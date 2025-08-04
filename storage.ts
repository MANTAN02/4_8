import { type User, type InsertUser, type Business, type InsertBusiness, type Bundle, type BCoinTransaction, type InsertBCoinTransaction, type CustomerProfile, type InsertCustomerProfile, type Rating, type InsertRating, type QRCode, type InsertQRCode } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Business operations
  getBusiness(id: string): Promise<Business | undefined>;
  getBusinessByUserId(userId: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, updates: Partial<Business>): Promise<Business | undefined>;
  getBusinessesByPincode(pincode: string): Promise<Business[]>;
  getBusinessesByCategory(category: string): Promise<Business[]>;
  getBusinessesInBundle(bundleId: string): Promise<Business[]>;

  // Bundle operations
  getBundle(id: string): Promise<Bundle | undefined>;
  getBundleByPincode(pincode: string): Promise<Bundle | undefined>;
  createBundle(bundle: { name: string; pincode: string; description?: string }): Promise<Bundle>;
  getAllBundles(): Promise<Bundle[]>;

  // Customer Profile operations
  getCustomerProfile(userId: string): Promise<CustomerProfile | undefined>;
  createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  updateCustomerProfile(userId: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile | undefined>;

  // B-Coin Transaction operations
  createBCoinTransaction(transaction: InsertBCoinTransaction): Promise<BCoinTransaction>;
  getUserTransactions(userId: string): Promise<BCoinTransaction[]>;
  getBusinessTransactions(businessId: string): Promise<BCoinTransaction[]>;

  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getBusinessRatings(businessId: string): Promise<Rating[]>;
  getUserRatings(userId: string): Promise<Rating[]>;

  // QR Code operations
  createQRCode(qrCode: InsertQRCode): Promise<QRCode>;
  getQRCodeByCode(code: string): Promise<QRCode | undefined>;
  getBusinessQRCodes(businessId: string): Promise<QRCode[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private businesses: Map<string, Business>;
  private bundles: Map<string, Bundle>;
  private bCoinTransactions: Map<string, BCoinTransaction>;
  private customerProfiles: Map<string, CustomerProfile>;
  private ratings: Map<string, Rating>;
  private qrCodes: Map<string, QRCode>;

  constructor() {
    this.users = new Map();
    this.businesses = new Map();
    this.bundles = new Map();
    this.bCoinTransactions = new Map();
    this.customerProfiles = new Map();
    this.ratings = new Map();
    this.qrCodes = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id, 
      pincode: insertUser.pincode || null,
      phone: insertUser.phone || null,
      isVerified: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Business operations
  async getBusiness(id: string): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async getBusinessByUserId(userId: string): Promise<Business | undefined> {
    return Array.from(this.businesses.values()).find(business => business.userId === userId);
  }

  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const id = randomUUID();
    const business: Business = { 
      ...insertBusiness,
      id,
      address: insertBusiness.address || null,
      description: insertBusiness.description || null,
      bundleId: insertBusiness.bundleId || null,
      bCoinPercentage: "5.00",
      isActive: true,
      isFeatured: false,
      totalBCoinsIssued: "0.00",
      totalBCoinsRedeemed: "0.00",
      totalCustomers: 0,
      photos: [],
      createdAt: new Date()
    };
    this.businesses.set(id, business);
    return business;
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | undefined> {
    const business = this.businesses.get(id);
    if (!business) return undefined;
    const updated = { ...business, ...updates };
    this.businesses.set(id, updated);
    return updated;
  }

  async getBusinessesByPincode(pincode: string): Promise<Business[]> {
    return Array.from(this.businesses.values()).filter(business => business.pincode === pincode);
  }

  async getBusinessesByCategory(category: string): Promise<Business[]> {
    return Array.from(this.businesses.values()).filter(business => business.category === category);
  }

  async getBusinessesInBundle(bundleId: string): Promise<Business[]> {
    return Array.from(this.businesses.values()).filter(business => business.bundleId === bundleId);
  }

  // Bundle operations
  async getBundle(id: string): Promise<Bundle | undefined> {
    return this.bundles.get(id);
  }

  async getBundleByPincode(pincode: string): Promise<Bundle | undefined> {
    return Array.from(this.bundles.values()).find(bundle => bundle.pincode === pincode);
  }

  async createBundle(bundle: { name: string; pincode: string; description?: string }): Promise<Bundle> {
    const id = randomUUID();
    const newBundle: Bundle = {
      id,
      name: bundle.name,
      pincode: bundle.pincode,
      description: bundle.description || null,
      isActive: true,
      createdAt: new Date()
    };
    this.bundles.set(id, newBundle);
    return newBundle;
  }

  async getAllBundles(): Promise<Bundle[]> {
    return Array.from(this.bundles.values());
  }

  // Customer Profile operations
  async getCustomerProfile(userId: string): Promise<CustomerProfile | undefined> {
    return Array.from(this.customerProfiles.values()).find(profile => profile.userId === userId);
  }

  async createCustomerProfile(insertProfile: InsertCustomerProfile): Promise<CustomerProfile> {
    const id = randomUUID();
    const profile: CustomerProfile = {
      ...insertProfile,
      id,
      preferredPincode: insertProfile.preferredPincode || null,
      bCoinBalance: "0.00",
      totalBCoinsEarned: "0.00",
      totalBCoinsSpent: "0.00",
      favoriteBusinesses: []
    };
    this.customerProfiles.set(id, profile);
    return profile;
  }

  async updateCustomerProfile(userId: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile | undefined> {
    const profile = Array.from(this.customerProfiles.values()).find(p => p.userId === userId);
    if (!profile) return undefined;
    const updated = { ...profile, ...updates };
    this.customerProfiles.set(profile.id, updated);
    return updated;
  }

  // B-Coin Transaction operations
  async createBCoinTransaction(insertTransaction: InsertBCoinTransaction): Promise<BCoinTransaction> {
    const id = randomUUID();
    const transaction: BCoinTransaction = {
      ...insertTransaction,
      id,
      description: insertTransaction.description || null,
      billAmount: insertTransaction.billAmount || null,
      qrCode: insertTransaction.qrCode || null,
      createdAt: new Date()
    };
    this.bCoinTransactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: string): Promise<BCoinTransaction[]> {
    return Array.from(this.bCoinTransactions.values())
      .filter(transaction => transaction.customerId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getBusinessTransactions(businessId: string): Promise<BCoinTransaction[]> {
    return Array.from(this.bCoinTransactions.values())
      .filter(transaction => transaction.businessId === businessId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  // Rating operations
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const bonusBCoins = insertRating.rating >= 4 ? "10.00" : "5.00";
    const rating: Rating = {
      ...insertRating,
      id,
      comment: insertRating.comment || null,
      bonusBCoins,
      createdAt: new Date()
    };
    this.ratings.set(id, rating);
    return rating;
  }

  async getBusinessRatings(businessId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(rating => rating.businessId === businessId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(rating => rating.customerId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  // QR Code operations
  async createQRCode(insertQRCode: InsertQRCode): Promise<QRCode> {
    const id = randomUUID();
    const qrCode: QRCode = {
      ...insertQRCode,
      id,
      expiresAt: insertQRCode.expiresAt || null,
      isActive: true,
      createdAt: new Date()
    };
    this.qrCodes.set(id, qrCode);
    return qrCode;
  }

  async getQRCodeByCode(code: string): Promise<QRCode | undefined> {
    return Array.from(this.qrCodes.values()).find(qr => qr.code === code);
  }

  async getBusinessQRCodes(businessId: string): Promise<QRCode[]> {
    return Array.from(this.qrCodes.values())
      .filter(qr => qr.businessId === businessId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async deleteQRCode(qrCodeId: string): Promise<boolean> {
    return this.qrCodes.delete(qrCodeId);
  }

  // Additional helper methods for bundle management
  async getBundleByCategoryAndPincode(category: string, pincode: string): Promise<Business | undefined> {
    const businesses = await this.getBusinessesByPincode(pincode);
    return businesses.find(business => business.category === category);
  }

  async validateBundleConstraints(category: string, pincode: string): Promise<{ valid: boolean; conflictingBusiness?: Business }> {
    const conflictingBusiness = await this.getBundleByCategoryAndPincode(category, pincode);
    return {
      valid: !conflictingBusiness,
      conflictingBusiness
    };
  }

  // Analytics helper methods
  async getBusinessAnalytics(businessId: string): Promise<any> {
    const business = await this.getBusiness(businessId);
    if (!business) return null;

    const transactions = await this.getBusinessTransactions(businessId);
    const ratings = await this.getBusinessRatings(businessId);

    const earnTransactions = transactions.filter(t => t.type === "earned");
    const spendTransactions = transactions.filter(t => t.type === "spent");

    return {
      totalBCoinsIssued: parseFloat(business.totalBCoinsIssued || "0"),
      totalBCoinsRedeemed: parseFloat(business.totalBCoinsRedeemed || "0"),
      totalTransactions: transactions.length,
      earnTransactions: earnTransactions.length,
      spendTransactions: spendTransactions.length,
      averageRating: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0,
      totalRatings: ratings.length,
      uniqueCustomers: new Set(transactions.map(t => t.customerId)).size
    };
  }
}

export const storage = new MemStorage();
