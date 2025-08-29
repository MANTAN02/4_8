import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, Smartphone, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useLogin } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../../firebase.config';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = useLogin();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await loginMutation.mutateAsync(formData);
      toast({
        title: 'Welcome back! 🎉',
        description: 'You have been successfully logged in.',
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (userType: 'customer' | 'business') => {
    const demoCredentials = {
      customer: { email: 'customer@demo.com', password: 'password123' },
      business: { email: 'business@demo.com', password: 'password123' }
    };
    
    setFormData(demoCredentials[userType]);
    toast({
      title: 'Demo credentials loaded',
      description: `Click "Sign In" to login as ${userType}`,
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      toast({
        title: 'Google sign-in successful! 🎉',
        description: `Welcome, ${result.user.displayName || result.user.email}`,
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: 'Google sign-in failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: 'Password Reset',
      description: 'Password reset functionality will be implemented soon. Contact support for assistance.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="flex items-center justify-center mb-4 cursor-pointer group">
              <img 
                src="/attached_assets/image_1754320645449.png" 
                alt="Prebucks Logo" 
                className="w-12 h-12 mr-3 group-hover:scale-110 transition-transform"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Prebucks
              </h1>
            </div>
          </Link>
          <p className="text-muted-foreground">Your discount currency - Welcome back to Mumbai's #1 loyalty platform</p>
          
          {/* Trust Indicators */}
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Secure
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Fast
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Mobile Ready
            </Badge>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Demo Login Buttons */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center mb-3">Quick Demo Login:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => demoLogin('customer')}
                  className="text-xs hover:bg-blue-50 hover:border-blue-300"
                  data-testid="button-demo-customer"
                >
                  👤 Demo Customer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => demoLogin('business')}
                  className="text-xs hover:bg-purple-50 hover:border-purple-300"
                  data-testid="button-demo-business"
                >
                  🏪 Demo Business
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 hover:bg-gray-50"
                onClick={handleGoogleSignIn}
                data-testid="button-google-sign-in"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-orange-500'}`}
                    placeholder="your@email.com"
                    data-testid="input-email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-orange-500'}`}
                    placeholder="Enter your password"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Button 
                  type="button"
                  variant="link" 
                  className="px-0 font-normal text-sm text-orange-600 hover:text-orange-700" 
                  onClick={handleForgotPassword}
                  data-testid="link-forgot-password"
                >
                  Forgot your password?
                </Button>
              </div>

              {/* Login Error */}
              {loginMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {loginMutation.error instanceof Error 
                      ? loginMutation.error.message 
                      : 'Login failed. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading || loginMutation.isPending}
                data-testid="button-sign-in"
              >
                {isLoading || loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button 
                  variant="link" 
                  className="px-0 font-medium text-orange-600 hover:text-orange-700" 
                  onClick={() => setLocation('/register')}
                  data-testid="link-sign-up"
                >
                  Create account
                </Button>
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex justify-center gap-4 text-sm">
              <Button 
                variant="link" 
                className="px-0 text-gray-600 hover:text-orange-600"
                onClick={() => setLocation('/about')}
              >
                About Us
              </Button>
              <Button 
                variant="link" 
                className="px-0 text-gray-600 hover:text-orange-600"
                onClick={() => setLocation('/faq')}
              >
                FAQ
              </Button>
              <Button 
                variant="link" 
                className="px-0 text-gray-600 hover:text-orange-600"
                onClick={() => setLocation('/contact')}
              >
                Support
              </Button>
            </div>

            {/* Security Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Your data is protected with enterprise-grade security
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Links */}
        <div className="text-center mt-8">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Button 
              variant="link" 
              className="px-0 text-xs hover:text-orange-600"
              onClick={() => setLocation('/privacy')}
            >
              Privacy Policy
            </Button>
            <Button 
              variant="link" 
              className="px-0 text-xs hover:text-orange-600"
              onClick={() => setLocation('/contact')}
            >
              Terms of Service
            </Button>
            <Button 
              variant="link" 
              className="px-0 text-xs hover:text-orange-600"
              onClick={() => setLocation('/help')}
            >
              Help Center
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}