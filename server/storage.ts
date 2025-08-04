import type {
  User,
  Business,
  Bundle,
  BundleMembership,
  BCoinTransaction,
  QrCode,
  Rating,
  InsertUser,
  InsertBusiness,
  InsertBundle,
  InsertBCoinTransaction,
  InsertQrCode,
  InsertRating,
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
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;

  // Business operations
  createBusiness(business: InsertBusiness & { userId: string }): Promise<Business>;
  getBusinessById(id: string): Promise<Business | null>;
  getBusinessesByUserId(userId: string): Promise<Business[]>;
  getBusinessesByCategory(category: string): Promise<Business[]>;
  getBusinessesByPincode(pincode: string): Promise<Business[]>;
  updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null>;

  // Bundle operations
  createBundle(bundle: InsertBundle): Promise<Bundle>;
  getBundleById(id: string): Promise<Bundle | null>;
  getBundlesByPincode(pincode: string): Promise<Bundle[]>;
  getAllBundles(): Promise<Bundle[]>;
  addBusinessToBundle(bundleId: string, businessId: string): Promise<BundleMembership>;
  getBundleBusinesses(bundleId: string): Promise<Business[]>;
  getBusinessBundles(businessId: string): Promise<Bundle[]>;

  // B-Coin transaction operations
  createBCoinTransaction(transaction: InsertBCoinTransaction): Promise<BCoinTransaction>;
  getBCoinTransactionsByCustomer(customerId: string): Promise<BCoinTransaction[]>;
  getBCoinTransactionsByBusiness(businessId: string): Promise<BCoinTransaction[]>;
  getCustomerBCoinBalance(customerId: string): Promise<number>;

  // QR Code operations
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  getQrCodeById(id: string): Promise<QrCode | null>;
  getQrCodesByBusiness(businessId: string): Promise<QrCode[]>;
  useQrCode(id: string, customerId: string): Promise<QrCode | null>;

  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByBusiness(businessId: string): Promise<Rating[]>;
  getRatingsByCustomer(customerId: string): Promise<Rating[]>;
  getBusinessAverageRating(businessId: string): Promise<number>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private businesses: Map<string, Business> = new Map();
  private bundles: Map<string, Bundle> = new Map();
  private bundleMemberships: Map<string, BundleMembership> = new Map();
  private bCoinTransactions: Map<string, BCoinTransaction> = new Map();
  private qrCodes: Map<string, QrCode> = new Map();
  private ratings: Map<string, Rating> = new Map();

  private generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.generateId(),
      ...user,
      phone: user.phone ?? null,
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = Array.from(this.users.values());
    for (const user of users) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Business operations
  async createBusiness(business: InsertBusiness & { userId: string }): Promise<Business> {
    const newBusiness: Business = {
      id: this.generateId(),
      ...business,
      phone: business.phone ?? null,
      description: business.description ?? null,
      isVerified: business.isVerified ?? false,
      bCoinRate: business.bCoinRate ?? "5.00",
      createdAt: new Date(),
    };
    this.businesses.set(newBusiness.id, newBusiness);
    return newBusiness;
  }

  async getBusinessById(id: string): Promise<Business | null> {
    return this.businesses.get(id) || null;
  }

  async getBusinessesByUserId(userId: string): Promise<Business[]> {
    return Array.from(this.businesses.values()).filter(b => b.userId === userId);
  }

  async getBusinessesByCategory(category: string): Promise<Business[]> {
    return Array.from(this.businesses.values()).filter(b => b.category === category);
  }

  async getBusinessesByPincode(pincode: string): Promise<Business[]> {
    return Array.from(this.businesses.values()).filter(b => b.pincode === pincode);
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    const business = this.businesses.get(id);
    if (!business) return null;
    
    const updatedBusiness = { ...business, ...updates };
    this.businesses.set(id, updatedBusiness);
    return updatedBusiness;
  }

  // Bundle operations
  async createBundle(bundle: InsertBundle): Promise<Bundle> {
    const newBundle: Bundle = {
      id: this.generateId(),
      ...bundle,
      description: bundle.description ?? null,
      isActive: bundle.isActive ?? true,
      createdAt: new Date(),
    };
    this.bundles.set(newBundle.id, newBundle);
    return newBundle;
  }

  async getBundleById(id: string): Promise<Bundle | null> {
    return this.bundles.get(id) || null;
  }

  async getBundlesByPincode(pincode: string): Promise<Bundle[]> {
    return Array.from(this.bundles.values()).filter(b => b.pincode === pincode);
  }

  async getAllBundles(): Promise<Bundle[]> {
    return Array.from(this.bundles.values());
  }

  async addBusinessToBundle(bundleId: string, businessId: string): Promise<BundleMembership> {
    const membership: BundleMembership = {
      id: this.generateId(),
      bundleId,
      businessId,
      joinedAt: new Date(),
    };
    this.bundleMemberships.set(membership.id, membership);
    return membership;
  }

  async getBundleBusinesses(bundleId: string): Promise<Business[]> {
    const memberships = Array.from(this.bundleMemberships.values())
      .filter(m => m.bundleId === bundleId);
    
    const businesses = [];
    for (const membership of memberships) {
      const business = await this.getBusinessById(membership.businessId);
      if (business) businesses.push(business);
    }
    return businesses;
  }

  async getBusinessBundles(businessId: string): Promise<Bundle[]> {
    const memberships = Array.from(this.bundleMemberships.values())
      .filter(m => m.businessId === businessId);
    
    const bundles = [];
    for (const membership of memberships) {
      const bundle = await this.getBundleById(membership.bundleId);
      if (bundle) bundles.push(bundle);
    }
    return bundles;
  }

  // B-Coin transaction operations
  async createBCoinTransaction(transaction: InsertBCoinTransaction): Promise<BCoinTransaction> {
    const newTransaction: BCoinTransaction = {
      id: this.generateId(),
      ...transaction,
      description: transaction.description ?? null,
      qrCodeId: transaction.qrCodeId ?? null,
      createdAt: new Date(),
    };
    this.bCoinTransactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }

  async getBCoinTransactionsByCustomer(customerId: string): Promise<BCoinTransaction[]> {
    return Array.from(this.bCoinTransactions.values())
      .filter(t => t.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getBCoinTransactionsByBusiness(businessId: string): Promise<BCoinTransaction[]> {
    return Array.from(this.bCoinTransactions.values())
      .filter(t => t.businessId === businessId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCustomerBCoinBalance(customerId: string): Promise<number> {
    const transactions = await this.getBCoinTransactionsByCustomer(customerId);
    return transactions.reduce((balance, transaction) => {
      return balance + parseFloat(transaction.bCoinsChanged.toString());
    }, 0);
  }

  // QR Code operations
  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    const newQrCode: QrCode = {
      ...qrCode,
      description: qrCode.description ?? null,
      expiresAt: qrCode.expiresAt ?? null,
      isUsed: false,
      usedBy: null,
      usedAt: null,
      createdAt: new Date(),
    };
    this.qrCodes.set(newQrCode.id, newQrCode);
    return newQrCode;
  }

  async getQrCodeById(id: string): Promise<QrCode | null> {
    return this.qrCodes.get(id) || null;
  }

  async getQrCodesByBusiness(businessId: string): Promise<QrCode[]> {
    return Array.from(this.qrCodes.values())
      .filter(q => q.businessId === businessId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async useQrCode(id: string, customerId: string): Promise<QrCode | null> {
    const qrCode = this.qrCodes.get(id);
    if (!qrCode || qrCode.isUsed) return null;
    
    const updatedQrCode = {
      ...qrCode,
      isUsed: true,
      usedBy: customerId,
      usedAt: new Date(),
    };
    this.qrCodes.set(id, updatedQrCode);
    return updatedQrCode;
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const newRating: Rating = {
      id: this.generateId(),
      ...rating,
      review: rating.review ?? null,
      createdAt: new Date(),
    };
    this.ratings.set(newRating.id, newRating);
    return newRating;
  }

  async getRatingsByBusiness(businessId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(r => r.businessId === businessId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRatingsByCustomer(customerId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(r => r.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getBusinessAverageRating(businessId: string): Promise<number> {
    const ratings = await this.getRatingsByBusiness(businessId);
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return sum / ratings.length;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        phone: user.phone ?? null,
      })
      .returning();
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
    const [newBusiness] = await db
      .insert(businesses)
      .values({
        ...business,
        phone: business.phone ?? null,
        description: business.description ?? null,
        isVerified: business.isVerified ?? false,
        bCoinRate: business.bCoinRate ?? "5.00",
      })
      .returning();
    return newBusiness;
  }

  async getBusinessById(id: string): Promise<Business | null> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || null;
  }

  async getBusinessesByUserId(userId: string): Promise<Business[]> {
    return await db.select().from(businesses).where(eq(businesses.userId, userId));
  }

  async getBusinessesByCategory(category: string): Promise<Business[]> {
    return await db.select().from(businesses).where(eq(businesses.category, category));
  }

  async getBusinessesByPincode(pincode: string): Promise<Business[]> {
    return await db.select().from(businesses).where(eq(businesses.pincode, pincode));
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
    const [newBundle] = await db
      .insert(bundles)
      .values({
        ...bundle,
        description: bundle.description ?? null,
        isActive: bundle.isActive ?? true,
      })
      .returning();
    return newBundle;
  }

  async getBundleById(id: string): Promise<Bundle | null> {
    const [bundle] = await db.select().from(bundles).where(eq(bundles.id, id));
    return bundle || null;
  }

  async getBundlesByPincode(pincode: string): Promise<Bundle[]> {
    return await db.select().from(bundles).where(eq(bundles.pincode, pincode));
  }

  async getAllBundles(): Promise<Bundle[]> {
    return await db.select().from(bundles);
  }

  async addBusinessToBundle(bundleId: string, businessId: string): Promise<BundleMembership> {
    const [membership] = await db
      .insert(bundleMemberships)
      .values({ bundleId, businessId })
      .returning();
    return membership;
  }

  async getBundleBusinesses(bundleId: string): Promise<Business[]> {
    const businessesInBundle = await db
      .select({ business: businesses })
      .from(bundleMemberships)
      .innerJoin(businesses, eq(bundleMemberships.businessId, businesses.id))
      .where(eq(bundleMemberships.bundleId, bundleId));
    
    return businessesInBundle.map(item => item.business);
  }

  async getBusinessBundles(businessId: string): Promise<Bundle[]> {
    const bundlesForBusiness = await db
      .select({ bundle: bundles })
      .from(bundleMemberships)
      .innerJoin(bundles, eq(bundleMemberships.bundleId, bundles.id))
      .where(eq(bundleMemberships.businessId, businessId));
    
    return bundlesForBusiness.map(item => item.bundle);
  }

  // B-Coin transaction operations
  async createBCoinTransaction(transaction: InsertBCoinTransaction): Promise<BCoinTransaction> {
    const [newTransaction] = await db
      .insert(bCoinTransactions)
      .values({
        ...transaction,
        description: transaction.description ?? null,
        qrCodeId: transaction.qrCodeId ?? null,
      })
      .returning();
    return newTransaction;
  }

  async getBCoinTransactionsByCustomer(customerId: string): Promise<BCoinTransaction[]> {
    return await db
      .select()
      .from(bCoinTransactions)
      .where(eq(bCoinTransactions.customerId, customerId))
      .orderBy(desc(bCoinTransactions.createdAt));
  }

  async getBCoinTransactionsByBusiness(businessId: string): Promise<BCoinTransaction[]> {
    return await db
      .select()
      .from(bCoinTransactions)
      .where(eq(bCoinTransactions.businessId, businessId))
      .orderBy(desc(bCoinTransactions.createdAt));
  }

  async getCustomerBCoinBalance(customerId: string): Promise<number> {
    const transactions = await this.getBCoinTransactionsByCustomer(customerId);
    return transactions.reduce((balance, transaction) => {
      return balance + parseFloat(transaction.bCoinsChanged.toString());
    }, 0);
  }

  // QR Code operations
  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    const [newQrCode] = await db
      .insert(qrCodes)
      .values({
        ...qrCode,
        description: qrCode.description ?? null,
        expiresAt: qrCode.expiresAt ?? null,
        isUsed: false,
        usedBy: null,
        usedAt: null,
      })
      .returning();
    return newQrCode;
  }

  async getQrCodeById(id: string): Promise<QrCode | null> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode || null;
  }

  async getQrCodesByBusiness(businessId: string): Promise<QrCode[]> {
    return await db
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
      .where(and(eq(qrCodes.id, id), eq(qrCodes.isUsed, false)))
      .returning();
    
    return updatedQrCode || null;
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db
      .insert(ratings)
      .values({
        ...rating,
        review: rating.review ?? null,
      })
      .returning();
    return newRating;
  }

  async getRatingsByBusiness(businessId: string): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.businessId, businessId))
      .orderBy(desc(ratings.createdAt));
  }

  async getRatingsByCustomer(customerId: string): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.customerId, customerId))
      .orderBy(desc(ratings.createdAt));
  }

  async getBusinessAverageRating(businessId: string): Promise<number> {
    const businessRatings = await this.getRatingsByBusiness(businessId);
    if (businessRatings.length === 0) return 0;
    
    const sum = businessRatings.reduce((total, rating) => total + rating.rating, 0);
    return sum / businessRatings.length;
  }
}

// Use database storage by default
export const storage = new DatabaseStorage();