import { Router } from 'express';
import { authenticateToken } from './enhanced-auth';
import { validate } from './validation';
import { z } from 'zod';
import { logInfo, logError } from './logger';
import { paymentService, PaymentStatus } from './payment-service';
import { rateLimitConfigs } from './advanced-middleware';

const router = Router();

// Payment validation schemas
const createOrderSchema = z.object({
  amount: z.number().min(1, 'Minimum amount is ₹1').max(100000, 'Maximum amount is ₹1,00,000'),
  business_id: z.string().min(1, 'Business ID is required'),
  qr_code_id: z.string().optional(),
  description: z.string().max(500, 'Description too long').optional()
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required')
});

const paymentHistorySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20)
});

// Apply authentication to all routes
router.use(authenticateToken);

// Apply strict rate limiting to payment routes
router.use(rateLimitConfigs.auth);

// === PAYMENT ORDER CREATION ===

// Create payment order
router.post('/create-order', validate({ body: createOrderSchema }), async (req, res) => {
  try {
    const { amount, business_id, qr_code_id, description } = req.body;
    const customer_id = req.user.id;

    // Validate user type
    if (req.user.userType !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create payment orders' });
    }

    logInfo('Creating payment order', {
      customer_id,
      business_id,
      amount,
      qr_code_id
    });

    const result = await paymentService.createPaymentOrder({
      amount,
      customer_id,
      business_id,
      qr_code_id,
      description
    });

    res.json({
      success: true,
      order: result.order,
      transaction_id: result.transaction_id,
      message: 'Payment order created successfully'
    });

  } catch (error) {
    logError(error as Error, { 
      context: 'Payment order creation',
      user_id: req.user?.id,
      body: req.body
    });

    res.status(500).json({
      error: error.message || 'Failed to create payment order',
      success: false
    });
  }
});

// === PAYMENT VERIFICATION ===

// Verify and complete payment
router.post('/verify', validate({ body: verifyPaymentSchema }), async (req, res) => {
  try {
    const verification = req.body;
    const customer_id = req.user.id;

    logInfo('Verifying payment', {
      customer_id,
      razorpay_order_id: verification.razorpay_order_id,
      razorpay_payment_id: verification.razorpay_payment_id
    });

    const completed_transaction = await paymentService.completePayment(verification);

    // Verify the transaction belongs to the authenticated user
    if (completed_transaction.customer_id !== customer_id) {
      return res.status(403).json({ 
        error: 'Unauthorized transaction access',
        success: false
      });
    }

    res.json({
      success: true,
      transaction: {
        id: completed_transaction.id,
        amount: completed_transaction.amount,
        bcoins_earned: completed_transaction.bcoins_earned,
        payment_method: completed_transaction.payment_method,
        status: completed_transaction.payment_status,
        business_name: completed_transaction.metadata.business_name,
        completed_at: completed_transaction.completed_at
      },
      message: `Payment successful! You earned ${completed_transaction.bcoins_earned} B-Coins`
    });

  } catch (error) {
    logError(error as Error, { 
      context: 'Payment verification',
      user_id: req.user?.id,
      body: req.body
    });

    res.status(400).json({
      error: error.message || 'Payment verification failed',
      success: false
    });
  }
});

// === PAYMENT FAILURE HANDLING ===

// Handle payment failure
router.post('/failure', async (req, res) => {
  try {
    const { razorpay_order_id, error_code, error_description } = req.body;
    
    await paymentService.handlePaymentFailure(
      razorpay_order_id, 
      `${error_code}: ${error_description}`
    );

    logInfo('Payment failure handled', {
      customer_id: req.user.id,
      razorpay_order_id,
      error_code,
      error_description
    });

    res.json({
      success: true,
      message: 'Payment failure recorded'
    });

  } catch (error) {
    logError(error as Error, { 
      context: 'Payment failure handling',
      user_id: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to handle payment failure',
      success: false
    });
  }
});

// === PAYMENT HISTORY ===

// Get customer payment history
router.get('/history', validate({ query: paymentHistorySchema }), async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { limit } = req.query;

    // Only customers can view their payment history
    if (req.user.userType !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transactions = await paymentService.getCustomerPaymentHistory(customer_id, limit);

    // Format transactions for frontend
    const formatted_transactions = transactions.map(txn => ({
      id: txn.id,
      amount: txn.amount,
      bcoins_earned: txn.bcoins_earned,
      business_name: txn.business_name,
      business_category: txn.category,
      payment_method: txn.payment_method,
      status: txn.payment_status,
      created_at: txn.created_at,
      completed_at: txn.completed_at,
      description: txn.metadata?.description
    }));

    res.json({
      success: true,
      transactions: formatted_transactions,
      total: formatted_transactions.length
    });

  } catch (error) {
    logError(error as Error, { 
      context: 'Payment history retrieval',
      user_id: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to get payment history',
      success: false
    });
  }
});

// === BUSINESS PAYMENT ANALYTICS ===

