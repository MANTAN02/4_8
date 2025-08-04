// Enhanced type definitions for the Baartal application

export interface NotificationData {
  id: string;
  userId: string;
  type: 'bcoin_earned' | 'bcoin_redeemed' | 'bundle_joined' | 'business_verified' | 'qr_scanned' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalBCoins?: number;
  totalTransactions?: number;
  totalCustomers?: number;
  monthlyRevenue?: number;
  businessesInBundle?: number;
  customerRating?: number;
}

export interface BusinessMetrics {
  totalRevenue: number;
  totalCustomers: number;
  averageRating: number;
  bCoinsIssued: number;
  qrCodesScanned: number;
  monthlyGrowth: number;
}

export interface CustomerActivity {
  totalBCoins: number;
  totalSpent: number;
  favoriteBusinesses: string[];
  recentTransactions: number;
  bundleMemberships: number;
}

export interface WebSocketMessage {
  type: 'notification' | 'bcoin_update' | 'transaction_complete' | 'qr_scanned';
  payload: any;
  userId?: string;
}