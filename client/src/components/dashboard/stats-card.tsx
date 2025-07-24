import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  gradient 
}: StatsCardProps) {
  const changeColor = {
    positive: "text-[var(--health-green)]",
    negative: "text-destructive",
    neutral: "text-[var(--accent-purple)]"
  }[changeType];

  return (
    <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-[var(--dark-slate)]">{value}</p>
            {change && (
              <p className={`text-sm ${changeColor}`}>{change}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center`}>
            <Icon className="text-white w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
