import { storage } from "./storage";

export async function seedInitialData() {
  try {
    // Create sample customers
    const customer1 = await storage.createUser({
      email: "customer1@example.com",
      password: "password123",
      userType: "customer",
      name: "Raj Sharma",
      pincode: "400001",
      phone: "+91-9876543210"
    });

    const customer2 = await storage.createUser({
      email: "customer2@example.com", 
      password: "password123",
      userType: "customer",
      name: "Priya Patel",
      pincode: "400002",
      phone: "+91-9876543211"
    });

    // Create customer profiles
    await storage.createCustomerProfile({
      userId: customer1.id,
      preferredPincode: "400001",
      bCoinBalance: "250.00",
      totalBCoinsEarned: "300.00",
      totalBCoinsSpent: "50.00"
    });

    await storage.createCustomerProfile({
      userId: customer2.id,
      preferredPincode: "400002",
      bCoinBalance: "150.00",
      totalBCoinsEarned: "200.00",
      totalBCoinsSpent: "50.00"
    });

    // Create sample business users
    const merchant1 = await storage.createUser({
      email: "merchant1@example.com",
      password: "password123",
      userType: "business",
      name: "Suresh Gupta",
      pincode: "400001"
    });

    const merchant2 = await storage.createUser({
      email: "merchant2@example.com",
      password: "password123", 
      userType: "business",
      name: "Kavita Singh",
      pincode: "400001"
    });

    // Create bundle for pincode 400001
    const bundle1 = await storage.createBundle({
      name: "Colaba Business Circle",
      pincode: "400001",
      description: "Premium business bundle in Colaba area"
    });

    // Create businesses
    const business1 = await storage.createBusiness({
      userId: merchant1.id,
      businessName: "Fresh Mart Grocery",
      ownerName: "Suresh Gupta",
      category: "kirana",
      pincode: "400001",
      address: "Shop 1, Colaba Market, Mumbai",
      description: "Fresh groceries and daily essentials",
      bCoinPercentage: "8.00",
      bundleId: bundle1.id
    });

    const business2 = await storage.createBusiness({
      userId: merchant2.id,
      businessName: "Style Corner Electronics", 
      ownerName: "Kavita Singh",
      category: "electronics",
      pincode: "400001",
      address: "Shop 5, Colaba Main Road, Mumbai",
      description: "Latest electronics and gadgets",
      bCoinPercentage: "5.00",
      bundleId: bundle1.id
    });

    // Create QR codes for businesses
    await storage.createQRCode({
      businessId: business1.id,
      code: `BAARTAL-${business1.id}`,
      isActive: true
    });

    await storage.createQRCode({
      businessId: business2.id,
      code: `BAARTAL-${business2.id}`,
      isActive: true
    });

    // Create sample transactions
    await storage.createBCoinTransaction({
      customerId: customer1.id,
      businessId: business1.id,
      type: "earned",
      amount: "25.00",
      billAmount: "500.00",
      description: "Earned from Fresh Mart Grocery"
    });

    await storage.createBCoinTransaction({
      customerId: customer1.id,
      businessId: business2.id,
      type: "earned", 
      amount: "15.00",
      billAmount: "300.00",
      description: "Earned from Style Corner Electronics"
    });

    await storage.createBCoinTransaction({
      customerId: customer2.id,
      businessId: business1.id,
      type: "spent",
      amount: "-20.00", 
      description: "Redeemed at Fresh Mart Grocery"
    });

    // Create sample ratings
    await storage.createRating({
      customerId: customer1.id,
      businessId: business1.id,
      rating: 5,
      comment: "Excellent fresh products and great service!"
    });

    await storage.createRating({
      customerId: customer2.id,
      businessId: business2.id,
      rating: 4,
      comment: "Good variety of electronics, helpful staff."
    });

    console.log("✅ Sample data seeded successfully");
    return {
      customers: [customer1, customer2],
      merchants: [merchant1, merchant2],
      businesses: [business1, business2],
      bundle: bundle1
    };
  } catch (error) {
    console.error("❌ Failed to seed data:", error);
    throw error;
  }
}