import type {
  User,
  Business,
  Bundle,
  BundleMembership,
  BCoinTransaction,
  QrCode,
  Rating,
  Notification,
  CustomerBalance,
  InsertUser,
  InsertBusiness,
  InsertBundle,
  InsertBCoinTransaction,
  InsertQrCode,
  InsertRating,
  InsertNotification,
  InsertCustomerBalance,
} from "@shared/schema";
import { db } from "./db";
import {
  users,
  businesses,
  bundles,
  bundleMemberships,
  bCoinTransactions,
  qrCodes,
  ratings,
  notifications,
  customerBalances,
} from "@shared/schema";
import { eq, and, desc, sql, avg, sum } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    
    // Initialize customer balance if it's a customer
    if (user.userType === 'customer') {
      await db.insert(customerBalances).values({
        customerId: newUser.id,
        totalBCoins: "0.00",
      });
    }
    
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || null;
  }

  // Business operations
  async createBusiness(business: InsertBusiness & { userId: string }): Promise<Business> {
    const [newBusiness] = await db.insert(businesses).values(business).returning();
    return newBusiness;
  }

  async getBusinessById(id: string): Promise<Business | null> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || null;
  }

  async getBusinessesByUserId(userId: string): Promise<Business[]> {
    return db.select().from(businesses).where(eq(businesses.userId, userId));
  }

  async getBusinessesByCategory(category: string): Promise<Business[]> {
    return db.select().from(businesses).where(eq(businesses.category, category));
  }

  async getBusinessesByPincode(pincode: string): Promise<Business[]> {
    return db.select().from(businesses).where(eq(businesses.pincode, pincode));
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    const [updatedBusiness] = await db
      .update(businesses)
      .set(updates)
      .where(eq(businesses.id, id))
      .returning();
    return updatedBusiness || null;
  }

  // Bundle operations
  async createBundle(bundle: InsertBundle): Promise<Bundle> {
    const [newBundle] = await db.insert(bundles).values(bundle).returning();
    return newBundle;
  }

  async getBundleById(id: string): Promise<Bundle | null> {
    const [bundle] = await db.select().from(bundles).where(eq(bundles.id, id));
    return bundle || null;
  }

  async getBundlesByPincode(pincode: string): Promise<Bundle[]> {
    return db.select().from(bundles).where(eq(bundles.pincode, pincode));
  }

  async getAllBundles(): Promise<Bundle[]> {
    return db.select().from(bundles);
  }

  async addBusinessToBundle(bundleId: string, businessId: string): Promise<BundleMembership> {
    const [membership] = await db
      .insert(bundleMemberships)
      .values({ bundleId, businessId })
      .returning();
    return membership;
  }

  async getBundleBusinesses(bundleId: string): Promise<Business[]> {
    return db
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
      .innerJoin(bundleMemberships, eq(businesses.id, bundleMemberships.businessId))
      .where(eq(bundleMemberships.bundleId, bundleId));
  }

  async getBusinessBundles(businessId: string): Promise<Bundle[]> {
    return db
      .select({
        id: bundles.id,
        name: bundles.name,
        pincode: bundles.pincode,
        description: bundles.description,
        isActive: bundles.isActive,
        createdAt: bundles.createdAt,
      })
      .from(bundles)
      .innerJoin(bundleMemberships, eq(bundles.id, bundleMemberships.bundleId))
      .where(eq(bundleMemberships.businessId, businessId));
  }

  // B-Coin transaction operations
  async createBCoinTransaction(transaction: InsertBCoinTransaction): Promise<BCoinTransaction> {
    const [newTransaction] = await db.insert(bCoinTransactions).values(transaction).returning();
    
    // Update customer balance
    const currentBalance = await this.getCustomerBalance(transaction.customerId);
    const currentBCoins = currentBalance ? parseFloat(currentBalance.totalBCoins) : 0;
    const bCoinsChanged = parseFloat(transaction.bCoinsChanged);
    const newTotal = currentBCoins + bCoinsChanged;
    
    await this.updateCustomerBalance(transaction.customerId, newTotal);
    
    return newTransaction;
  }

  async getBCoinTransactionsByCustomer(customerId: string): Promise<BCoinTransaction[]> {
    return db
      .select()
      .from(bCoinTransactions)
      .where(eq(bCoinTransactions.customerId, customerId))
      .orderBy(desc(bCoinTransactions.createdAt));
  }

  async getBCoinTransactionsByBusiness(businessId: string): Promise<BCoinTransaction[]> {
    return db
      .select()
      .from(bCoinTransactions)
      .where(eq(bCoinTransactions.businessId, businessId))
      .orderBy(desc(bCoinTransactions.createdAt));
  }

  async getCustomerBCoinBalance(customerId: string): Promise<number> {
    const balance = await this.getCustomerBalance(customerId);
    return balance ? parseFloat(balance.totalBCoins) : 0;
  }

  // QR Code operations
  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    const [newQrCode] = await db.insert(qrCodes).values(qrCode).returning();
    return newQrCode;
  }

  async getQrCodeById(id: string): Promise<QrCode | null> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode || null;
  }

  async getQrCodesByBusiness(businessId: string): Promise<QrCode[]> {
    return db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.businessId, businessId))
      .orderBy(desc(qrCodes.createdAt));
  }

  async useQrCode(id: string, customerId: string): Promise<QrCode | null> {
    const [updatedQrCode] = await db
      .update(qrCodes)
      .set({
        isUsed: true,
        usedBy: customerId,
        usedAt: new Date(),
      })
      .where(eq(qrCodes.id, id))
      .returning();
    return updatedQrCode || null;
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getRatingsByBusiness(businessId: string): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(eq(ratings.businessId, businessId))
      .orderBy(desc(ratings.createdAt));
  }

  async getRatingsByCustomer(customerId: string): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(eq(ratings.customerId, customerId))
      .orderBy(desc(ratings.createdAt));
  }

  async getBusinessAverageRating(businessId: string): Promise<number> {
    const [result] = await db
      .select({ avgRating: avg(ratings.rating) })
      .from(ratings)
      .where(eq(ratings.businessId, businessId));
    
    return result?.avgRating ? parseFloat(result.avgRating) : 0;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Customer balance operations
  async getCustomerBalance(customerId: string): Promise<CustomerBalance | null> {
    const [balance] = await db
      .select()
      .from(customerBalances)
      .where(eq(customerBalances.customerId, customerId));
    return balance || null;
  }

  async updateCustomerBalance(customerId: string, totalBCoins: number): Promise<CustomerBalance> {
    const [updatedBalance] = await db
      .insert(customerBalances)
      .values({
        customerId,
        totalBCoins: totalBCoins.toString(),
      })
      .onConflictDoUpdate({
        target: customerBalances.customerId,
        set: {
          totalBCoins: totalBCoins.toString(),
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return updatedBalance;
  }

  // Additional method for enhanced features
  async getAllBusinesses(): Promise<Business[]> {
    return db.select().from(businesses).orderBy(desc(businesses.createdAt));
  }
}