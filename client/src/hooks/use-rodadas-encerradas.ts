// Nov/2026 (correções da Rodada 3): dados das rodadas já encerradas da equipe,
// usados para mostrar o preço praticado e o custo de produção da rodada
// anterior (tela de Decisões) e o histórico de decisões (Rodadas anteriores).
// Só leitura: usa rotas que já existiam e não grava nada.
import { useQuery } from "@tanstack/react-query";
import { custoUnitarioEstimado } from "@shared/fichaProduto";

export interface RodadaResumo {
  id: string;
  roundNumber: number;
  status: string;
  isPractice?: boolean;
  endedAt?: string | null;
}

/** Rodadas encerradas que contam (a rodada de teste fica de fora), da mais recente para a mais antiga. */
export function useRodadasEncerradas(classId: string | undefined) {
  const { data: rodadas = [] } = useQuery<RodadaResumo[]>({
    queryKey: ["/api/rounds", classId],
    enabled: !!classId,
  });
  return rodadas
    .filter((r) => r.status === "completed" && !r.isPractice)
    .sort((a, b) => b.roundNumber - a.roundNumber);
}

/** Decisões (mix por produto), resultados por produto e resultado consolidado de uma rodada da equipe. */
export function useDadosDaRodada(teamId: string | undefined, roundId: string | undefined) {
  const habilitado = !!teamId && !!roundId;
  const { data: mixes = [] } = useQuery<any[]>({
    queryKey: ["/api/marketing-mix/team", teamId, "round", roundId, "products"],
    enabled: habilitado,
  });
  const { data: resultadosProdutos = [] } = useQuery<any[]>({
    queryKey: ["/api/results/team", teamId, "round", roundId, "products"],
    enabled: habilitado,
  });
  const { data: consolidado } = useQuery<any>({
    queryKey: ["/api/results/team", teamId, "round", roundId],
    enabled: habilitado,
  });
  const mixPorProduto = new Map<string, any>();
  for (const m of mixes) if (m?.productId) mixPorProduto.set(m.productId, m);
  const resultadoPorProduto = new Map<string, any>();
  for (const r of resultadosProdutos) if (r?.productId) resultadoPorProduto.set(r.productId, r);
  const multiplicadorCusto = Number(consolidado?.simulationBreakdown?.multiplicadorCusto) || null;
  return { mixPorProduto, resultadoPorProduto, consolidado, multiplicadorCusto };
}

/** Unidades vendidas: no motor, receita bruta = unidades × preço. */
export function unidadesVendidas(resultado: any, mix: any): number | null {
  const preco = Number(mix?.priceValue) || 0;
  const receita = Number(resultado?.receitaBruta ?? resultado?.revenue) || 0;
  if (preco <= 0 || !resultado) return null;
  return Math.round(receita / preco);
}

/**
 * Custo de produção por unidade efetivamente usado na rodada: o mesmo custo
 * da ficha do produto multiplicado pelo fator de custo da semana (dólar e
 * inflação) registrado no fechamento. Null quando faltar algum dado.
 */
export function custoUnitarioDaRodada(
  mix: any,
  precoReferencia: number | undefined,
  margemBrutaPct: number | undefined,
  multiplicadorCusto: number | null,
): number | null {
  if (!mix || !precoReferencia || margemBrutaPct == null) return null;
  const base = custoUnitarioEstimado(precoReferencia, margemBrutaPct, mix.productQuality, mix.productFeatures);
  return base * (multiplicadorCusto ?? 1);
}
