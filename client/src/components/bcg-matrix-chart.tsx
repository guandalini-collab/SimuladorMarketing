import { useQuery } from "@tanstack/react-query";
import { Info, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BcgLegenda, BcgMatriz, type ProdutoBcg } from "@/components/bcg-matriz";

// Página Análises. Desde out/2026 usa a mesma matriz da página Estratégia,
// no modelo original da Boston Consulting Group (components/bcg-matriz.tsx).
// Antes este gráfico cortava o crescimento em 0% (e não em 10%) e usava eixo
// linear, então podia mostrar um produto num quadrante diferente do salvo.
interface BcgMatrixChartProps {
  teamId: string;
  roundId: string;
}

export function BcgMatrixChart({ teamId, roundId }: BcgMatrixChartProps) {
  // Mesma rota da página Estratégia (resolve a equipe pela sessão).
  const { data: strategyData, isLoading } = useQuery<{ bcg: ProdutoBcg[] }>({
    queryKey: ["/api/strategy", roundId],
    enabled: !!teamId && !!roundId,
  });
  const { data: porProduto = [] } = useQuery<{ productId: string; revenue: number }[]>({
    queryKey: [`/api/results/team/${teamId}/round/${roundId}/products`],
    enabled: !!teamId && !!roundId,
  });

  const produtos: ProdutoBcg[] = (strategyData?.bcg ?? []).map((b) => ({
    ...b,
    revenue: porProduto.find((p) => p.productId && p.productId === b.productId)?.revenue ?? null,
  }));

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800" data-testid="card-bcg-matrix">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2f2a8f]">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          Matriz BCG — posicionamento dos produtos
        </CardTitle>
        <CardDescription>Modelo da Boston Consulting Group: crescimento do mercado × participação relativa; bolha proporcional à receita do mês.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : produtos.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Complete a análise BCG nas Ferramentas Estratégicas para visualizar o posicionamento dos seus produtos.</AlertDescription>
          </Alert>
        ) : (
          <>
            <BcgMatriz produtos={produtos} />
            <BcgLegenda produtos={produtos} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
