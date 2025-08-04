import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Coins, LogOut, User, Store, Home, Info, Phone, HelpCircle, Shield } from "lucide-react";
import { authService } from "@/lib/auth";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const user = authService.getUser();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center text-2xl font-bold text-baartal-orange cursor-pointer">
              <Coins className="mr-2" />
              Baartal
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/about">
              <span className="text-baartal-blue hover:text-baartal-orange transition-colors cursor-pointer flex items-center">
                <Info className="mr-1 h-4 w-4" />
                About
              </span>
            </Link>
            <Link href="/faq">
              <span className="text-baartal-blue hover:text-baartal-orange transition-colors cursor-pointer flex items-center">
                <HelpCircle className="mr-1 h-4 w-4" />
                FAQ
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-baartal-blue hover:text-baartal-orange transition-colors cursor-pointer flex items-center">
                <Phone className="mr-1 h-4 w-4" />
                Contact
              </span>
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-baartal-blue">Hi, {user.name}</span>
                <Link href={user.userType === 'customer' ? '/customer-dashboard' : '/merchant-dashboard'}>
                  <Button variant="outline" className="border-baartal-orange text-baartal-orange hover:bg-baartal-orange hover:text-white">
                    {user.userType === 'customer' ? (
                      <>
                        <User className="mr-1 h-4 w-4" />
                        Dashboard
                      </>
                    ) : (
                      <>
                        <Store className="mr-1 h-4 w-4" />
                        Business
                      </>
                    )}
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    authService.logout();
                    window.location.href = '/';
                  }}
                  className="text-gray-600 hover:text-baartal-blue"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/customer-login">
                  <Button variant="outline" className="border-baartal-blue text-baartal-blue hover:bg-baartal-blue hover:text-white">
                    <User className="mr-1 h-4 w-4" />
                    Customer
                  </Button>
                </Link>
                <Link href="/business-login">
                  <Button className="bg-baartal-orange text-white hover:bg-orange-600 font-medium">
                    <Store className="mr-1 h-4 w-4" />
                    Business
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-baartal-blue"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link href="/#how-it-works">
                <span className="text-baartal-blue hover:text-baartal-orange transition-colors block py-2">
                  How It Works
                </span>
              </Link>
              <Link href="/#bundles">
                <span className="text-baartal-blue hover:text-baartal-orange transition-colors block py-2">
                  Explore Bundles
                </span>
              </Link>
              <Link href="/#merchants">
                <span className="text-baartal-blue hover:text-baartal-orange transition-colors block py-2">
                  For Merchants
                </span>
              </Link>
              
              {user ? (
                <>
                  <Link href={user.userType === 'customer' ? '/customer-dashboard' : '/merchant-dashboard'}>
                    <Button variant="outline" className="w-full border-baartal-orange text-baartal-orange hover:bg-baartal-orange hover:text-white">
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      authService.logout();
                      window.location.href = '/';
                    }}
                    className="w-full text-gray-600 hover:text-baartal-blue"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/customer-login">
                  <Button className="w-full bg-baartal-orange text-white hover:bg-orange-600 font-medium">
                    Join Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
