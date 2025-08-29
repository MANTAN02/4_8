import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, Menu, X, User, LogOut, Settings, Home, QrCode, Store, Scan, Coins, Search, HelpCircle, Phone } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { FirebaseStatus } from '@/components/FirebaseStatus';
import { NotificationCenter } from './NotificationCenter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function Navigation() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { data: user } = useAuth();
  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ['/api/bcoin-balance/my'],
    enabled: !!user && user.userType === 'customer',
  });
  const logoutMutation = useLogout();
  const { toast } = useToast();

  // Get unread notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications', 'unread'],
    queryFn: () => apiRequest('/api/notifications?unreadOnly=true'),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.length;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: 'Logged out successfully',
        description: 'Come back soon!',
      });
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        setLocation('/scanner');
        break;
      case 'explore':
        setLocation('/explore');
        break;
      case 'wallet':
        setLocation('/wallet');
        break;
      case 'help':
        setLocation('/help');
        break;
      case 'contact':
        setLocation('/contact');
        break;
      default:
        break;
    }
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="w-4 h-4" />,
      show: true,
      action: () => setLocation('/')
    },
    {
      label: 'Explore',
      href: '/explore',
      icon: <Store className="w-4 h-4" />,
      show: true,
      action: () => setLocation('/explore')
    },
    {
      label: 'QR Scanner',
      href: '/scanner',
      icon: <Scan className="w-4 h-4" />,
      show: user?.userType === 'customer',
      action: () => setLocation('/scanner')
    },
    {
      label: 'My QR Codes',
      href: '/qr-codes',
      icon: <QrCode className="w-4 h-4" />,
      show: user?.userType === 'business',
      action: () => setLocation('/qr-codes')
    },
    {
      label: 'Help',
      href: '/help',
      icon: <HelpCircle className="w-4 h-4" />,
      show: true,
      action: () => setLocation('/help')
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
              <div className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200 cursor-pointer" data-testid="nav-logo">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md">
                  <img 
                    src="/attached_assets/image_1754320645449.png" 
                    alt="Prebucks Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gradient-orange">
                    Prebucks
                  </span>
                  <span className="text-xs text-orange-600 font-medium -mt-1">
                    Your discount currency
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.filter(item => item.show).map((item) => (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={`
                    relative px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${isActive(item.href) 
                      ? 'bg-gradient-primary text-white shadow-md' 
                      : 'hover:bg-orange-50 hover:text-orange-600 text-gray-700'
                    }
                  `}
                  onClick={item.action}
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
              ))}
            </div>

            {/* Right side - User menu or Auth buttons */}
            <div className="flex items-center space-x-3">
              {/* Customer Wallet */}
              {user && user.userType === 'customer' && (
                <Button
                  variant="outline"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                  onClick={() => setLocation('/wallet')}
                >
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-medium">₹{(wallet?.balance ?? 0).toFixed(2)}</span>
                </Button>
              )}

              {/* Status Indicators */}
              {user && (
                <div className="flex items-center gap-2">
                  <RealtimeIndicator />
                  <FirebaseStatus />
                </div>
              )}

              {user ? (
                <>
                  {/* Quick Actions */}
                  <div className="hidden lg:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-orange-600"
                      onClick={() => handleQuickAction('scan')}
                      title="Quick Scan"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-orange-600"
                      onClick={() => handleQuickAction('explore')}
                      title="Explore Businesses"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-orange-600"
                      onClick={() => handleQuickAction('help')}
                      title="Get Help"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </div>

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
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs border-2 border-white animate-pulse">
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
                      
                      {/* Dashboard Link */}
                      <DropdownMenuItem 
                        className="p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                        onClick={() => setLocation(user.userType === 'customer' ? '/dashboard' : '/business-dashboard')}
                      >
                        <Home className="mr-3 h-4 w-4 text-orange-600" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>

                      {/* Wallet for customers */}
                      {user.userType === 'customer' && (
                        <DropdownMenuItem 
                          className="p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                          onClick={() => setLocation('/wallet')}
                        >
                          <Coins className="mr-3 h-4 w-4 text-orange-600" />
                          <span>My Wallet</span>
                          <Badge className="ml-auto bg-orange-100 text-orange-800">
                            ₹{(wallet?.balance ?? 0).toFixed(0)}
                          </Badge>
                        </DropdownMenuItem>
                      )}

                      {/* QR Codes for businesses */}
                      {user.userType === 'business' && (
                        <DropdownMenuItem 
                          className="p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                          onClick={() => setLocation('/qr-codes')}
                        >
                          <QrCode className="mr-3 h-4 w-4 text-orange-600" />
                          <span>My QR Codes</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem 
                        className="p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                        onClick={() => setLocation('/notifications')}
                      >
                        <Bell className="mr-3 h-4 w-4 text-orange-600" />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white">
                            {unreadCount}
                          </Badge>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        className="p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                        onClick={() => setLocation('/help')}
                      >
                        <HelpCircle className="mr-3 h-4 w-4 text-orange-600" />
                        <span>Help & Support</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        className="p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors duration-200"
                        onClick={() => toast({ title: 'Settings', description: 'Settings page coming soon!' })}
                      >
                        <Settings className="mr-3 h-4 w-4 text-orange-600" />
                        <span>Settings</span>
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
                  <Button 
                    variant="ghost" 
                    className="font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200" 
                    onClick={() => setLocation('/login')}
                    data-testid="nav-login"
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="btn-primary font-medium hover-lift" 
                    onClick={() => setLocation('/register')}
                    data-testid="nav-register"
                  >
                    Get Started
                  </Button>
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
                {/* Navigation Items */}
                {navItems.filter(item => item.show).map((item) => (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={`
                      w-full justify-start px-4 py-3 rounded-lg font-medium transition-all duration-200
                      ${isActive(item.href) 
                        ? 'bg-gradient-primary text-white shadow-md' 
                        : 'hover:bg-orange-50 hover:text-orange-600 text-gray-700'
                      }
                    `}
                    onClick={() => {
                      item.action();
                      setIsMobileMenuOpen(false);
                    }}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </span>
                  </Button>
                ))}

                {/* Quick Actions for Mobile */}
                {user && (
                  <div className="pt-4 border-t border-orange-100 space-y-2">
                    <p className="text-sm font-medium text-gray-700 px-4">Quick Actions</p>
                    
                    {user.userType === 'customer' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start px-4 py-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleQuickAction('wallet')}
                      >
                        <Coins className="w-4 h-4 mr-3" />
                        My Wallet (₹{(wallet?.balance ?? 0).toFixed(2)})
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full justify-start px-4 py-3 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handleQuickAction('contact')}
                    >
                      <Phone className="w-4 h-4 mr-3" />
                      Contact Support
                    </Button>
                  </div>
                )}
                
                {/* Auth buttons for non-logged in users */}
                {!user && (
                  <div className="pt-4 border-t border-orange-100 space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200" 
                      onClick={() => {
                        setLocation('/login');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      className="w-full btn-primary" 
                      onClick={() => {
                        setLocation('/register');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Get Started
                    </Button>
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