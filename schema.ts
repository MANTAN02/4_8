import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  userType: text("user_type").notNull(), // 'customer' or 'business'
  name: text("name").notNull(),
  pincode: text("pincode"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  category: text("category").notNull(), // One of the 10 predefined categories
  pincode: text("pincode").notNull(),
  address: text("address"),
  description: text("description"),
  bCoinPercentage: decimal("bcoin_percentage", { precision: 5, scale: 2 }).default("5.00"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  bundleId: varchar("bundle_id"),
  totalBCoinsIssued: decimal("total_bcoins_issued", { precision: 12, scale: 2 }).default("0.00"),
  totalBCoinsRedeemed: decimal("total_bcoins_redeemed", { precision: 12, scale: 2 }).default("0.00"),
  totalCustomers: integer("total_customers").default(0),
  photos: json("photos").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bundles = pgTable("bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  pincode: text("pincode").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bCoinTransactions = pgTable("bcoin_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  type: text("type").notNull(), // 'earned' or 'spent'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  billAmount: decimal("bill_amount", { precision: 10, scale: 2 }),
  description: text("description"),
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bCoinBalance: decimal("bcoin_balance", { precision: 10, scale: 2 }).default("0.00"),
  totalBCoinsEarned: decimal("total_bcoins_earned", { precision: 10, scale: 2 }).default("0.00"),
  totalBCoinsSpent: decimal("total_bcoins_spent", { precision: 10, scale: 2 }).default("0.00"),
  favoriteBusinesses: json("favorite_businesses").$type<string[]>().default([]),
  preferredPincode: text("preferred_pincode"),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  bonusBCoins: decimal("bonus_bcoins", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const qrCodes = pgTable("qr_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertBusinessSchema = createInsertSchema(businesses).omit({ 
  id: true, 
  createdAt: true, 
  totalBCoinsIssued: true, 
  totalBCoinsRedeemed: true, 
  totalCustomers: true 
});
export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({ id: true });
export const insertBCoinTransactionSchema = createInsertSchema(bCoinTransactions).omit({ id: true, createdAt: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true, bonusBCoins: true });
export const insertQRCodeSchema = createInsertSchema(qrCodes).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Bundle = typeof bundles.$inferSelect;
export type BCoinTransaction = typeof bCoinTransactions.$inferSelect;
export type InsertBCoinTransaction = z.infer<typeof insertBCoinTransactionSchema>;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type QRCode = typeof qrCodes.$inferSelect;
export type InsertQRCode = z.infer<typeof insertQRCodeSchema>;

// Business categories
export const BUSINESS_CATEGORIES = [
  { value: "kirana", label: "Kirana / Grocery" },
  { value: "electronics", label: "Electronics / Gadgets" },
  { value: "clothing", label: "Clothing Store" },
  { value: "food", label: "Food / Restaurant" },
  { value: "salon", label: "Salon / Beauty" },
  { value: "footwear", label: "Footwear" },
  { value: "cafe", label: "Cafe / Ice Cream" },
  { value: "gifts", label: "Gift / Toy" },
  { value: "medicine", label: "Medicine / Wellness" },
  { value: "stationery", label: "Stationery / School" },
] as const;