// Get business payment analytics (business users only)
router.get('/analytics', async (req, res) => {
  try {
    const user_id = req.user.id;
    const days = parseInt(req.query.days as string) || 30;

    // Only business users can view analytics
    if (req.user.userType !== 'business') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user's business
    const business = await getUserBusiness(user_id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const analytics = await paymentService.getBusinessPaymentAnalytics(business.id, days);

    // Calculate summary statistics
    const summary = analytics.reduce((acc, curr) => {
      acc.total_transactions += curr.total_transactions;
      acc.total_revenue += curr.total_revenue;
      acc.total_bcoins_issued += curr.total_bcoins_issued;
      acc.unique_customers = Math.max(acc.unique_customers, curr.unique_customers);
      return acc;
    }, {
      total_transactions: 0,
      total_revenue: 0,
      total_bcoins_issued: 0,
      unique_customers: 0
    });

    res.json({
      success: true,
      summary,
      daily_data: analytics,
      period_days: days,
      business_id: business.id
    });

  } catch (error) {
    logError(error as Error, { 
      context: 'Business analytics retrieval',
      user_id: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to get payment analytics',
      success: false
    });
  }
});

// === QR CODE PAYMENT ===

// Create payment from QR code scan
router.post('/qr-payment', async (req, res) => {
  try {
    const { qr_code_id, amount } = req.body;
    const customer_id = req.user.id;

    // Validate QR code and get associated business
    const qr_code = await getQRCode(qr_code_id);
    if (!qr_code) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    if (qr_code.is_used) {
      return res.status(400).json({ error: 'QR code already used' });
    }

    // Check if QR code has expired
    if (qr_code.expires_at && new Date(qr_code.expires_at) < new Date()) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Use amount from QR code or provided amount
    const payment_amount = amount || qr_code.amount;

    const result = await paymentService.createPaymentOrder({
      amount: payment_amount,
      customer_id,
      business_id: qr_code.business_id,
      qr_code_id,
      description: `QR Payment to ${qr_code.business_name}`
    });

    res.json({
      success: true,
      order: result.order,
      transaction_id: result.transaction_id,
      qr_code_id,
      business_name: qr_code.business_name,
      amount: payment_amount,
      message: 'QR payment order created successfully'
    });

  } catch (error) {
    logError(error as Error, { 
      context: 'QR payment creation',
      user_id: req.user?.id,
      body: req.body
    });

    res.status(500).json({
      error: error.message || 'Failed to create QR payment',
      success: false
    });
  }
});

// === REFUND HANDLING ===

// Request refund (basic implementation)
router.post('/refund-request', async (req, res) => {
  try {
    const { transaction_id, reason } = req.body;
    const customer_id = req.user.id;

    // Validate transaction belongs to user
    const transaction = await getTransactionById(transaction_id);
    if (!transaction || transaction.customer_id !== customer_id) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.payment_status !== PaymentStatus.COMPLETED) {
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    }

    // Store refund request (simplified - in production, this would integrate with Razorpay refunds)
    await storeRefundRequest({
      transaction_id,
      customer_id,
      amount: transaction.amount,
      reason: reason || 'Customer requested refund',
      status: 'pending'
    });

    logInfo('Refund request created', {
      transaction_id,
      customer_id,
      amount: transaction.amount,
      reason
    });

    res.json({
      success: true,
      message: 'Refund request submitted successfully. We will process it within 3-5 business days.',
      refund_request_id: `refund_${Date.now()}`
    });

  } catch (error) {
    logError(error as Error, { 
      context: 'Refund request',
      user_id: req.user?.id,
      body: req.body
    });

    res.status(500).json({
      error: 'Failed to process refund request',
      success: false
    });
  }
});

// === UTILITY FUNCTIONS ===

// Get user's business
async function getUserBusiness(user_id: string): Promise<any> {
  try {
    const result = await paymentService['db'].execute(`
      SELECT * FROM businesses WHERE user_id = ? AND is_active = 1
    `, [user_id]);
    
    return result[0] || null;
  } catch (error) {
    logError(error as Error, { context: 'Get user business', user_id });
    return null;
  }
}

// Get QR code details
async function getQRCode(qr_code_id: string): Promise<any> {
  try {
    const result = await paymentService['db'].execute(`
      SELECT qr.*, b.business_name, b.category, b.is_verified
      FROM qr_codes qr
      JOIN businesses b ON qr.business_id = b.id
      WHERE qr.id = ? AND b.is_verified = 1 AND b.is_active = 1
    `, [qr_code_id]);
    
    return result[0] || null;
  } catch (error) {
    logError(error as Error, { context: 'Get QR code', qr_code_id });
    return null;
  }
}

// Get transaction by ID
async function getTransactionById(transaction_id: string): Promise<any> {
  try {
    const result = await paymentService['db'].execute(`
      SELECT * FROM transactions WHERE id = ?
    `, [transaction_id]);
    
    return result[0] || null;
  } catch (error) {
    logError(error as Error, { context: 'Get transaction', transaction_id });
    return null;
  }
}

// Store refund request
async function storeRefundRequest(refund_data: any): Promise<void> {
  try {
    const refund_id = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await paymentService['db'].execute(`
      INSERT INTO refund_requests (
        id, transaction_id, customer_id, amount, reason, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      refund_id,
      refund_data.transaction_id,
      refund_data.customer_id,
      refund_data.amount,
      refund_data.reason,
      refund_data.status,
      new Date().toISOString()
    ]);
  } catch (error) {
    logError(error as Error, { context: 'Store refund request', refund_data });
  }
}

export default router;