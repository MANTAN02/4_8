import { wsManager } from './websocket';
import { db } from './db-enhanced';
import { businesses, bCoinTransactions, users } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { logInfo, logBusinessEvent } from './logger';
import { firebaseService } from './firebase-admin';

export class RealtimeManager {
  private dashboardIntervals = new Map<string, NodeJS.Timeout>();
  private businessStats = new Map<string, any>();
  private customerStats = new Map<string, any>();

  // Start real-time dashboard updates for a user
  async startDashboardUpdates(userId: string, userType: 'customer' | 'business') {
    // Clear existing interval if any
    this.stopDashboardUpdates(userId);

    // Start new interval for real-time updates
    const interval = setInterval(async () => {
      try {
        if (userType === 'business') {
          await this.updateBusinessDashboard(userId);
        } else {
          await this.updateCustomerDashboard(userId);
        }
      } catch (error) {
        console.error(`Dashboard update failed for ${userId}:`, error);
      }
    }, 5000); // Update every 5 seconds

    this.dashboardIntervals.set(userId, interval);
    logInfo(`Started real-time dashboard for user ${userId} (${userType})`);
  }

  // Stop dashboard updates
  stopDashboardUpdates(userId: string) {
    const interval = this.dashboardIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.dashboardIntervals.delete(userId);
      logInfo(`Stopped real-time dashboard for user ${userId}`);
    }
  }

  // Update business dashboard with live stats
  private async updateBusinessDashboard(userId: string) {
    try {
      const database = await db;
      
      // Get business info
      const business = await database.query.businesses.findFirst({
        where: eq(businesses.userId, userId)
      });

      if (!business) return;

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = await database.query.bCoinTransactions.findMany({
        where: and(
          eq(bCoinTransactions.businessId, business.id),
          gte(bCoinTransactions.createdAt, today)
        )
      });

      // Calculate live stats
      const stats = {
        todayRevenue: todayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
        todayTransactions: todayTransactions.length,
        todayBCoinsIssued: todayTransactions.reduce((sum, t) => sum + parseFloat(t.bCoinsEarned), 0),
        lastTransaction: todayTransactions[0] || null,
        timestamp: new Date().toISOString()
      };

      // Only send if stats changed
      const prevStats = this.businessStats.get(userId);
      if (!prevStats || JSON.stringify(stats) !== JSON.stringify(prevStats)) {
        this.businessStats.set(userId, stats);
        
        wsManager.sendToUser(userId, {
          type: 'dashboard_update',
          data: {
            businessStats: stats,
            liveUpdate: true
          }
        });
      }
    } catch (error) {
      console.error('Business dashboard update error:', error);
    }
  }

  // Update customer dashboard with live stats
  private async updateCustomerDashboard(userId: string) {
    try {
      const database = await db;

      // Get customer's B-Coin balance and recent activity
      const recentTransactions = await database.query.bCoinTransactions.findMany({
        where: eq(bCoinTransactions.customerId, userId),
        orderBy: [desc(bCoinTransactions.createdAt)],
        limit: 5,
        with: {
          business: true
        }
      });

      const totalBCoins = recentTransactions.reduce((sum, t) => sum + parseFloat(t.bCoinsEarned), 0);

      const stats = {
        totalBCoins,
        recentTransactions: recentTransactions.slice(0, 3),
        transactionCount: recentTransactions.length,
        lastActivity: recentTransactions[0] || null,
        timestamp: new Date().toISOString()
      };

      // Only send if stats changed
      const prevStats = this.customerStats.get(userId);
      if (!prevStats || JSON.stringify(stats) !== JSON.stringify(prevStats)) {
        this.customerStats.set(userId, stats);
        
        wsManager.sendToUser(userId, {
          type: 'dashboard_update',
          data: {
            customerStats: stats,
            liveUpdate: true
          }
        });
      }
    } catch (error) {
      console.error('Customer dashboard update error:', error);
    }
  }

  // Real-time transaction processing
  async processTransaction(customerId: string, businessId: string, amount: number, qrCodeId: string) {
    try {
      const database = await db;
      
      // Get business and customer info
      const [business, customer] = await Promise.all([
        database.query.businesses.findFirst({ 
          where: eq(businesses.id, businessId),
          with: { user: true }
        }),
        database.query.users.findFirst({ 
          where: eq(users.id, customerId) 
        })
      ]);

      if (!business || !customer) {
        throw new Error('Business or customer not found');
      }

      // Calculate B-Coins earned
      const bCoinRate = parseFloat(business.bCoinRate);
      const bCoinsEarned = (amount * bCoinRate) / 100;

      // Create transaction record
      const transaction = await database.insert(bCoinTransactions).values({
        customerId,
        businessId,
        amount: amount.toString(),
        bCoinsEarned: bCoinsEarned.toString(),
        qrCodeId,
        type: 'earned'
      }).returning();

      // Real-time notifications
      const notifications = [
        // Notify customer
        wsManager.notifyBCoinEarned(customerId, bCoinsEarned, business.businessName),
        
        // Notify business
        wsManager.notifyQRScanned(business.userId, customer.name, amount),
        
        // Update dashboards immediately
        this.updateBusinessDashboard(business.userId),
        this.updateCustomerDashboard(customerId)
      ];

      await Promise.all(notifications);

      // Log business event
      logBusinessEvent('TRANSACTION_PROCESSED', customerId, {
        businessId,
        amount,
        bCoinsEarned,
        transactionId: transaction[0].id
      });

      // Sync to Firebase
      try {
        await firebaseService.logTransaction({
          customerId,
          businessId,
          amount,
          bCoinsEarned,
          qrCodeId,
          type: 'earned',
          id: transaction[0].id
        });
        
        // Update Firebase user stats
        await firebaseService.syncBusinessData(business.userId, {
          id: business.id,
          businessName: business.businessName,
          category: business.category,
          isVerified: business.isVerified,
          lastTransaction: new Date().toISOString()
        });
        
        await firebaseService.syncCustomerData(customerId, {
          id: customerId,
          name: customer.name,
          email: customer.email,
          lastTransaction: new Date().toISOString()
        });
      } catch (error) {
        console.error('Firebase sync failed:', error);
        // Continue without failing the transaction
      }

      return {
        success: true,
        transaction: transaction[0],
        bCoinsEarned
      };
    } catch (error) {
      console.error('Transaction processing error:', error);
      throw error;
    }
  }

  // Real-time business verification notification
  async notifyBusinessVerification(businessId: string, isVerified: boolean) {
    try {
      const database = await db;
      
      const business = await database.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        with: { user: true }
      });

      if (business) {
        wsManager.sendToUser(business.userId, {
          type: 'verification_update',
          data: {
            businessId,
            isVerified,
            message: isVerified 
              ? 'Congratulations! Your business has been verified ✅' 
              : 'Your business verification is under review',
            timestamp: new Date().toISOString()
          }
        });

        // Update dashboard
        await this.updateBusinessDashboard(business.userId);
        
        // Sync to Firebase
        try {
          await firebaseService.updateBusinessVerification(businessId, isVerified, 'system');
        } catch (error) {
          console.error('Firebase verification sync failed:', error);
        }
      }
    } catch (error) {
      console.error('Verification notification error:', error);
    }
  }

  // Real-time bundle updates
  async notifyBundleUpdate(pincode: string, message: string) {
    try {
      const database = await db;
      
      // Get all businesses in the pincode
      const businessesInArea = await database.query.businesses.findMany({
        where: eq(businesses.pincode, pincode),
        with: { user: true }
      });

      // Notify all businesses in the area
      businessesInArea.forEach(business => {
        wsManager.sendToUser(business.userId, {
          type: 'bundle_update',
          data: {
            pincode,
            message,
            timestamp: new Date().toISOString()
          }
        });
      });

      logInfo(`Bundle update sent to ${businessesInArea.length} businesses in ${pincode}`);
    } catch (error) {
      console.error('Bundle update error:', error);
    }
  }

  // Live business discovery for customers
  async broadcastNewBusiness(business: any) {
    try {
      // Notify customers in the same pincode
      wsManager.broadcast({
        type: 'new_business',
        data: {
          business: {
            id: business.id,
            businessName: business.businessName,
            category: business.category,
            pincode: business.pincode,
            bCoinRate: business.bCoinRate
          },
          message: `New business "${business.businessName}" just joined in your area!`,
          timestamp: new Date().toISOString()
        }
      }, 'customer');

      logBusinessEvent('NEW_BUSINESS_BROADCAST', business.userId, {
        businessId: business.id,
        pincode: business.pincode
      });
    } catch (error) {
      console.error('New business broadcast error:', error);
    }
  }

  // Platform analytics for admins
  async broadcastPlatformStats() {
    try {
      const database = await db;
      
      const [totalUsers, totalBusinesses, totalTransactions] = await Promise.all([
        database.query.users.findMany(),
        database.query.businesses.findMany(),
        database.query.bCoinTransactions.findMany()
      ]);

      const stats = {
        totalUsers: totalUsers.length,
        totalBusinesses: totalBusinesses.length,
        totalTransactions: totalTransactions.length,
        totalRevenue: totalTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
        timestamp: new Date().toISOString()
      };

      // Broadcast to admin users (you can implement admin role checking)
      wsManager.broadcast({
        type: 'platform_stats',
        data: stats
      });

    } catch (error) {
      console.error('Platform stats broadcast error:', error);
    }
  }

  // Cleanup when user disconnects
  cleanup(userId: string) {
    this.stopDashboardUpdates(userId);
    this.businessStats.delete(userId);
    this.customerStats.delete(userId);
  }

  // Get current connection stats
  getStats() {
    return {
      activeDashboards: this.dashboardIntervals.size,
      businessStats: this.businessStats.size,
      customerStats: this.customerStats.size,
      websocketStats: wsManager.getStats()
    };
  }
}

export const realtimeManager = new RealtimeManager();