import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

// Pages
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import EnhancedCustomerDashboard from "@/pages/EnhancedCustomerDashboard";
import EnhancedBusinessDashboard from "@/pages/EnhancedBusinessDashboard";
import ExploreBusiness from "@/pages/ExploreBusiness";
import QRScanner from "@/pages/QRScanner";
import QRCodes from "@/pages/QRCodes";
import NotFound from "@/pages/NotFound";

function AppRouter() {
  const { data: user, isLoading } = useAuth();
  useWebSocket(); // Initialize WebSocket connection

  // Don't show loading spinner for too long - show content after 2 seconds
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading && !showContent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={user ? (user.userType === "customer" ? EnhancedCustomerDashboard : EnhancedBusinessDashboard) : LandingPage} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/explore" component={ExploreBusiness} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" component={user?.userType === "customer" ? EnhancedCustomerDashboard : () => <div>Access Denied</div>} />
        <Route path="/business-dashboard" component={user?.userType === "business" ? EnhancedBusinessDashboard : () => <div>Access Denied</div>} />
        <Route path="/scanner" component={user?.userType === "customer" ? QRScanner : () => <div>Access Denied</div>} />
        <Route path="/qr-codes" component={user?.userType === "business" ? QRCodes : () => <div>Access Denied</div>} />
        
        {/* 404 Route */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}

export default App;