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
    icon: Info,
    chipBg: "#1aa15c",
    chipIconColor: "text-white",
    badgeClass: "bg-[#e6f7ee] text-[#0f7a44] border-transparent",
    label: "Baixo",
  },
  medio: {
    icon: TrendingUp,
    chipBg: "#ffcc00",
    chipIconColor: "text-[#0a1830]",
    badgeClass: "bg-[#fff3d6] text-[#7a5300] border-transparent",
    label: "Médio",
  },
  alto: {
    icon: AlertTriangle,
    chipBg: "#ff8c1a",
    chipIconColor: "text-white",
    badgeClass: "bg-[#ffe8d1] text-[#8a4b00] border-transparent",
    label: "Alto",
  },
  critico: {
    icon: Zap,
    chipBg: "#e5352b",
    chipIconColor: "text-white",
    badgeClass: "bg-[#fde8e6] text-[#a3241c] border-transparent",
    label: "Crítico",
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
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3 bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: config.chipBg }}>
            <Icon className={`h-5 w-5 ${config.chipIconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-sm text-muted-foreground">{typeLabels[type] || type}</p>
          </div>
        </div>
        <Badge className={config.badgeClass}>{config.label}</Badge>
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
