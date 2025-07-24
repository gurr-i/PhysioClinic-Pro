import { subDays, subMonths, subYears, format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface TimeRangeConfig {
  label: string;
  value: TimeRange;
  startDate: Date;
  endDate: Date;
}

export class TimeRangeManager {
  static getTimeRangeConfig(range: TimeRange, customStart?: Date, customEnd?: Date): TimeRangeConfig {
    const now = new Date();
    const endDate = endOfDay(now);

    switch (range) {
      case '7d':
        return {
          label: 'Last 7 days',
          value: '7d',
          startDate: startOfDay(subDays(now, 7)),
          endDate,
        };
      case '30d':
        return {
          label: 'Last 30 days',
          value: '30d',
          startDate: startOfDay(subDays(now, 30)),
          endDate,
        };
      case '90d':
        return {
          label: 'Last 90 days',
          value: '90d',
          startDate: startOfDay(subDays(now, 90)),
          endDate,
        };
      case '1y':
        return {
          label: 'Last year',
          value: '1y',
          startDate: startOfDay(subYears(now, 1)),
          endDate,
        };
      case 'custom':
        return {
          label: 'Custom range',
          value: 'custom',
          startDate: customStart || startOfDay(subDays(now, 30)),
          endDate: customEnd || endDate,
        };
      default:
        return this.getTimeRangeConfig('30d');
    }
  }

  static filterDataByTimeRange<T extends { createdAt?: string; visitDate?: string; date?: string }>(
    data: T[],
    timeRange: TimeRange,
    customStart?: Date,
    customEnd?: Date
  ): T[] {
    const config = this.getTimeRangeConfig(timeRange, customStart, customEnd);
    
    return data.filter(item => {
      // Try different date fields
      const dateStr = item.createdAt || item.visitDate || item.date;
      if (!dateStr) return false;

      const itemDate = new Date(dateStr);
      return isWithinInterval(itemDate, {
        start: config.startDate,
        end: config.endDate,
      });
    });
  }

  static generateChartDataForTimeRange(
    data: any[],
    timeRange: TimeRange,
    valueKey: string,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): any[] {
    const config = this.getTimeRangeConfig(timeRange);
    const filteredData = this.filterDataByTimeRange(data, timeRange);

    // Group data by time period
    const groupedData = new Map<string, number>();

    // Initialize all periods with 0
    const periods = this.generateTimePeriods(config.startDate, config.endDate, groupBy);
    periods.forEach(period => {
      groupedData.set(period, 0);
    });

    // Aggregate actual data
    filteredData.forEach(item => {
      const dateStr = item.createdAt || item.visitDate || item.date;
      if (!dateStr) return;

      const itemDate = new Date(dateStr);
      const periodKey = this.formatDateToPeriod(itemDate, groupBy);
      
      if (groupedData.has(periodKey)) {
        const currentValue = groupedData.get(periodKey) || 0;
        const itemValue = typeof item[valueKey] === 'string' 
          ? parseFloat(item[valueKey]) || 0 
          : item[valueKey] || 0;
        groupedData.set(periodKey, currentValue + itemValue);
      }
    });

    // Convert to chart format
    return Array.from(groupedData.entries()).map(([period, value]) => ({
      [groupBy]: period,
      [valueKey]: value,
    }));
  }

  private static generateTimePeriods(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month'): string[] {
    const periods: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      periods.push(this.formatDateToPeriod(current, groupBy));
      
      switch (groupBy) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return periods;
  }

  private static formatDateToPeriod(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    switch (groupBy) {
      case 'day':
        return format(date, 'MMM dd');
      case 'week':
        return format(date, 'MMM dd');
      case 'month':
        return format(date, 'MMM');
      default:
        return format(date, 'MMM');
    }
  }

  static generateVisitsChartData(visits: any[], timeRange: TimeRange): any[] {
    // If no visits data, return mock data for demonstration
    if (!visits || visits.length === 0) {
      return this.getMockVisitsData(timeRange);
    }

    // For visits, we need to count the number of visits per time period
    // Each visit record represents one visit, so we use a count of 1 per record
    const visitsWithCount = visits.map(visit => ({
      ...visit,
      visitCount: 1, // Each record represents one visit
      createdAt: visit.visitDate || visit.createdAt, // Use visitDate as the primary date field
    }));

    const chartData = this.generateChartDataForTimeRange(visitsWithCount, timeRange, 'visitCount', 'month');

    // Convert the data to the format expected by the charts (visits instead of visitCount)
    return chartData.map(item => ({
      month: item.month,
      visits: item.visitCount,
    }));
  }

  static generateRevenueChartData(payments: any[], timeRange: TimeRange): any[] {
    // If no payments data, return mock data for demonstration
    if (!payments || payments.length === 0) {
      return this.getMockRevenueData(timeRange);
    }

    // For payments, we need to sum the amounts per time period
    // Convert amount strings to numbers and ensure proper date field
    const paymentsWithAmount = payments.map(payment => ({
      ...payment,
      amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) || 0 : payment.amount || 0,
      createdAt: payment.createdAt || payment.date, // Use createdAt as the primary date field
    }));

    const chartData = this.generateChartDataForTimeRange(paymentsWithAmount, timeRange, 'amount', 'month');

    // Convert the data to the format expected by the charts (revenue instead of amount)
    return chartData.map(item => ({
      month: item.month,
      revenue: item.amount,
    }));
  }

  private static getMockVisitsData(timeRange: TimeRange): any[] {
    const config = this.getTimeRangeConfig(timeRange);
    const monthsBack = Math.ceil((config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    const data = [];
    const now = new Date();
    
    for (let i = monthsBack; i >= 0; i--) {
      const date = subMonths(now, i);
      const month = format(date, 'MMM');
      const visits = Math.floor(Math.random() * 20) + 10; // Random visits between 10-30
      
      data.push({ month, visits });
    }
    
    return data;
  }

  private static getMockRevenueData(timeRange: TimeRange): any[] {
    const config = this.getTimeRangeConfig(timeRange);
    const monthsBack = Math.ceil((config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    const data = [];
    const now = new Date();
    
    for (let i = monthsBack; i >= 0; i--) {
      const date = subMonths(now, i);
      const month = format(date, 'MMM');
      const revenue = Math.floor(Math.random() * 2000) + 1000; // Random revenue between 1000-3000
      
      data.push({ month, revenue });
    }
    
    return data;
  }

  static getTimeRangeOptions(): { label: string; value: TimeRange }[] {
    return [
      { label: 'Last 7 days', value: '7d' },
      { label: 'Last 30 days', value: '30d' },
      { label: 'Last 90 days', value: '90d' },
      { label: 'Last year', value: '1y' },
    ];
  }

  static calculateGrowthRate(data: any[], valueKey: string): number {
    if (data.length < 2) return 0;

    const firstValue = data[0][valueKey] || 0;
    const lastValue = data[data.length - 1][valueKey] || 0;

    if (firstValue === 0) return lastValue > 0 ? 100 : 0;
    
    return ((lastValue - firstValue) / firstValue) * 100;
  }

  static calculateTotalValue(data: any[], valueKey: string): number {
    return data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  }

  static calculateAverageValue(data: any[], valueKey: string): number {
    if (data.length === 0) return 0;
    return this.calculateTotalValue(data, valueKey) / data.length;
  }

  static findPeakPeriod(data: any[], valueKey: string): { period: string; value: number } | null {
    if (data.length === 0) return null;

    let maxValue = -Infinity;
    let maxPeriod = '';

    data.forEach(item => {
      const value = item[valueKey] || 0;
      if (value > maxValue) {
        maxValue = value;
        maxPeriod = item.month || item.day || item.week || 'Unknown';
      }
    });

    return { period: maxPeriod, value: maxValue };
  }
}
