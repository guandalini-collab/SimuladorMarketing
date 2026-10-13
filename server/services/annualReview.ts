import type { IStorage } from "../storage";
import type { Result, Round, Team } from "@shared/schema";
import { pool } from "../pg-storage";

// Fechamento anual (pedido do professor, out/2026). Cada rodada é um mês e
// cada ano tem sempre 12 rodadas. Ao fim de cada ano (rodadas 12, 24, …) e
// ao fim do jogo, a equipe recebe um relatório com os indicadores do ano,
// a comparação com o ano anterior e com a média da turma, e perguntas
// reflexivas construídas a partir dos próprios dados — sem dizer o que a
// equipe deve fazer. As respostas ficam salvas e visíveis ao professor.

export const MESES_POR_ANO = 12;

export function yearOfRound(roundNumber: number): number {
  return Math.floor((roundNumber - 1) / MESES_POR_ANO) + 1;
}

export interface MonthRow {
  roundNumber: number;
  month: number; // 1 a 12 dentro do ano
  revenue: number | null;
  profit: number | null;
  margin: number | null;
  roi: number | null;
  marketShare: number | null;
  budgetAfter: number | null;
  classAvgRevenue: number | null;
  classAvgProfit: number | null;
  classAvgMargin: number | null;
  classAvgShare: number | null;
}

export interface YearSummary {
  monthsWithResult: number;
  totalRevenue: number;
  totalProfit: number;
  avgMargin: number | null;
  avgRoi: number | null;
  finalShare: number | null;
  budgetStart: number | null;
  budgetEnd: number | null;
  profitableMonths: number;
  lossMonths: number;
}

export interface Question {
  id: string;
  text: string;
}

export interface YearReview {
  year: number;
  firstRound: number;
  lastRound: number;
  closed: boolean; // todas as rodadas do ano (ou do jogo) já encerradas
  isFinal: boolean; // último ano do jogo
  months: MonthRow[];
  summary: YearSummary;
  classSummary: { avgTotalRevenue: number | null; avgTotalProfit: number | null; avgMargin: number | null; avgFinalShare: number | null };
  previousYear: YearSummary | null;
  questions: Question[];
  reflection: { answers: Record<string, string>; submittedAt: string | null; updatedAt: string | null } | null;
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function resumir(rows: MonthRow[]): YearSummary {
  const com = rows.filter((r) => r.revenue !== null);
  const ultimo = [...com].reverse()[0];
  const primeiro = com[0];
  return {
    monthsWithResult: com.length,
    totalRevenue: com.reduce((a, r) => a + (r.revenue ?? 0), 0),
    totalProfit: com.reduce((a, r) => a + (r.profit ?? 0), 0),
    avgMargin: media(com.map((r) => r.margin ?? 0)),
    avgRoi: media(com.map((r) => r.roi ?? 0)),
    finalShare: ultimo?.marketShare ?? null,
    budgetStart: primeiro && primeiro.budgetAfter !== null && primeiro.profit !== null ? primeiro.budgetAfter - primeiro.profit : null,
    budgetEnd: ultimo?.budgetAfter ?? null,
    profitableMonths: com.filter((r) => (r.profit ?? 0) > 0).length,
    lossMonths: com.filter((r) => (r.profit ?? 0) < 0).length,
  };
}

// Perguntas reflexivas a partir dos dados da própria equipe. Elas apontam
// fatos (quando, quanto) e pedem a interpretação da equipe; nunca sugerem
// a decisão "certa".
function montarPerguntas(year: number, rows: MonthRow[], summary: YearSummary, classAvgMargin: number | null, previous: YearSummary | null): Question[] {
  const qs: Question[] = [];
  const com = rows.filter((r) => r.revenue !== null);

  if (com.length >= 2) {
    const melhor = [...com].sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0))[0];
    const pior = [...com].sort((a, b) => (a.profit ?? 0) - (b.profit ?? 0))[0];
    qs.push({
      id: "melhor-mes",
      text: `O melhor resultado do ano foi no mês ${melhor.month} (lucro de ${moeda(melhor.profit ?? 0)}). Que decisões da equipe e que condições do mercado naquele mês explicam esse resultado?`,
    });
    if (pior.roundNumber !== melhor.roundNumber) {
      qs.push({
        id: "pior-mes",
        text: `O pior resultado do ano foi no mês ${pior.month} (${(pior.profit ?? 0) < 0 ? "prejuízo" : "lucro"} de ${moeda(Math.abs(pior.profit ?? 0))}). O que a equipe decidiu naquele mês e por que, olhando agora, o resultado foi esse?`,
      });
    }

