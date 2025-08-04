import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import type { TokenPayload } from './auth';
import type { WebSocketMessage } from '@shared/types';

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

export interface AuthenticatedWebSocket extends WebSocket {
  user?: TokenPayload;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: (info) => {
        // Verify authentication token from query params
        const url = new URL(info.req.url!, 'http://localhost');
        const token = url.searchParams.get('token');
        
        if (!token) return false;
        
        try {
          jwt.verify(token, JWT_SECRET);
          return true;
        } catch {
          return false;
        }
      }
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      try {
        const url = new URL(req.url!, 'http://localhost');
        const token = url.searchParams.get('token');
        
        if (token) {
          const user = jwt.verify(token, JWT_SECRET) as TokenPayload;
          ws.user = user;
          this.clients.set(user.id, ws);
          
          console.log(`WebSocket client connected: ${user.email}`);
        }

        ws.on('close', () => {
          if (ws.user) {
            this.clients.delete(ws.user.id);
            console.log(`WebSocket client disconnected: ${ws.user.email}`);
          }
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

        // Send initial connection confirmation
        this.sendToClient(ws.user?.id!, {
          type: 'notification',
          payload: {
            title: 'Connected',
            message: 'Real-time notifications enabled'
          }
        });

      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close();
      }
    });
  }

  sendToClient(userId: string, message: WebSocketMessage) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  sendToAllClients(message: WebSocketMessage) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Notification helpers
  notifyBCoinEarned(userId: string, amount: number, businessName: string) {
    this.sendToClient(userId, {
      type: 'notification',
      payload: {
        type: 'bcoin_earned',
        title: 'B-Coins Earned! 🪙',
        message: `You earned ${amount} B-Coins at ${businessName}`,
        data: { amount, businessName }
      }
    });
  }

  notifyBCoinRedeemed(userId: string, amount: number, businessName: string) {
    this.sendToClient(userId, {
      type: 'notification',
      payload: {
        type: 'bcoin_redeemed',
        title: 'B-Coins Redeemed ✨',
        message: `You redeemed ${amount} B-Coins at ${businessName}`,
        data: { amount, businessName }
      }
    });
  }

  notifyQRScanned(businessUserId: string, customerName: string, amount: number) {
    this.sendToClient(businessUserId, {
      type: 'notification',
      payload: {
        type: 'qr_scanned',
        title: 'QR Code Scanned 📱',
        message: `${customerName} scanned your QR code for ₹${amount}`,
        data: { customerName, amount }
      }
    });
  }

  notifyBusinessVerified(userId: string, businessName: string) {
    this.sendToClient(userId, {
      type: 'notification',
      payload: {
        type: 'business_verified',
        title: 'Business Verified ✅',
        message: `${businessName} has been verified and is now live!`,
        data: { businessName }
      }
    });
  }
}

export let wsManager: WebSocketManager;

export function initWebSocket(server: Server) {
  wsManager = new WebSocketManager(server);
  return wsManager;
}