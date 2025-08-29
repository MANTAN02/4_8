import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import UserLanding from "@/pages/user-landing";
import MerchantLanding from "@/pages/merchant-landing";
import CustomerLogin from "@/pages/customer-login";
import BusinessLogin from "@/pages/business-login";
import CustomerDashboard from "@/pages/customer-dashboard";
import MerchantDashboard from "@/pages/merchant-dashboard";
import About from "@/pages/enhanced-about";
import FAQ from "@/pages/enhanced-faq";
import Contact from "@/pages/enhanced-contact";
import Privacy from "@/pages/privacy";
import NotFound from "@/pages/not-found";
import Offers from "@/pages/offers";
import Bundles from "@/pages/bundles";
import FloatingScan from "@/components/floating-scan";
import { ErrorBoundary } from "@/components/error-boundary";
import WalletPage from "@/pages/wallet";
import NotificationsPage from "@/pages/notifications";
import HelpPage from "@/pages/help";
import MerchantQRPoster from "@/pages/merchant-qr-poster";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/customer-login" component={CustomerLogin} />
      <Route path="/business-login" component={BusinessLogin} />
      <Route path="/for-users" component={UserLanding} />
      <Route path="/for-merchants" component={MerchantLanding} />
      <Route path="/customer-dashboard" component={CustomerDashboard} />
      <Route path="/merchant-dashboard" component={MerchantDashboard} />
      <Route path="/about" component={About} />
      <Route path="/offers" component={Offers} />
      <Route path="/bundles" component={Bundles} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/merchant/qr-poster" component={MerchantQRPoster} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <Router />
          <FloatingScan />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
