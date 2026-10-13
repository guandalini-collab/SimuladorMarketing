import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { YearIndicators, moeda, pct, type YearReview } from "@/components/annual-review";

// Fechamento anual na área do professor: indicadores do ano e respostas
// reflexivas de cada equipe (server/services/annualReview.ts).
interface TeamReviews {
  teamId: string;
  teamName: string;
  companyName: string | null;
  reviews: YearReview[];
}

export default function ProfessorFechamento({ classId }: { classId: string }) {
  const { data = [], isLoading } = useQuery<TeamReviews[]>({ queryKey: [`/api/annual-review/class/${classId}`] });
  const anos = Array.from(new Set(data.flatMap((t) => t.reviews.map((r) => r.year)))).sort((a, b) => a - b);
  const [ano, setAno] = useState<number | null>(null);
  const anoSel = ano ?? anos[anos.length - 1] ?? null;
  const [aberta, setAberta] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <Link href="/professor">
        <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Voltar</Button>
      </Link>
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-accent font-bold"><CalendarCheck className="h-7 w-7" />Fechamento anual da turma</h1>
        <p className="text-muted-foreground">Indicadores do ano e reflexões escritas por cada equipe.</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {!isLoading && anos.length === 0 && (
        <Alert><AlertDescription>Nenhum ano foi encerrado ainda. O fechamento aparece depois da 12ª rodada (e ao fim do jogo).</AlertDescription></Alert>
      )}

      {anos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {anos.map((a) => (
            <Button key={a} size="sm" variant={a === anoSel ? "default" : "outline"} onClick={() => setAno(a)}>Ano {a}</Button>
          ))}
        </div>
      )}

      {anoSel !== null && (
        <Card>
          <CardHeader><CardTitle>Ano {anoSel} — visão da turma</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Equipe</th>
                  <th className="py-2 pr-3 text-right">Receita</th>
                  <th className="py-2 pr-3 text-right">Lucro</th>
                  <th className="py-2 pr-3 text-right">Margem média</th>
                  <th className="py-2 pr-3 text-right">Participação final</th>
                  <th className="py-2 text-right">Reflexão</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => {
                  const r = t.reviews.find((x) => x.year === anoSel);
                  if (!r) return null;
                  return (
                    <tr key={t.teamId} className="cursor-pointer border-b last:border-0 hover:bg-muted/40" onClick={() => setAberta(aberta === t.teamId ? null : t.teamId)}>
                      <td className="py-2 pr-3 font-medium">{t.companyName || t.teamName} <span className="text-xs text-muted-foreground">{t.companyName ? t.teamName : ""}</span></td>
                      <td className="py-2 pr-3 text-right tabular-nums">{moeda(r.summary.totalRevenue)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{moeda(r.summary.totalProfit)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{pct(r.summary.avgMargin)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{pct(r.summary.finalShare)}</td>
                      <td className="py-2 text-right">
                        {r.reflection?.submittedAt
                          ? <Badge className="border-transparent bg-[#e6f7ee] text-[#0f7a44]">Enviada</Badge>
                          : <Badge className="border-transparent bg-[#fff6e0] text-[#8a5a00]">Pendente</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">Clique numa equipe para ver os indicadores e as respostas.</p>
          </CardContent>
        </Card>
      )}

      {anoSel !== null && data.filter((t) => t.teamId === aberta).map((t) => {
        const r = t.reviews.find((x) => x.year === anoSel);
        if (!r) return null;
        return (
          <div key={t.teamId} className="space-y-6">
            <h2 className="text-xl font-semibold">{t.companyName || t.teamName} — Ano {anoSel}</h2>
            <YearIndicators review={r} />
            <Card>
              <CardHeader><CardTitle>Reflexão da equipe</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {r.questions.map((q, i) => (
                  <div key={q.id} className="space-y-1">
                    <p className="text-sm font-medium"><span className="mr-1 text-[#1447e6]">{i + 1}.</span>{q.text}</p>
                    <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">{r.reflection?.answers?.[q.id] || "Sem resposta."}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  {r.reflection?.submittedAt ? `Enviada em ${new Date(r.reflection.submittedAt).toLocaleString("pt-BR")}.` : "A equipe ainda não enviou a reflexão (respostas acima podem ser rascunho)."}
                </p>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
