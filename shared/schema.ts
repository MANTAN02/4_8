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

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true });
export const insertBundleSchema = createInsertSchema(bundles).omit({ id: true, createdAt: true });
export const insertBundleMembershipSchema = createInsertSchema(bundleMemberships).omit({ id: true, joinedAt: true });
export const insertBCoinTransactionSchema = createInsertSchema(bCoinTransactions).omit({ id: true, createdAt: true });
export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({ createdAt: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertCustomerBalanceSchema = createInsertSchema(customerBalances).omit({ id: true, updatedAt: true });

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type InsertBundle = z.infer<typeof insertBundleSchema>;
export type InsertBundleMembership = z.infer<typeof insertBundleMembershipSchema>;
export type InsertBCoinTransaction = z.infer<typeof insertBCoinTransactionSchema>;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertCustomerBalance = z.infer<typeof insertCustomerBalanceSchema>;

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