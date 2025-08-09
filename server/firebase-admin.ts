import admin from 'firebase-admin';
import { logInfo, logError } from './logger';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

export const initializeFirebaseAdmin = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if we're in production and have service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    } else if (process.env.NODE_ENV === 'development') {
      // For development, use default credentials or emulator
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-baartal',
      });
    } else {
      throw new Error('Firebase configuration missing');
    }

    logInfo('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logError(error as Error, { context: 'Firebase Admin initialization' });
    throw error;
  }
};

// Get Firebase services
export const getFirestore = () => {
  const app = initializeFirebaseAdmin();
  return admin.firestore(app);
};

export const getAuth = () => {
  const app = initializeFirebaseAdmin();
  return admin.auth(app);
};

export const getMessaging = () => {
  const app = initializeFirebaseAdmin();
  return admin.messaging(app);
};

export const getStorage = () => {
  const app = initializeFirebaseAdmin();
  return admin.storage(app);
};

// Firestore helper functions for Baartal
export class FirebaseService {
  private db = getFirestore();
  private messaging = getMessaging();

  // Real-time business data sync
  async syncBusinessData(businessId: string, data: any) {
    try {
      await this.db.collection('businesses').doc(businessId).set({
        ...data,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        syncedAt: new Date().toISOString()
      }, { merge: true });
      
      logInfo(`Business data synced to Firebase: ${businessId}`);
    } catch (error) {
      logError(error as Error, { context: 'Firebase business sync', businessId });
    }
  }

  // Real-time customer data sync
  async syncCustomerData(customerId: string, data: any) {
    try {
      await this.db.collection('customers').doc(customerId).set({
        ...data,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        syncedAt: new Date().toISOString()
      }, { merge: true });
      
      logInfo(`Customer data synced to Firebase: ${customerId}`);
    } catch (error) {
      logError(error as Error, { context: 'Firebase customer sync', customerId });
    }
  }

  // Real-time transaction logging
  async logTransaction(transactionData: any) {
    try {
      const transactionRef = await this.db.collection('transactions').add({
        ...transactionData,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      // Also update user stats in real-time
      await this.updateUserStats(transactionData.customerId, transactionData.businessId, transactionData.amount);
      
      logInfo(`Transaction logged to Firebase: ${transactionRef.id}`);
      return transactionRef.id;
    } catch (error) {
      logError(error as Error, { context: 'Firebase transaction logging' });
      throw error;
    }
  }

  // Update user statistics in real-time
  private async updateUserStats(customerId: string, businessId: string, amount: number) {
    const batch = this.db.batch();

    // Update customer stats
    const customerStatsRef = this.db.collection('userStats').doc(customerId);
    batch.set(customerStatsRef, {
      totalSpent: admin.firestore.FieldValue.increment(amount),
      transactionCount: admin.firestore.FieldValue.increment(1),
      lastTransaction: new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Update business stats
    const businessStatsRef = this.db.collection('businessStats').doc(businessId);
    batch.set(businessStatsRef, {
      totalRevenue: admin.firestore.FieldValue.increment(amount),
      transactionCount: admin.firestore.FieldValue.increment(1),
      lastTransaction: new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await batch.commit();
  }

  // Send push notifications
  async sendPushNotification(fcmToken: string, title: string, body: string, data?: any) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title,
          body
        },
        data: data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#f97316' // Orange color
          }
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await this.messaging.send(message);
      logInfo(`Push notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      logError(error as Error, { context: 'Push notification', fcmToken });
      throw error;
    }
  }

  // Send notifications to multiple users
  async sendMulticastNotification(tokens: string[], title: string, body: string, data?: any) {
    try {
      const message = {
        tokens,
        notification: {
          title,
          body
        },
        data: data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#f97316'
          }
        }
      };

      const response = await this.messaging.sendMulticast(message);
      logInfo(`Multicast notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);
      return response;
    } catch (error) {
      logError(error as Error, { context: 'Multicast notification' });
      throw error;
    }
  }

  // Real-time business verification
  async updateBusinessVerification(businessId: string, isVerified: boolean, verifiedBy?: string) {
    try {
      await this.db.collection('businesses').doc(businessId).update({
        isVerified,
        verifiedAt: isVerified ? admin.firestore.FieldValue.serverTimestamp() : null,
        verifiedBy: verifiedBy || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log verification event
      await this.db.collection('verificationLogs').add({
        businessId,
        isVerified,
        verifiedBy,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      logInfo(`Business verification updated in Firebase: ${businessId} - ${isVerified}`);
    } catch (error) {
      logError(error as Error, { context: 'Firebase verification update', businessId });
      throw error;
    }
  }

  // Store FCM tokens for push notifications
  async storeFCMToken(userId: string, token: string, deviceInfo?: any) {
    try {
      await this.db.collection('fcmTokens').doc(userId).set({
        token,
        deviceInfo: deviceInfo || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUsed: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      logInfo(`FCM token stored for user: ${userId}`);
    } catch (error) {
      logError(error as Error, { context: 'FCM token storage', userId });
    }
  }

  // Get real-time analytics data
  async getRealtimeAnalytics() {
    try {
      const [businessesSnapshot, customersSnapshot, transactionsSnapshot] = await Promise.all([
        this.db.collection('businesses').get(),
        this.db.collection('customers').get(),
        this.db.collection('transactions').get()
      ]);

      return {
        totalBusinesses: businessesSnapshot.size,
        totalCustomers: customersSnapshot.size,
        totalTransactions: transactionsSnapshot.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError(error as Error, { context: 'Firebase analytics' });
      throw error;
    }
  }
}

// Export a function to get the Firebase service instance
let firebaseServiceInstance: FirebaseService | null = null;

export const getFirebaseService = () => {
  if (!firebaseServiceInstance) {
    firebaseServiceInstance = new FirebaseService();
  }
  return firebaseServiceInstance;
};

// For backward compatibility
export const firebaseService = {
  get instance() {
    return getFirebaseService();
  }
};