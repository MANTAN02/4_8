import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
      console.log('WebSocket connected');
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
      console.log('WebSocket disconnected');
      
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    return ws;
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'bcoin_earned':
        toast({
          title: 'B-Coins Earned! 🪙',
          description: `You earned ₹${message.data.amount} at ${message.data.businessName}`,
          duration: 5000,
        });
        break;
        
      case 'qr_scanned':
        toast({
          title: 'QR Code Scanned! 📱',
          description: `Customer ${message.data.customerName} made a ₹${message.data.amount} purchase`,
          duration: 5000,
        });
        break;
        
      case 'notification':
        toast({
          title: message.data.title,
          description: message.data.message,
          duration: 4000,
        });
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }, [toast]);

  useEffect(() => {
    const ws = connect();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    sendMessage,
  };
}