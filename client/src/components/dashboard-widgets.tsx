import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Painel de leitura rápida do Dashboard (redesign de UX, etapa 4).
//
// Apenas apresentação: tudo aqui é calculado a partir de dados que a API já
// devolve (resultados por rodada em /api/results/team/:id e o orçamento da
// equipe). Nada é gravado e nenhuma regra do jogo depende destes números —
// eles só resumem o que os relatórios completos já mostram.

export interface RoundPoint {
  roundNumber: number;
  revenue: number;
  profit: number;
  margin: number;
  marketShare: number;
  roi: number;
}

export type HealthLevel = "bom" | "atencao" | "risco";

export interface HealthFactor {
  label: string;
  level: HealthLevel;
  detail: string;
}

export interface HealthSummary {
  level: HealthLevel | "sem-dados";
  score: number; // 0..1, posição do ponteiro
  factors: HealthFactor[];
  alert: string | null;
}

const LEVEL_SCORE: Record<HealthLevel, number> = { bom: 1, atencao: 0.5, risco: 0 };

const moeda = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);

// Regras do indicador de saúde financeira. São deliberadamente simples e
// exibidas na tela ("Como é calculado"), para o aluno entender a cor.
export function computeHealth(points: RoundPoint[], budget: number, initialBudget: number): HealthSummary {
  if (points.length === 0) {
    return { level: "sem-dados", score: 0.5, factors: [], alert: null };
  }
  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const factors: HealthFactor[] = [];

  const ratio = initialBudget > 0 ? budget / initialBudget : 1;
  const pct = Math.round(ratio * 100);
  factors.push({
    label: "Caixa",
    level: ratio >= 1 ? "bom" : ratio >= 0.5 ? "atencao" : "risco",
    detail: `${moeda(budget)} disponíveis, ${pct}% do orçamento inicial`,
  });

  factors.push({
    label: "Resultado da última rodada",
    level: last.profit > 0 ? "bom" : last.profit < 0 ? "risco" : "atencao",
    detail: last.profit >= 0 ? `Lucro de ${moeda(last.profit)}` : `Prejuízo de ${moeda(Math.abs(last.profit))}`,
  });

  if (prev) {
    const up = last.profit >= prev.profit;
    factors.push({
      label: "Tendência do lucro",
      level: up ? "bom" : "atencao",
      detail: up ? "Igual ou melhor que a rodada anterior" : "Pior que a rodada anterior",
    });
  }

  const score = factors.reduce((s, f) => s + LEVEL_SCORE[f.level], 0) / factors.length;
  const level: HealthLevel = score >= 0.75 ? "bom" : score >= 0.4 ? "atencao" : "risco";

  let alert: string | null = null;
  if (ratio < 0.25) {
    alert = `O caixa está em ${pct}% do orçamento inicial. Revise custos e investimentos antes de enviar a próxima decisão.`;
  } else if (prev && last.profit < 0 && prev.profit < 0) {
    alert = "Duas rodadas seguidas com prejuízo. Vale rever preço, custos e mix antes da próxima decisão.";
  }

  return { level, score, factors, alert };
}

const LEVEL_META: Record<HealthLevel | "sem-dados", { label: string; text: string; icon: LucideIcon }> = {
  bom: { label: "Saudável", text: "text-[#0f7a44] dark:text-green-400", icon: CheckCircle2 },
  atencao: { label: "Atenção", text: "text-[#8a5a00] dark:text-amber-400", icon: AlertTriangle },
  risco: { label: "Em risco", text: "text-[#b42318] dark:text-red-400", icon: XCircle },
  "sem-dados": { label: "Aguardando resultados", text: "text-muted-foreground", icon: Clock },
};

