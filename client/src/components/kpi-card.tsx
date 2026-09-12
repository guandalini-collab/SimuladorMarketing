import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

const COLOR_MAP = {
  indigo: { bg: "#2f2a8f", shadow: "rgba(47,42,143,0.25)" },
  blue: { bg: "#1447e6", shadow: "rgba(20,71,230,0.25)" },
  gold: { bg: "#ffcc00", shadow: "rgba(255,204,0,0.25)" },
  green: { bg: "#1aa15c", shadow: "rgba(26,161,92,0.25)" },
  orange: { bg: "#ff8c1a", shadow: "rgba(255,140,26,0.25)" },
  violet: { bg: "#7c3aed", shadow: "rgba(124,58,237,0.25)" },
} as const;

export type KPICardColor = keyof typeof COLOR_MAP;

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
  color?: KPICardColor;
}

export function KPICard({ title, value, trend, icon: Icon, description, testId, color = "indigo" }: KPICardProps) {
  const { bg, shadow } = COLOR_MAP[color];
  // O dourado é claro demais para texto branco continuar legível; usa texto navy nesse caso.
  const textColor = color === "gold" ? "#3a2c00" : "#ffffff";
  const mutedTextColor = color === "gold" ? "rgba(58,44,0,0.7)" : "rgba(255,255,255,0.75)";

  return (
    <Card
      className="p-6 border-0 hover-elevate"
      style={{ backgroundColor: bg, color: textColor, boxShadow: `0 4px 14px ${shadow}` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium mb-2" style={{ color: mutedTextColor }}>{title}</p>
          <p className="text-3xl font-bold" data-testid={testId} style={{ color: textColor }}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" style={{ color: textColor }} />
              ) : (
                <TrendingDown className="h-4 w-4" style={{ color: textColor }} />
              )}
              <span className="text-sm font-medium" style={{ color: textColor }}>
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            </div>
          )}
          {description && !trend && (
            <p className="text-xs mt-2" style={{ color: mutedTextColor }}>{description}</p>
          )}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
          <Icon className="h-6 w-6" style={{ color: textColor }} />
        </div>
      </div>
    </Card>
  );
}
