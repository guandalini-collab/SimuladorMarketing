import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper,
  TrendingUp,
  AlertTriangle,
  Info,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import type { MarketEvent } from "@shared/schema";

// Página somente leitura para a equipe: compila os eventos de mercado ATIVOS
// da rodada corrente em uma única "edição" no formato jornalístico Simula+
// News (ver server/services/aiEventGenerator.ts). Não toca em nenhuma rota,
// componente ou lógica de cálculo existente — consome os mesmos endpoints já
// usados em mercado.tsx (/api/rounds/active/current) e no card de eventos
// (/api/market-events/:roundId), e não altera o formato salvo no banco: só
// decompõe visualmente o texto que a IA já gera com os rótulos "[Lead]:",
// "[Coluna Macroeconômica]:" e "[Análise de Tendência]:" em seções de jornal.

interface ActiveRoundResponse {
  round: { id: string; roundNumber: number; classId: string } | null;
  decisionsAllowed: boolean;
  reason: string;
  message: string;
}

// Mesmo mapeamento usado em market-event-card.tsx (duplicado aqui de
// propósito, em vez de importado, para não criar nenhuma dependência nova
// sobre esse componente e manter esta página 100% aditiva).
const pestelLabels: Record<string, string> = {
  economia: "Economia",
  economico: "Economia",
  economic: "Economia",
  tecnologia: "Tecnologia",
  tecnologico: "Tecnologia",
  technological: "Tecnologia",
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

const severityConfig: Record<string, { icon: typeof Info; label: string; badgeClass: string }> = {
  baixo: {
    icon: Info,
    label: "Nota breve",
    badgeClass: "bg-[#e6f7ee] text-[#0f7a44] border-transparent",
  },
  medio: {
    icon: TrendingUp,
    label: "Destaque",
    badgeClass: "bg-[#fff3d6] text-[#7a5300] border-transparent",
  },
  alto: {
    icon: AlertTriangle,
    label: "Manchete",
    badgeClass: "bg-[#ffe8d1] text-[#8a4b00] border-transparent",
  },
  critico: {
    icon: Zap,
    label: "Urgente",
    badgeClass: "bg-[#fde8e6] text-[#a3241c] border-transparent",
  },
};

const sentimentConfig: Record<string, { icon: typeof Minus; label: string; badgeClass: string }> = {
  positivo: {
    icon: ArrowUpRight,
    label: "Favorável",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-transparent",
  },
  negativo: {
    icon: ArrowDownRight,
    label: "Desfavorável",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-transparent",
  },
  neutro: {
    icon: Minus,
    label: "Neutro",
    badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-transparent",
  },
};

// Eventos foram gerados em formatos diferentes ao longo do tempo (texto
// simples antes de setembro/2026, "Simula+ News — ..." numa primeira versão,
// e os rótulos entre colchetes "[Lead]:" / "[Coluna Macroeconômica]:" /
// "[Análise de Tendência]:" na versão atual). Este parser tenta reconhecer
// todas as variantes e, se não encontrar nenhuma, simplesmente mostra o
// texto original inteiro como "Lead" — nenhum evento fica sem conteúdo.
function parseEdition(description: string, impact: string) {
  let body = (description || "").trim();
  body = body.replace(/^Jornal:\s*Simula\+\s*News\s*/i, "").trim();
  body = body.replace(/^Simula\+\s*News\s*(—|-)\s*/i, "").trim();

  // Encontra a Coluna Macroeconômica primeiro (com ou sem colchetes, como nas
  // duas versões já publicadas do prompt) e usa a posição dela para recortar
  // tudo que vem ANTES como lead — em vez de duas buscas independentes, que
  // duplicavam o texto quando o evento era de uma versão mais antiga do
  // prompt (sem o rótulo "[Lead]:" explícito, só "Coluna Macroeconômica:").
  const macroMatch = body.match(/\[?Coluna Macroeconômica\]?\s*:\s*([\s\S]*)$/i);
  const macro = macroMatch?.[1]?.trim() || null;

  const leadSegment = macroMatch ? body.slice(0, macroMatch.index).trim() : body;
  const lead = leadSegment.replace(/^\[?Lead\]?\s*:\s*/i, "").trim() || null;

  const trendMatch = (impact || "").match(/\[?Análise de Tendência\]?\s*:\s*([\s\S]*)$/i);
  const trend = trendMatch?.[1]?.trim() || (impact || "").trim();

  return {
    lead: lead || body,
    macro,
    trend,
  };
}

function EditionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function News() {
  const { data: activeRound, isLoading: loadingRound } = useQuery<ActiveRoundResponse>({
    queryKey: ["/api/rounds/active/current"],
  });

  const roundId = activeRound?.round?.id;

  const { data: events = [], isLoading: loadingEvents } = useQuery<MarketEvent[]>({
    queryKey: ["/api/market-events", roundId],
    enabled: !!roundId,
    select: (data) => data.filter((event) => event.active),
  });

  const isLoading = loadingRound || (!!roundId && loadingEvents);
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-accent font-bold flex items-center gap-2">
          <Newspaper className="h-7 w-7" />
          Simula+ News
        </h1>
        <p className="text-muted-foreground">
          O jornal de economia e negócios do simulador — cobertura completa da rodada em uma edição única
        </p>
      </div>

      {isLoading && <EditionSkeleton />}

      {!isLoading && !activeRound?.round && (
        <Alert>
          <AlertDescription>
            {activeRound?.message || "Nenhuma rodada ativa no momento."}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && activeRound?.round && events.length === 0 && (
        <Alert>
          <AlertDescription>
            Ainda não há edição publicada para a Rodada {activeRound.round.roundNumber}. Volte quando o
            professor liberar os eventos de mercado desta rodada.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && activeRound?.round && events.length > 0 && (
        <Card className="overflow-hidden border-2">
          {/* Capa / masthead do jornal */}
          <div className="border-b-4 border-double border-foreground/70 bg-muted/30 px-6 py-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Edição da Rodada {activeRound.round.roundNumber} · {today}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-black tracking-tight mt-1">
              Simula+ News
            </h2>
            <p className="font-serif italic text-sm text-muted-foreground mt-1">
              Economia, mercado e negócios para quem decide
            </p>
          </div>

          <CardContent className="p-6">
            <div className="grid gap-8 lg:grid-cols-2">
              {events.map((event, index) => {
                const { lead, macro, trend } = parseEdition(event.description, event.impact);
                const sev = severityConfig[event.severity] || severityConfig.medio;
                const SevIcon = sev.icon;
                const sent = event.sentiment ? sentimentConfig[event.sentiment] : undefined;
                const SentIcon = sent?.icon;

                return (
                  <article
                    key={event.id || index}
                    className="space-y-3 pb-8 border-b lg:border-b-0 lg:border-r lg:pr-8 last:border-0 lg:last:pr-0 lg:even:border-r-0 lg:even:pl-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-serif">
                        {pestelLabels[event.type] || event.type}
                      </Badge>
                      <Badge className={`${sev.badgeClass} flex items-center gap-1`}>
                        <SevIcon className="h-3 w-3" />
                        {sev.label}
                      </Badge>
                      {sent && SentIcon && (
                        <Badge className={`${sent.badgeClass} flex items-center gap-1`}>
                          <SentIcon className="h-3 w-3" />
                          {sent.label}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-serif text-2xl font-bold leading-tight">
                      {event.title}
                    </h3>

                    {lead && (
                      <p className="font-serif text-base leading-relaxed first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:float-left">
                        {lead}
                      </p>
                    )}

                    {macro && (
                      <div className="bg-muted/40 border-l-2 border-foreground/30 pl-4 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Coluna Macroeconômica
                        </p>
                        <p className="text-sm leading-relaxed">{macro}</p>
                      </div>
                    )}

                    {trend && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Análise de Tendência
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{trend}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
