// Nov/2026 (correções da Rodada 3): relatório didático do professor. Uma aba
// por equipe; cada aba explica, com as contas à mostra, por que o resultado
// da rodada foi o que foi. Os dados vêm de /api/professor/relatorio (calculado
// no servidor a partir do que ficou gravado). Só o professor vê esta tela.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Diagnostico { tipo: "alerta" | "ok"; titulo: string; texto: string; contas?: string[] }
interface Produto {
  produtoId: string; nome: string; qualidade: string; caracteristicas: string; estrategiaPreco: string;
  preco: number; precoReferencia: number; diferencaReferenciaPct: number; unidades: number; receitaBruta: number;
  receitaLiquidaUnidade: number; custoProducaoUnidade: number; sobraUnidade: number; sobraPct: number;
  comunicacao: number; distribuicao: number; administrativas: number; despesasUnidade: number;
  custoTotalUnidade: number; precoMinimo: number; resultado: number; participacao: number;
  mediaCategoria: number | null; lider: { empresa: string; participacao: number } | null;
  diagnosticos: Diagnostico[];
}
interface Equipe {
  equipeId: string; equipe: string; enviou: boolean; resumo: string; resultado: number;
  composicao: { item: string; valor: number; parte: number }[];
  produtos: Produto[]; diagnosticosEquipe: Diagnostico[]; conversa: string[];
}
interface Relatorio { rodada: number; equipes: Equipe[]; observacoes: string[] }

const brl = (v: number) => (Math.round(v) < 0 ? "−" : "") + "R$ " + Math.abs(Math.round(v)).toLocaleString("pt-BR");
const brl2 = (v: number) => (v < -0.005 ? "−" : "") + "R$ " + Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number, c = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c }) + "%";

