import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Info, Zap } from "lucide-react";

interface MarketEventCardProps {
  type: string;
  title: string;
  description: string;
  impact: string;
  severity: "baixo" | "medio" | "alto" | "critico";
}

const severityConfig = {
  baixo: {
    variant: "secondary" as const,
    icon: Info,
    color: "text-blue-500",
  },
  medio: {
    variant: "default" as const,
    icon: TrendingUp,
    color: "text-yellow-500",
  },
  alto: {
    variant: "default" as const,
    icon: AlertTriangle,
    color: "text-orange-500",
  },
  critico: {
    variant: "destructive" as const,
    icon: Zap,
    color: "text-destructive",
  },
};

const typeLabels: Record<string, string> = {
  economia: "Economia",
  tecnologia: "Tecnologia",
  social: "Social",
  competicao: "Competição",
  regulatorio: "Regulatório",
  tendencia: "Tendência",
};

export function MarketEventCard({
  type,
  title,
  description,
  impact,
  severity,
}: MarketEventCardProps) {
  const config = severityConfig[severity] || severityConfig.medio;
  const Icon = config.icon;

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-sm text-muted-foreground">{typeLabels[type] || type}</p>
          </div>
        </div>
        <Badge variant={config.variant}>{severity}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{description}</p>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Impacto:</strong> {impact}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