    // Maior queda de participação entre dois meses seguidos com resultado.
    let queda: { de: MonthRow; para: MonthRow; delta: number } | null = null;
    for (let i = 1; i < com.length; i++) {
      const d = (com[i].marketShare ?? 0) - (com[i - 1].marketShare ?? 0);
      if (d < 0 && (!queda || d < queda.delta)) queda = { de: com[i - 1], para: com[i], delta: d };
    }
    if (queda && queda.delta <= -0.5) {
      qs.push({
        id: "queda-participacao",
        text: `A participação de mercado caiu de ${pct(queda.de.marketShare ?? 0)} no mês ${queda.de.month} para ${pct(queda.para.marketShare ?? 0)} no mês ${queda.para.month}. O que mudou nas decisões da equipe ou no mercado entre esses dois meses?`,
      });
    }
  }

  if (summary.avgMargin !== null && classAvgMargin !== null) {
    const dif = summary.avgMargin - classAvgMargin;
    qs.push({
      id: "comparacao-turma",
      text: `A margem média da equipe no ano foi ${pct(summary.avgMargin)}, ${Math.abs(dif) < 0.5 ? "praticamente igual à" : `${Math.abs(dif).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p. ${dif > 0 ? "acima da" : "abaixo da"}`} média da turma (${pct(classAvgMargin)}). A que a equipe atribui essa diferença?`,
    });
  }

  if (previous && previous.monthsWithResult > 0) {
    const varLucro = summary.totalProfit - previous.totalProfit;
    qs.push({
      id: "comparacao-ano-anterior",
      text: `Em relação ao Ano ${year - 1}, o lucro acumulado ${varLucro >= 0 ? "aumentou" : "diminuiu"} ${moeda(Math.abs(varLucro))}. O que a equipe passou a fazer de forma diferente, e o que manteve?`,
    });
  }

  qs.push({
    id: "uma-decisao",
    text: "Se a equipe pudesse refazer uma única decisão deste ano, qual seria? Explique o raciocínio da época e o que vocês sabem hoje.",
  });
  qs.push({
    id: "aprendizado",
    text: "Qual conceito de marketing estudado em aula ficou mais claro para a equipe com o que aconteceu neste ano? Dê um exemplo concreto do jogo.",
  });
  return qs;
}

async function lerReflexoes(teamId: string): Promise<Map<number, { answers: Record<string, string>; submittedAt: string | null; updatedAt: string | null }>> {
  const mapa = new Map();
  try {
    const { rows } = await pool.query(`SELECT * FROM annual_reflections WHERE team_id = $1`, [teamId]);
    for (const r of rows) {
      mapa.set(Number(r.year), {
        answers: r.answers ?? {},
        submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : null,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      });
    }
  } catch (error) {
    console.error("[FECHAMENTO] Erro ao ler reflexões:", error);
  }
  return mapa;
}

