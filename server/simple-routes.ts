import { Router } from "express";
import type { IStorage } from "./storage";
import { AuthService } from "./auth";
import { z } from "zod";

export function createRouter(storage: IStorage) {
  const router = Router();
  const authService = new AuthService(storage);

  // Test route
  router.get("/api/test", (req, res) => {
    res.json({ message: "Backend is working!", timestamp: new Date().toISOString() });
  });

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
      console.error("Registration error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  router.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await authService.login(credentials.email, credentials.password);
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Simple auth middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      
      if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
      }

      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: "Authentication failed" });
    }
  };

  // User profile route
  router.get("/api/users/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Business routes
  router.get("/api/businesses", async (req, res) => {
    try {
      const { category, pincode } = req.query;
      let businesses;
      
      if (category) {
        businesses = await storage.getBusinessesByCategory(category as string);
      } else if (pincode) {
        businesses = await storage.getBusinessesByPincode(pincode as string);
      } else {
        // Return all businesses with a default filter
        businesses = await storage.getBusinessesByPincode("400001");
      }
      
      res.json(businesses || []);
    } catch (error) {
      console.error("Businesses error:", error);
      res.status(500).json({ error: "Failed to get businesses" });
    }
  });

  router.get("/api/businesses/my", requireAuth, async (req: any, res) => {
    try {
      if (req.user.userType !== "business") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const businesses = await storage.getBusinessesByUserId(req.user.id);
      res.json(businesses || []);
    } catch (error) {
      console.error("My businesses error:", error);
      res.status(500).json({ error: "Failed to get businesses" });
    }
  });

  router.post("/api/businesses", requireAuth, async (req: any, res) => {
    try {
      if (req.user.userType !== "business") {
        return res.status(403).json({ error: "Access denied" });
      }

      const businessData = {
        ...req.body,
        userId: req.user.id,
      };
      
      const business = await storage.createBusiness(businessData);
      res.json(business);
    } catch (error) {
      console.error("Create business error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create business" });
    }
  });

  // B-Coin balance route
  router.get("/api/bcoin-balance/my", requireAuth, async (req: any, res) => {
    try {
      if (req.user.userType !== "customer") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const transactions = await storage.getBCoinTransactionsByUserId(req.user.id);
      const balance = transactions.reduce((sum: number, t: any) => {
        return sum + (t.type === "earned" ? parseFloat(t.bCoinsChanged) : -parseFloat(t.bCoinsChanged));
      }, 0);
      
      res.json({ balance });
    } catch (error) {
      console.error("Balance error:", error);
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  // B-Coin transactions route
  router.get("/api/bcoin-transactions/my", requireAuth, async (req: any, res) => {
    try {
      if (req.user.userType !== "customer") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const transactions = await storage.getBCoinTransactionsByUserId(req.user.id);
      res.json(transactions || []);
    } catch (error) {
      console.error("Transactions error:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // QR Codes routes
  router.get("/api/businesses/:businessId/qr-codes", requireAuth, async (req: any, res) => {
    try {
      if (req.user.userType !== "business") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const qrCodes = await storage.getQrCodesByBusinessId(req.params.businessId);
      res.json(qrCodes || []);
    } catch (error) {
      console.error("QR codes error:", error);
      res.status(500).json({ error: "Failed to get QR codes" });
    }
  });

  router.post("/api/qr-codes", requireAuth, async (req: any, res) => {
    try {
      if (req.user.userType !== "business") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const qrCode = await storage.createQrCode(req.body);
      res.json(qrCode);
    } catch (error) {
      console.error("Create QR code error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create QR code" });
    }
  });

  // QR Transaction route
  router.post("/api/qr-transactions", requireAuth, async (req: any, res) => {
    try {
      if (req.user.userType !== "customer") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { qrCodeId, amount } = req.body;
      
      // Simulate earning B-Coins (5% of amount)
      const bCoinsEarned = (parseFloat(amount) * 0.05).toFixed(1);
      
      // Create transaction record
      const transaction = await storage.createBCoinTransaction({
        customerId: req.user.id,
        businessId: "default", // Would get from QR code in real implementation
        type: "earned",
        amount: amount,
        bCoinsChanged: bCoinsEarned,
        description: `Purchase at business - QR: ${qrCodeId}`,
      });
      
      res.json({ 
        success: true, 
        bCoinsEarned,
        transaction 
      });
    } catch (error) {
      console.error("QR transaction error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Transaction failed" });
    }
  });

  return router;
}