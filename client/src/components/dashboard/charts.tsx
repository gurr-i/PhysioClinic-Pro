import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface MonthlyVisitsChartProps {
  data: { month: string; visits: number }[];
}

export function MonthlyVisitsChart({ data }: MonthlyVisitsChartProps) {
  return (
    <Card className="glass-effect border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
          Monthly Visit Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="visits"
                stroke="var(--medical-blue)"
                strokeWidth={3}
                fill="url(#colorVisits)"
                fillOpacity={0.1}
              />
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--medical-blue)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--medical-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface RevenueChartProps {
  data: { month: string; revenue: number; outstanding: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="glass-effect border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
          Revenue vs Outstanding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                fill="var(--health-green)"
                name="Revenue"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="outstanding"
                fill="var(--warning-amber)"
                name="Outstanding"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
