// Nov/2026 (correções da Rodada 3): análise de concorrentes da equipe. Segue o
// roteiro pedido pelo professor (identificar concorrentes, comparar os 4 Ps,
// SWOT em relação aos concorrentes e pontos cegos). Os dados vêm do servidor
// (/api/team/analise-concorrentes), calculados a partir do mercado da rodada
// anterior e de marcas reais com fonte. A tela descreve; não recomenda.
// O significado de cada etapa está no Manual do Aluno, Apêndice D.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Swords } from "lucide-react";
import { formatarNumeroBR } from "@/lib/formatters";

interface ItemSwot { texto: string; criterio: string }
interface Dado { valor: number; fonte: string; periodo: string; criterio: string }
interface Marca { nome: string; vendasBrasil: Dado | null; usoBrasil: Dado | null; mundial: Dado | null; observacao?: string }
interface EmpresaMatriz { empresa: string; tipo: string; preco: number; qualidade: string; canais: string[]; cobertura: string; participacao: number; unidades: number }
interface Produto {
  produtoId: string; produto: string; categoria: string; precoReferencia: number;
  diretos: { jogo: { empresa: string; tipo: string }[]; marcasReais: string[] };
  indiretos: string[]; novosEntrantes: { nome: string; fonte: string }[];
  matriz: EmpresaMatriz[]; media: { preco: number; participacao: number; unidades: number; canais: number } | null;
  marcasReais: Marca[]; lacunas: string[]; fontes: string[];
  swot: { forcas: ItemSwot[]; fraquezas: ItemSwot[]; oportunidades: ItemSwot[]; ameacas: ItemSwot[] };
  pontosCegos: ItemSwot[]; semDadosDaEquipe: boolean;
  benchmarking?: Benchmarking | null;
}
type Comparacao = "melhor" | "pior" | "parecido" | null;
interface Benchmarking {
  colunas: { empresa: string; tipo: string }[];
  linhas: { atributo: string; valores: string[]; comparacao: Comparacao[]; detalhe?: string[] }[];
}

