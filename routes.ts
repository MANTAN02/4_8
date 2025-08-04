import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBusinessSchema, insertBCoinTransactionSchema, insertRatingSchema, BUSINESS_CATEGORIES } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      
      // Create customer profile if user type is customer
      if (userData.userType === 'customer') {
        await storage.createCustomerProfile({
          userId: user.id,
          preferredPincode: userData.pincode || null
        });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Business routes
  app.post("/api/businesses", async (req, res) => {
    try {
      const businessData = insertBusinessSchema.parse(req.body);
      
      // Check if category is already taken in this pincode
      const existingBusinesses = await storage.getBusinessesByPincode(businessData.pincode);
      const categoryTaken = existingBusinesses.some(b => b.category === businessData.category);
      
      if (categoryTaken) {
        return res.status(400).json({ message: "Category already taken in this area" });
      }

      // Create or get bundle for this pincode
      let bundle = await storage.getBundleByPincode(businessData.pincode);
      if (!bundle) {
        bundle = await storage.createBundle({
          name: `${businessData.pincode} Business Circle`,
          pincode: businessData.pincode,
          description: `Local business bundle for pincode ${businessData.pincode}`
        });
      }

      const business = await storage.createBusiness({
        ...businessData,
        bundleId: bundle.id
      });

      // Generate QR code for the business
      const qrCode = await storage.createQRCode({
        businessId: business.id,
        code: `BAARTAL-${business.id}`,
        isActive: true
      });

      res.json({ business, qrCode });
    } catch (error) {
      res.status(400).json({ message: "Invalid business data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.get("/api/businesses/user/:userId", async (req, res) => {
    try {
      const business = await storage.getBusinessByUserId(req.params.userId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.put("/api/businesses/:id", async (req, res) => {
    try {
      const updates = req.body;
      const business = await storage.updateBusiness(req.params.id, updates);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  // Customer Profile routes
  app.get("/api/customers/:userId/profile", async (req, res) => {
    try {
      const profile = await storage.getCustomerProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ message: "Customer profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer profile" });
    }
  });

  app.put("/api/customers/:userId/profile", async (req, res) => {
    try {
      const updates = req.body;
      const profile = await storage.updateCustomerProfile(req.params.userId, updates);
      if (!profile) {
        return res.status(404).json({ message: "Customer profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer profile" });
    }
  });

  // Bundle routes
  app.get("/api/bundles", async (req, res) => {
    try {
      const bundles = await storage.getAllBundles();
      
      // Enhance bundles with business information
      const bundlesWithBusinesses = await Promise.all(
        bundles.map(async (bundle) => {
          const businesses = await storage.getBusinessesInBundle(bundle.id);
          return { ...bundle, businesses };
        })
      );
      
      res.json(bundlesWithBusinesses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bundles" });
    }
  });

  app.get("/api/bundles/:pincode", async (req, res) => {
    try {
      const bundle = await storage.getBundleByPincode(req.params.pincode);
      if (!bundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      
      const businesses = await storage.getBusinessesInBundle(bundle.id);
      res.json({ ...bundle, businesses });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bundle" });
    }
  });

  // B-Coin Transaction routes
  app.post("/api/bcoin-transactions", async (req, res) => {
    try {
      const transactionData = insertBCoinTransactionSchema.parse(req.body);
      const transaction = await storage.createBCoinTransaction(transactionData);
      
      // Update customer profile balance
      const customerProfile = await storage.getCustomerProfile(transactionData.customerId);
      if (customerProfile) {
        const currentBalance = parseFloat(customerProfile.bCoinBalance || "0");
        const transactionAmount = parseFloat(transactionData.amount);
        const newBalance = currentBalance + transactionAmount;
        
        const totalEarned = transactionAmount > 0 
          ? parseFloat(customerProfile.totalBCoinsEarned || "0") + transactionAmount
          : parseFloat(customerProfile.totalBCoinsEarned || "0");
          
        const totalSpent = transactionAmount < 0 
          ? parseFloat(customerProfile.totalBCoinsSpent || "0") + Math.abs(transactionAmount)
          : parseFloat(customerProfile.totalBCoinsSpent || "0");

        await storage.updateCustomerProfile(transactionData.customerId, {
          bCoinBalance: newBalance.toFixed(2),
          totalBCoinsEarned: totalEarned.toFixed(2),
          totalBCoinsSpent: totalSpent.toFixed(2)
        });
      }
      
      // Update business stats
      const business = await storage.getBusiness(transactionData.businessId);
      if (business) {
        const transactionAmount = parseFloat(transactionData.amount);
        if (transactionAmount > 0) {
          // B-Coins issued
          const newIssued = parseFloat(business.totalBCoinsIssued || "0") + transactionAmount;
          await storage.updateBusiness(transactionData.businessId, {
            totalBCoinsIssued: newIssued.toFixed(2)
          });
        } else {
          // B-Coins redeemed
          const newRedeemed = parseFloat(business.totalBCoinsRedeemed || "0") + Math.abs(transactionAmount);
          await storage.updateBusiness(transactionData.businessId, {
            totalBCoinsRedeemed: newRedeemed.toFixed(2)
          });
        }
      }

      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/bcoin-transactions/user/:userId", async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.params.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/bcoin-transactions/business/:businessId", async (req, res) => {
    try {
      const transactions = await storage.getBusinessTransactions(req.params.businessId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // QR Code routes
  app.post("/api/qr-codes", async (req, res) => {
    try {
      const qrCodeData = req.body;
      const qrCode = await storage.createQRCode({
        businessId: qrCodeData.businessId,
        code: `BAARTAL-${qrCodeData.businessId}-${Date.now()}`,
        isActive: true
      });
      res.json(qrCode);
    } catch (error) {
      res.status(400).json({ message: "Failed to create QR code" });
    }
  });

  app.get("/api/qr-codes/:code", async (req, res) => {
    try {
      const qrCode = await storage.getQRCodeByCode(req.params.code);
      if (!qrCode || !qrCode.isActive) {
        return res.status(404).json({ message: "QR code not found or inactive" });
      }
      
      const business = await storage.getBusiness(qrCode.businessId);
      if (!business) {
        return res.status(404).json({ message: "Associated business not found" });
      }
      
      res.json({ qrCode, business });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate QR code" });
    }
  });

  app.get("/api/qr-codes/business/:businessId", async (req, res) => {
    try {
      const qrCodes = await storage.getBusinessQRCodes(req.params.businessId);
      res.json(qrCodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch QR codes" });
    }
  });

  // QR Scan and Transaction Processing
  app.post("/api/scan-qr", async (req, res) => {
    try {
      const { qrCode, customerId, billAmount } = req.body;
      
      // Validate QR code
      const qr = await storage.getQRCodeByCode(qrCode);
      if (!qr || !qr.isActive) {
        return res.status(404).json({ message: "Invalid QR code" });
      }
      
      const business = await storage.getBusiness(qr.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Calculate B-Coins earned (percentage of bill amount)
      const bCoinPercentage = parseFloat(business.bCoinPercentage || "5");
      const bCoinsEarned = (parseFloat(billAmount) * bCoinPercentage) / 100;
      
      // Create transaction
      const transaction = await storage.createBCoinTransaction({
        customerId,
        businessId: business.id,
        type: "earned",
        amount: bCoinsEarned.toFixed(2),
        billAmount: billAmount,
        description: `Earned from ${business.businessName}`,
        qrCode: qrCode
      });
      
      // Update customer profile
      const customerProfile = await storage.getCustomerProfile(customerId);
      if (customerProfile) {
        const newBalance = parseFloat(customerProfile.bCoinBalance || "0") + bCoinsEarned;
        const newEarned = parseFloat(customerProfile.totalBCoinsEarned || "0") + bCoinsEarned;
        
        await storage.updateCustomerProfile(customerId, {
          bCoinBalance: newBalance.toFixed(2),
          totalBCoinsEarned: newEarned.toFixed(2)
        });
      }
      
      // Update business stats
      const newIssued = parseFloat(business.totalBCoinsIssued || "0") + bCoinsEarned;
      const newCustomers = (business.totalCustomers || 0) + 1;
      await storage.updateBusiness(business.id, {
        totalBCoinsIssued: newIssued.toFixed(2),
        totalCustomers: newCustomers
      });
      
      res.json({ 
        transaction, 
        bCoinsEarned: bCoinsEarned.toFixed(2),
        business: business.businessName 
      });
    } catch (error) {
      res.status(400).json({ message: "QR scan failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Rating routes
  app.post("/api/ratings", async (req, res) => {
    try {
      const ratingData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating(ratingData);
      
      // Award bonus B-Coins for rating
      const bonusAmount = parseFloat(rating.bonusBCoins || "0");
      if (bonusAmount > 0) {
        const business = await storage.getBusiness(ratingData.businessId);
        await storage.createBCoinTransaction({
          customerId: ratingData.customerId,
          businessId: ratingData.businessId,
          type: "earned",
          amount: bonusAmount.toFixed(2),
          description: `Bonus for rating ${business?.businessName || 'business'}`
        });
        
        // Update customer balance
        const customerProfile = await storage.getCustomerProfile(ratingData.customerId);
        if (customerProfile) {
          const newBalance = parseFloat(customerProfile.bCoinBalance || "0") + bonusAmount;
          const newEarned = parseFloat(customerProfile.totalBCoinsEarned || "0") + bonusAmount;
          
          await storage.updateCustomerProfile(ratingData.customerId, {
            bCoinBalance: newBalance.toFixed(2),
            totalBCoinsEarned: newEarned.toFixed(2)
          });
        }
      }
      
      res.json(rating);
    } catch (error) {
      res.status(400).json({ message: "Invalid rating data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/ratings/business/:businessId", async (req, res) => {
    try {
      const ratings = await storage.getBusinessRatings(req.params.businessId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.get("/api/ratings/user/:userId", async (req, res) => {
    try {
      const ratings = await storage.getUserRatings(req.params.userId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Business Analytics
  app.get("/api/analytics/business/:businessId", async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      const transactions = await storage.getBusinessTransactions(req.params.businessId);
      const ratings = await storage.getBusinessRatings(req.params.businessId);
      
      // Calculate analytics
      const totalBCoinsIssued = parseFloat(business.totalBCoinsIssued || "0");
      const totalBCoinsRedeemed = parseFloat(business.totalBCoinsRedeemed || "0");
      const uniqueCustomers = new Set(transactions.map(t => t.customerId)).size;
      
      const earnTransactions = transactions.filter(t => t.type === "earned");
      const totalRevenue = earnTransactions.reduce((sum, t) => 
        sum + parseFloat(t.billAmount || "0"), 0
      );
      const averageBillAmount = earnTransactions.length > 0 
        ? totalRevenue / earnTransactions.length 
        : 0;
      
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      
      // Weekly data (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyTransactions = transactions.filter(t => 
        new Date(t.createdAt!) > oneWeekAgo
      );
      
      const analytics = {
        totalBCoinsIssued,
        totalBCoinsRedeemed,
        uniqueCustomers,
        totalTransactions: transactions.length,
        averageBillAmount: averageBillAmount.toFixed(2),
        averageRating: averageRating.toFixed(1),
        totalRatings: ratings.length,
        weeklyData: {
          transactions: weeklyTransactions.length,
          revenue: weeklyTransactions
            .filter(t => t.type === "earned")
            .reduce((sum, t) => sum + parseFloat(t.billAmount || "0"), 0)
            .toFixed(2),
          bCoinsIssued: weeklyTransactions
            .filter(t => t.type === "earned")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
            .toFixed(2)
        }
      };
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Business categories
  app.get("/api/business-categories", async (req, res) => {
    res.json(BUSINESS_CATEGORIES);
  });

  // Check category availability in pincode
  app.get("/api/category-availability/:pincode/:category", async (req, res) => {
    try {
      const { pincode, category } = req.params;
      const businesses = await storage.getBusinessesByPincode(pincode);
      const isAvailable = !businesses.some(b => b.category === category);
      
      res.json({ 
        available: isAvailable,
        existingBusiness: isAvailable ? null : businesses.find(b => b.category === category)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Redeem B-Coins
  app.post("/api/redeem-bcoins", async (req, res) => {
    try {
      const { customerId, businessId, amount } = req.body;
      
      // Validate customer has enough B-Coins
      const customerProfile = await storage.getCustomerProfile(customerId);
      if (!customerProfile) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const currentBalance = parseFloat(customerProfile.bCoinBalance || "0");
      const redeemAmount = parseFloat(amount);
      
      if (currentBalance < redeemAmount) {
        return res.status(400).json({ message: "Insufficient B-Coins balance" });
      }
      
      // Create redemption transaction
      const transaction = await storage.createBCoinTransaction({
        customerId,
        businessId,
        type: "spent",
        amount: (-redeemAmount).toFixed(2),
        description: "B-Coins redemption"
      });
      
      // Update customer balance
      const newBalance = currentBalance - redeemAmount;
      const newSpent = parseFloat(customerProfile.totalBCoinsSpent || "0") + redeemAmount;
      
      await storage.updateCustomerProfile(customerId, {
        bCoinBalance: newBalance.toFixed(2),
        totalBCoinsSpent: newSpent.toFixed(2)
      });
      
      // Update business stats
      const business = await storage.getBusiness(businessId);
      if (business) {
        const newRedeemed = parseFloat(business.totalBCoinsRedeemed || "0") + redeemAmount;
        await storage.updateBusiness(businessId, {
          totalBCoinsRedeemed: newRedeemed.toFixed(2)
        });
      }
      
      res.json({ 
        transaction, 
        newBalance: newBalance.toFixed(2),
        message: `Successfully redeemed ₹${redeemAmount} in B-Coins`
      });
    } catch (error) {
      res.status(400).json({ message: "Redemption failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}