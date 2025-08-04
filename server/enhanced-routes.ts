import { Router } from "express";
import type { DatabaseStorage } from "./db-storage";
import { db } from "./db";
import {
  insertUserSchema,
  insertBusinessSchema,
  insertBundleSchema,
  insertBCoinTransactionSchema,
  insertQrCodeSchema,
  insertRatingSchema,
  insertNotificationSchema,
  businesses,
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
import { db } from "./db";
import { desc } from "drizzle-orm";

export function createEnhancedRouter(storage: DatabaseStorage) {
  const router = Router();
  const authService = new AuthService(storage);

  // Authentication routes
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    userType: z.enum(["customer", "business"]),
    phone: z.string().optional(),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  router.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const result = await authService.register(
        userData.email,
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
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  router.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await authService.login(credentials.email, credentials.password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Get current user profile
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

  // Business routes
  router.post("/api/businesses", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businessData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness({
        ...businessData,
        userId: req.user!.id,
      });
      
      // Send business creation notification
      await storage.createNotification({
        userId: req.user!.id,
        type: 'business_created',
        title: 'Business Profile Created! 🏪',
        message: `Your business "${business.businessName}" has been created and is pending verification.`,
        data: JSON.stringify({ businessId: business.id }),
        isRead: false,
      });
      
      res.json(business);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create business" });
    }
  });

  router.get("/api/business/profile", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businesses = await storage.getBusinessesByUserId(req.user!.id);
      res.json(businesses[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business profile" });
    }
  });

  router.get("/api/businesses/nearby", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // For demo, return all businesses - in real app, use user location
      const allBusinesses = await db.select().from(businesses).orderBy(desc(businesses.createdAt));
      res.json(allBusinesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nearby businesses" });
    }
  });

  // QR Code routes
  router.post("/api/qr-codes", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const qrData = insertQrCodeSchema.parse(req.body);
      const business = await storage.getBusinessesByUserId(req.user!.id);
      
      if (!business[0]) {
        return res.status(404).json({ error: "Business not found" });
      }

      const qrCode = await storage.createQrCode({
        ...qrData,
        id: randomBytes(16).toString('hex'),
        businessId: business[0].id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });
      
      res.json(qrCode);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create QR code" });
    }
  });

  router.get("/api/business/qr-codes", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const business = await storage.getBusinessesByUserId(req.user!.id);
      if (!business[0]) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      const qrCodes = await storage.getQrCodesByBusiness(business[0].id);
      res.json(qrCodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch QR codes" });
    }
  });

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
      
      // Calculate B-Coins earned
      const bCoinsEarned = (parseFloat(qrCode.amount) * parseFloat(business.bCoinRate)) / 100;
      
      // Create transaction
      const transaction = await storage.createBCoinTransaction({
        customerId: req.user!.id,
        businessId: business.id,
        type: 'earned',
        amount: qrCode.amount,
        bCoinsChanged: bCoinsEarned.toString(),
        description: `Earned from ${business.businessName}`,
        qrCodeId: qrCode.id,
      });
      
      // Send notifications
      await storage.createNotification({
        userId: req.user!.id,
        type: 'bcoin_earned',
        title: 'B-Coins Earned! 🪙',
        message: `You earned ₹${bCoinsEarned.toFixed(2)} B-Coins at ${business.businessName}`,
        data: JSON.stringify({ businessId: business.id, amount: bCoinsEarned }),
        isRead: false,
      });
      
      await storage.createNotification({
        userId: business.userId,
        type: 'qr_scanned',
        title: 'QR Code Scanned! 📱',
        message: `A customer scanned your QR code for ₹${qrCode.amount}`,
        data: JSON.stringify({ customerId: req.user!.id, amount: qrCode.amount }),
        isRead: false,
      });
      
      // Send real-time notifications
      if (wsManager) {
        wsManager.notifyBCoinEarned(req.user!.id, bCoinsEarned, business.businessName);
        wsManager.notifyQRScanned(business.userId, req.user!.name, parseFloat(qrCode.amount));
      }
      
      res.json({
        success: true,
        bCoinsEarned,
        businessName: business.businessName,
        transaction,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to scan QR code" });
    }
  });

  // Customer balance and transactions
  router.get("/api/customer/balance/:customerId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const balance = await storage.getCustomerBalance(req.params.customerId);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  router.get("/api/customer/transactions/:customerId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getBCoinTransactionsByCustomer(req.params.customerId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  router.get("/api/business/transactions", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const business = await storage.getBusinessesByUserId(req.user!.id);
      if (!business[0]) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      const transactions = await storage.getBCoinTransactionsByBusiness(business[0].id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business transactions" });
    }
  });

  // Bundles
  router.get("/api/bundles/recommended", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const bundles = await storage.getAllBundles();
      res.json(bundles.slice(0, 5)); // Return top 5 for demo
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommended bundles" });
    }
  });

  // Ratings
  router.post("/api/ratings", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const ratingData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating({
        ...ratingData,
        customerId: req.user!.id,
      });
      
      const business = await storage.getBusinessById(ratingData.businessId);
      if (business) {
        await storage.createNotification({
          userId: business.userId,
          type: 'rating_received',
          title: 'New Rating Received! ⭐',
          message: `You received a ${rating.rating}-star rating from a customer`,
          data: JSON.stringify({ ratingId: rating.id, rating: rating.rating }),
          isRead: false,
        });
      }
      
      res.json(rating);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create rating" });
    }
  });

  router.get("/api/business/ratings", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const business = await storage.getBusinessesByUserId(req.user!.id);
      if (!business[0]) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      const ratings = await storage.getRatingsByBusiness(business[0].id);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  // Notifications
  router.get("/api/notifications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  router.post("/api/notifications/:id/read", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
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

  // Enhanced business route for fetching all businesses
  router.get("/api/businesses/all", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const allBusinesses = await db.select().from(businesses).orderBy(desc(businesses.createdAt));
      res.json(allBusinesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all businesses" });
    }
  });

  return router;
}