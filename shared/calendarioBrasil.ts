// Calendário brasileiro (pedido do professor, out/2026): feriados nacionais
// destacados no calendário de datas das rodadas, com aviso (sem bloquear) se
// o professor escolher um deles. Feriados estaduais, municipais e recessos
// da instituição não são conhecidos pelo sistema.
// O cálculo da Páscoa também serve às datas sazonais móveis (Carnaval etc.).

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
export function pascoa(ano: number): { mes: number; dia: number } {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return { mes, dia };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const somarDias = (ano: number, mes: number, dia: number, n: number) => iso(new Date(Date.UTC(ano, mes - 1, dia + n)));

export interface Feriado {
  data: string; // AAAA-MM-DD
  nome: string;
  /** Ponto facultativo nacional (Carnaval, Corpus Christi), comum nas instituições federais. */
  facultativo?: boolean;
}

/** Feriados nacionais (Lei 662/1949 e alterações; 20/11 pela Lei 14.759/2023) e pontos facultativos usuais. */
export function feriadosNacionais(ano: number): Feriado[] {
  const p = pascoa(ano);
  const fixos: [string, string][] = [
    ["01-01", "Confraternização Universal"],
    ["04-21", "Tiradentes"],
    ["05-01", "Dia do Trabalho"],
    ["09-07", "Independência do Brasil"],
    ["10-12", "Nossa Senhora Aparecida"],
    ["11-02", "Finados"],
    ["11-15", "Proclamação da República"],
    ["11-20", "Dia Nacional de Zumbi e da Consciência Negra"],
    ["12-25", "Natal"],
  ];
  return [
    ...fixos.map(([md, nome]) => ({ data: `${ano}-${md}`, nome })),
    { data: somarDias(ano, p.mes, p.dia, -48), nome: "Carnaval (segunda-feira)", facultativo: true },
    { data: somarDias(ano, p.mes, p.dia, -47), nome: "Carnaval (terça-feira)", facultativo: true },
    { data: somarDias(ano, p.mes, p.dia, -2), nome: "Sexta-feira Santa" },
    { data: somarDias(ano, p.mes, p.dia, 60), nome: "Corpus Christi", facultativo: true },
  ].sort((a, b) => a.data.localeCompare(b.data));
}

/** Feriado nacional na data (AAAA-MM-DD), se houver. */
export function feriadoEm(data: string): Feriado | undefined {
  const ano = Number(data.slice(0, 4));
  return feriadosNacionais(ano).find((f) => f.data === data);
}