// Cor e símbolo do ponto de vista da sua equipe (o símbolo garante a leitura
// também sem cor). Regra: diferença de até 10% nos números, ou o mesmo nível
// nas escalas, é "parecido".
const ESTILO: Record<Exclude<Comparacao, null>, { classe: string; simbolo: string; rotulo: string }> = {
  melhor: { classe: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100", simbolo: "▲", rotulo: "sua equipe está melhor" },
  pior: { classe: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100", simbolo: "▼", rotulo: "sua equipe está pior" },
  parecido: { classe: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100", simbolo: "●", rotulo: "parecido" },
};

function TabelaComparativa({ b }: { b: Benchmarking }) {
  return (
    <div className="space-y-3">
      <table className="w-full min-w-[720px] border-collapse text-sm" data-testid="tabela-comparativa-concorrentes">
        <thead>
          <tr className="border-b text-left align-bottom">
            <th className="py-2 pr-3 font-medium text-muted-foreground">Atributo</th>
            {b.colunas.map((c, i) => (
              <th key={c.empresa} className={`px-2 py-2 text-center font-medium ${i === 0 ? "bg-[#c026d3]/10" : ""}`}>
                {c.empresa}
                <div className="text-[11px] font-normal text-muted-foreground">{c.tipo === "sua equipe" ? "sua equipe" : c.tipo === "equipe" ? "equipe da turma" : "simulado"}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {b.linhas.map((l) => (
            <tr key={l.atributo} className="border-b">
              <td className="py-2 pr-3 font-medium">{l.atributo}</td>
              {l.valores.map((v, i) => {
                const c = l.comparacao[i];
                const e = c ? ESTILO[c] : null;
                return (
                  <td key={i} className={`px-2 py-2 text-center tabular-nums ${i === 0 ? "bg-[#c026d3]/10 font-semibold" : ""} ${e ? e.classe : ""}`} title={[e?.rotulo, l.detalhe?.[i]].filter(Boolean).join(" · ") || undefined}>
                    {e && <span aria-label={e.rotulo} className="mr-1">{e.simbolo}</span>}
                    {v}
                    {l.detalhe?.[i] && i > 0 && <div className="text-[11px] font-normal opacity-80">{l.detalhe[i]}</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className={`rounded px-2 py-0.5 ${ESTILO.melhor.classe}`}>▲ sua equipe está melhor que esta empresa</span>
        <span className={`rounded px-2 py-0.5 ${ESTILO.pior.classe}`}>▼ sua equipe está pior</span>
        <span className={`rounded px-2 py-0.5 ${ESTILO.parecido.classe}`}>● parecido (diferença de até 10% ou mesmo nível)</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Formato da classificação de concorrentes por atributos de Kotler e Keller (2019, p. 304, Tabela 10.2) e das áreas de forças e fraquezas
        dos concorrentes de Porter (2008a, p. 81-82, Figura 3-2). Preço e variação da participação ficam sem cor: um preço mais alto ou mais baixo
        não é melhor nem pior por si só, depende do posicionamento. Atributos que o jogo não simula (conscientização do cliente, assistência
        técnica e equipe de vendas) não aparecem. Explicação no Manual do Aluno, Apêndice D.3.
      </p>
    </div>
  );
}
interface Analise { disponivel: boolean; mensagem?: string; rodadaBase?: number; rodadaAtual?: number; produtos: Produto[]; referenciaSwot: string }

const pct = (v: number, c = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c }) + "%";
const dado = (d: Dado | null) => (d ? pct(d.valor) : "não divulgado");

function Quadrante({ titulo, itens, cor, vazio }: { titulo: string; itens: ItemSwot[]; cor: string; vazio: string }) {
  return (
    <div className={`rounded-lg border-2 p-3 ${cor}`}>
      <h4 className="font-semibold">{titulo}</h4>
      {itens.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">{vazio}</p> : (
        <ul className="mt-2 space-y-2">
          {itens.map((i, k) => (
            <li key={k} className="text-sm">
              <p>{i.texto}</p>
              <p className="text-xs text-muted-foreground">Critério: {i.criterio}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnaliseDoProduto({ p, rodadaBase }: { p: Produto; rodadaBase?: number }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Quem são os concorrentes</CardTitle>
          <CardDescription>Categoria {p.categoria}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Diretos (vendem o mesmo produto para o mesmo público)</p>
            <p><span className="text-muted-foreground">No jogo:</span> {p.diretos.jogo.length ? p.diretos.jogo.map((e) => `${e.empresa} (${e.tipo})`).join(", ") : "nenhuma empresa registrada"}.</p>
            <p><span className="text-muted-foreground">Marcas reais no Brasil:</span> {p.diretos.marcasReais.join(", ") || "sem levantamento"}.</p>
          </div>
          <div>
            <p className="font-medium">Indiretos (resolvem a mesma necessidade com outro produto)</p>
            <p>{p.indiretos.join(", ") || "sem levantamento"}.</p>
          </div>
          <div>
            <p className="font-medium">Novos entrantes</p>
            <p>{p.novosEntrantes.length ? p.novosEntrantes.map((n) => n.nome).join(", ") : "nenhum registrado em fonte aberta"}.</p>
            {p.novosEntrantes[0] && <p className="text-xs text-muted-foreground">Fonte: {p.novosEntrantes[0].fonte}.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Comparação com cada concorrente</CardTitle>
          <CardDescription>
            Dados da Rodada {rodadaBase}. Preço de referência da categoria: {formatarNumeroBR(p.precoReferencia, "moeda")}.
            O valor investido em comunicação de cada empresa não é mostrado, como no mercado real.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {p.benchmarking ? <TabelaComparativa b={p.benchmarking} /> : (
            <p className="text-sm text-muted-foreground">A comparação aparece quando a sua equipe tiver vendido este produto na rodada anterior.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Marcas reais no Brasil</CardTitle>
          <CardDescription>Dados de mercado com fonte. Não entram no cálculo do jogo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1.5 font-medium">Marca</th>
                <th className="py-1.5 text-right font-medium">Vendas no Brasil</th>
                <th className="py-1.5 text-right font-medium">Uso no Brasil (acessos à internet)</th>
                <th className="py-1.5 text-right font-medium">Mercado mundial</th>
                <th className="py-1.5 pl-3 font-medium">Observação</th>
              </tr>
            </thead>
            <tbody>
              {p.marcasReais.map((m) => (
                <tr key={m.nome} className="border-b align-top">
                  <td className="py-1.5 font-medium">{m.nome}</td>
                  <td className="py-1.5 text-right tabular-nums">{dado(m.vendasBrasil)}</td>
                  <td className="py-1.5 text-right tabular-nums">{dado(m.usoBrasil)}</td>
                  <td className="py-1.5 text-right tabular-nums">{dado(m.mundial)}</td>
                  <td className="py-1.5 pl-3 text-xs text-muted-foreground">{m.observacao ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 text-xs text-muted-foreground">
            {Array.from(new Set(p.marcasReais.flatMap((m) => [m.vendasBrasil, m.usoBrasil, m.mundial]).filter(Boolean).map((d) => `${d!.fonte}, ${d!.periodo}: ${d!.criterio}.`))).map((t) => <p key={t}>{t}</p>)}
            {p.lacunas.map((l) => <p key={l}>{l}</p>)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. SWOT em relação aos concorrentes</CardTitle>
          <CardDescription>Forças e fraquezas: ambiente interno, comparado com os concorrentes. Oportunidades e ameaças: ambiente externo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {p.semDadosDaEquipe && <Alert><AlertDescription>A equipe não teve este produto na rodada anterior; forças e fraquezas ficam sem comparação.</AlertDescription></Alert>}
          <div className="grid gap-3 md:grid-cols-2">
            <Quadrante titulo="Forças" itens={p.swot.forcas} cor="border-emerald-500/50" vazio="Nenhuma força identificada pelos critérios." />
            <Quadrante titulo="Fraquezas" itens={p.swot.fraquezas} cor="border-[#ff8c1a]/60" vazio="Nenhuma fraqueza identificada pelos critérios." />
            <Quadrante titulo="Oportunidades" itens={p.swot.oportunidades} cor="border-sky-500/50" vazio="Nenhuma oportunidade identificada pelos critérios." />
            <Quadrante titulo="Ameaças" itens={p.swot.ameacas} cor="border-rose-500/50" vazio="Nenhuma ameaça identificada pelos critérios." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Pontos cegos dos concorrentes</CardTitle>
          <CardDescription>O que nenhuma empresa do jogo fez nesta categoria na rodada anterior.</CardDescription>
        </CardHeader>
        <CardContent>
          {p.pontosCegos.length === 0 ? <p className="text-sm text-muted-foreground">Todas as qualidades, canais e coberturas foram usados por alguma empresa.</p> : (
            <ul className="list-disc space-y-1 pl-5 text-sm">{p.pontosCegos.map((i) => <li key={i.texto}>{i.texto}</li>)}</ul>
          )}
        </CardContent>
      </Card>

      {p.fontes.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Fontes das marcas reais</summary>
          <div className="mt-2 space-y-1">{p.fontes.map((f) => <p key={f}>{f}</p>)}</div>
        </details>
      )}
    </div>
  );
}

export default function AnaliseConcorrentes() {
  const { data, isLoading } = useQuery<Analise>({ queryKey: ["/api/team/analise-concorrentes"] });
  const [produtoId, setProdutoId] = useState<string | null>(null);
  useEffect(() => {
    if (data?.produtos?.length && (!produtoId || !data.produtos.some((p) => p.produtoId === produtoId))) setProdutoId(data.produtos[0].produtoId);
  }, [data, produtoId]);
  const produto = data?.produtos.find((p) => p.produtoId === produtoId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-accent font-bold"><Swords className="h-7 w-7" />Análise de concorrentes</h1>
        <p className="text-muted-foreground">Quem disputa o mercado com a sua empresa e como cada um atuou na última rodada encerrada.</p>
        <p className="text-xs text-muted-foreground mt-1">O que cada etapa significa e como os critérios funcionam: Manual do Aluno, Apêndice D.</p>
      </div>
      {isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {data && !data.disponivel && <Alert><AlertDescription>{data.mensagem}</AlertDescription></Alert>}
      {data?.disponivel && (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Produto">
            {data.produtos.map((p) => (
              <Button key={p.produtoId} size="sm" variant={p.produtoId === produtoId ? "default" : "outline"} onClick={() => setProdutoId(p.produtoId)} data-testid={`concorrentes-produto-${p.produtoId}`}>
                {p.produto}
              </Button>
            ))}
          </div>
          {produto && <AnaliseDoProduto p={produto} rodadaBase={data.rodadaBase} />}
          <p className="text-xs text-muted-foreground">Referência da SWOT: {data.referenciaSwot}</p>
        </>
      )}
    </div>
  );
}
