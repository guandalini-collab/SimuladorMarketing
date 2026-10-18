import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

/**
 * Out/2026 (Grupo G): as consultas do app não expiram sozinhas
 * (staleTime: Infinity em lib/queryClient.ts), então a tela do aluno ficava
 * presa na rodada anterior até ele apertar F5. Este hook reconsulta, a cada
 * minuto e quando o aluno volta para a aba, só os dados que mudam quando
 * uma rodada abre ou fecha.
 *
 * Seguro para formulários: o TanStack Query mantém a mesma referência
 * quando a resposta não muda (structural sharing), então os efeitos das
 * telas que copiam dados para o estado local não disparam à toa. Ficam de
 * fora as consultas do Mix de Marketing e dos produtos, que a equipe edita.
 */
const PREFIXOS_DA_RODADA = [
  "/api/rounds",
  "/api/team/current",
  "/api/results/team",
  "/api/feedback",
  "/api/deterministic-feedback",
  "/api/market-bulletins",
  "/api/market-fit",
  "/api/events/class",
  "/api/insights/market",
  "/api/strategy",
  "/api/student/class",
];

function atualizar() {
  queryClient.invalidateQueries({
    predicate: (q) => {
      const chave = q.queryKey[0];
      return typeof chave === "string" && PREFIXOS_DA_RODADA.some((p) => chave.startsWith(p));
    },
  });
}

export function useAtualizacaoDaRodada(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return;
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") atualizar();
    }, 60_000);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") atualizar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [ativo]);
}