function CartaoDiagnostico({ d }: { d: Diagnostico }) {
  const alerta = d.tipo === "alerta";
  return (
    <div className={`rounded-lg border p-3 ${alerta ? "border-[#ff8c1a]/60" : "border-emerald-500/50"}`}>
      <p className="flex items-center gap-2 font-semibold">
        {alerta ? <AlertTriangle className="h-4 w-4 shrink-0 text-[#c2410c]" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
        {d.titulo}
      </p>
      <p className="mt-1 text-sm">{d.texto}</p>
      {d.contas && d.contas.length > 0 && (
        <div className="mt-2 rounded-md bg-muted/50 p-2">
          <p className="text-xs font-medium text-muted-foreground">Como a conta foi feita</p>
          <ul className="mt-1 space-y-0.5 text-sm tabular-nums">
            {d.contas.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function AbaDaEquipe({ e }: { e: Equipe }) {
  if (!e.enviou) return <Alert><AlertDescription>{e.resumo}</AlertDescription></Alert>;
  const linhas: { rotulo: string; valor: (p: Produto) => string }[] = [
    { rotulo: "Qualidade · características", valor: (p) => `${p.qualidade} · ${p.caracteristicas}` },
    { rotulo: "Preço praticado", valor: (p) => brl(p.preco) },
    { rotulo: "Preço de referência do mercado", valor: (p) => `${brl(p.precoReferencia)} (${p.diferencaReferenciaPct >= 0 ? "+" : ""}${pct(p.diferencaReferenciaPct, 0)})` },
    { rotulo: "Quanto a empresa recebe por unidade (preço − 12% de tributos)", valor: (p) => brl2(p.receitaLiquidaUnidade) },
    { rotulo: "Custo de produção por unidade", valor: (p) => brl2(p.custoProducaoUnidade) },
    { rotulo: "Sobra por unidade antes das despesas", valor: (p) => `${brl2(p.sobraUnidade)} (${pct(p.sobraPct, 0)})` },
    { rotulo: "Unidades vendidas", valor: (p) => p.unidades.toLocaleString("pt-BR") },
    { rotulo: "Participação de mercado", valor: (p) => pct(p.participacao) + (p.mediaCategoria != null ? ` (média ${pct(p.mediaCategoria)})` : "") },
    { rotulo: "Comunicação (mídias)", valor: (p) => brl(p.comunicacao) },
    { rotulo: "Distribuição (canais e cobertura)", valor: (p) => brl(p.distribuicao) },
    { rotulo: "Despesas administrativas", valor: (p) => brl(p.administrativas) },
    { rotulo: "Resultado do produto", valor: (p) => brl(p.resultado) },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Resultado em poucas palavras</CardTitle></CardHeader>
        <CardContent><p>{e.resumo}</p></CardContent>
      </Card>

      {e.composicao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Para onde foi cada R$ 100 vendidos</CardTitle>
            <CardDescription>Cada linha dividida pela receita bruta da equipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {e.composicao.map((l) => (
                  <tr key={l.item} className="border-b last:border-b-0 last:font-semibold">
                    <td className="py-1.5">{l.item}</td>
                    <td className="py-1.5 text-right tabular-nums">{brl(l.valor)}</td>
                    <td className="py-1.5 pl-4 text-right tabular-nums">{pct(l.parte)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Produto a produto</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1.5 text-left font-medium text-muted-foreground"></th>
                {e.produtos.map((p) => <th key={p.produtoId} className="py-1.5 text-right font-semibold">{p.nome}</th>)}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.rotulo} className="border-b last:border-b-0">
                  <td className="py-1.5 pr-3">{l.rotulo}</td>
                  {e.produtos.map((p) => <td key={p.produtoId} className="py-1.5 text-right tabular-nums">{l.valor(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O que explica o resultado</CardTitle>
          <CardDescription>Cada ponto traz a conta feita com os números da equipe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {e.diagnosticosEquipe.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">A empresa como um todo</h3>
              {e.diagnosticosEquipe.map((d, i) => <CartaoDiagnostico key={i} d={d} />)}
            </div>
          )}
          {e.produtos.map((p) => (
            <div key={p.produtoId} className="space-y-3">
              <h3 className="font-semibold">{p.nome}</h3>
              {p.diagnosticos.length === 0
                ? <p className="text-sm text-muted-foreground">Nenhum ponto de atenção encontrado neste produto.</p>
                : p.diagnosticos.map((d, i) => <CartaoDiagnostico key={i} d={d} />)}
            </div>
          ))}
        </CardContent>
      </Card>

      {e.conversa.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Para conversar com a equipe</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {e.conversa.map((t, i) => <p key={i}>{t}</p>)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProfessorRelatorio({ classId }: { classId: string }) {
  const { data: rodadas = [] } = useQuery<any[]>({ queryKey: ["/api/rounds", classId] });
  const encerradas = rodadas.filter((r) => r.status === "completed" && !r.isPractice).sort((a, b) => a.roundNumber - b.roundNumber);
  const [roundId, setRoundId] = useState<string | null>(null);
  useEffect(() => {
    if (encerradas.length > 0 && (!roundId || !encerradas.some((r) => r.id === roundId))) setRoundId(encerradas[encerradas.length - 1].id);
  }, [encerradas, roundId]);
  const { data: relatorio, isLoading, error } = useQuery<Relatorio>({
    queryKey: ["/api/professor/relatorio", classId, roundId],
    enabled: !!roundId,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <Link href="/professor">
        <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Voltar</Button>
      </Link>
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-accent font-bold"><FileText className="h-7 w-7" />Relatório da rodada</h1>
        <p className="text-muted-foreground">Por que cada equipe teve o resultado que teve, com as contas à mostra. Só você vê este relatório.</p>
      </div>

      {encerradas.length === 0 ? (
        <Alert><AlertDescription>Nenhuma rodada foi encerrada ainda. O relatório aparece depois do fechamento.</AlertDescription></Alert>
      ) : (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Rodada">
          {encerradas.map((r) => (
            <Button key={r.id} size="sm" variant={r.id === roundId ? "default" : "outline"} onClick={() => setRoundId(r.id)} data-testid={`relatorio-rodada-${r.roundNumber}`}>
              Rodada {r.roundNumber}
            </Button>
          ))}
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Montando o relatório…</p>}
      {error && <Alert variant="destructive"><AlertDescription>{(error as Error).message}</AlertDescription></Alert>}

      {relatorio && relatorio.equipes.length > 0 && (
        <Tabs defaultValue={relatorio.equipes[0].equipeId} key={relatorio.rodada}>
          <TabsList className="h-auto flex-wrap">
            {relatorio.equipes.map((e) => (
              <TabsTrigger key={e.equipeId} value={e.equipeId} data-testid={`relatorio-equipe-${e.equipeId}`}>{e.equipe}</TabsTrigger>
            ))}
          </TabsList>
          {relatorio.equipes.map((e) => (
            <TabsContent key={e.equipeId} value={e.equipeId} className="mt-6">
              <AbaDaEquipe e={e} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {relatorio && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {relatorio.observacoes.map((o, i) => <p key={i}>{o}</p>)}
        </div>
      )}
    </div>
  );
}
