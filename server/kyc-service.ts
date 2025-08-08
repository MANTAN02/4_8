import { superDb } from './super-database';
import { logInfo, logError } from './logger';
import { smsService } from './sms-service';

interface KYCDocument {
  id: string;
  business_id: string;
  document_type: 'gst' | 'pan' | 'aadhaar' | 'shop_license' | 'bank_statement' | 'address_proof';
  document_number: string;
  file_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
  rejection_reason?: string;
}

interface BusinessKYC {
  business_id: string;
  owner_name: string;
  owner_phone: string;
  business_name: string;
  business_type: string;
  address: string;
  pincode: string;
  gst_number?: string;
  pan_number: string;
  bank_account: string;
  ifsc_code: string;
  kyc_status: 'incomplete' | 'pending' | 'verified' | 'rejected';
  documents: KYCDocument[];
}

class KYCService {
  
  // Submit KYC documents
  async submitKYC(kyc_data: Partial<BusinessKYC>): Promise<boolean> {
    try {
      const kyc_id = `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await superDb.execute(`
        INSERT INTO business_kyc (
          id, business_id, owner_name, owner_phone, business_name,
          business_type, address, pincode, gst_number, pan_number,
          bank_account, ifsc_code, kyc_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `, [
        kyc_id,
        kyc_data.business_id,
        kyc_data.owner_name,
        kyc_data.owner_phone,
        kyc_data.business_name,
        kyc_data.business_type,
        kyc_data.address,
        kyc_data.pincode,
        kyc_data.gst_number,
        kyc_data.pan_number,
        kyc_data.bank_account,
        kyc_data.ifsc_code,
        new Date().toISOString()
      ]);
      
      // Update business verification status
      await superDb.execute(`
        UPDATE businesses 
        SET verification_requested = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [kyc_data.business_id]);
      
      logInfo('KYC submitted', { business_id: kyc_data.business_id });
      return true;
      
    } catch (error) {
      logError(error as Error, { context: 'Submit KYC', kyc_data });
      return false;
    }
  }
  
  // Upload KYC document
  async uploadDocument(doc_data: {
    business_id: string;
    document_type: string;
    document_number: string;
    file_url?: string;
  }): Promise<boolean> {
    try {
      const doc_id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await superDb.execute(`
        INSERT INTO kyc_documents (
          id, business_id, document_type, document_number, 
          file_url, verification_status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `, [
        doc_id,
        doc_data.business_id,
        doc_data.document_type,
        doc_data.document_number,
        doc_data.file_url,
        new Date().toISOString()
      ]);
      
      return true;
    } catch (error) {
      logError(error as Error, { context: 'Upload document', doc_data });
      return false;
    }
  }
  
  // Approve KYC (admin function)
  async approveKYC(business_id: string, admin_notes?: string): Promise<boolean> {
    try {
      // Update KYC status
      await superDb.execute(`
        UPDATE business_kyc 
        SET kyc_status = 'verified', admin_notes = ?, verified_at = ?
        WHERE business_id = ?
      `, [admin_notes, new Date().toISOString(), business_id]);
      
      // Verify business
      await superDb.execute(`
        UPDATE businesses 
        SET is_verified = 1, verified_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [business_id]);
      
      // Get business and owner details
      const business = await this.getBusinessDetails(business_id);
      if (business) {
        await smsService.sendBusinessVerificationSMS(
          business.owner_phone,
          business.business_name,
          'approved'
        );
      }
      
      logInfo('KYC approved', { business_id });
      return true;
      
    } catch (error) {
      logError(error as Error, { context: 'Approve KYC', business_id });
      return false;
    }
  }
  
  // Reject KYC
  async rejectKYC(business_id: string, rejection_reason: string): Promise<boolean> {
    try {
      await superDb.execute(`
        UPDATE business_kyc 
        SET kyc_status = 'rejected', rejection_reason = ?
        WHERE business_id = ?
      `, [rejection_reason, business_id]);
      
      const business = await this.getBusinessDetails(business_id);
      if (business) {
        await smsService.sendBusinessVerificationSMS(
          business.owner_phone,
          business.business_name,
          'rejected'
        );
      }
      
      logInfo('KYC rejected', { business_id, rejection_reason });
      return true;
      
    } catch (error) {
      logError(error as Error, { context: 'Reject KYC', business_id });
      return false;
    }
  }
  
  // Get KYC status
  async getKYCStatus(business_id: string): Promise<any> {
    try {
      const kyc = await superDb.execute(`
        SELECT * FROM business_kyc WHERE business_id = ?
      `, [business_id]);
      
      const documents = await superDb.execute(`
        SELECT * FROM kyc_documents WHERE business_id = ?
      `, [business_id]);
      
      return {
        kyc: kyc[0] || null,
        documents: documents || []
      };
    } catch (error) {
      logError(error as Error, { context: 'Get KYC status', business_id });
      return null;
    }
  }
  
  // Get pending KYC applications (admin)
  async getPendingKYC(): Promise<any[]> {
    try {
      const result = await superDb.execute(`
        SELECT 
          bk.*,
          b.business_name,
          b.category,
          b.created_at as business_created_at,
          COUNT(kd.id) as document_count
        FROM business_kyc bk
        JOIN businesses b ON bk.business_id = b.id
        LEFT JOIN kyc_documents kd ON bk.business_id = kd.business_id
        WHERE bk.kyc_status = 'pending'
        GROUP BY bk.id
        ORDER BY bk.created_at ASC
      `);
      
      return result;
    } catch (error) {
      logError(error as Error, { context: 'Get pending KYC' });
      return [];
    }
  }
  
  private async getBusinessDetails(business_id: string): Promise<any> {
    try {
      const result = await superDb.execute(`
        SELECT bk.owner_phone, bk.business_name
        FROM business_kyc bk
        WHERE bk.business_id = ?
      `, [business_id]);
      
      return result[0] || null;
    } catch (error) {
      return null;
    }
  }
}

export const kycService = new KYCService();
export default kycService;