// E1 (nov/2026): segmentação de mercado por produto, com tópicos prontos nos
// quatro critérios. O público escolhido para cada produto entra no cálculo do
// resultado (motor competitivo). A tela não indica qual combinação é melhor:
// o significado de cada critério e de cada opção está no Manual do Aluno.
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  CRITERIOS_B2C,
  TOPICOS_B2C,
  MAX_OPCOES_POR_TOPICO,
  MIN_TOPICOS_POR_CRITERIO,
  codigoOpcao,
  type CriterioSegmentacao,
} from "@shared/segmentacao";

type Selecoes = Record<CriterioSegmentacao, string[]>;
const vazio = (): Selecoes => ({ geographic: [], demographic: [], psychographic: [], behavioral: [] });

function selecoesDaLinha(linha: any): Selecoes {
  const s = vazio();
  for (const c of Object.keys(s) as CriterioSegmentacao[]) {
    s[c] = Array.isArray(linha?.[c]) ? linha[c].filter((x: unknown) => typeof x === "string" && x.includes(":")) : [];
  }
  return s;
}

function topicosMarcados(lista: string[]): number {
  return new Set(lista.map((c) => c.split(":")[0])).size;
}

export function SegmentacaoPorProduto({
  roundId,
  roundStatus,
  classId,
  linhas,
}: {
  roundId: string;
  roundStatus: string;
  classId: string;
  linhas: any[];
}) {
  const { toast } = useToast();
  const editavel = roundStatus === "active";
  const { data: produtos = [] } = useQuery<any[]>({
    queryKey: ["/api/products/class", `${classId}?roundId=${roundId}`],
    enabled: !!classId && !!roundId,
  });
  const [produtoId, setProdutoId] = useState<string | null>(null);
  useEffect(() => {
    if (produtos.length > 0 && (!produtoId || !produtos.some((p) => p.id === produtoId))) setProdutoId(produtos[0].id);
  }, [produtos, produtoId]);

  const linhaAtual = useMemo(() => linhas.find((l) => l.productId === produtoId && l.segmentType === "b2c"), [linhas, produtoId]);
  const [selecoes, setSelecoes] = useState<Selecoes>(vazio);
  const [alterado, setAlterado] = useState(false);
  useEffect(() => {
    setSelecoes(selecoesDaLinha(linhaAtual));
    setAlterado(false);
  }, [linhaAtual, produtoId]);

  const salvar = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/strategy/segmentation", {
        roundId,
        productId: produtoId,
        segmentType: "b2c",
        ...selecoes,
      });
      return res.json();
    },
    onSuccess: () => {
      setAlterado(false);
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/current-round-status"] });
      toast({ title: "Segmentação do produto salva!" });
    },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e?.message || "Verifique a conexão e tente de novo.", variant: "destructive" }),
  });

  const alternar = (criterio: CriterioSegmentacao, topico: string, opcao: string) => {
    if (!editavel) return;
    const cod = codigoOpcao(topico, opcao);
    setSelecoes((prev) => {
      const lista = prev[criterio];
      if (lista.includes(cod)) return { ...prev, [criterio]: lista.filter((c) => c !== cod) };
      const noTopico = lista.filter((c) => c.startsWith(`${topico}:`)).length;
      if (noTopico >= MAX_OPCOES_POR_TOPICO) return prev;
      return { ...prev, [criterio]: [...lista, cod] };
    });
    setAlterado(true);
  };

  if (produtos.length === 0) return null;

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800" data-testid="segmentacao-por-produto">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c026d3]">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Público-alvo de cada produto</CardTitle>
            <CardDescription>
              Marque até {MAX_OPCOES_POR_TOPICO} opções por tópico e preencha pelo menos {MIN_TOPICOS_POR_CRITERIO} tópicos em cada critério.
              O significado de cada critério e de cada opção está no Manual do Aluno.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Produto">
          {produtos.map((p) => {
            const salvo = linhas.some((l) => l.productId === p.id && l.segmentType === "b2c");
            return (
              <Button
                key={p.id}
                type="button"
                variant={p.id === produtoId ? "default" : "outline"}
                size="sm"
                onClick={() => setProdutoId(p.id)}
                data-testid={`seg-produto-${p.id}`}
              >
                {p.name}
                <Badge variant="secondary" className="ml-2">{salvo ? "salva" : "pendente"}</Badge>
              </Button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {CRITERIOS_B2C.map((crit) => {
            const n = topicosMarcados(selecoes[crit.key]);
            const ok = n >= MIN_TOPICOS_POR_CRITERIO;
            return (
              <div key={crit.key} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{crit.label}</h3>
                    <p className="text-sm text-muted-foreground">{crit.pergunta}</p>
                  </div>
                  <span className={cn("shrink-0 text-xs tabular-nums", ok ? "text-muted-foreground" : "font-medium text-[#8a4a00] dark:text-orange-300")}>
                    {n} de {TOPICOS_B2C[crit.key].length} tópicos
                  </span>
                </div>
                {TOPICOS_B2C[crit.key].map((t) => {
                  const marcadas = selecoes[crit.key].filter((c) => c.startsWith(`${t.id}:`)).length;
                  return (
                    <div key={t.id} className="space-y-2">
                      <p className="text-sm font-medium">{t.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {t.opcoes.map((op) => {
                          const ativo = selecoes[crit.key].includes(codigoOpcao(t.id, op.id));
                          const bloqueado = !ativo && marcadas >= MAX_OPCOES_POR_TOPICO;
                          return (
                            <button
                              key={op.id}
                              type="button"
                              aria-pressed={ativo}
                              disabled={!editavel || bloqueado}
                              onClick={() => alternar(crit.key, t.id, op.id)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-sm transition-colors",
                                ativo ? "border-[#c026d3] bg-[#c026d3] text-white" : "border-slate-300 bg-background hover:bg-muted dark:border-slate-700",
                                (bloqueado || !editavel) && !ativo && "opacity-50",
                              )}
                              data-testid={`seg-${t.id}-${op.id}`}
                            >
                              {op.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => salvar.mutate()} disabled={!editavel || !produtoId || salvar.isPending} data-testid="button-salvar-seg-produto">
            Salvar segmentação deste produto
          </Button>
          {alterado && <span className="text-sm text-muted-foreground">Há alterações não salvas.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
