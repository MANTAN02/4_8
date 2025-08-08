import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

export function FirebaseStatus() {
  // Simple fallback - we'll enhance this once Firebase is properly connected
  const isFirebaseConnected = false;
  const fcmToken = null;

  const getStatusConfig = () => {
    if (isFirebaseConnected) {
      return {
        icon: <Cloud className="w-3 h-3" />,
        text: 'Cloud',
        variant: 'default' as const,
        className: 'bg-blue-100 text-blue-700 border-blue-200'
      };
    } else {
      return {
        icon: <CloudOff className="w-3 h-3" />,
        text: 'Local',
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-700 border-gray-200'
      };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={config.variant}
        className={`flex items-center gap-1 ${config.className}`}
        title={`Firebase ${isFirebaseConnected ? 'Connected' : 'Disconnected'}`}
      >
        {config.icon}
        <span className="text-xs font-medium">{config.text}</span>
      </Badge>
      
      {fcmToken && (
        <Badge 
          variant="outline"
          className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"
          title="Push notifications enabled"
        >
          <span className="text-xs">🔔</span>
        </Badge>
      )}
    </div>
  );
}