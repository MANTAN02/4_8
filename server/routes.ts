import { Router } from "express";
import type { IStorage } from "./storage";
import {
  insertUserSchema,
  insertBusinessSchema,
  insertBundleSchema,
  insertBCoinTransactionSchema,
  insertQrCodeSchema,
  insertRatingSchema,
} from "@shared/schema";
import { 
  AuthService, 
  authenticateToken, 
  requireCustomer, 
  requireBusiness, 
  requireBusinessOwnership,
  type AuthenticatedRequest 
} from "./auth";
import { z } from "zod";


export function createRouter(storage: IStorage) {
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

  router.post("/api/auth/change-password", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }

      const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Password change failed" });
    }
  });

  // User routes
  router.get("/api/users/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });



  // Business routes
  router.post("/api/businesses", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businessData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness({ ...businessData, userId: req.user!.id });
      res.json(business);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
    }
  });

  router.get("/api/businesses/:id", async (req, res) => {
    try {
      const business = await storage.getBusinessById(req.params.id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/businesses/my", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const businesses = await storage.getBusinessesByUserId(req.user!.id);
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/businesses", async (req, res) => {
    try {
      const { category, pincode } = req.query;
      let businesses;
      
      if (category) {
        businesses = await storage.getBusinessesByCategory(category as string);
      } else if (pincode) {
        businesses = await storage.getBusinessesByPincode(pincode as string);
      } else {
        return res.status(400).json({ error: "Category or pincode is required" });
      }
      
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bundle routes
  router.post("/api/bundles", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const bundleData = insertBundleSchema.parse(req.body);
      const bundle = await storage.createBundle(bundleData);
      res.json(bundle);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
    }
  });

  router.get("/api/bundles", async (req, res) => {
    try {
      const { pincode } = req.query;
      let bundles;
      
      if (pincode) {
        bundles = await storage.getBundlesByPincode(pincode as string);
      } else {
        bundles = await storage.getAllBundles();
      }
      
      res.json(bundles);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/bundles/:id", async (req, res) => {
    try {
      const bundle = await storage.getBundleById(req.params.id);
      if (!bundle) {
        return res.status(404).json({ error: "Bundle not found" });
      }
      res.json(bundle);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/bundles/:id/businesses", async (req, res) => {
    try {
      const businesses = await storage.getBundleBusinesses(req.params.id);
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/api/bundles/:bundleId/businesses/:businessId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const membership = await storage.addBusinessToBundle(
        req.params.bundleId,
        req.params.businessId
      );
      res.json(membership);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // B-Coin transaction routes
  router.post("/api/bcoin-transactions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const transactionData = insertBCoinTransactionSchema.parse(req.body);
      const transaction = await storage.createBCoinTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
    }
  });

  router.get("/api/bcoin-transactions/my", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getBCoinTransactionsByCustomer(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/businesses/:businessId/bcoin-transactions", authenticateToken, requireBusinessOwnership, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getBCoinTransactionsByBusiness(req.params.businessId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/bcoin-balance/my", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const balance = await storage.getCustomerBCoinBalance(req.user!.id);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // QR Code routes
  router.post("/api/qr-codes", authenticateToken, requireBusiness, async (req: AuthenticatedRequest, res) => {
    try {
      const qrCodeData = insertQrCodeSchema.parse(req.body);
      const qrCode = await storage.createQrCode(qrCodeData);
      res.json(qrCode);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
    }
  });

  router.get("/api/qr-codes/:id", async (req, res) => {
    try {
      const qrCode = await storage.getQrCodeById(req.params.id);
      if (!qrCode) {
        return res.status(404).json({ error: "QR code not found" });
      }
      res.json(qrCode);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/businesses/:businessId/qr-codes", authenticateToken, requireBusinessOwnership, async (req: AuthenticatedRequest, res) => {
    try {
      const qrCodes = await storage.getQrCodesByBusiness(req.params.businessId);
      res.json(qrCodes);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/api/qr-codes/:id/use", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const customerId = req.user!.id; // Use authenticated customer's ID

      const qrCode = await storage.useQrCode(req.params.id, customerId);
      if (!qrCode) {
        return res.status(404).json({ error: "QR code not found or already used" });
      }

      // Create B-Coin transaction
      const business = await storage.getBusinessById(qrCode.businessId);
      if (business) {
        const bCoinsEarned = parseFloat(qrCode.amount.toString()) * (parseFloat(business.bCoinRate?.toString() || "5") / 100);
        
        await storage.createBCoinTransaction({
          customerId,
          businessId: qrCode.businessId,
          type: "earned",
          amount: qrCode.amount,
          bCoinsChanged: bCoinsEarned.toString(),
          description: `Earned B-Coins from ${business.businessName}`,
          qrCodeId: qrCode.id,
        });
      }

      res.json(qrCode);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rating routes
  router.post("/api/ratings", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const ratingData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating({
        ...ratingData,
        customerId: req.user!.id, // Use authenticated customer's ID
      });
      res.json(rating);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
    }
  });

  router.get("/api/businesses/:businessId/ratings", async (req, res) => {
    try {
      const ratings = await storage.getRatingsByBusiness(req.params.businessId);
      const averageRating = await storage.getBusinessAverageRating(req.params.businessId);
      res.json({ ratings, averageRating });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/ratings/my", authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
    try {
      const ratings = await storage.getRatingsByCustomer(req.user!.id);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}