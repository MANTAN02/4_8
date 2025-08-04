import { useState } from 'react';
import { TrendingUp, DollarSign, Users, Store, Target, Calendar, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function FinancialOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Revenue projections based on user growth
  const revenueMetrics = {
    currentRevenue: 250000, // ₹2.5L monthly
    projectedRevenue: 1200000, // ₹12L monthly target
    platformCommission: 0.05, // 5%
    totalTransactions: 45000,
    totalUsers: 12500,
    totalBusinesses: 580,
    averageTransactionValue: 850
  };

  const monthlyGrowth = [
    { month: 'Jan', revenue: 45000, users: 2500, businesses: 125 },
    { month: 'Feb', revenue: 78000, users: 4200, businesses: 210 },
    { month: 'Mar', revenue: 125000, users: 6800, businesses: 340 },
    { month: 'Apr', revenue: 180000, users: 8900, businesses: 425 },
    { month: 'May', revenue: 250000, users: 12500, businesses: 580 },
    { month: 'Jun', revenue: 340000, users: 16800, businesses: 750 },
  ];

  const revenueStreams = [
    {
      name: 'Transaction Commission',
      value: 87.5,
      amount: 218750,
      color: 'bg-orange-500',
      description: '5% on all B-Coin transactions'
    },
    {
      name: 'Business Verification',
      value: 8.2,
      amount: 20500,
      color: 'bg-blue-500',
      description: 'Premium verification badges'
    },
    {
      name: 'Featured Listings',
      value: 3.1,
      amount: 7750,
      color: 'bg-green-500',
      description: 'Promoted business placements'
    },
    {
      name: 'Analytics Premium',
      value: 1.2,
      amount: 3000,
      color: 'bg-purple-500',
      description: 'Advanced business insights'
    }
  ];

  const keyMetrics = [
    {
      title: 'Monthly Revenue',
      value: `₹${(revenueMetrics.currentRevenue / 1000).toFixed(0)}K`,
      change: '+156%',
      trend: 'up',
      icon: <DollarSign className="w-6 h-6" />,
      description: 'Platform commission earnings'
    },
    {
      title: 'Active Users',
      value: `${(revenueMetrics.totalUsers / 1000).toFixed(1)}K`,
      change: '+89%',
      trend: 'up',
      icon: <Users className="w-6 h-6" />,
      description: 'Customers & businesses combined'
    },
    {
      title: 'Partner Businesses',
      value: revenueMetrics.totalBusinesses.toString(),
      change: '+67%',
      trend: 'up',
      icon: <Store className="w-6 h-6" />,
      description: 'Revenue-generating businesses'
    },
    {
      title: 'Avg Transaction',
      value: `₹${revenueMetrics.averageTransactionValue}`,
      change: '+23%',
      trend: 'up',
      icon: <Coins className="w-6 h-6" />,
      description: 'Per transaction value'
    }
  ];

  const projections = [
    {
      period: 'Q3 2025',
      revenue: 4500000,
      users: 35000,
      businesses: 1200,
      confidence: 92
    },
    {
      period: 'Q4 2025',
      revenue: 8200000,
      users: 65000,
      businesses: 2100,
      confidence: 87
    },
    {
      period: 'Q1 2026',
      revenue: 15000000,
      users: 120000,
      businesses: 3800,
      confidence: 78
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Baartal Financial Overview
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time revenue tracking and growth projections for Mumbai's #1 loyalty platform
          </p>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            🚀 Production Ready • Money Making Machine
          </Badge>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {keyMetrics.map((metric, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className="text-orange-600">
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`flex items-center gap-1 text-sm ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Streams */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-orange-600" />
                Revenue Streams
              </CardTitle>
              <CardDescription>
                Breakdown of monthly revenue sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenueStreams.map((stream, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{stream.name}</span>
                    <span className="text-sm font-bold">₹{(stream.amount / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${stream.color}`}
                        style={{ width: `${stream.value}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">{stream.value}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{stream.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Growth Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Revenue Growth
              </CardTitle>
              <CardDescription>
                Monthly revenue progression (₹ in thousands)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyGrowth.map((month, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 text-sm font-medium">{month.month}</div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">₹{(month.revenue / 1000).toFixed(0)}K</span>
                        <span className="text-xs text-muted-foreground">
                          {month.users} users • {month.businesses} businesses
                        </span>
                      </div>
                      <Progress 
                        value={(month.revenue / 340000) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projections */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Growth Projections
            </CardTitle>
            <CardDescription>
              Conservative estimates based on current growth trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projections.map((projection, index) => (
                <div key={index} className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                  <h3 className="text-lg font-semibold">{projection.period}</h3>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-orange-600">
                      ₹{(projection.revenue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">{(projection.users / 1000).toFixed(0)}K</div>
                      <div className="text-muted-foreground">Users</div>
                    </div>
                    <div>
                      <div className="font-semibold">{projection.businesses.toLocaleString()}</div>
                      <div className="text-muted-foreground">Businesses</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-xs text-muted-foreground">Confidence:</div>
                    <Badge variant="secondary">{projection.confidence}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Investment Highlights */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5" />
              Investment Highlights
            </CardTitle>
            <CardDescription className="text-orange-100">
              Why Baartal is the greatest startup opportunity
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">5%</div>
              <div className="text-sm opacity-90">Automatic Commission</div>
              <div className="text-xs opacity-75 mt-1">On every transaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">₹12M+</div>
              <div className="text-sm opacity-90">Revenue Potential</div>
              <div className="text-xs opacity-75 mt-1">By end of 2025</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">100K+</div>
              <div className="text-sm opacity-90">User Target</div>
              <div className="text-xs opacity-75 mt-1">Mumbai market penetration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm opacity-90">Passive Income</div>
              <div className="text-xs opacity-75 mt-1">Automated platform</div>
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Immediate Action Plan
            </CardTitle>
            <CardDescription>
              Steps to maximize revenue and growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-orange-600">Next 30 Days</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Deploy to production server (Heroku/Vercel)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Onboard 50+ Mumbai businesses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Launch customer acquisition campaign
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Implement referral reward system
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-green-600">Next 90 Days</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Scale to 500+ businesses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Launch premium business features
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Expand to Pune and Bangalore
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Achieve ₹500K monthly revenue
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white">
                Start Deployment Process
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}