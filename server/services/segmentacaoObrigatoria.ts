import type { IStorage } from "../storage";
import type { Class, Round } from "@shared/schema";
import { setorComSegmentacaoPorProduto } from "@shared/segmentacao";

/**
 * Nov/2026 (a partir da Rodada 3 da turma Marketing II): nas turmas com
 * segmentação por produto (setor Eletrônicos, B2C ou híbrida), a
 * Segmentação de Mercado só está completa quando CADA produto liberado na
 * rodada tem a sua segmentação B2C preenchida. A "Visão geral da equipe"
 * deixa de valer para o envio e para o checklist.
 *
 * Devolve os ids dos produtos exigidos (os mesmos que a tela mostra: os
 * produtos do setor em ordem, limitados ao número liberado na rodada) ou
 * null quando a regra antiga continua valendo (outros setores, turma B2B).
 */
export async function produtosComSegmentacaoObrigatoria(
  storage: IStorage,
  classData: Pick<Class, "sector" | "businessType"> | null | undefined,
  round: Pick<Round, "productCount"> | null | undefined,
): Promise<string[] | null> {
  if (!classData?.sector || !round) return null;
  if (classData.businessType === "b2b") return null;
  if (!setorComSegmentacaoPorProduto(classData.sector)) return null;
  const produtos = await storage.getProductsBySector(classData.sector);
  const ids = [...produtos]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .slice(0, Math.max(1, round.productCount ?? 1))
    .map((p) => p.id);
  return ids.length > 0 ? ids : null;
}
