import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Landmark, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Conjuntura Brasil (server/services/conjuntura.ts): indicadores oficiais do
// Banco Central + fatos econômicos e políticos atuais usados pela IA na
// PESTEL, nos eventos e no boletim do mês.

interface Indicadores {
  exchangeRateUSD: number | null;
  inflationRate: number | null;
  interestRate: number | null;
  gdpGrowth: number | null;
  consumerConfidence: number | null;
  meta: {
    fonte?: string;
    referencias?: Record<string, string | null>;
    desocupacao?: number | null;
    confiancaEscala?: string;
  } | null;
}

export interface Conjuntura {
  texto: string;
  personalizada: boolean;
  atualizadaEm: string;
  padrao: string;
  padraoAtualizadoEm: string;
  indicadores: Indicadores | null;
}

const num = (v: number | null | undefined, casas = 2) =>
  v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

const dataBR = (iso: string) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
};

// "01/09/2026" (dd/mm/aaaa do BCB) → "09/2026" para séries mensais.
const mesAno = (s: string | null | undefined) => (s && /^\d{2}\/\d{2}\/\d{4}$/.test(s) ? s.slice(3) : s ?? "");

export function IndicadoresOficiais({ indicadores }: { indicadores: Indicadores | null }) {
  if (!indicadores) return null;
  const ref = indicadores.meta?.referencias ?? {};
  const escala200 = indicadores.meta?.confiancaEscala === "fecomercio-0-200";
  const itens = [
    { rotulo: "Selic (meta)", valor: `${num(indicadores.interestRate)}%`, nota: "ao ano, vigente", ref: null },
    { rotulo: "Inflação (IPCA)", valor: `${num(indicadores.inflationRate)}%`, nota: "acumulado em 12 meses", ref: mesAno(ref.ipca12m) },
    { rotulo: "Dólar (PTAX)", valor: `R$ ${num(indicadores.exchangeRateUSD)}`, nota: "venda", ref: ref.cambio },
    { rotulo: "PIB", valor: `${num(indicadores.gdpGrowth, 1)}%`, nota: "variação real no último ano", ref: ref.pib ? ref.pib.slice(-4) : null },
    { rotulo: "Desemprego", valor: indicadores.meta?.desocupacao != null ? `${num(indicadores.meta.desocupacao, 1)}%` : "—", nota: "PNAD Contínua", ref: mesAno(ref.desocupacao) },
    {
      rotulo: "Confiança do consumidor",
      valor: num(indicadores.consumerConfidence, 1),
      nota: escala200 ? "Fecomercio-SP · acima de 100 = otimismo" : "índice",
      ref: mesAno(ref.confianca),
    },
  ];
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((i) => (
          <div key={i.rotulo} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{i.rotulo}</p>
            <p className="text-xl font-semibold tabular-nums">{i.valor}</p>
            <p className="text-xs text-muted-foreground">
              {i.nota}
              {i.ref ? ` · ref. ${i.ref}` : ""}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Fonte: {indicadores.meta?.fonte ?? "Banco Central do Brasil (SGS)"}. Atualizado automaticamente.</p>
    </div>
  );
}

function TextoConjuntura({ texto }: { texto: string }) {
  // Linhas em maiúsculas viram títulos; "- " vira item de lista.
  const linhas = texto.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {linhas.map((l, i) => {
        const t = l.trim();
        if (!t) return <div key={i} className="h-1" />;
        if (t === t.toUpperCase() && /[A-ZÁÉÍÓÚÇ]/.test(t) && t.length < 60) {
          return <p key={i} className="pt-2 text-xs font-semibold tracking-wide text-[#1447e6]">{t}</p>;
        }
        if (t.startsWith("- ")) return <p key={i} className="pl-3 -indent-3">• {t.slice(2)}</p>;
        return <p key={i} className="text-muted-foreground">{t}</p>;
      })}
    </div>
  );
}

/** Tela do aluno (Análise de Mercado, aba Economia e Política). */
export function ConjunturaCard() {
  const { data } = useQuery<Conjuntura>({ queryKey: ["/api/conjuntura/minha"] });
  if (!data) return null;
  return (
    <Card data-testid="card-conjuntura">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-5 w-5 text-[#1447e6]" />
          Conjuntura Brasil
        </CardTitle>
        <CardDescription>
          O momento real da economia e da política no país. Use estes dados na sua PESTEL e para interpretar as notícias do mês.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <IndicadoresOficiais indicadores={data.indicadores} />
        <div className="rounded-lg bg-muted/40 p-4">
          <TextoConjuntura texto={data.texto} />
          <p className="mt-3 text-xs text-muted-foreground">Texto atualizado em {dataBR(data.atualizadaEm)}.</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Painel do professor (aba Configurar): ver e ajustar a conjuntura da turma. */
export function ConjunturaEditor({ classId }: { classId: string }) {
  const { toast } = useToast();
  const chave = [`/api/conjuntura/class/${classId}`];
  const { data } = useQuery<Conjuntura>({ queryKey: chave });
  const [texto, setTexto] = useState("");
  useEffect(() => {
    if (data) setTexto(data.texto);
  }, [data?.texto]);

  const salvar = useMutation({
    mutationFn: async (valor: string | null) => (await apiRequest("PUT", `/api/conjuntura/class/${classId}`, { texto: valor })).json(),
    onSuccess: (novo: Conjuntura) => {
      queryClient.setQueryData(chave, novo);
      toast({ title: novo.personalizada ? "Conjuntura da turma salva" : "Texto padrão restaurado", description: "A IA passa a usar este texto nas próximas gerações." });
    },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });

  if (!data) return null;
  const alterado = texto.trim() !== data.texto.trim();

  return (
    <Card data-testid="card-conjuntura-editor">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-5 w-5" />
          Conjuntura Brasil (economia e política)
          {data.personalizada ? (
            <Badge className="border-transparent bg-[#fff6e0] text-[#8a5a00]">Personalizada nesta turma</Badge>
          ) : (
            <Badge variant="secondary">Texto padrão de {dataBR(data.padraoAtualizadoEm)}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          A IA usa estes fatos e os indicadores oficiais ao gerar a PESTEL, os eventos do Simula+ News e o boletim do mês. Os alunos veem o mesmo conteúdo na Análise de Mercado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <IndicadoresOficiais indicadores={data.indicadores} />
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={14} className="font-mono text-xs" data-testid="textarea-conjuntura" />
        <p className="text-xs text-muted-foreground">
          Linhas em MAIÚSCULAS viram títulos e linhas iniciadas por "- " viram itens. Mantenha o texto factual, com data e fonte, e neutro em temas políticos.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => salvar.mutate(texto)} disabled={!alterado || salvar.isPending || !texto.trim()} data-testid="button-save-conjuntura">
            <Save className="mr-2 h-4 w-4" />
            Salvar para esta turma
          </Button>
          {data.personalizada && (
            <Button variant="outline" onClick={() => salvar.mutate(null)} disabled={salvar.isPending} data-testid="button-reset-conjuntura">
              <RotateCcw className="mr-2 h-4 w-4" />
              Voltar ao texto padrão
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
