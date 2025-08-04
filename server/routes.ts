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


export function createRouter(storage: IStorage) {
  const router = Router();

  // User routes
  router.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
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

  router.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Business routes
  router.post("/api/businesses", async (req, res) => {
    try {
      const businessData = insertBusinessSchema.parse(req.body);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const business = await storage.createBusiness({ ...businessData, userId });
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

  router.get("/api/users/:userId/businesses", async (req, res) => {
    try {
      const businesses = await storage.getBusinessesByUserId(req.params.userId);
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
  router.post("/api/bundles", async (req, res) => {
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

  router.post("/api/bundles/:bundleId/businesses/:businessId", async (req, res) => {
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
  router.post("/api/bcoin-transactions", async (req, res) => {
    try {
      const transactionData = insertBCoinTransactionSchema.parse(req.body);
      const transaction = await storage.createBCoinTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid input" });
    }
  });

  router.get("/api/customers/:customerId/bcoin-transactions", async (req, res) => {
    try {
      const transactions = await storage.getBCoinTransactionsByCustomer(req.params.customerId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/businesses/:businessId/bcoin-transactions", async (req, res) => {
    try {
      const transactions = await storage.getBCoinTransactionsByBusiness(req.params.businessId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/api/customers/:customerId/bcoin-balance", async (req, res) => {
    try {
      const balance = await storage.getCustomerBCoinBalance(req.params.customerId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // QR Code routes
  router.post("/api/qr-codes", async (req, res) => {
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

  router.get("/api/businesses/:businessId/qr-codes", async (req, res) => {
    try {
      const qrCodes = await storage.getQrCodesByBusiness(req.params.businessId);
      res.json(qrCodes);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/api/qr-codes/:id/use", async (req, res) => {
    try {
      const { customerId } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }

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
  router.post("/api/ratings", async (req, res) => {
    try {
      const ratingData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating(ratingData);
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

  router.get("/api/customers/:customerId/ratings", async (req, res) => {
    try {
      const ratings = await storage.getRatingsByCustomer(req.params.customerId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}