/**
 * H2 (nov/2026): mercado que muda com o calendário real.
 *
 * Pedido do professor: os alunos estavam repetindo a decisão que deu certo
 * uma vez. Cada semana passa a ter (1) o efeito das datas comerciais do
 * varejo brasileiro e (2) uma preferência do consumidor que muda de semana
 * para semana. As duas aparecem no Simula+ News como notícia, sem dizer o
 * que a equipe deve fazer; o motor de resultados usa os mesmos valores.
 *
 * Os multiplicadores são PARÂMETROS DO MODELO (hipóteses do simulador
 * inspiradas no calendário do varejo), não estatísticas oficiais.
 */

export type PreferenciaConsumidor = "preco" | "qualidade" | "inovacao" | "equilibrada";

export interface SazonalidadeSemana {
  /** Nome da data comercial da semana, se houver. */
  rotulo: string | null;
  /** Multiplicador da demanda da categoria (1 = semana comum). */
  demanda: number;
  /** Multiplicador da sensibilidade a preço (1 = semana comum). */
  sensibilidade: number;
  /** Multiplicador extra da atratividade de produtos premium (presentes). */
  bonusPremium: number;
}

const dia = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const iso = (x: Date) => x.toISOString().slice(0, 10);

/** Black Friday: quarta sexta-feira de novembro. */
export function blackFriday(ano: number): string {
  const primeiro = new Date(Date.UTC(ano, 10, 1));
  const primeiraSexta = 1 + ((5 - primeiro.getUTCDay() + 7) % 7);
  return iso(new Date(Date.UTC(ano, 10, primeiraSexta + 21)));
}

/**
 * Efeito do calendário na semana que começa em `inicioSemana` (segunda-feira,
 * AAAA-MM-DD). PARÂMETROS DO MODELO:
 * - semana da Black Friday: demanda ×1,30 e sensibilidade a preço ×1,25;
 * - semanas que antecedem o Natal (segundas de 1º a 21/12): demanda ×1,10,
 *   ×1,20 e ×1,30, sensibilidade a preço ×0,92 e produtos premium ×1,06.
 */
export function sazonalidadeDaSemana(inicioSemana: string | null | undefined): SazonalidadeSemana {
  const comum: SazonalidadeSemana = { rotulo: null, demanda: 1, sensibilidade: 1, bonusPremium: 1 };
  if (!inicioSemana) return comum;
  const seg = dia(inicioSemana);
  const dom = new Date(seg.getTime() + 6 * 86_400_000);
  const ano = seg.getUTCFullYear();
  const bf = blackFriday(ano);
  if (iso(seg) <= bf && bf <= iso(dom)) {
    return { rotulo: `Black Friday (${bf.slice(8, 10)}/${bf.slice(5, 7)})`, demanda: 1.3, sensibilidade: 1.25, bonusPremium: 1 };
  }
  if (seg.getUTCMonth() === 11 && seg.getUTCDate() <= 21) {
    const d = seg.getUTCDate();
    const demanda = d <= 7 ? 1.1 : d <= 14 ? 1.2 : 1.3;
    return { rotulo: "compras de Natal", demanda, sensibilidade: 0.92, bonusPremium: 1.06 };
  }
  return comum;
}

/** Hash simples e estável (FNV-1a) para sortear a preferência da semana. */
function hash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Preferência do consumidor na semana: sorteio estável por turma e rodada
 * (o mesmo valor no boletim e no cálculo do resultado). Na Black Friday o
 * consumidor busca preço; nas semanas de Natal, sorteia entre qualidade,
 * inovação e equilibrada.
 */
export function preferenciaDaSemana(classId: string, roundNumber: number, saz: SazonalidadeSemana): PreferenciaConsumidor {
  const h = hash(`${classId}:${roundNumber}`);
  if (saz.rotulo?.startsWith("Black Friday")) return "preco";
  if (saz.rotulo === "compras de Natal") return (["qualidade", "inovacao", "equilibrada"] as const)[h % 3];
  return (["preco", "qualidade", "inovacao", "equilibrada"] as const)[h % 4];
}

/**
 * PARÂMETRO DO MODELO: posicionamento alinhado à preferência da semana ganha
 * 8% de atratividade; os demais perdem 4%. Semana "equilibrada": neutro.
 */
export function fatorPreferencia(posicionamento: string, preferencia: PreferenciaConsumidor): number {
  if (preferencia === "equilibrada") return 1;
  return posicionamento === preferencia ? 1.08 : 0.96;
}

export const TEXTO_PREFERENCIA: Record<PreferenciaConsumidor, string> = {
  preco: "consumidores mais atentos a preço e promoções",
  qualidade: "consumidores valorizando qualidade e durabilidade",
  inovacao: "consumidores atraídos por novidades e tecnologia",
  equilibrada: "consumidores sem uma preferência dominante",
};
