import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced metric card with trend analysis
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
  description?: string;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  className,
  onClick,
}) => {
  const trendColor = change?.trend === 'up' 
    ? 'text-green-600' 
    : change?.trend === 'down' 
      ? 'text-red-600' 
      : 'text-gray-600';

  const TrendIcon = change?.trend === 'up' 
    ? TrendingUp 
    : change?.trend === 'down' 
      ? TrendingDown 
      : Activity;

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <div className={cn('flex items-center space-x-1', trendColor)}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {Math.abs(change.value)}%
                  </span>
                </div>
              )}
            </div>
            {change && (
              <p className="text-xs text-muted-foreground mt-1">
                {change.trend === 'up' ? '+' : change.trend === 'down' ? '-' : ''}
                {Math.abs(change.value)}% from {change.period}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          <div className="text-primary/60">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Interactive chart wrapper with controls
interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  children,
  timeRange,
  onTimeRangeChange,
  onExport,
  onRefresh,
  isLoading = false,
  className,
  actions,
}) => {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            {timeRange && onTimeRangeChange && (
              <Select value={timeRange} onValueChange={onTimeRangeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {actions}
            
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
            )}
            
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('transition-opacity', isLoading && 'opacity-50')}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

// Data insights component
interface DataInsight {
  title: string;
  value: string;
  trend: 'positive' | 'negative' | 'neutral';
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface DataInsightsProps {
  insights: DataInsight[];
  className?: string;
}

export const DataInsights: React.FC<DataInsightsProps> = ({ insights, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Key Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-sm">{insight.title}</h4>
                <Badge 
                  variant={
                    insight.trend === 'positive' 
                      ? 'default' 
                      : insight.trend === 'negative' 
                        ? 'destructive' 
                        : 'secondary'
                  }
                  className="text-xs"
                >
                  {insight.value}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
              {insight.action && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs mt-2"
                  onClick={insight.action.onClick}
                >
                  {insight.action.label}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Comparative metrics component
interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  format?: 'number' | 'currency' | 'percentage';
}

interface ComparisonMetricsProps {
  title: string;
  metrics: ComparisonMetric[];
  className?: string;
}

export const ComparisonMetrics: React.FC<ComparisonMetricsProps> = ({
  title,
  metrics,
  className,
}) => {
  const formatValue = (value: number, format: ComparisonMetric['format'] = 'number') => {
    switch (format) {
      case 'currency':
        return `₹${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => {
            const changePercent = getChangePercentage(metric.current, metric.previous);
            const isPositive = changePercent > 0;
            const isNegative = changePercent < 0;

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{metric.label}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg font-bold">
                      {formatValue(metric.current, metric.format)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      vs {formatValue(metric.previous, metric.format)}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  'flex items-center space-x-1 text-sm font-medium',
                  isPositive && 'text-green-600',
                  isNegative && 'text-red-600',
                  !isPositive && !isNegative && 'text-gray-600'
                )}>
                  {isPositive && <TrendingUp className="w-4 h-4" />}
                  {isNegative && <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(changePercent).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