export async function buildTeamReviews(storage: IStorage, team: Team): Promise<YearReview[]> {
  const classData = await storage.getClass(team.classId);
  const rounds: Round[] = (await storage.getRoundsByClass(team.classId)).sort((a, b) => a.roundNumber - b.roundNumber);
  if (!classData || rounds.length === 0) return [];

  const completed = rounds.filter((r) => r.status === "completed");
  const resultsPorRodada = new Map<string, Result[]>();
  for (const r of completed) resultsPorRodada.set(r.id, await storage.getResultsByRound(r.id));

  const linha = (r: Round): MonthRow => {
    const all = resultsPorRodada.get(r.id) ?? [];
    const mine = all.find((x) => x.teamId === team.id);
    return {
      roundNumber: r.roundNumber,
      month: ((r.roundNumber - 1) % MESES_POR_ANO) + 1,
      revenue: mine?.revenue ?? null,
      profit: mine?.profit ?? null,
      margin: mine?.margin ?? null,
      roi: mine?.roi ?? null,
      marketShare: mine?.marketShare ?? null,
      budgetAfter: mine?.budgetAfter ?? null,
      classAvgRevenue: media(all.map((x) => x.revenue)),
      classAvgProfit: media(all.map((x) => x.profit)),
      classAvgMargin: media(all.map((x) => x.margin)),
      classAvgShare: media(all.map((x) => x.marketShare)),
    };
  };

  const lastRoundOfGame = Math.max(classData.maxRounds, ...rounds.map((r) => r.roundNumber));
  const totalAnos = yearOfRound(lastRoundOfGame);
  const reflexoes = await lerReflexoes(team.id);
  const reviews: YearReview[] = [];
  let anterior: YearSummary | null = null;

  for (let ano = 1; ano <= totalAnos; ano++) {
    const first = (ano - 1) * MESES_POR_ANO + 1;
    const last = Math.min(ano * MESES_POR_ANO, lastRoundOfGame);
    const doAno = rounds.filter((r) => r.roundNumber >= first && r.roundNumber <= last);
    const encerradas = doAno.filter((r) => r.status === "completed");
    const closed = encerradas.length > 0 && encerradas.length === last - first + 1;
    const months = encerradas.map(linha);
    const summary = resumir(months);

    // Médias da turma no ano: por equipe, depois a média entre equipes.
    const porEquipe = new Map<string, Result[]>();
    for (const r of encerradas) for (const res of resultsPorRodada.get(r.id) ?? []) {
      if (!porEquipe.has(res.teamId)) porEquipe.set(res.teamId, []);
      porEquipe.get(res.teamId)!.push(res);
    }
    const equipes: Result[][] = Array.from(porEquipe.values());
    const ultimaPorEquipe = (lst: Result[]) => {
      const ord = [...lst].sort((a, b) => (doAno.find((r) => r.id === a.roundId)?.roundNumber ?? 0) - (doAno.find((r) => r.id === b.roundId)?.roundNumber ?? 0));
      return ord[ord.length - 1];
    };
    const classSummary = {
      avgTotalRevenue: media(equipes.map((l) => l.reduce((a, x) => a + x.revenue, 0))),
      avgTotalProfit: media(equipes.map((l) => l.reduce((a, x) => a + x.profit, 0))),
      avgMargin: media(equipes.map((l) => media(l.map((x) => x.margin)) ?? 0)),
      avgFinalShare: media(equipes.map((l) => ultimaPorEquipe(l)?.marketShare ?? 0)),
    };

    if (closed) {
      reviews.push({
        year: ano,
        firstRound: first,
        lastRound: last,
        closed,
        isFinal: ano === totalAnos,
        months,
        summary,
        classSummary,
        previousYear: anterior,
        questions: montarPerguntas(ano, months, summary, classSummary.avgMargin, anterior),
        reflection: reflexoes.get(ano) ?? null,
      });
    }
    anterior = summary.monthsWithResult > 0 ? summary : anterior;
  }
  return reviews;
}

// Ano cujo fechamento a equipe ainda precisa responder antes de seguir na
// rodada atual (usado pelo percurso da rodada): só no primeiro mês de um
// ano novo, e só se a equipe teve resultado no ano que fechou.
export async function pendingReflectionYear(storage: IStorage, team: Team, round: Round): Promise<number | null> {
  if (round.roundNumber <= MESES_POR_ANO || (round.roundNumber - 1) % MESES_POR_ANO !== 0) return null;
  const anoFechado = yearOfRound(round.roundNumber) - 1;
  const reviews = await buildTeamReviews(storage, team);
  const review = reviews.find((r) => r.year === anoFechado);
  if (!review || review.summary.monthsWithResult === 0) return null;
  return review.reflection?.submittedAt ? null : anoFechado;
}

export async function saveReflection(params: {
  teamId: string;
  classId: string;
  year: number;
  answers: Record<string, string>;
  submit: boolean;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { rows } = await pool.query(`SELECT submitted_at FROM annual_reflections WHERE team_id = $1 AND year = $2`, [params.teamId, params.year]);
  if (rows[0]?.submitted_at) return { ok: false, error: "A reflexão deste ano já foi enviada e não pode mais ser alterada." };
  const limpas: Record<string, string> = {};
  for (const [k, v] of Object.entries(params.answers ?? {})) {
    if (typeof v === "string") limpas[k.slice(0, 60)] = v.slice(0, 4000);
  }
  await pool.query(
    `INSERT INTO annual_reflections (team_id, class_id, year, answers, submitted_by, submitted_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (team_id, year) DO UPDATE SET answers = EXCLUDED.answers, submitted_by = EXCLUDED.submitted_by,
       submitted_at = EXCLUDED.submitted_at, updated_at = now()`,
    [params.teamId, params.classId, params.year, JSON.stringify(limpas), params.userId, params.submit ? new Date() : null],
  );
  return { ok: true };
}
