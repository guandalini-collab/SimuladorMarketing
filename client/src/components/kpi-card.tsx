import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  description?: string;
  testId?: string;
}

export function KPICard({ title, value, trend, icon: Icon, description, testId }: KPICardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-bold" data-testid={testId}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-chart-3" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? "text-chart-3" : "text-destructive"
                }`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            </div>
          )}
          {description && !trend && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
