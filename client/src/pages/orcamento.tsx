import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function Orcamento() {
  const { data: team } = useQuery<any>({
    queryKey: ["/api/team/current"],
  });

  const { data: results } = useQuery<any[]>({
    queryKey: ["/api/results/team", team?.id],
    enabled: !!team?.id,
  });
  
  const currentBudget = team?.budget || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-accent font-bold">Gestão de Orçamento</h1>
        <p className="text-muted-foreground">
          Acompanhe a evolução do orçamento da sua equipe ao longo das rodadas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              Orçamento Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-chart-1" data-testid="text-current-budget">
              R$ {currentBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Disponível para investimentos nas próximas rodadas
            </p>
          </CardContent>
        </Card>

        {results && results.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Orçamento Inicial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  R$ {(results[0]?.budgetBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Definido no início da simulação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Resultado Acumulado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${
                  results.reduce((sum, r) => sum + (r.profitImpact || 0), 0) >= 0 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {results.reduce((sum, r) => sum + (r.profitImpact || 0), 0) >= 0 ? "+" : ""}
                  R$ {results.reduce((sum, r) => sum + (r.profitImpact || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Lucro/Prejuízo total ao longo das rodadas
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Histórico de Fluxo de Caixa
          </CardTitle>
          <CardDescription>
            Evolução do orçamento ao longo das rodadas (lucros aumentam, prejuízos diminuem)
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
                    <th className="text-right py-3 px-4 font-medium">Orçamento Inicial</th>
                    <th className="text-right py-3 px-4 font-medium">Resultado</th>
                    <th className="text-right py-3 px-4 font-medium">Orçamento Final</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime())
                    .map((result, index) => (
                      <tr key={result.id} className="border-b hover-elevate" data-testid={`cashflow-row-${index}`}>
                        <td className="py-3 px-4">
                          <span className="font-medium">Rodada {index + 1}</span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-muted-foreground">
                            R$ {(result.budgetBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={result.profitImpact >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                            {result.profitImpact >= 0 ? "+" : ""}
                            R$ {(result.profitImpact || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="font-bold">
                            R$ {(result.budgetAfter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {result.profitImpact >= 0 ? (
                            <Badge variant="default" className="bg-green-600">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Lucro
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
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
          <strong>Como funciona o orçamento:</strong> O orçamento da sua equipe é utilizado ao longo de TODAS as rodadas. 
          Em cada rodada, você decide quanto investir no Mix de Marketing (4 Ps). Quando a rodada fecha, os custos são deduzidos 
          e os lucros ou prejuízos são aplicados ao seu orçamento. Gerencie seus recursos com sabedoria!
        </AlertDescription>
      </Alert>
    </div>
  );
}
