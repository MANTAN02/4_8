import twilio from 'twilio';
import { db } from './db-local';
import { logInfo, logError } from './logger';
import { cacheManager } from './cache-manager';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID || 'ACxxx',
  process.env.TWILIO_AUTH_TOKEN || 'xxx'
);

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

interface OTPData {
  phone: string;
  otp: string;
  type: 'login' | 'signup' | 'verification';
  expires_at: Date;
  attempts: number;
}

class SMSService {
  
  // Generate OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Send OTP
  async sendOTP(phone: string, type: 'login' | 'signup' | 'verification'): Promise<boolean> {
    try {
      const otp = this.generateOTP();
      const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store OTP in cache
      const otp_key = `otp:${phone}`;
      const otp_data: OTPData = { phone, otp, type, expires_at, attempts: 0 };
      await cacheManager.set(otp_key, otp_data, 10 * 60 * 1000);
      
      // Mumbai-specific OTP message
      const message = `Your Baartal Mumbai OTP is: ${otp}. Valid for 10 minutes. Don't share with anyone.`;
      
      // Send SMS via Twilio
      await client.messages.create({
        body: message,
        from: TWILIO_PHONE,
        to: phone
      });
      
      logInfo('OTP sent successfully', { phone, type });
      return true;
      
    } catch (error) {
      logError(error as Error, { context: 'Send OTP', phone, type });
      return false;
    }
  }
  
  // Verify OTP
  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const otp_key = `otp:${phone}`;
      const stored_data = await cacheManager.get(otp_key) as OTPData;
      
      if (!stored_data) return false;
      
      // Check expiry
      if (new Date() > stored_data.expires_at) {
        await cacheManager.del(otp_key);
        return false;
      }
      
      // Check attempts
      if (stored_data.attempts >= 3) {
        await cacheManager.del(otp_key);
        return false;
      }
      
      if (stored_data.otp === otp) {
        await cacheManager.del(otp_key);
        logInfo('OTP verified successfully', { phone });
        return true;
      } else {
        stored_data.attempts++;
        await cacheManager.set(otp_key, stored_data, 10 * 60 * 1000);
        return false;
      }
      
    } catch (error) {
      logError(error as Error, { context: 'Verify OTP', phone });
      return false;
    }
  }
  
  // Send transaction notification
  async sendTransactionSMS(phone: string, amount: number, business_name: string, bcoins: number): Promise<void> {
    try {
      const message = `Payment of ₹${amount} to ${business_name} successful! You earned ${bcoins} B-Coins. Thanks for using Baartal!`;
      
      await client.messages.create({
        body: message,
        from: TWILIO_PHONE,
        to: phone
      });
      
      logInfo('Transaction SMS sent', { phone, amount, business_name });
    } catch (error) {
      logError(error as Error, { context: 'Transaction SMS', phone });
    }
  }
  
  // Send business verification SMS
  async sendBusinessVerificationSMS(phone: string, business_name: string, status: 'approved' | 'rejected'): Promise<void> {
    try {
      const message = status === 'approved' 
        ? `Congratulations! ${business_name} has been verified on Baartal Mumbai. Start accepting payments now!`
        : `Your business verification for ${business_name} needs more documents. Please check your dashboard.`;
      
      await client.messages.create({
        body: message,
        from: TWILIO_PHONE,
        to: phone
      });
      
      logInfo('Business verification SMS sent', { phone, business_name, status });
    } catch (error) {
      logError(error as Error, { context: 'Business verification SMS', phone });
    }
  }
  
  // Send welcome SMS for new Mumbai users
  async sendWelcomeSMS(phone: string, name: string): Promise<void> {
    try {
      const message = `Welcome to Baartal Mumbai, ${name}! Discover local businesses, earn B-Coins on every purchase. Start exploring now!`;
      
      await client.messages.create({
        body: message,
        from: TWILIO_PHONE,
        to: phone
      });
      
      logInfo('Welcome SMS sent', { phone, name });
    } catch (error) {
      logError(error as Error, { context: 'Welcome SMS', phone });
    }
  }
}

export const smsService = new SMSService();
export default smsService;