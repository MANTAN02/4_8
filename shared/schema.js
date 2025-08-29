"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS_CATEGORIES = exports.insertCustomerBalanceSchema = exports.insertNotificationSchema = exports.insertRatingSchema = exports.insertQrCodeSchema = exports.insertBCoinTransactionSchema = exports.insertBundleMembershipSchema = exports.insertBundleSchema = exports.insertBusinessSchema = exports.insertUserSchema = exports.customerBalances = exports.notifications = exports.ratings = exports.qrCodes = exports.bCoinTransactions = exports.bundleMemberships = exports.bundles = exports.businesses = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
// Users table
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)("password", { length: 255 }).notNull(),
    userType: (0, pg_core_1.varchar)("user_type", { length: 20 }).notNull(), // 'customer' or 'business'
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Business profiles table
exports.businesses = (0, pg_core_1.pgTable)("businesses", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id).notNull(),
    businessName: (0, pg_core_1.varchar)("business_name", { length: 255 }).notNull(),
    category: (0, pg_core_1.varchar)("category", { length: 100 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    address: (0, pg_core_1.text)("address").notNull(),
    pincode: (0, pg_core_1.varchar)("pincode", { length: 10 }).notNull(),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    bCoinRate: (0, pg_core_1.numeric)("bcoin_rate", { precision: 5, scale: 2 }).default("5.00"), // Percentage of purchase that becomes B-Coins
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Bundles table (groups of businesses in same area)
exports.bundles = (0, pg_core_1.pgTable)("bundles", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    pincode: (0, pg_core_1.varchar)("pincode", { length: 10 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Bundle memberships (which businesses are in which bundles)
exports.bundleMemberships = (0, pg_core_1.pgTable)("bundle_memberships", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    bundleId: (0, pg_core_1.uuid)("bundle_id").references(() => exports.bundles.id).notNull(),
    businessId: (0, pg_core_1.uuid)("business_id").references(() => exports.businesses.id).notNull(),
    joinedAt: (0, pg_core_1.timestamp)("joined_at").defaultNow().notNull(),
});
// B-Coin transactions table
exports.bCoinTransactions = (0, pg_core_1.pgTable)("bcoin_transactions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    customerId: (0, pg_core_1.uuid)("customer_id").references(() => exports.users.id).notNull(),
    businessId: (0, pg_core_1.uuid)("business_id").references(() => exports.businesses.id).notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 20 }).notNull(), // 'earned' or 'redeemed'
    amount: (0, pg_core_1.numeric)("amount", { precision: 10, scale: 2 }).notNull(),
    bCoinsChanged: (0, pg_core_1.numeric)("bcoins_changed", { precision: 10, scale: 2 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    qrCodeId: (0, pg_core_1.varchar)("qr_code_id", { length: 255 }), // Reference to QR code used
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// QR codes table
exports.qrCodes = (0, pg_core_1.pgTable)("qr_codes", {
    id: (0, pg_core_1.varchar)("id", { length: 255 }).primaryKey(),
    businessId: (0, pg_core_1.uuid)("business_id").references(() => exports.businesses.id).notNull(),
    amount: (0, pg_core_1.numeric)("amount", { precision: 10, scale: 2 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    isUsed: (0, pg_core_1.boolean)("is_used").default(false),
    usedBy: (0, pg_core_1.uuid)("used_by").references(() => exports.users.id),
    usedAt: (0, pg_core_1.timestamp)("used_at"),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Ratings table
exports.ratings = (0, pg_core_1.pgTable)("ratings", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    customerId: (0, pg_core_1.uuid)("customer_id").references(() => exports.users.id).notNull(),
    businessId: (0, pg_core_1.uuid)("business_id").references(() => exports.businesses.id).notNull(),
    rating: (0, pg_core_1.integer)("rating").notNull(), // 1-5 stars
    review: (0, pg_core_1.text)("review"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Notifications table
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id).notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 50 }).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    data: (0, pg_core_1.text)("data"), // JSON string
    isRead: (0, pg_core_1.boolean)("is_read").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Customer B-Coin balances
exports.customerBalances = (0, pg_core_1.pgTable)("customer_balances", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    customerId: (0, pg_core_1.uuid)("customer_id").references(() => exports.users.id).notNull().unique(),
    totalBCoins: (0, pg_core_1.numeric)("total_bcoins", { precision: 10, scale: 2 }).default("0.00"),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// Insert schemas using drizzle-zod
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({ id: true, createdAt: true });
exports.insertBusinessSchema = (0, drizzle_zod_1.createInsertSchema)(exports.businesses).omit({ id: true, createdAt: true });
exports.insertBundleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.bundles).omit({ id: true, createdAt: true });
exports.insertBundleMembershipSchema = (0, drizzle_zod_1.createInsertSchema)(exports.bundleMemberships).omit({ id: true, joinedAt: true });
exports.insertBCoinTransactionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.bCoinTransactions).omit({ id: true, createdAt: true });
exports.insertQrCodeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.qrCodes).omit({ createdAt: true });
exports.insertRatingSchema = (0, drizzle_zod_1.createInsertSchema)(exports.ratings).omit({ id: true, createdAt: true });
exports.insertNotificationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.notifications).omit({ id: true, createdAt: true });
exports.insertCustomerBalanceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.customerBalances).omit({ id: true, updatedAt: true });
// Business categories
exports.BUSINESS_CATEGORIES = [
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
];
