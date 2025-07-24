import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Activity,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced color palette with accessibility-compliant colors
const ENHANCED_COLORS = {
  primary: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
  success: ['#10B981', '#059669', '#047857', '#065F46'],
  warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
  danger: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
  purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
  teal: ['#14B8A6', '#0D9488', '#0F766E', '#115E59'],
  rose: ['#F43F5E', '#E11D48', '#BE185D', '#9F1239'],
  indigo: ['#6366F1', '#4F46E5', '#4338CA', '#3730A3'],
};

const CHART_COLORS = [
  ...ENHANCED_COLORS.primary,
  ...ENHANCED_COLORS.success,
  ...ENHANCED_COLORS.warning,
  ...ENHANCED_COLORS.purple,
  ...ENHANCED_COLORS.teal,
  ...ENHANCED_COLORS.rose,
];

interface EnhancedChartProps {
  title: string;
  data: any[];
  icon: React.ReactNode;
  type: 'pie' | 'bar' | 'line' | 'donut';
  height?: number;
  showLegend?: boolean;
  interactive?: boolean;
  onViewDetails?: () => void;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 min-w-[120px]">
        {label && (
          <p className="font-medium text-gray-900 mb-1 text-sm">{label}</p>
        )}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 text-sm">{entry.name || entry.dataKey}</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Enhanced Pie Chart Component
export const EnhancedPieChart: React.FC<EnhancedChartProps> = ({
  title,
  data,
  icon,
  type = 'pie',
  height = 320,
  showLegend = true,
  interactive = true,
  onViewDetails,
}) => {
  const [hiddenSlices, setHiddenSlices] = useState<Set<string>>(new Set());

  const toggleSlice = (name: string) => {
    if (!interactive) return;
    const newHidden = new Set(hiddenSlices);
    if (newHidden.has(name)) {
      newHidden.delete(name);
    } else {
      newHidden.add(name);
    }
    setHiddenSlices(newHidden);
  };

  const visibleData = data.filter(item => !hiddenSlices.has(item.name));
  const totalValue = visibleData.reduce((sum, item) => sum + (item.value || 0), 0);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Hide labels for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="glass-effect border-border/50 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title}
            </CardTitle>
          </div>
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
              className="text-gray-500 hover:text-gray-700"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>
        {totalValue > 0 && (
          <div className="text-sm text-gray-600">
            Total: {typeof totalValue === 'number' ? totalValue.toLocaleString() : totalValue}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={height - 60}>
              <PieChart>
                <Pie
                  data={visibleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={type === 'donut' ? 70 : 80}
                  innerRadius={type === 'donut' ? 40 : 0}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="white"
                  strokeWidth={2}
                >
                  {visibleData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip formatter={(value: number) => [value.toLocaleString(), 'Value']} />}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {showLegend && data.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                {data.slice(0, 6).map((entry, index) => {
                  const isHidden = hiddenSlices.has(entry.name);
                  const percentage = totalValue > 0 ? ((entry.value / totalValue) * 100).toFixed(1) : '0';

                  return (
                    <div
                      key={`legend-${entry.name}-${index}`}
                      className={cn(
                        "flex items-center gap-1 p-1 rounded cursor-pointer transition-all text-xs",
                        isHidden
                          ? "opacity-50"
                          : "hover:bg-gray-50",
                        interactive && "hover:shadow-sm"
                      )}
                      onClick={() => toggleSlice(entry.name)}
                    >
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: isHidden
                              ? '#D1D5DB'
                              : CHART_COLORS[index % CHART_COLORS.length]
                          }}
                        />
                        {interactive && (
                          <button className="text-gray-400 hover:text-gray-600">
                            {isHidden ? <EyeOff className="w-2 h-2" /> : <Eye className="w-2 h-2" />}
                          </button>
                        )}
                        <span className={cn(
                          "truncate",
                          isHidden ? "text-gray-400" : "text-gray-700"
                        )} title={entry.name}>
                          {entry.name.length > 8 ? `${entry.name.substring(0, 8)}...` : entry.name}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        isHidden ? "text-gray-400" : "text-gray-900"
                      )}>
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
              {data.length > 6 && (
                <div className="text-xs text-gray-500 text-center">
                  +{data.length - 6} more
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Bar Chart Component
export const EnhancedBarChart: React.FC<EnhancedChartProps> = ({
  title,
  data,
  icon,
  height = 320,
  onViewDetails,
}) => {
  return (
    <Card className="glass-effect border-border/50 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title}
            </CardTitle>
          </div>
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
              className="text-gray-500 hover:text-gray-700"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 10, right: 20, left: 50, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={70}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <Tooltip
              content={<CustomTooltip formatter={(value: number) => [value.toLocaleString(), 'Count']} />}
            />
            <Bar
              dataKey="count"
              fill={ENHANCED_COLORS.primary[0]}
              radius={[0, 3, 3, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Enhanced Line Chart Component
export const EnhancedLineChart: React.FC<EnhancedChartProps> = ({
  title,
  data,
  icon,
  height = 320,
  onViewDetails,
}) => {
  const maxValue = Math.max(...data.map(item => item.patients || 0));
  const hasGrowth = data.length > 1 && (data[data.length - 1]?.patients || 0) > (data[0]?.patients || 0);

  return (
    <Card className="glass-effect border-border/50 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasGrowth && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Growing
              </Badge>
            )}
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Peak: {maxValue} patients
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <Tooltip
              content={<CustomTooltip formatter={(value: number) => [value.toLocaleString(), 'Patients']} />}
            />
            <Line
              type="monotone"
              dataKey="patients"
              stroke={ENHANCED_COLORS.primary[0]}
              strokeWidth={2}
              dot={{
                fill: ENHANCED_COLORS.primary[0],
                strokeWidth: 2,
                r: 4,
                className: "hover:r-5 transition-all"
              }}
              activeDot={{
                r: 6,
                fill: ENHANCED_COLORS.primary[1],
                stroke: 'white',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Enhanced Chart Container with responsive grid
export const EnhancedAnalyticsSection: React.FC<{
  paymentMethodsData: any[];
  ageGroups: any[];
  treatmentTypesData: any[];
  patientGrowthData: any[];
}> = ({
  paymentMethodsData,
  ageGroups,
  treatmentTypesData,
  patientGrowthData,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
        <Button variant="outline" size="sm">
          <ChevronRight className="w-4 h-4 mr-2" />
          View All Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods - Enhanced Pie Chart */}
        <EnhancedPieChart
          title="Payment Methods"
          data={paymentMethodsData}
          icon={<CreditCard className="w-5 h-5" />}
          type="donut"
          height={280}
          showLegend={true}
          interactive={true}
        />

        {/* Age Demographics - Enhanced Bar Chart */}
        <EnhancedBarChart
          title="Age Demographics"
          data={ageGroups}
          icon={<Users className="w-5 h-5" />}
          height={280}
        />

        {/* Treatment Types - Enhanced Pie Chart */}
        <EnhancedPieChart
          title="Treatment Types"
          data={treatmentTypesData.slice(0, 8)} // Show top 8 treatments
          icon={<Activity className="w-5 h-5" />}
          type="pie"
          height={280}
          showLegend={true}
          interactive={true}
        />

        {/* Patient Growth - Enhanced Line Chart */}
        <EnhancedLineChart
          title="Patient Growth"
          data={patientGrowthData.slice(-6)} // Show last 6 months
          icon={<TrendingUp className="w-5 h-5" />}
          height={280}
        />
      </div>
    </div>
  );
};
