import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Info, Zap, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface MarketEventCardProps {
  type: string;
  title: string;
  description: string;
  impact: string;
  severity: "baixo" | "medio" | "alto" | "critico";
  // Pedido do professor (2026-09): mostra ao aluno se o evento favorece,
  // prejudica ou é neutro para o resultado calculado da equipe — antes essa
  // informação não existia (o sinal do impacto era um detalhe interno do
  // cálculo). Campo opcional para não quebrar quem ainda não repassa
  // sentiment (ex.: componente de exemplo).
  sentiment?: "positivo" | "negativo" | "neutro";
}

const sentimentConfig = {
  positivo: {
    icon: ArrowUpRight,
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-transparent",
    label: "Favorável",
  },
  negativo: {
    icon: ArrowDownRight,
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-transparent",
    label: "Desfavorável",
  },
  neutro: {
    icon: Minus,
    badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-transparent",
    label: "Neutro",
  },
};

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

// Existem três fontes históricas de valores para "type", que nunca foram
// unificadas: o gerador de eventos por IA salva em português sem acento
// ("economico", "tecnologico", "competitivo"...), o formulário manual salvava
// em inglês ("economic", "technological"...) até ser corrigido, e este
// dicionário original só reconhecia uma terceira grafia ("economia",
// "tecnologia"...). Isso fazia a maioria dos eventos aparecerem para o aluno
// com o slug interno em vez de um rótulo traduzido. Mantém todas as grafias
// como sinônimos (inclusive as antigas, para eventos já salvos no banco).
const typeLabels: Record<string, string> = {
  economia: "Econômico",
  economico: "Econômico",
  economic: "Econômico",
  tecnologia: "Tecnológico",
  tecnologico: "Tecnológico",
  technological: "Tecnológico",
  social: "Social",
  competicao: "Competição",
  competitivo: "Competição",
  competitive: "Competição",
  regulatorio: "Regulatório",
  regulatory: "Regulatório",
  ambiental: "Ambiental",
  environmental: "Ambiental",
  tendencia: "Tendência",
};

export function MarketEventCard({
  type,
  title,
  description,
  impact,
  severity,
  sentiment,
}: MarketEventCardProps) {
  const config = severityConfig[severity] || severityConfig.medio;
  const Icon = config.icon;
  const sentimentCfg = sentiment ? sentimentConfig[sentiment] : undefined;
  const SentimentIcon = sentimentCfg?.icon;

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
        <div className="flex flex-col items-end gap-1.5">
          <Badge className={config.badgeClass}>{config.label}</Badge>
          {sentimentCfg && SentimentIcon && (
            <Badge className={`${sentimentCfg.badgeClass} flex items-center gap-1`}>
              <SentimentIcon className="h-3 w-3" />
              {sentimentCfg.label}
            </Badge>
          )}
        </div>
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
