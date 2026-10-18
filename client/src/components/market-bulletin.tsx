import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Boletim semanal de mercado (um por rodada) e adequação ao mercado da semana
// (server/services/marketBulletin.ts). Só leitura.

type Demanda = "retracao" | "estavel" | "aquecida";
type Sensibilidade = "alta" | "normal" | "baixa";

interface Bulletin {
  id: string;
  roundId: string;
  roundNumber: number | null;
  demand: Demanda;
  priceSensitivity: Sensibilidade;
  headline: string;
  summary: string;
  indicators: {
    confiancaConsumidor?: number;
    variacaoPrecosSetor?: number;
    intensidadeConcorrencia?: "baixa" | "media" | "alta";
    tendencias?: string[];
  } | null;
}

const DEMANDA: Record<Demanda, { label: string; cls: string; icon: typeof TrendingUp }> = {
  retracao: { label: "Demanda em retração", cls: "bg-[#fde8e6] text-[#a3241c]", icon: TrendingDown },
  estavel: { label: "Demanda estável", cls: "bg-[#eef2ff] text-[#1447e6]", icon: Minus },
  aquecida: { label: "Demanda aquecida", cls: "bg-[#e6f7ee] text-[#0f7a44]", icon: TrendingUp },
};

const SENSIB: Record<Sensibilidade, { label: string; cls: string }> = {
  alta: { label: "Consumidor muito sensível a preço", cls: "bg-[#ffe8d1] text-[#8a4b00]" },
  normal: { label: "Sensibilidade a preço normal", cls: "bg-[#eef2ff] text-[#1447e6]" },
  baixa: { label: "Consumidor pouco sensível a preço", cls: "bg-[#e6f7ee] text-[#0f7a44]" },
};

const CONCORRENCIA: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };

export function MonthlyBulletinCard({ classId, activeRoundId }: { classId: string; activeRoundId?: string | null }) {
  const { data: bulletins = [] } = useQuery<Bulletin[]>({
    queryKey: ["/api/market-bulletins/class", classId],
    enabled: !!classId,
  });

  if (bulletins.length === 0) return null;
  const atual = bulletins.find((b) => b.roundId === activeRoundId) ?? bulletins[bulletins.length - 1];
  const d = DEMANDA[atual.demand] ?? DEMANDA.estavel;
  const s = SENSIB[atual.priceSensitivity] ?? SENSIB.normal;
  const DIcon = d.icon;
  const ind = atual.indicators ?? {};
  const anteriores = bulletins.filter((b) => b.id !== atual.id).slice(-6).reverse();

  return (
    <Card data-testid="card-monthly-bulletin">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#1447e6] flex items-center justify-center">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Boletim da semana{atual.roundNumber ? ` — Rodada ${atual.roundNumber}` : ""}</CardTitle>
            <CardDescription>Como o mercado está se comportando nesta rodada. Estas condições pesam no resultado.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap gap-2">
          <Badge className={cn("gap-1 border-transparent", d.cls)}><DIcon className="h-3.5 w-3.5" />{d.label}</Badge>
          <Badge className={cn("border-transparent", s.cls)}>{s.label}</Badge>
        </div>
        <div>
          <h3 className="font-semibold">{atual.headline}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{atual.summary}</p>
        </div>
        {/* Out/2026 (Grupo D): "confiança do consumidor" e "preços do setor"
            eram números criados pelo texto do boletim, sem fonte, e não são
            mais exibidos. A confiança do consumidor real (Fecomercio-SP) está
            na Conjuntura Brasil. */}
        {ind.intensidadeConcorrencia && (
          <div className="grid gap-3 sm:grid-cols-3">
            {ind.intensidadeConcorrencia && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Intensidade da concorrência</p>
                <p className="text-xl font-semibold">{CONCORRENCIA[ind.intensidadeConcorrencia]}</p>
              </div>
            )}
          </div>
        )}
        {ind.tendencias && ind.tendencias.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-0.5">
            {ind.tendencias.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
        {anteriores.length > 0 && (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rodadas anteriores</p>
            <ul className="space-y-1 text-sm">
              {anteriores.map((b) => (
                <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-muted-foreground">Rodada {b.roundNumber ?? "—"}</span>
                  <span>{DEMANDA[b.demand]?.label ?? "—"} · {(SENSIB[b.priceSensitivity]?.label ?? "—").toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FitProduct {
  productId: string | null;
  productName: string;
  percent: number;
  reasons: string[];
}

export function MarketFitCard({ teamId, roundId }: { teamId: string; roundId: string }) {
  const { data } = useQuery<{ bulletin: Bulletin | null; products: FitProduct[]; motorCompetitivo?: boolean }>({
    queryKey: [`/api/market-fit/${teamId}/${roundId}`],
    enabled: !!teamId && !!roundId,
  });

  if (!data?.bulletin) return null;
  const d = DEMANDA[data.bulletin.demand];
  const s = SENSIB[data.bulletin.priceSensitivity];

  // Out/2026, motor competitivo: o boletim muda o mercado de todas as
  // empresas; não há ajuste individual de receita para mostrar.
  if (data.motorCompetitivo) {
    return (
      <Card data-testid="card-market-fit">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Mercado da semana</CardTitle>
              <CardDescription>{d.label} · {s.label.toLowerCase()}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 text-sm text-muted-foreground">
          As condições do boletim valeram para todas as empresas do mercado, equipes e concorrentes: entraram no cálculo da demanda total da categoria e da reação dos compradores ao preço. Não há ajuste individual de receita.
        </CardContent>
      </Card>
    );
  }
  if (!data.products?.length) return null;

  return (
    <Card data-testid="card-market-fit">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Adequação ao mercado da semana</CardTitle>
            <CardDescription>{d.label} · {s.label.toLowerCase()}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {data.products.map((p) => (
          <div key={p.productId ?? p.productName} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{p.productName}</span>
              <span
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  p.percent > 0 ? "text-[#0f7a44]" : p.percent < 0 ? "text-[#b42318]" : "text-muted-foreground",
                )}
              >
                {p.percent > 0 ? "+" : ""}{p.percent}% na receita
              </span>
            </div>
            {(p.reasons ?? []).length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-0.5">
                {p.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">As decisões não entraram em conflito com as condições da semana.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
