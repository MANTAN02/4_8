import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { LogOut, User, Store, Coins, QrCode } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

export function Navigation() {
  const [location] = useLocation();
  const { data: user, isLoading } = useAuth();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate();
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-orange-600">
                Baartal
              </Link>
            </div>
            <LoadingSpinner />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-orange-600">
              Baartal
            </Link>
            
            {user && (
              <div className="hidden md:flex space-x-6">
                {user.userType === "customer" ? (
                  <>
                    <Link href="/dashboard">
                      <Button 
                        variant={location === "/dashboard" ? "default" : "ghost"} 
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <User className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Button>
                    </Link>
                    <Link href="/explore">
                      <Button 
                        variant={location === "/explore" ? "default" : "ghost"} 
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Store className="w-4 h-4" />
                        <span>Explore</span>
                      </Button>
                    </Link>
                    <Link href="/scanner">
                      <Button 
                        variant={location === "/scanner" ? "default" : "ghost"} 
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Scanner</span>
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/business-dashboard">
                      <Button 
                        variant={location === "/business-dashboard" ? "default" : "ghost"} 
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Store className="w-4 h-4" />
                        <span>Business</span>
                      </Button>
                    </Link>
                    <Link href="/qr-codes">
                      <Button 
                        variant={location === "/qr-codes" ? "default" : "ghost"} 
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR Codes</span>
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {user.name}
                  {user.userType === "customer" && (
                    <span className="ml-2 inline-flex items-center">
                      <Coins className="w-4 h-4 text-orange-500 mr-1" />
                      <span className="text-orange-600 font-medium">B-Coins</span>
                    </span>
                  )}
                </span>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}