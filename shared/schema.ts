import { pgTable, varchar, text, integer, boolean, timestamp, numeric, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  userType: varchar("user_type", { length: 20 }).notNull(), // 'customer' or 'business'
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Business profiles table
export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  pincode: varchar("pincode", { length: 10 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  isVerified: boolean("is_verified").default(false),
  bCoinRate: numeric("bcoin_rate", { precision: 5, scale: 2 }).default("5.00"), // Percentage of purchase that becomes B-Coins
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bundles table (groups of businesses in same area)
export const bundles = pgTable("bundles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  pincode: varchar("pincode", { length: 10 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bundle memberships (which businesses are in which bundles)
export const bundleMemberships = pgTable("bundle_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  bundleId: uuid("bundle_id").references(() => bundles.id).notNull(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// B-Coin transactions table
export const bCoinTransactions = pgTable("bcoin_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => users.id).notNull(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'earned' or 'redeemed'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  bCoinsChanged: numeric("bcoins_changed", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  qrCodeId: varchar("qr_code_id", { length: 255 }), // Reference to QR code used
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// QR codes table
export const qrCodes = pgTable("qr_codes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isUsed: boolean("is_used").default(false),
  usedBy: uuid("used_by").references(() => users.id),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ratings table
export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => users.id).notNull(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer B-Coin balances
export const customerBalances = pgTable("customer_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => users.id).notNull().unique(),
  totalBCoins: numeric("total_bcoins", { precision: 10, scale: 2 }).default("0.00"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type Bundle = typeof bundles.$inferSelect;
export type BundleMembership = typeof bundleMemberships.$inferSelect;
export type BCoinTransaction = typeof bCoinTransactions.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type CustomerBalance = typeof customerBalances.$inferSelect;

// Insert types
export type InsertUser = typeof users.$inferInsert;
export type InsertBusiness = typeof businesses.$inferInsert;
export type InsertBundle = typeof bundles.$inferInsert;
export type InsertBundleMembership = typeof bundleMemberships.$inferInsert;
export type InsertBCoinTransaction = typeof bCoinTransactions.$inferInsert;
export type InsertQrCode = typeof qrCodes.$inferInsert;
export type InsertRating = typeof ratings.$inferInsert;
export type InsertNotification = typeof notifications.$inferInsert;
export type InsertCustomerBalance = typeof customerBalances.$inferInsert;

// Manual Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  userType: z.enum(["customer", "business"]),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
});

export const insertBusinessSchema = z.object({
  userId: z.string().uuid(),
  businessName: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional().nullable(),
  address: z.string().min(1),
  pincode: z.string().min(1),
  phone: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
  bCoinRate: z.string().optional(),
});

export const insertBundleSchema = z.object({
  name: z.string().min(1),
  pincode: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const insertBundleMembershipSchema = z.object({
  bundleId: z.string().uuid(),
  businessId: z.string().uuid(),
});

export const insertBCoinTransactionSchema = z.object({
  customerId: z.string().uuid(),
  businessId: z.string().uuid(),
  type: z.enum(["earned", "redeemed"]),
  amount: z.string(),
  bCoinsChanged: z.string(),
  description: z.string().optional().nullable(),
  qrCodeId: z.string().optional().nullable(),
});

export const insertQrCodeSchema = z.object({
  id: z.string(),
  businessId: z.string().uuid(),
  amount: z.string(),
  description: z.string().optional().nullable(),
  isUsed: z.boolean().optional(),
  usedBy: z.string().uuid().optional().nullable(),
  usedAt: z.date().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
});

export const insertRatingSchema = z.object({
  customerId: z.string().uuid(),
  businessId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().optional().nullable(),
});

export const insertNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.string().optional().nullable(),
  isRead: z.boolean().optional(),
});

export const insertCustomerBalanceSchema = z.object({
  customerId: z.string().uuid(),
  totalBCoins: z.string().optional().nullable(),
});

// Business categories
export const BUSINESS_CATEGORIES = [
  { id: "kirana", name: "Kirana Store", emoji: "🏪" },
  { id: "electronics", name: "Electronics", emoji: "📱" },
  { id: "clothing", name: "Clothing", emoji: "👕" },
  { id: "food", name: "Food & Beverages", emoji: "🍕" },
  { id: "salon", name: "Salon & Beauty", emoji: "💄" },
  { id: "pharmacy", name: "Pharmacy", emoji: "💊" },
  { id: "stationery", name: "Stationery", emoji: "📚" },
  { id: "hardware", name: "Hardware", emoji: "🔧" },
  { id: "fitness", name: "Fitness", emoji: "💪" },
  { id: "services", name: "Services", emoji: "⚙️" },
] as const;