import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Peças compartilhadas do fechamento anual (server/services/annualReview.ts):
// usadas na tela da equipe e na tela do professor.

export interface MonthRow {
  roundNumber: number;
  month: number;
  revenue: number | null;
  profit: number | null;
  margin: number | null;
  roi: number | null;
  marketShare: number | null;
  budgetAfter: number | null;
  classAvgRevenue: number | null;
  classAvgProfit: number | null;
  classAvgMargin: number | null;
  classAvgShare: number | null;
}

export interface YearSummary {
  monthsWithResult: number;
  totalRevenue: number;
  totalProfit: number;
  avgMargin: number | null;
  avgRoi: number | null;
  finalShare: number | null;
  budgetStart: number | null;
  budgetEnd: number | null;
  profitableMonths: number;
  lossMonths: number;
}

export interface YearReview {
  year: number;
  firstRound: number;
  lastRound: number;
  closed: boolean;
  isFinal: boolean;
  months: MonthRow[];
  summary: YearSummary;
  classSummary: { avgTotalRevenue: number | null; avgTotalProfit: number | null; avgMargin: number | null; avgFinalShare: number | null };
  previousYear: YearSummary | null;
  questions: { id: string; text: string }[];
  reflection: { answers: Record<string, string>; submittedAt: string | null; updatedAt: string | null } | null;
}

export const moeda = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const pct = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function Comparacao({ valor, referencia, label, formato }: { valor: number | null; referencia: number | null; label: string; formato: "moeda" | "pp" }) {
  if (valor === null || referencia === null) return null;
  const d = valor - referencia;
  const txt = formato === "moeda" ? moeda(Math.abs(d)) : `${Math.abs(d).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.`;
  return (
    <p className={cn("text-xs", d > 0 ? "text-[#0f7a44]" : d < 0 ? "text-[#b42318]" : "text-muted-foreground")}>
      {d > 0 ? "▲" : d < 0 ? "▼" : "="} {txt} vs. {label}
    </p>
  );
}

export function YearIndicators({ review }: { review: YearReview }) {
  const s = review.summary;
  const c = review.classSummary;
  const p = review.previousYear;
  const tiles = [
    { label: "Receita acumulada", value: moeda(s.totalRevenue), v: s.totalRevenue, turma: c.avgTotalRevenue, anterior: p?.totalRevenue ?? null, formato: "moeda" as const },
    { label: "Lucro acumulado", value: moeda(s.totalProfit), v: s.totalProfit, turma: c.avgTotalProfit, anterior: p?.totalProfit ?? null, formato: "moeda" as const },
    { label: "Margem média", value: pct(s.avgMargin), v: s.avgMargin, turma: c.avgMargin, anterior: p?.avgMargin ?? null, formato: "pp" as const },
    { label: "Participação no fim do ano", value: pct(s.finalShare), v: s.finalShare, turma: c.avgFinalShare, anterior: p?.finalShare ?? null, formato: "pp" as const },
  ];
  const dados = review.months.map((m) => ({
    mes: `Mês ${m.month}`,
    "Lucro da equipe": m.profit,
    "Lucro médio da turma": m.classAvgProfit !== null ? Math.round(m.classAvgProfit) : null,
    "Participação da equipe": m.marketShare,
    "Participação média da turma": m.classAvgShare !== null ? Math.round(m.classAvgShare * 10) / 10 : null,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{t.value}</p>
              <Comparacao valor={t.v} referencia={t.turma} label="média da turma" formato={t.formato} />
              {p && <Comparacao valor={t.v} referencia={t.anterior} label={`Ano ${review.year - 1}`} formato={t.formato} />}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {s.monthsWithResult} {s.monthsWithResult === 1 ? "mês" : "meses"} com resultado · {s.profitableMonths} com lucro · {s.lossMonths} com prejuízo
        {s.budgetStart !== null && s.budgetEnd !== null && <> · caixa de {moeda(s.budgetStart)} para {moeda(s.budgetEnd)}</>}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lucro mês a mês</CardTitle>
            <CardDescription>Equipe comparada à média da turma</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$ ${Math.round(v / 1000)} mil`} width={70} />
                <Tooltip formatter={(v: any) => moeda(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Lucro da equipe" stroke="#1447e6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Lucro médio da turma" stroke="#9aa3b2" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Participação de mercado</CardTitle>
            <CardDescription>Equipe comparada à média da turma</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} width={44} />
                <Tooltip formatter={(v: any) => pct(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Participação da equipe" stroke="#1447e6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Participação média da turma" stroke="#9aa3b2" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mês a mês</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Mês</th>
                <th className="py-2 pr-3 text-right">Receita</th>
                <th className="py-2 pr-3 text-right">Lucro</th>
                <th className="py-2 pr-3 text-right">Margem</th>
                <th className="py-2 pr-3 text-right">ROI</th>
                <th className="py-2 pr-3 text-right">Participação</th>
                <th className="py-2 text-right">Caixa no fim</th>
              </tr>
            </thead>
            <tbody>
              {review.months.map((m) => (
                <tr key={m.roundNumber} className="border-b last:border-0">
                  <td className="py-2 pr-3">Mês {m.month} <span className="text-xs text-muted-foreground">(rodada {m.roundNumber})</span></td>
                  {m.revenue === null ? (
                    <td colSpan={6} className="py-2 text-right text-muted-foreground">Sem decisão enviada</td>
                  ) : (
                    <>
                      <td className="py-2 pr-3 text-right tabular-nums">{moeda(m.revenue)}</td>
                      <td className={cn("py-2 pr-3 text-right tabular-nums", (m.profit ?? 0) < 0 && "text-[#b42318]")}>{moeda(m.profit)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{pct(m.margin)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{pct(m.roi)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{pct(m.marketShare)}</td>
                      <td className="py-2 text-right tabular-nums">{moeda(m.budgetAfter)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function YearTitle({ review }: { review: YearReview }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-xl font-semibold">Fechamento do Ano {review.year}</h2>
      <span className="text-sm text-muted-foreground">rodadas {review.firstRound} a {review.lastRound}</span>
      {review.isFinal && <Badge className="border-transparent bg-[#1447e6] text-white">Fechamento final do jogo</Badge>}
      {review.reflection?.submittedAt ? (
        <Badge className="border-transparent bg-[#e6f7ee] text-[#0f7a44]">Reflexão enviada</Badge>
      ) : (
        <Badge className="border-transparent bg-[#fff6e0] text-[#8a5a00]">Reflexão pendente</Badge>
      )}
    </div>
  );
}

export function useSelectedYear(reviews: YearReview[] | undefined) {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    if (reviews && reviews.length > 0 && (year === null || !reviews.some((r) => r.year === year))) {
      setYear(reviews[reviews.length - 1].year);
    }
  }, [reviews, year]);
  return [reviews?.find((r) => r.year === year) ?? null, setYear] as const;
}
