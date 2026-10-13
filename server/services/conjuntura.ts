import { pool } from "../pg-storage";
import { storage } from "../storage";
import { CONJUNTURA_PADRAO, CONJUNTURA_ATUALIZADA_EM } from "../data/conjunturaBrasil";
import { economicService, indicadoresEmTexto } from "./economic";

/**
 * Conjuntura Brasil (pedido do professor, out/2026): fatos econômicos e
 * políticos atuais + indicadores oficiais do Banco Central, entregues à IA
 * na geração da PESTEL, dos eventos e do boletim do mês.
 */

export interface ConjunturaTurma {
  texto: string;
  personalizada: boolean;
  atualizadaEm: string;
  padrao: string;
  padraoAtualizadoEm: string;
}

export async function getConjunturaDaTurma(classId: string | null | undefined): Promise<ConjunturaTurma> {
  let row: any = null;
  if (classId) {
    try {
      const r = await pool.query(`SELECT conjuntura, updated_at FROM class_context WHERE class_id = $1`, [classId]);
      row = r.rows[0] ?? null;
    } catch (e) {
      console.error("[CONJUNTURA] Falha ao ler a conjuntura da turma:", e);
    }
  }
  return {
    texto: row?.conjuntura ?? CONJUNTURA_PADRAO,
    personalizada: !!row,
    atualizadaEm: row ? new Date(row.updated_at).toISOString() : CONJUNTURA_ATUALIZADA_EM,
    padrao: CONJUNTURA_PADRAO,
    padraoAtualizadoEm: CONJUNTURA_ATUALIZADA_EM,
  };
}

export async function salvarConjunturaDaTurma(classId: string, texto: string | null, userId: string): Promise<void> {
  if (texto === null || texto.trim() === "") {
    await pool.query(`DELETE FROM class_context WHERE class_id = $1`, [classId]);
    return;
  }
  await pool.query(
    `INSERT INTO class_context (class_id, conjuntura, updated_by, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (class_id) DO UPDATE SET conjuntura = EXCLUDED.conjuntura, updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [classId, texto.trim().slice(0, 6000), userId],
  );
}

/** Indicadores mais recentes (atualiza a cada hora, como a rota /api/economic/latest). */
export async function getIndicadoresAtuais() {
  let economicData = await storage.getLatestEconomicData();
  if (!economicData || Date.now() - economicData.createdAt.getTime() > 3600000) {
    try {
      economicData = await storage.createEconomicData(await economicService.fetchLatestData());
    } catch (e) {
      console.error("[CONJUNTURA] Falha ao atualizar indicadores:", e);
    }
  }
  return economicData;
}

/** Bloco pronto para os prompts. Nunca lança erro: sem dados, devolve "". */
export async function getConjunturaParaPrompt(classId: string | null | undefined): Promise<string> {
  try {
    const [conj, indicadores] = await Promise.all([getConjunturaDaTurma(classId), getIndicadoresAtuais().catch(() => undefined)]);
    const numeros = indicadoresEmTexto(indicadores);
    return `

**CONJUNTURA ATUAL DO BRASIL (fatos reais — use como referência obrigatória):**
${numeros}

${conj.texto}

Regras para a conjuntura: baseie os fatores político-econômicos nestes fatos e números; não contradiga nem invente indicadores além deles; trate temas políticos e eleitorais de forma estritamente neutra e apartidária, apenas pelos efeitos sobre mercado, consumo e negócios.`;
  } catch (e) {
    console.error("[CONJUNTURA] Falha ao montar o bloco do prompt:", e);
    return "";
  }
}
