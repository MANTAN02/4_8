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
        title: 'Welcome to Baartal! 🎉',
        message: `Welcome ${result.user.name}! Start exploring local businesses and earning B-Coins.`,
        data: JSON.stringify({ userType: result.user.userType }),
        isRead: false,
      });
      
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

  // QR CODE ROUTES (Revenue Generation)
  router.post("/api/qr-codes", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const qrData = insertQrCodeSchema.parse(req.body);
      const businesses = await storage.getBusinessesByUserId(req.user!.id);
      
      if (!businesses[0]) {
        return res.status(404).json({ error: "Business not found" });
      }

      // Validate amount
      const amount = parseFloat(qrData.amount);
      if (amount < 10 || amount > 50000) {
        return res.status(400).json({ error: "Amount must be between ₹10 and ₹50,000" });
      }

      const qrCode = await storage.createQrCode({
        ...qrData,
        id: randomBytes(16).toString('hex'),
        businessId: businesses[0].id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
      
      res.status(201).json(qrCode);
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

  // QR SCANNING (Core Revenue Feature)
  router.post("/api/qr-codes/:id/scan", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const qrCode = await storage.getQrCodeById(req.params.id);
      
      if (!qrCode) {
        return res.status(404).json({ error: "QR code not found" });
      }
      
      if (qrCode.isUsed) {
        return res.status(400).json({ error: "QR code already used" });
      }
      
      if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
        return res.status(400).json({ error: "QR code expired" });
      }
      
      // Mark QR as used
      await storage.useQrCode(qrCode.id, req.user!.id);
      
      // Get business info
      const business = await storage.getBusinessById(qrCode.businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      // Calculate B-Coins earned (Platform takes 5% commission)
      const purchaseAmount = parseFloat(qrCode.amount);
      const bCoinRate = parseFloat(business.bCoinRate);
      const bCoinsEarned = (purchaseAmount * bCoinRate) / 100;
      const platformCommission = bCoinsEarned * 0.05; // 5% platform fee
      const actualBCoinsEarned = bCoinsEarned - platformCommission;
      
      // Create transaction
      const transaction = await storage.createBCoinTransaction({
        customerId: req.user!.id,
        businessId: business.id,
        type: 'earned',
        amount: qrCode.amount,
        bCoinsChanged: actualBCoinsEarned.toString(),
        description: `Earned from ${business.businessName} (Platform fee: ₹${platformCommission.toFixed(2)})`,
        qrCodeId: qrCode.id,
      });
      
      // Create platform revenue transaction (for tracking)
      await storage.createBCoinTransaction({
        customerId: 'platform-revenue', // Special ID for platform
        businessId: business.id,
        type: 'platform_fee',
        amount: qrCode.amount,
        bCoinsChanged: platformCommission.toString(),
        description: `Platform commission from ${business.businessName}`,
        qrCodeId: qrCode.id,
      });
      
      // Send notifications
      await Promise.all([
        storage.createNotification({
          userId: req.user!.id,
          type: 'bcoin_earned',
          title: 'B-Coins Earned! 🪙',
          message: `You earned ₹${actualBCoinsEarned.toFixed(2)} B-Coins at ${business.businessName}`,
          data: JSON.stringify({ businessId: business.id, amount: actualBCoinsEarned }),
          isRead: false,
        }),
        storage.createNotification({
          userId: business.userId,
          type: 'qr_scanned',
          title: 'QR Code Scanned! 📱',
          message: `Customer scanned your QR code for ₹${qrCode.amount}`,
          data: JSON.stringify({ customerId: req.user!.id, amount: qrCode.amount }),
          isRead: false,
        })
      ]);
      
      // Real-time notifications
      if (wsManager) {
        wsManager.notifyBCoinEarned(req.user!.id, actualBCoinsEarned, business.businessName);
        wsManager.notifyQRScanned(business.userId, req.user!.name, purchaseAmount);
      }
      
      res.json({
        success: true,
        bCoinsEarned: actualBCoinsEarned,
        platformFee: platformCommission,
        businessName: business.businessName,
        transaction,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to scan QR code" });
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