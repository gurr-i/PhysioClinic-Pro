import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  DollarSign, 
  Activity,
  Download,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartType: 'visits' | 'revenue';
  data: any[];
  title: string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const ChartDetailModal: React.FC<ChartDetailModalProps> = ({
  isOpen,
  onClose,
  chartType,
  data,
  title,
  timeRange,
  onTimeRangeChange,
}) => {
  const [viewType, setViewType] = useState<'chart' | 'table' | 'insights'>('chart');
  const [chartStyle, setChartStyle] = useState<'area' | 'bar' | 'line'>('area');

  // Generate insights based on data
  const insights = useMemo(() => {
    if (!data || data.length === 0) return [];

    const insights = [];
    const values = data.map(d => chartType === 'visits' ? d.visits : d.revenue);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);

    // Trend analysis
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    insights.push({
      title: 'Overall Trend',
      value: `${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`,
      description: `${chartType === 'visits' ? 'Visits' : 'Revenue'} ${trendPercentage > 0 ? 'increased' : 'decreased'} in the second half of the period`,
      trend: trendPercentage > 0 ? 'positive' : 'negative',
    });

    insights.push({
      title: 'Peak Performance',
      value: data[maxIndex]?.month || 'N/A',
      description: `Highest ${chartType} recorded: ${chartType === 'visits' ? max : `₹${max.toLocaleString()}`}`,
      trend: 'positive',
    });

    insights.push({
      title: 'Average Performance',
      value: chartType === 'visits' ? Math.round(average).toString() : `₹${Math.round(average).toLocaleString()}`,
      description: `Average ${chartType} per period`,
      trend: 'neutral',
    });

    if (chartType === 'revenue') {
      const growth = values.length > 1 ? ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;
      insights.push({
        title: 'Growth Rate',
        value: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
        description: 'Total growth from start to end of period',
        trend: growth > 0 ? 'positive' : 'negative',
      });
    }

    return insights;
  }, [data, chartType]);

  // Enhanced data with additional metrics
  const enhancedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, index) => {
      const prevValue = index > 0 ? (chartType === 'visits' ? data[index - 1].visits : data[index - 1].revenue) : 0;
      const currentValue = chartType === 'visits' ? item.visits : item.revenue;
      const change = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;

      return {
        ...item,
        change: change.toFixed(1),
        changeDirection: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        cumulative: data.slice(0, index + 1).reduce((sum, d) => sum + (chartType === 'visits' ? d.visits : d.revenue), 0),
      };
    });
  }, [data, chartType]);

  const renderChart = () => {
    const commonProps = {
      data: enhancedData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const dataKey = chartType === 'visits' ? 'visits' : 'revenue';
    const color = chartType === 'visits' ? 'var(--medical-blue)' : 'var(--health-green)';

    switch (chartStyle) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [
                chartType === 'visits' ? value : `₹${value.toLocaleString()}`,
                chartType === 'visits' ? 'Visits' : 'Revenue'
              ]}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={color}
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [
                chartType === 'visits' ? value : `₹${value.toLocaleString()}`,
                chartType === 'visits' ? 'Visits' : 'Revenue'
              ]}
            />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [
                chartType === 'visits' ? value : `₹${value.toLocaleString()}`,
                chartType === 'visits' ? 'Visits' : 'Revenue'
              ]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
      default:
        return null;
    }
  };

  const exportData = (format: 'csv' | 'json') => {
    const filename = `${chartType}_data_${timeRange}.${format}`;
    
    if (format === 'csv') {
      const headers = ['Month', chartType === 'visits' ? 'Visits' : 'Revenue', 'Change %', 'Cumulative'];
      const csvContent = [
        headers.join(','),
        ...enhancedData.map(row => [
          row.month,
          chartType === 'visits' ? row.visits : row.revenue,
          row.change,
          row.cumulative
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(enhancedData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title} - Detailed Analysis</span>
            <div className="flex items-center space-x-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={viewType} onValueChange={(value) => setViewType(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="table">Data Table</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Chart Type:</span>
                <Select value={chartStyle} onValueChange={(value) => setChartStyle(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  {renderChart()}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Month</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">
                          {chartType === 'visits' ? 'Visits' : 'Revenue'}
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Change %</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{row.month}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {chartType === 'visits' ? row.visits : `₹${(row.revenue || 0).toLocaleString()}`}
                          </td>
                          <td className={cn(
                            "border border-gray-300 px-4 py-2 text-right",
                            row.changeDirection === 'up' && "text-green-600",
                            row.changeDirection === 'down' && "text-red-600"
                          )}>
                            {row.changeDirection === 'up' && '+'}
                            {row.change}%
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {chartType === 'visits' ? row.cumulative : `₹${(row.cumulative || 0).toLocaleString()}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-2xl font-bold mt-1">{insight.value}</p>
                        <p className="text-xs text-muted-foreground mt-2">{insight.description}</p>
                      </div>
                      <Badge 
                        variant={
                          insight.trend === 'positive' 
                            ? 'default' 
                            : insight.trend === 'negative' 
                              ? 'destructive' 
                              : 'secondary'
                        }
                      >
                        {insight.trend === 'positive' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {insight.trend === 'negative' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {insight.trend === 'neutral' && <Activity className="w-3 h-3 mr-1" />}
                        {insight.trend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
