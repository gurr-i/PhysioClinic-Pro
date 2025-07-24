import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import StatsCard from "@/components/dashboard/stats-card";
import {
  MonthlyVisitsChart,
  RevenueChart,
} from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, FileText } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MetricCard, ChartWrapper, DataInsights, ComparisonMetrics } from "@/components/analytics/advanced-charts";
import { ChartDetailModal } from "@/components/analytics/chart-detail-modal";
import { ExportManager } from "@/lib/export-utils";
import { TimeRangeManager, type TimeRange } from "@/lib/time-range-utils";
import { useToast } from "@/hooks/use-toast";
import { EnhancedAnalyticsSection } from "@/components/dashboard/enhanced-analytics-charts";


export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [chartDetailModal, setChartDetailModal] = useState<{
    isOpen: boolean;
    type: 'visits' | 'revenue';
    title: string;
  }>({ isOpen: false, type: 'visits', title: '' });

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: visits, isLoading: visitsLoading, refetch: refetchVisits } = useQuery<any[]>({
    queryKey: ["/api/visits"],
  });

  const { data: lowStock, isLoading: lowStockLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const { data: patients, refetch: refetchPatients } = useQuery<any[]>({
    queryKey: ["/api/patients"],
  });

  const { data: payments, refetch: refetchPayments } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

    const { data: inventory } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  // Generate chart data based on time range
  const visitsChartData = TimeRangeManager.generateVisitsChartData(visits || [], timeRange);
  const revenueChartData = TimeRangeManager.generateRevenueChartData(payments || [], timeRange);

  // Enhanced analytics functions
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchVisits(),
        refetchPatients(),
        refetchPayments(),
      ]);
      toast({
        title: "Success",
        description: "Dashboard data refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportData = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await ExportManager.exportDashboardReport(
        format,
        stats,
        patients || [],
        visits || [],
        payments || []
      );
      toast({
        title: "Success",
        description: `Dashboard report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export dashboard data",
        variant: "destructive",
      });
    }
  };

  // Navigation handlers
  const handleMetricCardClick = (type: 'patients' | 'revenue' | 'payments' | 'appointments') => {
    switch (type) {
      case 'patients':
        setLocation('/patients');
        break;
      case 'revenue':
        setLocation('/payments');
        break;
      case 'payments':
        setLocation('/payments');
        break;
      case 'appointments':
        setLocation('/appointments');
        break;
    }
  };

  const handleChartDetailView = (type: 'visits' | 'revenue', title: string) => {
    setChartDetailModal({
      isOpen: true,
      type,
      title,
    });
  };

  const handleViewPatientTrends = () => {
    setLocation('/patients');
  };

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    toast({
      title: "Time Range Updated",
      description: `Showing data for ${TimeRangeManager.getTimeRangeConfig(newRange).label}`,
    });
  };

  // Generate insights based on data
  const generateInsights = () => {
    if (!stats || !patients || !visits) return [];

    const insights = [];

    // Patient growth insight
    const totalPatients = parseInt(stats.totalPatients || '0');
    if (totalPatients > 0) {
      insights.push({
        title: 'Patient Growth',
        value: `${totalPatients} patients`,
        trend: 'positive' as const,
        description: 'Steady growth in patient base this month',
        action: {
          label: 'View patient trends',
          onClick: handleViewPatientTrends,
        },
      });
    }

    // Revenue insight
    const monthlyRevenue = typeof stats.monthlyRevenue === 'string'
      ? parseFloat(stats.monthlyRevenue.replace(/[₹,]/g, '') || '0')
      : parseFloat(stats.monthlyRevenue || '0');
    if (monthlyRevenue > 0) {
      insights.push({
        title: 'Revenue Performance',
        value: `₹${monthlyRevenue.toLocaleString()}`,
        trend: 'positive' as const,
        description: 'Monthly revenue target exceeded by 15%',
      });
    }

    return insights;
  };

  // Generate comparison metrics
  const getComparisonMetrics = () => {
    if (!stats) return [];

    return [
      {
        label: 'Total Patients',
        current: parseInt(stats.totalPatients || '0'),
        previous: Math.max(0, parseInt(stats.totalPatients || '0') - 2),
        format: 'number' as const,
      },
      {
        label: 'Monthly Revenue',
        current: typeof stats.monthlyRevenue === 'string'
          ? parseFloat(stats.monthlyRevenue.replace(/[₹,]/g, '') || '0')
          : parseFloat(stats.monthlyRevenue || '0'),
        previous: 2800,
        format: 'currency' as const,
      },
      {
        label: 'Visit Completion',
        current: 100,
        previous: 95,
        format: 'percentage' as const,
      },
    ];
  };

  if (statsLoading) {
    return (
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--dark-slate)]">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, Dr. Johnson
            </p>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentVisits = Array.isArray(visits) ? visits.slice(0, 3) : [];
  const todaysVisits = Array.isArray(visits) ?
    visits.filter((visit: any) => {
      const today = new Date();
      const visitDate = new Date(visit.visitDate);
      return visitDate.toDateString() === today.toDateString();
    }) : [];

  // Calculate additional insights
  const totalRevenue = Array.isArray(payments) ?
    payments.reduce(
      (sum: number, payment: any) => sum + parseFloat(payment.amount),
      0,
    ) : 0;
  const averageVisitValue =
    Array.isArray(visits) && visits.length > 0 ? totalRevenue / visits.length : 0;
  const completionRate =
    todaysVisits.length > 0
      ? (todaysVisits.filter((v: any) => new Date(v.visitDate) < new Date())
          .length /
          todaysVisits.length) *
        100
      : 0;
  const newPatientsThisMonth = Array.isArray(patients) ?
    patients.filter((patient: any) => {
      const patientDate = new Date(patient.createdAt || new Date());
      const thisMonth = new Date();
      return (
        patientDate.getMonth() === thisMonth.getMonth() &&
        patientDate.getFullYear() === thisMonth.getFullYear()
      );
    }).length : 0;

    // Use real data from API queries
  const chartData = stats?.monthlyVisitTrends || [];
  const revenueData = stats?.revenueData || [];
  const lowStockItems = Array.isArray(inventory) ? inventory.filter((item: any) =>
    parseInt(item.quantity) <= parseInt(item.minStockLevel)
  ) : [];

  // New chart data processing
  // Payment Methods Distribution
  const paymentMethodsData = (Array.isArray(payments) ? payments : [])?.reduce((acc: any, payment: any) => {
    const method = payment.paymentMethod || 'Unknown';
    const existing = acc.find((item: any) => item.name === method);
    if (existing) {
      existing.value += parseFloat(payment.amount);
      existing.count += 1;
    } else {
      acc.push({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value: parseFloat(payment.amount),
        count: 1
      });
    }
    return acc;
  }, []) || [];

  // Patient Age Demographics
  const ageGroups = (Array.isArray(patients) ? patients : [])?.reduce((acc: any, patient: any) => {
    const age = parseInt(patient.age);
    let group = 'Unknown';
    if (age < 18) group = '0-17';
    else if (age < 30) group = '18-29';
    else if (age < 45) group = '30-44';
    else if (age < 60) group = '45-59';
    else group = '60+';

    const existing = acc.find((item: any) => item.name === group);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: group, count: 1 });
    }
    return acc;
  }, []) || [];

  // Treatment Types Distribution
  const treatmentTypesData = (Array.isArray(visits) ? visits : [])?.reduce((acc: any, visit: any) => {
    const treatment = visit.treatmentProvided || 'Unknown';
    const existing = acc.find((item: any) => item.name === treatment);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: treatment, value: 1 });
    }
    return acc;
  }, []) || [];

  // Monthly Patient Growth
  const patientGrowthData = (Array.isArray(patients) ? patients : [])?.reduce((acc: any, patient: any) => {
    const date = new Date(patient.createdAt || new Date());
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const existing = acc.find((item: any) => item.month === monthName);
    if (existing) {
      existing.patients += 1;
    } else {
      acc.push({ month: monthName, patients: 1, monthKey });
    }
    return acc;
  }, [])?.sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey)) || [];

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark-slate)]">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, Dr. Sukhcharan Singh
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportData('pdf')}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportData('excel')}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </Button>

          <div className="relative">
            <input
              type="search"
              placeholder="Search patients..."
              className="w-64 px-4 py-2 rounded-xl bg-background/80 backdrop-blur-sm border-border focus-visible:ring-ring"
            />
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Patients"
            value={stats?.totalPatients ?? 0}
            change={{
              value: 12,
              period: "last month",
              trend: "up"
            }}
            icon={<Users className="w-6 h-6" />}
            description="Active patient base"
            onClick={() => handleMetricCardClick('patients')}
          />
          <MetricCard
            title="Monthly Revenue"
            value={`₹${stats?.monthlyRevenue?.toLocaleString() ?? 0}`}
            change={{
              value: 8,
              period: "last month",
              trend: "up"
            }}
            icon={<DollarSign className="w-6 h-6" />}
            description="Revenue this month"
            onClick={() => handleMetricCardClick('revenue')}
          />
          <MetricCard
            title="Outstanding"
            value={`₹${stats?.outstandingBalance?.toLocaleString() ?? 0}`}
            change={{
              value: 5,
              period: "last month",
              trend: "down"
            }}
            icon={<AlertTriangle className="w-6 h-6" />}
            description="Pending payments"
            onClick={() => handleMetricCardClick('payments')}
          />
          <MetricCard
            title="Today's Visits"
            value={stats?.todaysVisits ?? 0}
            change={{
              value: 0,
              period: "today",
              trend: "neutral"
            }}
            icon={<Calendar className="w-6 h-6" />}
            description="3 remaining"
            onClick={() => handleMetricCardClick('appointments')}
          />
        </div>

        {/* Enhanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ComparisonMetrics
              title="Performance Comparison"
              metrics={getComparisonMetrics()}
            />
          </div>
          <DataInsights
            insights={generateInsights()}
            className="lg:col-span-1"
          />
        </div>

        {/* Additional Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-border/50 hover-liquid">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Avg Visit Value
                  </p>
                  <p className="text-2xl font-bold text-[var(--dark-slate)]">
                    ₹{averageVisitValue.toFixed(0)}
                  </p>
                  <p className="text-sm text-[var(--health-green)]">
                    +15% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--health-green)] to-emerald-600 flex items-center justify-center">
                  <TrendingUp className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50 hover-liquid">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    New Patients
                  </p>
                  <p className="text-2xl font-bold text-[var(--dark-slate)]">
                    {newPatientsThisMonth}
                  </p>
                  <p className="text-sm text-[var(--medical-blue)]">
                    This month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--medical-blue)] to-blue-600 flex items-center justify-center">
                  <Users className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50 hover-liquid">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-bold text-[var(--dark-slate)]">
                    {completionRate.toFixed(0)}%
                  </p>
                  <Progress value={completionRate} className="mt-2 h-2" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-purple-600 flex items-center justify-center">
                  <Activity className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50 hover-liquid">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Avg Wait Time
                  </p>
                  <p className="text-2xl font-bold text-[var(--dark-slate)]">
                    0min
                  </p>
                  <p className="text-sm text-destructive">
                    +2min from last week
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--warning-amber)] to-orange-500 flex items-center justify-center">
                  <Clock className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {statsLoading ? (
            <>
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
            </>
          ) : (
            <>
              <ChartWrapper
                title="Monthly Visits Trend"
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
                onExport={() => handleExportData('csv')}
                onRefresh={() => refetchVisits()}
                isLoading={visitsLoading}
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChartDetailView('visits', 'Monthly Visits Trend')}
                  >
                    <LineChartIcon className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={visitsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="var(--medical-blue)"
                      fill="var(--medical-blue)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartWrapper>

              <ChartWrapper
                title="Monthly Revenue"
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
                onExport={() => handleExportData('csv')}
                onRefresh={() => refetchPayments()}
                isLoading={statsLoading}
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChartDetailView('revenue', 'Monthly Revenue')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analyze
                  </Button>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="var(--health-green)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </>
          )}
        </div>

        {/* Enhanced Analytics Section */}
        <EnhancedAnalyticsSection
          paymentMethodsData={paymentMethodsData}
          ageGroups={ageGroups}
          treatmentTypesData={treatmentTypesData}
          patientGrowthData={patientGrowthData}
        />

        {/* Bottom Section - Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Patients */}
          <Card className="glass-effect border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
                Recent Patients
              </CardTitle>
              <Button
                variant="ghost"
                className="text-primary text-sm font-medium"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {visitsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-3 w-12 mb-1" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                  ))
                ) : recentVisits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent visits found
                  </div>
                ) : (
                  recentVisits.map((visit: any) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-card/50 hover:bg-card/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {visit.patient.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[var(--dark-slate)]">
                            {visit.patient.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {visit.treatmentProvided}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[var(--dark-slate)]">
                          {new Date(visit.visitDate).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </p>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card className="glass-effect border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
                Inventory Alerts
              </CardTitle>
              <Button
                variant="ghost"
                className="text-primary text-sm font-medium"
              >
                Manage
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-card/50"
                    >
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))
                ) : !Array.isArray(lowStock) || lowStock.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No inventory alerts
                  </div>
                ) : (
                  lowStockItems.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                      <div>
                        <p className="font-medium text-[var(--dark-slate)]">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Current: {item.quantity} (Min: {item.minStockLevel})</p>
                      </div>
                      <Badge variant="destructive">Low Stock</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-[var(--medical-blue)] to-blue-600 hover:shadow-lg">
                  <Calendar className="mr-2 w-4 h-4" />
                  Schedule Appointment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 w-4 h-4" />
                  Add New Patient
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 w-4 h-4" />
                  Record Payment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 w-4 h-4" />
                  Update Inventory
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 w-4 h-4" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart Detail Modal */}
      <ChartDetailModal
        isOpen={chartDetailModal.isOpen}
        onClose={() => setChartDetailModal({ ...chartDetailModal, isOpen: false })}
        chartType={chartDetailModal.type}
        data={chartDetailModal.type === 'visits' ? visitsChartData : revenueChartData}
        title={chartDetailModal.title}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />
    </div>
  );
}