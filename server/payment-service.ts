import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from './db-local';
import { logInfo, logError, logWarn } from './logger';
import { cacheManager } from './cache-manager';

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret'
});

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Payment method enum
export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
  EMI = 'emi'
}

// Transaction type enum
export enum TransactionType {
  PURCHASE = 'purchase',
  REFUND = 'refund',
  SETTLEMENT = 'settlement',
  BONUS = 'bonus'
}

interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, any>;
  customer_id: string;
  business_id: string;
  qr_code_id?: string;
}

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface BaartalTransaction {
  id: string;
  customer_id: string;
  business_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  bcoins_earned: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_type: TransactionType;
  qr_code_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

class PaymentService {
  
  // Create payment order
  async createPaymentOrder(orderData: {
    amount: number;
    customer_id: string;
    business_id: string;
    qr_code_id?: string;
    description?: string;
  }): Promise<{ order: any; transaction_id: string }> {
    try {
      const { amount, customer_id, business_id, qr_code_id, description } = orderData;
      
      // Validate amount (minimum ₹1)
      if (amount < 1) {
        throw new Error('Minimum transaction amount is ₹1');
      }
      
      // Validate business and customer
      const [business, customer] = await Promise.all([
        this.getBusinessById(business_id),
        this.getCustomerById(customer_id)
      ]);
      
      if (!business || !business.is_verified) {
        throw new Error('Business not found or not verified');
      }
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      // Calculate B-Coins to be earned
      const bcoins_earned = this.calculateBCoins(amount, business.category);
      
      // Generate transaction ID
      const transaction_id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const receipt = `receipt_${transaction_id}`;
      
      // Create Razorpay order
      const razorpay_order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt,
        payment_capture: 1,
        notes: {
          customer_id,
          business_id,
          transaction_id,
          qr_code_id: qr_code_id || '',
          platform: 'baartal',
          description: description || `Payment to ${business.business_name}`
        }
      });
      
      // Store transaction in database
      const transaction: BaartalTransaction = {
        id: transaction_id,
        customer_id,
        business_id,
        razorpay_order_id: razorpay_order.id,
        amount,
        bcoins_earned,
        payment_method: PaymentMethod.UPI, // Default to UPI
        payment_status: PaymentStatus.PENDING,
        transaction_type: TransactionType.PURCHASE,
        qr_code_id,
        metadata: {
          description,
          business_name: business.business_name,
          customer_name: customer.name
        },
        created_at: new Date().toISOString()
      };
      
      await this.saveTransaction(transaction);
      
      logInfo('Payment order created', {
        transaction_id,
        razorpay_order_id: razorpay_order.id,
        amount,
        customer_id,
        business_id
      });
      
      return {
        order: {
          id: razorpay_order.id,
          amount: razorpay_order.amount,
          currency: razorpay_order.currency,
          key_id: process.env.RAZORPAY_KEY_ID
        },
        transaction_id
      };
      
    } catch (error) {
      logError(error as Error, { context: 'Payment order creation', orderData });
      throw error;
    }
  }
  
  // Verify payment signature
  async verifyPayment(verification: PaymentVerification): Promise<boolean> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verification;
      
      // Generate expected signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expected_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret')
        .update(body.toString())
        .digest('hex');
      
      const is_authentic = expected_signature === razorpay_signature;
      
      if (is_authentic) {
        logInfo('Payment signature verified successfully', {
          razorpay_order_id,
          razorpay_payment_id
        });
      } else {
        logWarn('Payment signature verification failed', {
          razorpay_order_id,
          razorpay_payment_id,
          provided_signature: razorpay_signature,
          expected_signature
        });
      }
      
      return is_authentic;
      
    } catch (error) {
      logError(error as Error, { context: 'Payment verification', verification });
      return false;
    }
  }
  
  // Complete payment transaction
  async completePayment(verification: PaymentVerification): Promise<BaartalTransaction> {
    try {
      // Verify payment signature
      const is_verified = await this.verifyPayment(verification);
      if (!is_verified) {
        throw new Error('Payment signature verification failed');
      }
      
      // Get transaction by Razorpay order ID
      const transaction = await this.getTransactionByOrderId(verification.razorpay_order_id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Fetch payment details from Razorpay
      const payment_details = await razorpay.payments.fetch(verification.razorpay_payment_id);
      
      // Update transaction status
      const updated_transaction = await this.updateTransactionStatus(
        transaction.id,
        {
          razorpay_payment_id: verification.razorpay_payment_id,
          payment_status: PaymentStatus.COMPLETED,
          payment_method: this.mapRazorpayMethod(payment_details.method),
          completed_at: new Date().toISOString(),
          metadata: {
            ...transaction.metadata,
            payment_details: {
              method: payment_details.method,
              bank: payment_details.bank,
              wallet: payment_details.wallet,
              vpa: payment_details.vpa
            }
          }
        }
      );
      
      // Credit B-Coins to customer
      await this.creditBCoins(transaction.customer_id, transaction.bcoins_earned, transaction.id);
      
      // Update business statistics
      await this.updateBusinessStats(transaction.business_id, transaction.amount);
      
      // Mark QR code as used if applicable
      if (transaction.qr_code_id) {
        await this.markQRCodeUsed(transaction.qr_code_id, transaction.customer_id);
      }
      
      // Send notifications
      await this.sendPaymentNotifications(updated_transaction);
      
      // Clear relevant caches
      await this.clearPaymentCaches(transaction.customer_id, transaction.business_id);
      
      logInfo('Payment completed successfully', {
        transaction_id: transaction.id,
        razorpay_payment_id: verification.razorpay_payment_id,
        amount: transaction.amount,
        bcoins_earned: transaction.bcoins_earned
      });
      
      return updated_transaction;
      
    } catch (error) {
      logError(error as Error, { context: 'Payment completion', verification });
      throw error;
    }
  }
  
  // Handle payment failure
  async handlePaymentFailure(razorpay_order_id: string, reason?: string): Promise<void> {
    try {
      const transaction = await this.getTransactionByOrderId(razorpay_order_id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      await this.updateTransactionStatus(transaction.id, {
        payment_status: PaymentStatus.FAILED,
        metadata: {
          ...transaction.metadata,
          failure_reason: reason || 'Payment failed'
        }
      });
      
      logWarn('Payment failed', {
        transaction_id: transaction.id,
        razorpay_order_id,
        reason
      });
      
    } catch (error) {
      logError(error as Error, { context: 'Payment failure handling', razorpay_order_id });
    }
  }
  
  // Calculate B-Coins based on amount and business category
  private calculateBCoins(amount: number, business_category: string): number {
    const mumbai_coin_rates = {
      'restaurant': 8,
      'salon': 10,
      'electronics': 5,
      'pharmacy': 6,
      'clothing': 12,
      'cafe': 8,
      'gifts': 10,
      'stationery': 8,
      'ethnic-wear': 12,
      'kids-clothing': 12,
      'formal-wear': 12,
      'cosmetics': 10,
      'turf': 6,
      'beauty-parlour': 10,
      'footwear': 8
    };
    
    const earn_rate = mumbai_coin_rates[business_category] || 5; // Default 5%
    return Math.floor(amount * earn_rate / 100);
  }
  
  // Credit B-Coins to customer account
  private async creditBCoins(customer_id: string, bcoins: number, transaction_id: string): Promise<void> {
    try {
      // Insert B-Coin transaction record
      await db.execute(`
        INSERT INTO bcoin_transactions (
          id, customer_id, business_id, amount, bcoins_earned, 
          qr_code_id, type, status, created_at
        ) 
        SELECT ?, ?, business_id, amount, ?, qr_code_id, 'earned', 'completed', ?
        FROM transactions 
        WHERE id = ?
      `, [
        `bcoin_${transaction_id}`,
        customer_id,
        bcoins,
        new Date().toISOString(),
        transaction_id
      ]);
      
      logInfo('B-Coins credited successfully', {
        customer_id,
        bcoins,
        transaction_id
      });
      
    } catch (error) {
      logError(error as Error, { context: 'B-Coin crediting', customer_id, bcoins });
    }
  }
  
  // Database operations
  private async saveTransaction(transaction: BaartalTransaction): Promise<void> {
    await db.execute(`
      INSERT INTO transactions (
        id, customer_id, business_id, razorpay_order_id, amount, 
        bcoins_earned, payment_method, payment_status, transaction_type,
        qr_code_id, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transaction.id,
      transaction.customer_id,
      transaction.business_id,
      transaction.razorpay_order_id,
      transaction.amount,
      transaction.bcoins_earned,
      transaction.payment_method,
      transaction.payment_status,
      transaction.transaction_type,
      transaction.qr_code_id,
      JSON.stringify(transaction.metadata),
      transaction.created_at
    ]);
  }
  
  private async getTransactionByOrderId(razorpay_order_id: string): Promise<BaartalTransaction | null> {
    const result = await db.execute(`
      SELECT * FROM transactions WHERE razorpay_order_id = ?
    `, [razorpay_order_id]);
    
    if (result.length === 0) return null;
    
    const row = result[0];
    return {
      ...row,
      metadata: JSON.parse(row.metadata || '{}')
    } as BaartalTransaction;
  }
  
  private async updateTransactionStatus(
    transaction_id: string, 
    updates: Partial<BaartalTransaction>
  ): Promise<BaartalTransaction> {
    const set_clauses = [];
    const values = [];
    
    if (updates.razorpay_payment_id) {
      set_clauses.push('razorpay_payment_id = ?');
      values.push(updates.razorpay_payment_id);
    }
    
    if (updates.payment_status) {
      set_clauses.push('payment_status = ?');
      values.push(updates.payment_status);
    }
    
    if (updates.payment_method) {
      set_clauses.push('payment_method = ?');
      values.push(updates.payment_method);
    }
    
    if (updates.completed_at) {
      set_clauses.push('completed_at = ?');
      values.push(updates.completed_at);
    }
    
    if (updates.metadata) {
      set_clauses.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }
    
    values.push(transaction_id);
    
    await db.execute(`
      UPDATE transactions 
      SET ${set_clauses.join(', ')} 
      WHERE id = ?
    `, values);
    
    // Return updated transaction
    const result = await db.execute(`SELECT * FROM transactions WHERE id = ?`, [transaction_id]);
    const row = result[0];
    return {
      ...row,
      metadata: JSON.parse(row.metadata || '{}')
    } as BaartalTransaction;
  }
  
  private async getBusinessById(business_id: string): Promise<any> {
    const cached = await cacheManager.getCachedBusiness(business_id);
    if (cached) return cached;
    
    const result = await db.execute(`SELECT * FROM businesses WHERE id = ?`, [business_id]);
    const business = result[0];
    
    if (business) {
      await cacheManager.cacheBusiness(business_id, business, 30 * 60 * 1000); // 30 min cache
    }
    
    return business;
  }
  
  private async getCustomerById(customer_id: string): Promise<any> {
    const cached = await cacheManager.getCachedUser(customer_id);
    if (cached) return cached;
    
    const result = await db.execute(`SELECT * FROM users WHERE id = ?`, [customer_id]);
    const customer = result[0];
    
    if (customer) {
      await cacheManager.cacheUser(customer_id, customer, 30 * 60 * 1000); // 30 min cache
    }
    
    return customer;
  }
  
  private async updateBusinessStats(business_id: string, amount: number): Promise<void> {
    await db.execute(`
      UPDATE businesses 
      SET 
        total_transactions = total_transactions + 1,
        total_revenue = total_revenue + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [amount, business_id]);
    
    // Clear business cache
    await cacheManager.del(`business:${business_id}`);
  }
  
  private async markQRCodeUsed(qr_code_id: string, used_by: string): Promise<void> {
    await db.execute(`
      UPDATE qr_codes 
      SET 
        is_used = 1,
        used_by = ?,
        used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [used_by, qr_code_id]);
  }
  
  private mapRazorpayMethod(method: string): PaymentMethod {
    const method_map = {
      'upi': PaymentMethod.UPI,
      'card': PaymentMethod.CARD,
      'netbanking': PaymentMethod.NETBANKING,
      'wallet': PaymentMethod.WALLET,
      'emi': PaymentMethod.EMI
    };
    
    return method_map[method] || PaymentMethod.UPI;
  }
  
  private async sendPaymentNotifications(transaction: BaartalTransaction): Promise<void> {
    try {
      // This will be implemented with SMS/Email service
      logInfo('Payment notifications sent', { transaction_id: transaction.id });
    } catch (error) {
      logError(error as Error, { context: 'Payment notifications', transaction_id: transaction.id });
    }
  }
  
  private async clearPaymentCaches(customer_id: string, business_id: string): Promise<void> {
    await Promise.all([
      cacheManager.del(`user:${customer_id}`),
      cacheManager.del(`business:${business_id}`),
      cacheManager.del(`transactions:${customer_id}`),
      cacheManager.del(`business_stats:${business_id}`)
    ]);
  }
  
  // Get payment history for customer
  async getCustomerPaymentHistory(customer_id: string, limit = 50): Promise<BaartalTransaction[]> {
    const cached_key = `payment_history:${customer_id}:${limit}`;
    const cached = await cacheManager.get(cached_key);
    if (cached) return cached;
    
    const result = await db.execute(`
      SELECT t.*, b.business_name, b.category
      FROM transactions t
      JOIN businesses b ON t.business_id = b.id
      WHERE t.customer_id = ? AND t.payment_status = 'completed'
      ORDER BY t.created_at DESC
      LIMIT ?
    `, [customer_id, limit]);
    
    const transactions = result.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}')
    })) as BaartalTransaction[];
    
    // Cache for 5 minutes
    await cacheManager.set(cached_key, transactions, 5 * 60 * 1000);
    
    return transactions;
  }
  
  // Get payment analytics for business
  async getBusinessPaymentAnalytics(business_id: string, days = 30): Promise<any> {
    const cached_key = `payment_analytics:${business_id}:${days}`;
    const cached = await cacheManager.get(cached_key);
    if (cached) return cached;
    
    const since_date = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const result = await db.execute(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_transaction_amount,
        SUM(bcoins_earned) as total_bcoins_issued,
        COUNT(DISTINCT customer_id) as unique_customers,
        payment_method,
        DATE(created_at) as transaction_date
      FROM transactions
      WHERE business_id = ? 
        AND payment_status = 'completed'
        AND created_at >= ?
      GROUP BY payment_method, DATE(created_at)
      ORDER BY transaction_date DESC
    `, [business_id, since_date]);
    
    // Cache for 1 hour
    await cacheManager.set(cached_key, result, 60 * 60 * 1000);
    
    return result;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;