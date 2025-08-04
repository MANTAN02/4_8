import { useEffect, useState, useCallback } from 'react';
import type { WebSocketMessage } from '@shared/types';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'notification':
        const payload = message.payload;
        toast({
          title: payload.title,
          description: payload.message,
          duration: 5000,
        });
        break;
      
      case 'bcoin_update':
        // Trigger re-fetch of user balance
        window.dispatchEvent(new CustomEvent('bcoin-balance-updated'));
        break;
      
      case 'transaction_complete':
        toast({
          title: "Transaction Complete",
          description: "Your transaction has been processed successfully",
          duration: 4000,
        });
        break;
      
      case 'qr_scanned':
        toast({
          title: "QR Code Scanned",
          description: `Customer scanned your QR code for ₹${message.payload.amount}`,
          duration: 4000,
        });
        break;
      
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }, [toast]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  return {
    isConnected,
    sendMessage,
  };
}