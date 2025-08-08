import { useRealtimeData } from '@/hooks/useRealtimeData';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function RealtimeIndicator() {
  const { connectionStatus, isConnected } = useRealtimeData();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi className="w-3 h-3" />,
          text: 'Live',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-700 border-green-200'
        };
      case 'connecting':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Connecting',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Offline',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-700 border-red-200'
        };
      default:
        return {
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Offline',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1 ${config.className}`}
    >
      {config.icon}
      <span className="text-xs font-medium">{config.text}</span>
    </Badge>
  );
}