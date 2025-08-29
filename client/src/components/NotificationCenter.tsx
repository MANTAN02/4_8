import { useState } from 'react';
import { X, Bell, Check, Trash2, MoreVertical, Filter, Search, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'transaction' | 'system' | 'business' | 'customer' | 'promotion';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high';
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications', filter],
    queryFn: () => {
      let url = '/api/notifications';
      if (filter === 'unread') url += '?unreadOnly=true';
      if (filter === 'important') url += '?priority=high';
      return apiRequest(url);
    },
    enabled: isOpen,
    refetchInterval: 30000,
  });

  // Filter notifications by search
  const filteredNotifications = notifications.filter((notification: Notification) =>
    notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest('/api/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'All notifications marked as read ✅',
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Notification deleted 🗑️',
      });
    },
  });

  // Archive all read notifications
  const archiveReadMutation = useMutation({
    mutationFn: () => apiRequest('/api/notifications/archive-read', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Read notifications archived 📦',
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    } else {
      // Default action based on type
      switch (notification.type) {
        case 'transaction':
          window.location.href = '/wallet';
          break;
        case 'business':
          window.location.href = '/business-dashboard';
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return '💰';
      case 'business':
        return '🏪';
      case 'customer':
        return '👤';
      case 'promotion':
        return '🎉';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string, priority?: string) => {
    if (priority === 'high') return 'border-l-red-500 bg-red-50/50';
    
    switch (type) {
      case 'transaction':
        return 'border-l-green-500 bg-green-50/50';
      case 'business':
        return 'border-l-blue-500 bg-blue-50/50';
      case 'customer':
        return 'border-l-purple-500 bg-purple-50/50';
      case 'promotion':
        return 'border-l-orange-500 bg-orange-50/50';
      default:
        return 'border-l-gray-500 bg-gray-50/50';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority || priority === 'low') return null;
    
    const colors = {
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`text-xs ${colors[priority as keyof typeof colors]}`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-semibold">Notifications</h2>
              {filteredNotifications.filter((n: Notification) => !n.isRead).length > 0 && (
                <Badge className="bg-orange-600">
                  {filteredNotifications.filter((n: Notification) => !n.isRead).length}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="close-notifications"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                data-testid="filter-all"
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                data-testid="filter-unread"
              >
                Unread
                {notifications.filter((n: Notification) => !n.isRead).length > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 bg-orange-600">
                    {notifications.filter((n: Notification) => !n.isRead).length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={filter === 'important' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('important')}
                data-testid="filter-important"
              >
                Important
              </Button>
            </div>
          </div>

          {/* Actions */}
          {filteredNotifications.length > 0 && (
            <div className="p-4 border-b bg-gray-50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  data-testid="mark-all-read"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => archiveReadMutation.mutate()}
                  disabled={archiveReadMutation.isPending}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Read
                </Button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? 'No unread notifications' : 
                     searchQuery ? 'No notifications match your search' : 
                     'No notifications yet'}
                  </p>
                  {!searchQuery && filter === 'all' && (
                    <p className="text-sm text-gray-500 mt-2">
                      Start using Prebucks to receive updates and rewards!
                    </p>
                  )}
                </div>
              ) : (
                filteredNotifications.map((notification: Notification) => (
                  <Card
                    key={notification.id}
                    className={`border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getNotificationColor(notification.type, notification.priority)} ${
                      !notification.isRead ? 'ring-2 ring-orange-100' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              {notification.title}
                              {!notification.isRead && (
                                <Badge className="h-2 w-2 p-0 bg-orange-600 rounded-full"></Badge>
                              )}
                              {getPriorityBadge(notification.priority)}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                              {formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true })}
                            </CardDescription>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.isRead && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                data-testid={`mark-read-${notification.id}`}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="text-red-600"
                              data-testid={`delete-${notification.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      {notification.actionUrl && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-orange-600 hover:text-orange-700 mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = notification.actionUrl!;
                          }}
                          data-testid={`action-${notification.id}`}
                        >
                          View Details →
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>{filteredNotifications.length} notifications</span>
              <Button
                variant="link"
                size="sm"
                className="text-orange-600 hover:text-orange-700"
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
              >
                View All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}