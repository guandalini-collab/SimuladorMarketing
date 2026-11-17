import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Lock, Target, Shield, TrendingUp, Globe } from "lucide-react";
import BcgMatrixChart from "@/components/BcgMatrixChart";

// Out/2026: SWOT, 5 Forças de Porter, BCG e PESTEL entregues prontas a cada
// rodada (server/services/analisesDaIA.ts). Somente leitura: a equipe lê,
// interpreta e decide. Nenhum texto aqui recomenda decisões.

function AvisoSomenteLeitura({ fonte }: { fonte: string }) {
  return (
    <Alert className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <Lock className="h-4 w-4" />
      <AlertDescription className="text-sm">
        Análise entregue pronta nesta rodada, {fonte}. Somente leitura; ela é refeita a cada rodada.
      </AlertDescription>
    </Alert>
  );
}

function EmPreparacao() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        A análise desta rodada ainda está sendo preparada. Volte a esta tela em alguns minutos.
      </CardContent>
    </Card>
  );
}

function Lista({ itens }: { itens?: string[] }) {
  if (!itens?.length) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <ul className="space-y-2">
      {itens.map((item, i) => (
        <li key={i} className="rounded border p-2 text-sm leading-relaxed">{item}</li>
      ))}
    </ul>
  );
}

function Cabecalho({ cor, Icone, titulo, descricao }: { cor: string; Icone: any; titulo: string; descricao: string }) {
  return (
    <CardHeader className="bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: cor }}>
          <Icone className="h-5 w-5 text-white" />
        </div>
        <div>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

export function SwotSomenteLeitura({ data }: { data?: any }) {
  if (!data) return <EmPreparacao />;
  const quadros = [
    { chave: "strengths", titulo: "Forças", sub: "Ambiente interno", cor: "#1aa15c" },
    { chave: "weaknesses", titulo: "Fraquezas", sub: "Ambiente interno", cor: "#e5352b" },
    { chave: "opportunities", titulo: "Oportunidades", sub: "Ambiente externo", cor: "#1447e6" },
    { chave: "threats", titulo: "Ameaças", sub: "Ambiente externo", cor: "#c9871a" },
  ];
  return (
    <div className="space-y-4">
      <AvisoSomenteLeitura fonte="a partir dos números da sua empresa no jogo e do ambiente de mercado da turma" />
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <Cabecalho cor="#7c3aed" Icone={Target} titulo="Análise SWOT da empresa" descricao="Forças e fraquezas (internas); oportunidades e ameaças (externas)" />
        <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
          {quadros.map((q) => (
            <div key={q.chave} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: q.cor }} />
                <h3 className="font-semibold">{q.titulo}</h3>
                <span className="text-xs text-muted-foreground">{q.sub}</span>
              </div>
              <Lista itens={data[q.chave]} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Nov/2026 (pedido do professor, 17/11): cada força mostra os fatores que a
// explicam, conforme Porter (2008, cap. 1), com os dados do jogo de cada
// produto (server/services/analiseConcorrentes.ts). "Não simulado" quando o
// jogo não tem o dado. A nota continua a da análise da rodada.
interface FatorPorter { forca: string; fator: string; dado: string | null; pagina: string }
interface ProdutoFatores { produto: string; categoria: string; fatoresPorter?: FatorPorter[] }

function FatoresDaForca({ forca, produtos, rodadaBase }: { forca: string; produtos: ProdutoFatores[]; rodadaBase?: number }) {
  const linhas = Array.from(new Set(produtos.flatMap((p) => (p.fatoresPorter ?? []).filter((f) => f.forca === forca).map((f) => f.fator))));
  if (!linhas.length) return null;
  return (
    <div className="overflow-x-auto">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        Fatores desta força (Porter, 2008a){rodadaBase ? `, com os dados do mercado na Rodada ${rodadaBase}` : ""}:
      </p>
      <table className="w-full min-w-[560px] border-collapse text-xs">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1 pr-2 font-medium">Fator</th>
            {produtos.map((p) => <th key={p.produto} className="py-1 pr-2 font-medium">{p.produto}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((fator) => {
            const pag = produtos.flatMap((p) => p.fatoresPorter ?? []).find((f) => f.forca === forca && f.fator === fator)?.pagina;
            return (
              <tr key={fator} className="border-b align-top">
                <td className="py-1 pr-2 font-medium">{fator}<span className="block font-normal text-muted-foreground">Porter, {pag}</span></td>
                {produtos.map((p) => {
                  const f = (p.fatoresPorter ?? []).find((x) => x.forca === forca && x.fator === fator);
                  return <td key={p.produto} className="py-1 pr-2">{f?.dado ?? <span className="italic text-muted-foreground">não simulado no jogo</span>}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PorterSomenteLeitura({ data }: { data?: any }) {
  const { data: analise } = useQuery<{ disponivel: boolean; rodadaBase?: number; produtos: ProdutoFatores[] }>({ queryKey: ["/api/team/analise-concorrentes"] });
  if (!data) return <EmPreparacao />;
  const produtos = analise?.disponivel ? analise.produtos : [];
  const forcas = [
    { nota: "competitiveRivalry", texto: "rivalryNotes", titulo: "Rivalidade entre concorrentes", chave: "rivalidade" },
    { nota: "supplierPower", texto: "supplierNotes", titulo: "Poder de barganha dos fornecedores", chave: "fornecedores" },
    { nota: "buyerPower", texto: "buyerNotes", titulo: "Poder de barganha dos compradores", chave: "compradores" },
    { nota: "threatOfSubstitutes", texto: "substitutesNotes", titulo: "Ameaça de produtos substitutos", chave: "substitutos" },
    { nota: "threatOfNewEntry", texto: "newEntryNotes", titulo: "Ameaça de novos entrantes", chave: "entrantes" },
  ];
  return (
    <div className="space-y-4">
      <AvisoSomenteLeitura fonte="igual para toda a turma, porque descreve o mercado do setor" />
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <Cabecalho cor="#0a1830" Icone={Shield} titulo="5 Forças de Porter" descricao="Intensidade de cada força no setor, de 1 (muito fraca) a 10 (muito forte)" />
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Porter (2008a, p. 20) explica que cada força depende de fatores da estrutura do setor. Abaixo de cada nota estão esses fatores,
            com os números do jogo de cada produto. Onde aparece "não simulado no jogo", o simulador não tem esse dado. Explicação no Manual do Aluno, Apêndice D.7.
          </p>
          {forcas.map((f) => {
            const valor = Number(data[f.nota]) || 0;
            return (
              <div key={f.nota} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{f.titulo}</h3>
                  <Badge variant="outline" className="tabular-nums">{valor}/10</Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="img" aria-label={`${valor} de 10`}>
                  <div className="h-full rounded-full bg-[#1447e6]" style={{ width: `${valor * 10}%` }} />
                </div>
                {data[f.texto] ? <p className="text-sm leading-relaxed text-muted-foreground">{data[f.texto]}</p> : null}
                <FatoresDaForca forca={f.chave} produtos={produtos} rodadaBase={analise?.rodadaBase} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export function BcgSomenteLeitura({ data }: { data?: any[] }) {
  if (!data?.length) return <EmPreparacao />;
  return (
    <div className="space-y-4">
      <AvisoSomenteLeitura fonte="calculada com a participação dos seus produtos no mercado do jogo e o crescimento real do setor" />
      <BcgMatrixChart products={data} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />Como cada produto foi posicionado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.map((p: any) => (
            <div key={p.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{p.productName}</p>
                <Badge variant="outline">{p.quadrant}</Badge>
              </div>
              {p.notes ? <p className="mt-1 text-sm text-muted-foreground">{p.notes}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function PestelSomenteLeitura({ data }: { data?: any }) {
  if (!data) return <EmPreparacao />;
  const fatores = [
    { chave: "political", titulo: "Político" },
    { chave: "economic", titulo: "Econômico" },
    { chave: "social", titulo: "Social" },
    { chave: "technological", titulo: "Tecnológico" },
    { chave: "environmental", titulo: "Ambiental" },
    { chave: "legal", titulo: "Legal" },
  ];
  return (
    <div className="space-y-4">
      <AvisoSomenteLeitura fonte="igual para toda a turma, com base na conjuntura brasileira atual e nos dados do setor" />
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <Cabecalho cor="#1aa15c" Icone={Globe} titulo="Análise PESTEL" descricao="Fatores do macroambiente que afetam o setor" />
        <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
          {fatores.map((f) => (
            <div key={f.chave} className="space-y-2">
              <h3 className="font-semibold">{f.titulo}</h3>
              <Lista itens={data[f.chave]} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
