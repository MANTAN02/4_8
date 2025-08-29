import { Router } from "express";
import { superDb } from "./super-database";
import {
  insertUserSchema,
  insertBusinessSchema,
  insertBundleSchema,
  insertBCoinTransactionSchema,
  insertQrCodeSchema,
  insertRatingSchema,
  insertNotificationSchema,
  businesses,
  users,
  bCoinTransactions,
  qrCodes,
  ratings,
  notifications,
  customerBalances,
  bundles,
} from "@shared/schema";
import { 
  AuthService, 
  authenticateToken, 
  requireCustomer, 
  requireBusiness, 
  requireBusinessOwnership,
  type AuthenticatedRequest 
} from "./auth";
import { wsManager } from "./websocket";
import { z } from "zod";
import { randomBytes } from "crypto";
import { desc, eq, and, avg, sum, count, gte, lte } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { DatabaseStorage } from "./db-storage";
import { db } from "./db";

// Rate limiting for security
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: "Too many authentication attempts, please try again later" }
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // limit each IP to 100 requests per minute
});

export function createProductionRouter() {
  const router = Router();
  // Note: AuthService now uses superDb internally
  
  // Create storage and AuthService instances
  const storage = new DatabaseStorage();
  const authService = new AuthService(storage);

  // Make storage available to middlewares like authenticateToken
  router.use((req, _res, next) => {
    req.app.locals.storage = storage;
    next();
  });

  // Apply rate limiting
  router.use('/api/auth', authLimiter);
  router.use('/api', generalLimiter);

  // Enhanced validation schemas
  const registerSchema = z.object({
    email: z.string().email().min(5).max(255),
    password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    name: z.string().min(2).max(100).trim(),
    userType: z.enum(["customer", "business"]),
    phone: z.string().optional().refine(val => !val || /^\+?[\d\s-()]{10,15}$/.test(val)),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const businessSchema = insertBusinessSchema.extend({
    businessName: z.string().min(2).max(255).trim(),
    category: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    address: z.string().min(10).max(500).trim(),
    pincode: z.string().regex(/^[0-9]{6}$/),
    phone: z.string().optional().refine(val => !val || /^\+?[\d\s-()]{10,15}$/.test(val)),
    bCoinRate: z.string().refine(val => {
      const num = parseFloat(val);
      return num >= 1 && num <= 25; // 1-25% B-Coin rate
    }),
  });

  // AUTHENTICATION ROUTES
  router.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const result = await authService.register(
        userData.email.toLowerCase(),
        userData.password,
        userData.name,
        userData.userType,
        userData.phone
      );
      
      // Send welcome notification
      await storage.createNotification({
        userId: result.user.id,
        type: 'system',
        title: 'Welcome to Prebucks! 🎉',
        message: `Welcome ${result.user.name}! Start exploring local businesses and earning Prebucks.`,
        data: JSON.stringify({ userType: result.user.userType }),
        isRead: false,
      });

      // Initial signup bonus for customers: credit 200 Prebucks
      if (result.user.userType === 'customer') {
        try {
          await storage.createBCoinTransaction({
            customerId: result.user.id,
            businessId: result.user.id, // self-issued for signup bonus tracking
            type: 'earned',
            amount: '0',
            bCoinsChanged: '200',
            description: 'Signup bonus: 200 Prebucks',
          } as any);
        } catch {}
      }
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  router.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await authService.login(credentials.email.toLowerCase(), credentials.password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: "Invalid email or password" });
    }
  });

  // FAKE PASSWORDLESS LOGIN: create or fetch by email and issue token
  router.post("/api/auth/fake-login", async (req, res) => {
    try {
      const body = z.object({
        email: z.string().email(),
        name: z.string().optional(),
        userType: z.enum(["customer", "business"]).default("customer"),
      }).parse(req.body);

      const email = body.email.toLowerCase();
      let existing = await storage.getUserByEmail(email);
      if (!existing) {
        // create user with random password
        const randomPwd = randomBytes(12).toString('hex') + 'Ab1!';
        const result = await authService.register(email, randomPwd, body.name || email.split('@')[0], body.userType);
        // Credit initial Prebucks for new customers
        if (result.user.userType === 'customer') {
          try {
            await storage.createBCoinTransaction({
              customerId: result.user.id,
              businessId: result.user.id,
              type: 'earned',
              amount: '0',
              bCoinsChanged: '200',
              description: 'Signup bonus: 200 Prebucks',
            } as any);
          } catch {}
        }
        return res.json(result);
      }

      // If exists, just issue a token
      const token = authService.generateToken({
        id: existing.id,
        email: existing.email,
        userType: (existing as any).userType,
        name: (existing as any).name,
      });
      const { password, ...userWithoutPassword } = existing as any;
      return res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed' });
      }
      return res.status(500).json({ error: 'Fake login failed' });
    }
  });

  router.post("/api/auth/change-password", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }
      
      await authService.changePassword(req.user!.id, currentPassword, newPassword);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Password change failed" });
    }
  });

  // USER PROFILE ROUTES
  router.get("/api/users/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // BUSINESS ROUTES
  router.post("/api/businesses", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businessData = businessSchema.parse(req.body);
      
      // Check if business already exists for this user
      const existingBusinesses = await storage.getBusinessesByUserId(req.user!.id);
      if (existingBusinesses.length > 0) {
        return res.status(400).json({ error: "Business already exists for this user" });
      }
      
      const business = await storage.createBusiness({
        ...businessData,
        userId: req.user!.id,
      });
      
      // Create notification
      await storage.createNotification({
        userId: req.user!.id,
        type: 'business_created',
        title: 'Business Profile Created! 🏪',
        message: `Your business "${business.businessName}" has been created and is pending verification.`,
        data: JSON.stringify({ businessId: business.id }),
        isRead: false,
      });
      
      res.status(201).json(business);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create business" });
    }
  });

  router.get("/api/business/profile", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businesses = await storage.getBusinessesByUserId(req.user!.id);
      const business = businesses[0] || null;
      
      if (business) {
        // Get additional metrics
        const [avgRating] = await db
          .select({ avg: avg(ratings.rating) })
          .from(ratings)
          .where(eq(ratings.businessId, business.id));
        
        const [totalTransactions] = await db
          .select({ count: count() })
          .from(bCoinTransactions)
          .where(eq(bCoinTransactions.businessId, business.id));
        
        res.json({
          ...business,
          averageRating: avgRating?.avg ? parseFloat(avgRating.avg) : 0,
          totalTransactions: totalTransactions?.count || 0
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business profile" });
    }
  });

  router.get("/api/businesses/nearby", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { pincode, category, limit = 20 } = req.query;
      
      let query = db
        .select({
          id: businesses.id,
          userId: businesses.userId,
          businessName: businesses.businessName,
          category: businesses.category,
          description: businesses.description,
          address: businesses.address,
          pincode: businesses.pincode,
          phone: businesses.phone,
          isVerified: businesses.isVerified,
          bCoinRate: businesses.bCoinRate,
          createdAt: businesses.createdAt,
        })
        .from(businesses)
        .where(eq(businesses.isVerified, true));

      if (pincode) {
        query = query.where(eq(businesses.pincode, pincode as string));
      }
      if (category) {
        query = query.where(eq(businesses.category, category as string));
      }

      const businessList = await query
        .orderBy(desc(businesses.createdAt))
        .limit(parseInt(limit as string));

      // Get ratings for each business
      const businessesWithRatings = await Promise.all(
        businessList.map(async (business) => {
          const [avgRating] = await db
            .select({ avg: avg(ratings.rating), count: count() })
            .from(ratings)
            .where(eq(ratings.businessId, business.id));
          
          return {
            ...business,
            averageRating: avgRating?.avg ? parseFloat(avgRating.avg) : 0,
            totalRatings: avgRating?.count || 0
          };
        })
      );

      res.json(businessesWithRatings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nearby businesses" });
    }
  });

  // Offers listing (public) - verified businesses with Prebucks rate
  router.get("/api/offers", async (req, res) => {
    try {
      const list = await db
        .select({
          id: businesses.id,
          businessName: businesses.businessName,
          category: businesses.category,
          pincode: businesses.pincode,
          bCoinRate: businesses.bCoinRate,
          isVerified: businesses.isVerified,
          createdAt: businesses.createdAt,
        })
        .from(businesses)
        .where(eq(businesses.isVerified, true))
        .orderBy(desc(businesses.createdAt));
      res.json(list.map(b => ({ ...b, offerPercent: b.bCoinRate })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  // QR CODE GENERATION (For merchants to display at shops)
  router.post("/api/qr-codes", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businesses = await storage.getBusinessesByUserId(req.user!.id);
      
      if (!businesses[0]) {
        return res.status(404).json({ error: "Business not found" });
      }

      // Generate unique QR code for the shop
      const qrCodeValue = `PREBUCKS_${businesses[0].id}_${Date.now()}`;
      
      const qrCode = await storage.createQrCode({
        businessId: businesses[0].id,
        code: qrCodeValue,
        isActive: true,
      });
      
      res.status(201).json({
        ...qrCode,
        displayCode: qrCodeValue, // This is what gets displayed as QR at shop
        message: "QR code generated successfully. Display this at your shop for customers to scan."
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create QR code" });
    }
  });

  router.get("/api/business/qr-codes", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businesses = await storage.getBusinessesByUserId(req.user!.id);
      if (!businesses[0]) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      const qrCodes = await storage.getQrCodesByBusiness(businesses[0].id);
      res.json(qrCodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch QR codes" });
    }
  });

  // SHOP QR CODE SCANNING (Customer scans physical QR at shop)
  router.post("/api/shop/scan-qr", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const { qrCode } = req.body;
      
      if (!qrCode) {
        return res.status(400).json({ error: "QR code is required" });
      }
      
      // Find the shop by QR code
      const shopQR = await storage.getQrCodeByCode(qrCode);
      if (!shopQR || !shopQR.isActive) {
        return res.status(404).json({ error: "Invalid or inactive QR code" });
      }
      
      // Get business info
      const business = await storage.getBusinessById(shopQR.businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      // Return shop details for payment
      res.json({
        success: true,
        shop: {
          id: business.id,
          name: business.businessName,
          category: business.category,
          address: business.address,
          pincode: business.pincode,
          bCoinRate: business.bCoinRate || "5.00",
          description: business.description
        },
        message: `Welcome to ${business.businessName}! You can now pay with Prebucks.`
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to scan shop QR code" });
    }
  });

  // PAYMENT WITH PREBUCKS (After scanning shop QR)
  router.post("/api/shop/pay", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const { shopId, billAmount, prebucksToUse, paymentMethod = 'upi' } = req.body;
      
      if (!shopId || !billAmount) {
        return res.status(400).json({ error: "Shop ID and bill amount are required" });
      }
      
      // Get business info
      const business = await storage.getBusinessById(shopId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      // Get customer balance
      const customerBalance = await storage.getCustomerBCoinBalance(req.user!.id);
      const availablePrebucks = customerBalance || 0;
      
      // Validate Prebucks usage
      const prebucksAmount = Math.min(parseFloat(prebucksToUse || "0"), availablePrebucks, parseFloat(billAmount));
      const cashAmount = parseFloat(billAmount) - prebucksAmount;
      
      // Calculate new Prebucks earned from this purchase
      const bCoinRate = business.bCoinRate ? parseFloat(business.bCoinRate) : 5.0;
      const newPrebucksEarned = (parseFloat(billAmount) * bCoinRate) / 100;
      const platformCommission = newPrebucksEarned * 0.05; // 5% platform fee
      const actualPrebucksEarned = newPrebucksEarned - platformCommission;
      
      // Create transactions
      const transactions = [];
      
      // If using Prebucks, create redemption transaction
      if (prebucksAmount > 0) {
        const redemptionTx = await storage.createBCoinTransaction({
          customerId: req.user!.id,
          businessId: shopId,
          type: 'redeemed',
          amount: billAmount,
          bCoinsChanged: (-prebucksAmount).toString(),
          description: `Redeemed Prebucks at ${business.businessName}`,
        });
        transactions.push(redemptionTx);
      }
      
      // Create earning transaction for new Prebucks
      const earningTx = await storage.createBCoinTransaction({
        customerId: req.user!.id,
        businessId: shopId,
        type: 'earned',
        amount: billAmount,
        bCoinsChanged: actualPrebucksEarned.toString(),
        description: `Earned Prebucks from ${business.businessName} (Platform fee: ₹${platformCommission.toFixed(2)})`,
      });
      transactions.push(earningTx);
      
      // Create platform revenue transaction
      await storage.createBCoinTransaction({
        customerId: 'platform-revenue',
        businessId: shopId,
        type: 'platform_fee',
        amount: billAmount,
        bCoinsChanged: platformCommission.toString(),
        description: `Platform commission from ${business.businessName}`,
      });
      
      // Send notifications
      await Promise.all([
        storage.createNotification({
          userId: req.user!.id,
          type: 'payment_successful',
          title: 'Payment Successful! 💳',
          message: `You paid ₹${cashAmount.toFixed(2)} + ₹${prebucksAmount.toFixed(2)} Prebucks at ${business.businessName}`,
          data: JSON.stringify({ 
            businessId: shopId, 
            billAmount, 
            prebucksUsed: prebucksAmount,
            prebucksEarned: actualPrebucksEarned 
          }),
          isRead: false,
        }),
        storage.createNotification({
          userId: business.userId,
          type: 'payment_received',
          title: 'Payment Received! 💰',
          message: `Customer paid ₹${billAmount} (₹${prebucksAmount} Prebucks + ₹${cashAmount} cash)`,
          data: JSON.stringify({ 
            customerId: req.user!.id, 
            billAmount, 
            prebucksRedeemed: prebucksAmount 
          }),
          isRead: false,
        })
      ]);
      
      // Real-time notifications
      if (wsManager) {
        wsManager.notifyPaymentSuccess(req.user!.id, billAmount, business.businessName);
        wsManager.notifyPaymentReceived(business.userId, req.user!.name, billAmount);
      }
      
      res.json({
        success: true,
        payment: {
          billAmount: parseFloat(billAmount),
          prebucksUsed: prebucksAmount,
          cashPaid: cashAmount,
          newPrebucksEarned: actualPrebucksEarned,
          platformFee: platformCommission
        },
        shop: business.businessName,
        transactions
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Payment failed" });
    }
  });

  // CUSTOMER BALANCE & TRANSACTIONS
  router.get("/api/customer/balance/:customerId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Security check - users can only see their own balance
      if (req.user!.id !== req.params.customerId && req.user!.userType !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const balance = await storage.getCustomerBalance(req.params.customerId);
      res.json(balance || { customerId: req.params.customerId, totalBCoins: "0.00" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // Convenience endpoints for authenticated customer wallet
  router.get("/api/bcoin-balance/my", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const balance = await storage.getCustomerBCoinBalance(req.user!.id);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  router.get("/api/bcoin-transactions/my", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getBCoinTransactionsByCustomer(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  router.get("/api/customer/transactions/:customerId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Security check
      if (req.user!.id !== req.params.customerId && req.user!.userType !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { limit = 50, offset = 0 } = req.query;
      const transactions = await db
        .select()
        .from(bCoinTransactions)
        .where(eq(bCoinTransactions.customerId, req.params.customerId))
        .orderBy(desc(bCoinTransactions.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // BUSINESS ANALYTICS (Revenue Insights)
  router.get("/api/business/analytics", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businesses = await storage.getBusinessesByUserId(req.user!.id);
      if (!businesses[0]) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      const businessId = businesses[0].id;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get analytics data
      const [
        totalRevenue,
        monthlyRevenue,
        totalCustomers,
        monthlyCustomers,
        avgRating,
        totalRatings,
        activeQRCodes,
        totalQRCodes
      ] = await Promise.all([
        db.select({ sum: sum(bCoinTransactions.amount) })
          .from(bCoinTransactions)
          .where(eq(bCoinTransactions.businessId, businessId)),
        
        db.select({ sum: sum(bCoinTransactions.amount) })
          .from(bCoinTransactions)
          .where(and(
            eq(bCoinTransactions.businessId, businessId),
            gte(bCoinTransactions.createdAt, thirtyDaysAgo)
          )),
        
        db.select({ count: count() })
          .from(bCoinTransactions)
          .where(eq(bCoinTransactions.businessId, businessId)),
        
        db.select({ count: count() })
          .from(bCoinTransactions)
          .where(and(
            eq(bCoinTransactions.businessId, businessId),
            gte(bCoinTransactions.createdAt, thirtyDaysAgo)
          )),
        
        db.select({ avg: avg(ratings.rating) })
          .from(ratings)
          .where(eq(ratings.businessId, businessId)),
        
        db.select({ count: count() })
          .from(ratings)
          .where(eq(ratings.businessId, businessId)),
        
        db.select({ count: count() })
          .from(qrCodes)
          .where(and(
            eq(qrCodes.businessId, businessId),
            eq(qrCodes.isUsed, false)
          )),
        
        db.select({ count: count() })
          .from(qrCodes)
          .where(eq(qrCodes.businessId, businessId))
      ]);
      
      res.json({
        totalRevenue: totalRevenue[0]?.sum || "0",
        monthlyRevenue: monthlyRevenue[0]?.sum || "0",
        totalCustomers: totalCustomers[0]?.count || 0,
        monthlyCustomers: monthlyCustomers[0]?.count || 0,
        averageRating: avgRating[0]?.avg ? parseFloat(avgRating[0].avg) : 0,
        totalRatings: totalRatings[0]?.count || 0,
        activeQRCodes: activeQRCodes[0]?.count || 0,
        totalQRCodes: totalQRCodes[0]?.count || 0,
        business: businesses[0]
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // NOTIFICATION SYSTEM
  router.get("/api/notifications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { limit = 50, unreadOnly = false } = req.query;
      
      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, req.user!.id));
      
      if (unreadOnly === 'true') {
        query = query.where(eq(notifications.isRead, false));
      }
      
      const notificationList = await query
        .orderBy(desc(notifications.createdAt))
        .limit(parseInt(limit as string));
      
      res.json(notificationList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  router.post("/api/notifications/:id/read", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Security check - only owner can mark as read
      const [notification] = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.id, req.params.id),
          eq(notifications.userId, req.user!.id)
        ));
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  router.post("/api/notifications/mark-all-read", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // PLATFORM ANALYTICS (For admin/revenue tracking)
  router.get("/api/platform/analytics", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only allow admin access (implement admin role check)
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const [
        totalUsers,
        totalBusinesses,
        totalTransactions,
        platformRevenue,
        activeUsers,
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(businesses),
        db.select({ count: count() }).from(bCoinTransactions),
        db.select({ sum: sum(bCoinTransactions.bCoinsChanged) })
          .from(bCoinTransactions)
          .where(eq(bCoinTransactions.customerId, 'platform-revenue')),
        db.select({ count: count() })
          .from(bCoinTransactions)
          .where(gte(bCoinTransactions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
      ]);
      
      res.json({
        totalUsers: totalUsers[0]?.count || 0,
        totalBusinesses: totalBusinesses[0]?.count || 0,
        totalTransactions: totalTransactions[0]?.count || 0,
        platformRevenue: platformRevenue[0]?.sum || "0",
        weeklyActiveUsers: activeUsers[0]?.count || 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform analytics" });
    }
  });

  // BUSINESS CATEGORIES (Public endpoint for frontend)
  router.get("/api/business/categories", async (req, res) => {
    try {
      res.json(BUSINESS_CATEGORIES);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business categories" });
    }
  });

  // Compatibility endpoints for current frontend
  router.get("/api/businesses/user/:userId", authenticateToken, async (req, res) => {
    try {
      const businessesForUser = await storage.getBusinessesByUserId(req.params.userId);
      res.json(businessesForUser[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });

  router.put("/api/businesses/:id", authenticateToken, async (req, res) => {
    try {
      const updated = await storage.updateBusiness(req.params.id, req.body || {} as any);
      if (!updated) return res.status(404).json({ error: "Business not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update business" });
    }
  });

  router.get("/api/bundles", async (req, res) => {
    try {
      const bundlesList = await storage.getAllBundles();
      const withBusinesses = await Promise.all(
        bundlesList.map(async (bundle) => {
          const businessesInBundle = await storage.getBundleBusinesses(bundle.id);
          return { ...bundle, businesses: businessesInBundle };
        })
      );
      res.json(withBusinesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bundles" });
    }
  });

  router.get("/api/bundles/:id", async (req, res) => {
    try {
      const bundle = await storage.getBundleById(req.params.id);
      if (!bundle) return res.status(404).json({ error: "Bundle not found" });
      const businessesInBundle = await storage.getBundleBusinesses(bundle.id);
      res.json({ ...bundle, businesses: businessesInBundle });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bundle" });
    }
  });

  router.get("/api/customers/:userId/profile", authenticateToken, async (req, res) => {
    try {
      const customerId = req.params.userId;
      const transactions = await storage.getBCoinTransactionsByCustomer(customerId);
      const totals = transactions.reduce(
        (acc, t) => {
          const delta = parseFloat(t.bCoinsChanged.toString());
          if (t.type === 'earned') {
            acc.earned += delta;
            acc.balance += delta;
          } else if (t.type === 'redeemed' || t.type === 'spent') {
            acc.spent += Math.abs(delta);
            acc.balance -= Math.abs(delta);
          }
          return acc;
        },
        { earned: 0, spent: 0, balance: 0 }
      );
      res.json({
        userId: customerId,
        bCoinBalance: totals.balance.toFixed(2),
        totalBCoinsEarned: totals.earned.toFixed(2),
        totalBCoinsSpent: totals.spent.toFixed(2),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer profile" });
    }
  });

  router.put("/api/customers/:userId/profile", authenticateToken, async (req, res) => {
    try {
      const customerId = req.params.userId;
      const transactions = await storage.getBCoinTransactionsByCustomer(customerId);
      const balance = transactions.reduce((acc, t) => acc + parseFloat(t.bCoinsChanged.toString()), 0);
      res.json({ userId: customerId, bCoinBalance: balance.toFixed(2) });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  router.get("/api/bcoin-transactions/user/:userId", authenticateToken, async (req, res) => {
    try {
      const tx = await storage.getBCoinTransactionsByCustomer(req.params.userId);
      res.json(tx);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  router.get("/api/bcoin-transactions/business/:businessId", authenticateToken, async (req, res) => {
    try {
      const tx = await storage.getBCoinTransactionsByBusiness(req.params.businessId);
      res.json(tx);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  router.post("/api/scan-qr", authenticateToken, async (req, res) => {
    try {
      const { qrCode, customerId, billAmount } = req.body || {};
      if (!qrCode || !customerId || !billAmount) {
        return res.status(400).json({ error: "qrCode, customerId and billAmount are required" });
      }
      const qr = await storage.getQrCodeById(qrCode);
      if (!qr || qr.isUsed) {
        return res.status(404).json({ error: "Invalid or used QR code" });
      }
      const business = await storage.getBusinessById(qr.businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      const rate = business.bCoinRate ? parseFloat(business.bCoinRate) : 5.0;
      const earned = (parseFloat(billAmount) * rate) / 100;
      const tx = await storage.createBCoinTransaction({
        customerId,
        businessId: business.id,
        type: 'earned',
        amount: billAmount,
        bCoinsChanged: earned.toString(),
        description: `Earned from ${business.businessName}`,
        qrCodeId: qr.id,
      });
      res.json({ transaction: tx, bCoinsEarned: earned.toFixed(2), business: business.businessName });
    } catch (error) {
      res.status(500).json({ error: "QR scan failed" });
    }
  });

  // Redeem preview: compute discount and net amount including payment fees
  router.post("/api/redeem/preview", authenticateToken, async (req, res) => {
    try {
      const { customerId, businessId, billAmount, requestedDiscount } = req.body || {};
      if (!customerId || !businessId || !billAmount) {
        return res.status(400).json({ error: "customerId, businessId, billAmount required" });
      }

      const txs = await storage.getBCoinTransactionsByCustomer(customerId);
      const balance = txs.reduce((acc, t) => acc + parseFloat(t.bCoinsChanged.toString()), 0);
      const bill = parseFloat(billAmount);
      const want = Math.max(0, parseFloat(requestedDiscount || 0));
      const discount = Math.min(balance, want, bill);

      // Payment fee rules (PhonePe-like placeholder): 0 for UPI, 1.2% for card, 0.5% if bill>2000
      const method = (req.body.method || 'upi') as 'upi' | 'card';
      let fee = 0;
      if (method === 'card') fee = 0.012 * (bill - discount);
      if (bill > 2000) fee += 0.005 * (bill - discount);

      const netPayable = Math.max(0, bill - discount) + fee;
      res.json({
        balance: balance.toFixed(2),
        discount: discount.toFixed(2),
        fee: fee.toFixed(2),
        netPayable: netPayable.toFixed(2),
        method,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to preview redemption" });
    }
  });

  // PhonePe initiate (mock)
  router.post("/api/payments/phonepe/initiate", authenticateToken, async (req, res) => {
    try {
      const { customerId, businessId, billAmount, discount, method = 'upi' } = req.body || {};
      if (!customerId || !businessId || !billAmount) {
        return res.status(400).json({ error: "customerId, businessId, billAmount required" });
      }
      const bill = parseFloat(billAmount);
      const disc = Math.max(0, parseFloat(discount || 0));
      const amountToPay = Math.max(0, bill - disc);
      // Generate a mock payment request id
      const paymentRequestId = `pp_${Date.now()}`;
      res.json({ paymentRequestId, amountToPay: amountToPay.toFixed(2), method });
    } catch (error) {
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  // PhonePe confirm (mock) — records spend and merchant credited
  router.post("/api/payments/phonepe/confirm", authenticateToken, async (req, res) => {
    try {
      const { customerId, businessId, billAmount, discount, paymentRequestId } = req.body || {};
      if (!customerId || !businessId || !billAmount || !paymentRequestId) {
        return res.status(400).json({ error: "customerId, businessId, billAmount, paymentRequestId required" });
      }
      const bill = parseFloat(billAmount);
      const disc = Math.max(0, parseFloat(discount || 0));
      const spend = Math.min(disc, bill);

      // Deduct Prebucks (record negative change)
      if (spend > 0) {
        await storage.createBCoinTransaction({
          customerId,
          businessId,
          type: 'redeemed',
          amount: billAmount,
          bCoinsChanged: (-spend).toString(),
          description: `Redeemed Prebucks on bill ₹${bill.toFixed(2)}`,
        });
      }

      // Record earn from purchase at merchant rate
      const business = await storage.getBusinessById(businessId);
      const rate = business?.bCoinRate ? parseFloat(business.bCoinRate) : 0;
      const earned = (bill * rate) / 100;
      if (earned > 0) {
        await storage.createBCoinTransaction({
          customerId,
          businessId,
          type: 'earned',
          amount: billAmount,
          bCoinsChanged: earned.toString(),
          description: `Earned Prebucks from ${business?.businessName || 'merchant'}`,
        });
      }

      // Simulate settlement to merchant via UPI (no platform fee)
      const cashToMerchant = bill - spend; // customer pays net after discount
      // In real integration, confirm via PhonePe API and track settlement id

      res.json({
        success: true,
        paymentRequestId,
        cashToMerchant: cashToMerchant.toFixed(2),
        prebucksSpent: spend.toFixed(2),
        prebucksEarned: earned.toFixed(2),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Merchant payout (mock) — request withdrawal to bank
  router.post("/api/payments/withdraw", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, accountHolder, accountNumber, ifsc } = req.body || {};
      const amt = parseFloat(amount || '0');
      if (!amount || amt <= 0 || !accountHolder || !accountNumber || !ifsc) {
        return res.status(400).json({ error: "amount, accountHolder, accountNumber, ifsc are required" });
      }
      // In real world: validate KYC, check balance, enqueue payout job
      const payoutId = `pout_${Date.now()}`;
      return res.json({ success: true, payoutId, status: 'processing', amount: amt.toFixed(2) });
    } catch (error) {
      res.status(500).json({ error: "Failed to initiate withdrawal" });
    }
  });

  // Error handling middleware
  router.use((error: any, req: any, res: any, next: any) => {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  });

  return router;
}