import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userType?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, AuthenticatedWebSocket>();

  init(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: (info) => {
        // Optional: Add origin verification in production
        return true;
      }
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      console.log('New WebSocket connection');

      // Handle authentication
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'auth' && message.token) {
            try {
              const decoded = jwt.verify(message.token, JWT_SECRET) as any;
              ws.userId = decoded.id;
              ws.userType = decoded.userType;
              this.clients.set(decoded.id, ws);
              
              ws.send(JSON.stringify({
                type: 'auth_success',
                data: { userId: decoded.id }
              }));
              
              console.log(`User ${decoded.id} authenticated via WebSocket`);
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'auth_error',
                data: { message: 'Invalid token' }
              }));
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          console.log(`User ${ws.userId} disconnected from WebSocket`);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });

    console.log('WebSocket server initialized on path /ws');
  }

  // Send notification to specific user
  sendToUser(userId: string, message: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Send notification to all users of a specific type
  broadcast(message: any, userType?: string) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (!userType || client.userType === userType) {
          client.send(JSON.stringify(message));
        }
      }
    });
  }

  // Specific business notifications
  notifyBCoinEarned(userId: string, amount: number, businessName: string) {
    return this.sendToUser(userId, {
      type: 'bcoin_earned',
      data: {
        amount: amount.toFixed(2),
        businessName,
        timestamp: new Date().toISOString()
      }
    });
  }

  notifyQRScanned(businessUserId: string, customerName: string, amount: number) {
    return this.sendToUser(businessUserId, {
      type: 'qr_scanned',
      data: {
        customerName,
        amount: amount.toFixed(2),
        timestamp: new Date().toISOString()
      }
    });
  }

  // General notifications
  sendNotification(userId: string, title: string, message: string, type = 'notification') {
    return this.sendToUser(userId, {
      type,
      data: {
        title,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Platform-wide announcements
  sendAnnouncement(title: string, message: string) {
    this.broadcast({
      type: 'announcement',
      data: {
        title,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Get connection stats
  getStats() {
    return {
      totalConnections: this.clients.size,
      customers: Array.from(this.clients.values()).filter(c => c.userType === 'customer').length,
      businesses: Array.from(this.clients.values()).filter(c => c.userType === 'business').length,
    };
  }
}

export const wsManager = new WebSocketManager();

export function initWebSocket(server: Server) {
  wsManager.init(server);
  return wsManager;
}