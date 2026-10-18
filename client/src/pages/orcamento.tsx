import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/kpi-card";

export default function Orcamento() {
  const { data: team } = useQuery<any>({
    queryKey: ["/api/team/current"],
  });

  const { data: results } = useQuery<any[]>({
    queryKey: ["/api/results/team", team?.id],
    enabled: !!team?.id,
  });
  
  const { data: rounds } = useQuery<any[]>({
    queryKey: ["/api/rounds"],
    enabled: !!team?.id,
  });

  // Out/2026 (Grupo G): ordem por rodada, numa cópia (antes o array do
  // cache era reordenado no lugar), e com o número real da rodada.
  const rodadaDe = (roundId: string) => rounds?.find((r: any) => r.id === roundId);
  const resultadosOrdenados = [...(results || [])].sort((a, b) => {
    const ra = rodadaDe(a.roundId), rb = rodadaDe(b.roundId);
    if (ra && rb) return (ra.roundNumber ?? 0) - (rb.roundNumber ?? 0);
    return new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime();
  });
  const rotuloDaRodada = (roundId: string) => {
    const r = rodadaDe(roundId);
    if (!r) return "Rodada";
    return r.isPractice ? "Rodada de teste" : `Rodada ${r.roundNumber}`;
  };

  const currentBudget = team?.budget || 0;
  const accumulatedResult = (results || []).reduce((sum, r) => sum + (r.profitImpact || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-accent font-bold">Gestão de Orçamento</h1>
        <p className="text-muted-foreground">
          Acompanhe a evolução do orçamento da sua equipe ao longo das rodadas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Orçamento Atual"
          value={`R$ ${currentBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          description="Verba de marketing da próxima rodada"
          testId="text-current-budget"
          color="blue"
        />

        {results && results.length > 0 && (
          <>
            <KPICard
              title="Orçamento Inicial"
              value={`R$ ${(resultadosOrdenados[0]?.budgetBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
              description="Definido no início da simulação"
              color="gold"
            />

            <KPICard
              title="Resultado Acumulado"
              value={`${accumulatedResult >= 0 ? "+" : ""}R$ ${accumulatedResult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={accumulatedResult >= 0 ? TrendingUp : TrendingDown}
              description="Lucro/Prejuízo total ao longo das rodadas"
              color={accumulatedResult >= 0 ? "green" : "orange"}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#2f2a8f] flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            Histórico de Fluxo de Caixa
          </CardTitle>
          <CardDescription>
            Verba de cada rodada, lucro ou prejuízo obtido e verba definida para a rodada seguinte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!results || results.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O histórico de fluxo de caixa será exibido após a conclusão da primeira rodada.
                O orçamento é usado ao longo de todas as rodadas - cada rodada você decide quanto investir no Mix de Marketing.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Rodada</th>
                    <th className="text-right py-3 px-4 font-medium">Verba da rodada</th>
                    <th className="text-right py-3 px-4 font-medium">Lucro / prejuízo</th>
                    <th className="text-right py-3 px-4 font-medium">Verba da rodada seguinte</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadosOrdenados
                    .map((result, index) => (
                      <tr key={result.id} className="border-b hover-elevate" data-testid={`cashflow-row-${index}`}>
                        <td className="py-3 px-4">
                          <span className="font-medium">{rotuloDaRodada(result.roundId)}</span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-muted-foreground">
                            R$ {(result.budgetBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={result.profitImpact >= 0 ? "text-[#0f7a44] font-semibold" : "text-[#a3241c] font-semibold"}>
                            {result.profitImpact >= 0 ? "+" : ""}
                            R$ {(result.profitImpact || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="font-bold">
                            R$ {(result.budgetAfter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {result.profitImpact >= 0 ? (
                            <Badge variant="outline" className="bg-[#e6f7ee] text-[#0f7a44] border-[#1aa15c]/30 dark:bg-green-900/30 dark:text-green-400">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Lucro
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-[#fde8e6] text-[#a3241c] border-[#a3241c]/30 dark:bg-red-900/30 dark:text-red-400">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Prejuízo
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Como funciona o orçamento:</strong> Em cada rodada, a equipe dispõe de uma verba de marketing e decide quanto investir
          no Mix de Marketing (4 Ps). A verba não acumula de uma rodada para a outra. Quando a rodada fecha, o jogo calcula o resultado
          e define a verba da rodada seguinte, como explica o Apêndice “Como o mercado é calculado” do Manual do Aluno.
        </AlertDescription>
      </Alert>
    </div>
  );
}
