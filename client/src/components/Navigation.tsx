import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, Menu, X, User, LogOut, Settings, Home, QrCode, Store, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { FirebaseStatus } from '@/components/FirebaseStatus';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { NotificationCenter } from './NotificationCenter';
import { useToast } from '@/hooks/use-toast';

export function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { data: user } = useAuth();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  // Get unread notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications', 'unread'],
    queryFn: () => apiRequest('/api/notifications?unreadOnly=true'),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.length;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: 'Logged out successfully',
        description: 'Come back soon!',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="w-4 h-4" />,
      show: true
    },
    {
      label: 'Explore',
      href: '/explore',
      icon: <Store className="w-4 h-4" />,
      show: true
    },
    {
      label: 'QR Scanner',
      href: '/scanner',
      icon: <Scan className="w-4 h-4" />,
      show: user?.userType === 'customer'
    },
    {
      label: 'My QR Codes',
      href: '/qr-codes',
      icon: <QrCode className="w-4 h-4" />,
      show: user?.userType === 'business'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full glass border-b border-orange-100/50 shadow-lg">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200" data-testid="nav-logo">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md">
                  <img 
                    src="/attached_assets/image_1754320645449.png" 
                    alt="Baartal Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-2xl font-bold text-gradient-orange">
                  Baartal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.filter(item => item.show).map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={`
                      relative px-4 py-2 rounded-lg font-medium transition-all duration-200
                      ${isActive(item.href) 
                        ? 'bg-gradient-primary text-white shadow-md' 
                        : 'hover:bg-orange-50 hover:text-orange-600 text-gray-700'
                      }
                    `}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                    {isActive(item.href) && (
                      <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full"></div>
                    )}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Right side - User menu or Auth buttons */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="flex items-center gap-2">
                  <RealtimeIndicator />
                  <FirebaseStatus />
                </div>
              )}
              {user ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative p-2 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      data-testid="notifications-button"
                    >
                      <Bell className="w-5 h-5 text-gray-600" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs border-2 border-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </div>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-orange-50 transition-colors duration-200" data-testid="user-menu">
                        <Avatar className="h-9 w-9 border-2 border-orange-200">
                          <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 glass-orange border border-orange-200 shadow-professional" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal p-3">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                          <Badge className="w-fit mt-1 bg-orange-100 text-orange-800 hover:bg-orange-200">
                            {user.userType === 'business' ? 'Business' : 'Customer'}
                          </Badge>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-orange-200" />
                      <DropdownMenuItem className="p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200">
                        <User className="mr-3 h-4 w-4 text-orange-600" />
                        <span>Profile Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200">
                        <Settings className="mr-3 h-4 w-4 text-orange-600" />
                        <span>Preferences</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-orange-200" />
                      <DropdownMenuItem 
                        className="p-3 hover:bg-red-50 rounded-lg cursor-pointer transition-colors duration-200 text-red-600"
                        onClick={handleLogout}
                        data-testid="logout-button"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="ghost" className="font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200" data-testid="nav-login">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="btn-primary font-medium hover-lift" data-testid="nav-register">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-orange-100 bg-white/95 backdrop-blur-sm animate-fade-in">
              <div className="space-y-2">
                {navItems.filter(item => item.show).map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className={`
                        w-full justify-start px-4 py-3 rounded-lg font-medium transition-all duration-200
                        ${isActive(item.href) 
                          ? 'bg-gradient-primary text-white shadow-md' 
                          : 'hover:bg-orange-50 hover:text-orange-600 text-gray-700'
                        }
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                    </Button>
                  </Link>
                ))}
                
                {!user && (
                  <div className="pt-4 border-t border-orange-100 space-y-2">
                    <Link href="/login">
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full btn-primary" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </>
  );
}