// Nov/2026 (correções da Rodada 3): consulta das rodadas encerradas. A equipe
// vê, só para leitura, as decisões que tomou em cada produto e o que elas
// geraram. A rodada de teste não aparece. Nada aqui é editável nem traz dicas.
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { History } from "lucide-react";
import { formatarNumeroBR } from "@/lib/formatters";
import { useRodadasEncerradas, useDadosDaRodada, custoUnitarioDaRodada, unidadesVendidas } from "@/hooks/use-rodadas-encerradas";

const QUALIDADE: Record<string, string> = { basico: "Básica", medio: "Média", premium: "Premium" };
const RECURSOS: Record<string, string> = { basico: "Básicas", intermediario: "Intermediárias", completo: "Completas" };
const POSICIONAMENTO: Record<string, string> = { qualidade: "Qualidade", preco: "Preço", inovacao: "Inovação" };
const ESTRATEGIA_PRECO: Record<string, string> = { penetracao: "Penetração", competitivo: "Competitivo", skimming: "Desnatamento (Skimming)", valor: "Baseado em valor" };
const CANAIS: Record<string, string> = { varejo: "Varejo físico", ecommerce: "E-commerce próprio", marketplace: "Marketplaces", atacado: "Atacado", franquias: "Franquias", direto: "Venda direta" };
const COBERTURA: Record<string, string> = { local: "Local", regional: "Regional", nacional: "Nacional", internacional: "Internacional" };

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function Linha({ rotulo, valor, testId }: { rotulo: string; valor: ReactNode; testId?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 text-sm last:border-b-0">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium tabular-nums" data-testid={testId}>{valor}</span>
    </div>
  );
}

export default function RodadasAnteriores() {
  const { data: team } = useQuery<any>({ queryKey: ["/api/team/current"] });
  const { data: turma } = useQuery<any>({ queryKey: ["/api/classes/" + team?.classId], enabled: !!team?.classId });
  const { data: setor } = useQuery<any>({ queryKey: ["/api/market/sectors/" + turma?.sector], enabled: !!turma?.sector });
  const { data: produtos = [] } = useQuery<any[]>({ queryKey: ["/api/products/class", team?.classId], enabled: !!team?.classId });
  const { data: midias = [] } = useQuery<any[]>({ queryKey: ["/api/midias"] });

  const rodadas = useRodadasEncerradas(team?.classId);
  const [rodadaId, setRodadaId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (rodadas.length > 0 && (!rodadaId || !rodadas.some((r) => r.id === rodadaId))) setRodadaId(rodadas[0].id);
  }, [rodadas, rodadaId]);
  const rodada = rodadas.find((r) => r.id === rodadaId);
  const { mixPorProduto, resultadoPorProduto, multiplicadorCusto } = useDadosDaRodada(team?.id, rodadaId);

  const nomeMidia = (id: string) => midias.find((m: any) => m.id === id)?.nome ?? id;
  const categoriaDe = (produto: any) => (setor?.categories ?? []).find((c: any) =>
    c.id === produto?.slug ||
    `${c.id}-${setor?.id}` === produto?.slug ||
    (c.name && produto?.name && semAcento(c.name) === semAcento(String(produto.name))));
  const produtosDaRodada = produtos.filter((p: any) => mixPorProduto.has(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-accent font-bold">Rodadas anteriores</h1>
        <p className="text-muted-foreground">Decisões que a equipe tomou em cada rodada encerrada e o que elas geraram. Somente consulta.</p>
        <p className="text-xs text-muted-foreground mt-1">Como cada número é calculado: Manual do Aluno, Apêndices A e C.</p>
      </div>

      {rodadas.length === 0 ? (
        <Alert>
          <History className="h-4 w-4" />
          <AlertDescription>Ainda não há rodada encerrada.</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Rodada">
            {[...rodadas].reverse().map((r) => (
              <Button
                key={r.id}
                type="button"
                size="sm"
                variant={r.id === rodadaId ? "default" : "outline"}
                onClick={() => setRodadaId(r.id)}
                data-testid={`rodada-anterior-${r.roundNumber}`}
              >
                Rodada {r.roundNumber}
              </Button>
            ))}
          </div>

          {rodada && produtosDaRodada.length === 0 && (
            <Alert>
              <AlertDescription>A equipe não enviou decisões na Rodada {rodada.roundNumber}.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {produtosDaRodada.map((p: any) => {
              const mix = mixPorProduto.get(p.id);
              const res = resultadoPorProduto.get(p.id);
              const cat = categoriaDe(p);
              const custo = custoUnitarioDaRodada(mix, cat?.averagePrice, setor?.margemBruta, multiplicadorCusto);
              const unidades = unidadesVendidas(res, mix);
              const verbas: Record<string, number> = mix?.promotionBudgets ?? {};
              const midiasEscolhidas: string[] = mix?.promotionMix ?? [];
              return (
                <Card key={p.id} data-testid={`card-rodada-anterior-${p.id}`}>
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                    <CardDescription>Rodada {rodada?.roundNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <h3 className="mb-1 text-sm font-semibold">Decisões</h3>
                      <Linha rotulo="Qualidade" valor={QUALIDADE[mix?.productQuality] ?? mix?.productQuality ?? "—"} />
                      <Linha rotulo="Características" valor={RECURSOS[mix?.productFeatures] ?? mix?.productFeatures ?? "—"} />
                      <Linha rotulo="Posicionamento" valor={POSICIONAMENTO[mix?.brandPositioning] ?? mix?.brandPositioning ?? "—"} />
                      <Linha rotulo="Estratégia de preço" valor={ESTRATEGIA_PRECO[mix?.priceStrategy] ?? mix?.priceStrategy ?? "—"} />
                      <Linha rotulo="Preço praticado" valor={Number(mix?.priceValue) > 0 ? formatarNumeroBR(Number(mix.priceValue), "moeda") : "—"} testId={`preco-anterior-${p.id}`} />
                      <Linha rotulo="Canais" valor={(mix?.distributionChannels ?? []).map((c: string) => CANAIS[c] ?? c).join(", ") || "—"} />
                      <Linha rotulo="Cobertura" valor={COBERTURA[mix?.distributionCoverage] ?? mix?.distributionCoverage ?? "—"} />
                      <Linha
                        rotulo="Mídias"
                        valor={midiasEscolhidas.length === 0 ? "—" : (
                          <span className="block space-y-0.5">
                            {midiasEscolhidas.map((id) => (
                              <span key={id} className="block">{nomeMidia(id)}{verbas[id] ? `: ${formatarNumeroBR(verbas[id], "moeda")}` : ""}</span>
                            ))}
                          </span>
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-semibold">Resultado</h3>
                      {res ? (
                        <>
                          <Linha rotulo="Unidades vendidas" valor={unidades != null ? unidades.toLocaleString("pt-BR") : "—"} />
                          <Linha rotulo="Custo de produção por unidade (com dólar e inflação)" valor={custo != null ? formatarNumeroBR(custo, "moeda") : "—"} />
                          <Linha rotulo="Receita bruta" valor={formatarNumeroBR(Number(res.receitaBruta ?? res.revenue) || 0, "moeda")} />
                          <Linha rotulo="Custos totais" valor={formatarNumeroBR(Number(res.costs) || 0, "moeda")} />
                          <Linha rotulo="Lucro do produto" valor={formatarNumeroBR(Number(res.profit) || 0, "moeda")} />
                          <Linha rotulo="Participação de mercado" valor={`${(Number(res.marketShare) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`} />
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Resultado não disponível para este produto.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