// Velocímetro em SVG: três faixas (risco, atenção, saudável) e um ponteiro.
function Gauge({ score, muted }: { score: number; muted: boolean }) {
  const cx = 100, cy = 100, r = 80, w = 16;
  const arc = (from: number, to: number) => {
    // 0 = esquerda, 1 = direita (semicírculo superior)
    const a0 = Math.PI * (1 - from), a1 = Math.PI * (1 - to);
    const x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const gap = 0.012;
  const angle = Math.PI * (1 - Math.min(1, Math.max(0, score)));
  const nx = cx + (r - 22) * Math.cos(angle), ny = cy - (r - 22) * Math.sin(angle);
  return (
    <svg viewBox="0 0 200 112" className="w-full max-w-[260px]" aria-hidden="true">
      <path d={arc(0, 0.4 - gap)} stroke={muted ? "#cbd5e1" : "#e5484d"} strokeWidth={w} fill="none" strokeLinecap="butt" />
      <path d={arc(0.4 + gap, 0.75 - gap)} stroke={muted ? "#cbd5e1" : "#f5b400"} strokeWidth={w} fill="none" strokeLinecap="butt" />
      <path d={arc(0.75 + gap, 1)} stroke={muted ? "#cbd5e1" : "#1aa15c"} strokeWidth={w} fill="none" strokeLinecap="butt" />
      {!muted && (
        <>
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="currentColor" strokeWidth={4} strokeLinecap="round" className="text-[#0a1830] dark:text-white" />
          <circle cx={cx} cy={cy} r={7} className="fill-[#0a1830] dark:fill-white" />
        </>
      )}
    </svg>
  );
}

export function HealthCard({ health }: { health: HealthSummary }) {
  const meta = LEVEL_META[health.level];
  const Icon = meta.icon;
  return (
    <div className="flex h-full flex-col" data-testid="card-financial-health">
      <p className="text-sm font-medium text-muted-foreground">Saúde financeira</p>
      <div className="mt-2 flex flex-col items-center">
        <Gauge score={health.score} muted={health.level === "sem-dados"} />
        <p className={cn("-mt-1 flex items-center gap-1.5 text-xl font-bold", meta.text)} data-testid="text-health-level">
          <Icon className="h-5 w-5" /> {meta.label}
        </p>
      </div>
      {health.level === "sem-dados" ? (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          O indicador aparece depois que a primeira rodada da sua equipe for concluída.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {health.factors.map((f) => {
            const fm = LEVEL_META[f.level];
            const FIcon = fm.icon;
            return (
              <li key={f.label} className="flex items-start gap-2 text-sm">
                <FIcon className={cn("mt-0.5 h-4 w-4 shrink-0", fm.text)} aria-label={fm.label} />
                <span>
                  <span className="font-medium">{f.label}:</span>{" "}
                  <span className="text-muted-foreground">{f.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {health.level !== "sem-dados" && (
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none font-medium">Como é calculado</summary>
          <p className="mt-1.5 leading-relaxed">
            Caixa: verde com 100% ou mais do orçamento inicial, amarelo entre 50% e 100%, vermelho abaixo de 50%.
            Resultado: verde com lucro, vermelho com prejuízo. Tendência: verde se o lucro igualou ou superou a
            rodada anterior. O ponteiro é a média dos três. É só um resumo visual: não altera nota nem resultado.
          </p>
        </details>
      )}
    </div>
  );
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const w = 120, h = 36, pad = 4;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-28" role="img" aria-label={`Evolução de ${label} nas rodadas`}>
      <polyline
        points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-[#1447e6] dark:text-blue-400"
      />
      <circle cx={lx} cy={ly} r={3.5} className="fill-[#1447e6] dark:fill-blue-400" />
    </svg>
  );
}

interface TrendKPIProps {
  title: string;
  value: string;
  icon: LucideIcon;
  delta?: { value: number; text: string } | null; // value > 0 = melhora
  note?: string;
  series?: number[];
  testId?: string;
}

// Indicador com variação em relação à rodada anterior e minigráfico.
export function TrendKPI({ title, value, icon: Icon, delta, note, series = [], testId }: TrendKPIProps) {
  const dir = !delta ? 0 : delta.value > 0 ? 1 : delta.value < 0 ? -1 : 0;
  const DIcon = dir > 0 ? ArrowUpRight : dir < 0 ? ArrowDownRight : Minus;
  return (
    <div className="flex h-full flex-col justify-between gap-3 rounded-xl border-2 border-slate-200 bg-card p-5 dark:border-slate-800">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1447e6]/10 text-[#1447e6] dark:bg-blue-500/15 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-3xl font-bold tabular-nums" data-testid={testId}>{value}</p>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0 text-sm">
          {delta ? (
            <p
              className={cn(
                "flex items-center gap-1 font-medium",
                dir > 0 ? "text-[#0f7a44] dark:text-green-400" : dir < 0 ? "text-[#b42318] dark:text-red-400" : "text-muted-foreground",
              )}
            >
              <DIcon className="h-4 w-4 shrink-0" /> {delta.text}
            </p>
          ) : null}
          {note && <p className="text-muted-foreground">{note}</p>}
        </div>
        <Sparkline values={series} label={title} />
      </div>
    </div>
  );
}
