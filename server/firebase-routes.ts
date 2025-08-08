import { Router } from 'express';
import { firebaseService } from './firebase-admin';
import { authenticateToken } from './enhanced-auth';
import { validateRegistration, validate } from './validation';
import { z } from 'zod';
import { asyncHandler } from './error-handler';
import { logInfo, logError } from './logger';

const router = Router();

// FCM Token validation schema
const fcmTokenSchema = z.object({
  token: z.string().min(1, 'FCM token required'),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    timestamp: z.string().optional()
  }).optional()
});

// Notification schema
const notificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  body: z.string().min(1, 'Body required').max(300, 'Body too long'),
  data: z.object({}).optional()
});

// Store FCM token
router.post('/fcm-token', 
  authenticateToken,
  validate(fcmTokenSchema),
  asyncHandler(async (req: any, res) => {
    const { token, deviceInfo } = req.body;
    const userId = req.user.id;

    try {
      await firebaseService.storeFCMToken(userId, token, deviceInfo);
      
      logInfo(`FCM token stored for user ${userId}`);
      
      res.json({
        success: true,
        message: 'FCM token stored successfully'
      });
    } catch (error) {
      logError(error as Error, { context: 'Store FCM token', userId });
      res.status(500).json({
        success: false,
        error: 'Failed to store FCM token'
      });
    }
  })
);

// Send notification
router.post('/send-notification',
  authenticateToken,
  validate(notificationSchema),
  asyncHandler(async (req: any, res) => {
    const { userId, title, body, data } = req.body;
    const senderId = req.user.id;

    try {
      // Get FCM token for the user
      const response = await fetch(`${process.env.API_BASE_URL || ''}/api/users/${userId}/fcm-token`, {
        headers: {
          'Authorization': req.headers.authorization
        }
      });

      if (!response.ok) {
        return res.status(404).json({
          success: false,
          error: 'User FCM token not found'
        });
      }

      const { token } = await response.json();

      // Send push notification
      const notificationResponse = await firebaseService.sendPushNotification(
        token,
        title,
        body,
        data
      );

      logInfo(`Notification sent from ${senderId} to ${userId}`);

      res.json({
        success: true,
        messageId: notificationResponse,
        message: 'Notification sent successfully'
      });
    } catch (error) {
      logError(error as Error, { context: 'Send notification', userId, senderId });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification'
      });
    }
  })
);

// Send multicast notification
router.post('/send-multicast',
  authenticateToken,
  asyncHandler(async (req: any, res) => {
    const { userIds, title, body, data } = req.body;
    const senderId = req.user.id;

    try {
      // Validate input
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'UserIds array is required'
        });
      }

      // Get FCM tokens for all users
      const tokens: string[] = [];
      for (const userId of userIds) {
        try {
          const response = await fetch(`${process.env.API_BASE_URL || ''}/api/users/${userId}/fcm-token`, {
            headers: {
              'Authorization': req.headers.authorization
            }
          });
          
          if (response.ok) {
            const { token } = await response.json();
            tokens.push(token);
          }
        } catch (error) {
          console.log(`Failed to get token for user ${userId}`);
        }
      }

      if (tokens.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No valid FCM tokens found'
        });
      }

      // Send multicast notification
      const notificationResponse = await firebaseService.sendMulticastNotification(
        tokens,
        title,
        body,
        data
      );

      logInfo(`Multicast notification sent from ${senderId} to ${tokens.length} users`);

      res.json({
        success: true,
        response: notificationResponse,
        message: `Notification sent to ${notificationResponse.successCount} users`
      });
    } catch (error) {
      logError(error as Error, { context: 'Send multicast notification', senderId });
      res.status(500).json({
        success: false,
        error: 'Failed to send multicast notification'
      });
    }
  })
);

// Get user's FCM token
router.get('/users/:userId/fcm-token',
  authenticateToken,
  asyncHandler(async (req: any, res) => {
    const { userId } = req.params;
    const requesterId = req.user.id;

    // Users can only get their own token, or businesses can get customer tokens
    if (userId !== requesterId && req.user.userType !== 'business') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    try {
      // This would typically fetch from your database where FCM tokens are stored
      // For now, we'll return a mock response
      res.json({
        success: true,
        token: 'mock-fcm-token-' + userId,
        message: 'FCM token retrieved successfully'
      });
    } catch (error) {
      logError(error as Error, { context: 'Get FCM token', userId, requesterId });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve FCM token'
      });
    }
  })
);

// Sync user data to Firebase
router.post('/sync-user-data',
  authenticateToken,
  asyncHandler(async (req: any, res) => {
    const userId = req.user.id;
    const { userType } = req.user;

    try {
      // Get user data from your main database
      const userData = {
        id: userId,
        userType,
        name: req.user.name,
        email: req.user.email,
        lastActive: new Date().toISOString()
      };

      // Sync to Firebase
      if (userType === 'business') {
        await firebaseService.syncBusinessData(userId, userData);
      } else {
        await firebaseService.syncCustomerData(userId, userData);
      }

      logInfo(`User data synced to Firebase: ${userId}`);

      res.json({
        success: true,
        message: 'User data synced to Firebase successfully'
      });
    } catch (error) {
      logError(error as Error, { context: 'Sync user data', userId });
      res.status(500).json({
        success: false,
        error: 'Failed to sync user data'
      });
    }
  })
);

// Get Firebase analytics
router.get('/firebase-analytics',
  authenticateToken,
  asyncHandler(async (req: any, res) => {
    try {
      const analytics = await firebaseService.getRealtimeAnalytics();
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logError(error as Error, { context: 'Firebase analytics' });
      res.status(500).json({
        success: false,
        error: 'Failed to get Firebase analytics'
      });
    }
  })
);

// Test Firebase connection
router.get('/test-firebase',
  authenticateToken,
  asyncHandler(async (req: any, res) => {
    try {
      // Test Firestore connection
      const analytics = await firebaseService.getRealtimeAnalytics();
      
      res.json({
        success: true,
        message: 'Firebase connection successful',
        data: {
          firestoreConnected: true,
          analyticsData: analytics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logError(error as Error, { context: 'Test Firebase connection' });
      res.status(500).json({
        success: false,
        error: 'Firebase connection failed',
        details: error.message
      });
    }
  })
);

export default router;