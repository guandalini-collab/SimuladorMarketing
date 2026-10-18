import { Star, DollarSign, HelpCircle, XCircle, ArrowRight } from "lucide-react";
import {
  BCG_ESTRATEGIA,
  BCG_LIMIAR_CRESCIMENTO,
  BCG_LIMIAR_PARTICIPACAO,
  BCG_PARTICIPACAO_MAX,
  BCG_PARTICIPACAO_MIN,
  classificarBcg,
  type QuadranteBcg,
} from "@shared/bcg";

// Matriz BCG no desenho do modelo original da Boston Consulting Group
// (HENDERSON, 1970), pedido do professor (out/2026):
// - participação relativa em escala logarítmica (0,1× a 10×), ALTA à esquerda;
// - crescimento do mercado no eixo vertical, corte em 10%;
// - Estrela no alto à esquerda, Ponto de Interrogação no alto à direita,
//   Vaca Leiteira embaixo à esquerda, Abacaxi embaixo à direita;
// - bolha proporcional à receita do produto (quando houver resultado).
// Usado na página Estratégia e na de Análises (substitui os dois gráficos
// antigos, que tinham eixo linear, não invertido e cortes diferentes).

export interface ProdutoBcg {
  id?: string;
  productId?: string | null;
  productName: string;
  marketGrowth: number;
  relativeMarketShare: number;
  quadrant?: string;
  revenue?: number | null;
}

export const CORES_BCG: Record<QuadranteBcg, string> = {
  "Estrela": "#1aa15c",
  "Vaca Leiteira": "#1447e6",
  "Ponto de Interrogação": "#d97706",
  "Abacaxi": "#e5352b",
};

export const ICONES_BCG: Record<QuadranteBcg, typeof Star> = {
  "Estrela": Star,
  "Vaca Leiteira": DollarSign,
  "Ponto de Interrogação": HelpCircle,
  "Abacaxi": XCircle,
};

const W = 640;
const H = 460;
const M = { top: 24, right: 20, bottom: 58, left: 62 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;
const TICKS_X = [10, 5, 2, 1, 0.5, 0.2, 0.1];

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fmtX = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}×`;
const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function BcgMatriz({ produtos }: { produtos: ProdutoBcg[] }) {
  const ys = produtos.map((p) => Number(p.marketGrowth) || 0);
  const yMin = Math.min(-5, Math.floor((Math.min(...ys, 0) - 2) / 5) * 5);
  const yMax = Math.max(25, Math.ceil((Math.max(...ys, 0) + 2) / 5) * 5);
  const ticksY: number[] = [];
  for (let v = yMin; v <= yMax; v += 5) ticksY.push(v);

  const lMax = Math.log10(BCG_PARTICIPACAO_MAX);
  const lMin = Math.log10(BCG_PARTICIPACAO_MIN);
  // Participação ALTA à esquerda: 10× em x=0, 0,1× em x=PW.
  const sx = (s: number) => M.left + ((lMax - Math.log10(limitar(s, BCG_PARTICIPACAO_MIN, BCG_PARTICIPACAO_MAX))) / (lMax - lMin)) * PW;
  const sy = (g: number) => M.top + ((yMax - limitar(g, yMin, yMax)) / (yMax - yMin)) * PH;

  const xCorte = sx(BCG_LIMIAR_PARTICIPACAO);
  const yCorte = sy(BCG_LIMIAR_CRESCIMENTO);
  const maxReceita = Math.max(0, ...produtos.map((p) => Number(p.revenue) || 0));
  const raio = (p: ProdutoBcg) => (maxReceita > 0 && p.revenue ? 9 + 27 * Math.sqrt(Number(p.revenue) / maxReceita) : 13);

  const quadrantes: { q: QuadranteBcg; x: number; y: number; w: number; h: number; lx: number; ly: number; anchor: "start" | "end" }[] = [
    { q: "Estrela", x: M.left, y: M.top, w: xCorte - M.left, h: yCorte - M.top, lx: M.left + 8, ly: M.top + 16, anchor: "start" },
    { q: "Ponto de Interrogação", x: xCorte, y: M.top, w: M.left + PW - xCorte, h: yCorte - M.top, lx: M.left + PW - 8, ly: M.top + 16, anchor: "end" },
    { q: "Vaca Leiteira", x: M.left, y: yCorte, w: xCorte - M.left, h: M.top + PH - yCorte, lx: M.left + 8, ly: M.top + PH - 8, anchor: "start" },
    { q: "Abacaxi", x: xCorte, y: yCorte, w: M.left + PW - xCorte, h: M.top + PH - yCorte, lx: M.left + PW - 8, ly: M.top + PH - 8, anchor: "end" },
  ];

  // Maiores atrás, menores na frente.
  const ordenados = [...produtos].sort((a, b) => raio(b) - raio(a));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Matriz BCG" data-testid="bcg-matriz">
      {quadrantes.map((r) => (
        <g key={r.q}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={CORES_BCG[r.q]} fillOpacity={0.07} />
          <text x={r.lx} y={r.ly} textAnchor={r.anchor} fontSize={13} fontWeight={700} fill={CORES_BCG[r.q]}>
            {r.q}
          </text>
        </g>
      ))}

      {ticksY.map((v) => (
        <g key={`y${v}`}>
          <line x1={M.left} x2={M.left + PW} y1={sy(v)} y2={sy(v)} stroke="currentColor" strokeOpacity={0.08} />
          <text x={M.left - 8} y={sy(v) + 4} textAnchor="end" fontSize={11} fill="currentColor" fillOpacity={0.6}>
            {v}%
          </text>
        </g>
      ))}
      {TICKS_X.map((v) => (
        <g key={`x${v}`}>
          <line x1={sx(v)} x2={sx(v)} y1={M.top} y2={M.top + PH} stroke="currentColor" strokeOpacity={0.08} />
          <text x={sx(v)} y={M.top + PH + 16} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.6}>
            {fmtX(v)}
          </text>
        </g>
      ))}

      <line x1={xCorte} x2={xCorte} y1={M.top} y2={M.top + PH} stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="6 4" />
      <line x1={M.left} x2={M.left + PW} y1={yCorte} y2={yCorte} stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="6 4" />
      <rect x={M.left} y={M.top} width={PW} height={PH} fill="none" stroke="currentColor" strokeOpacity={0.25} />

      <text x={M.left + PW / 2} y={H - 22} textAnchor="middle" fontSize={12} fontWeight={600} fill="currentColor">
        Participação de mercado relativa (escala logarítmica) — alta ← → baixa
      </text>
      <text x={M.left + PW / 2} y={H - 6} textAnchor="middle" fontSize={10.5} fill="currentColor" fillOpacity={0.6}>
        participação da empresa ÷ participação do maior concorrente · corte em 1,0×
      </text>
      <text transform={`translate(16 ${M.top + PH / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fontWeight={600} fill="currentColor">
        Crescimento do mercado (% ao ano) · corte em {BCG_LIMIAR_CRESCIMENTO}%
      </text>

      {ordenados.map((p, i) => {
        const q = classificarBcg(Number(p.marketGrowth) || 0, Number(p.relativeMarketShare) || 0);
        const cx = sx(Number(p.relativeMarketShare) || BCG_PARTICIPACAO_MIN);
        const cy = sy(Number(p.marketGrowth) || 0);
        const r = raio(p);
        const direita = cx < M.left + PW - 120;
        return (
          <g key={p.id ?? `${p.productName}-${i}`} data-testid="bcg-bolha">
            <title>
              {`${p.productName} — ${q}\nCrescimento do mercado: ${Number(p.marketGrowth).toLocaleString("pt-BR")}%\nParticipação relativa: ${fmtX(Number(p.relativeMarketShare))}${p.revenue ? `\nReceita: ${moeda(Number(p.revenue))}` : ""}`}
            </title>
            <circle cx={cx} cy={cy} r={r} fill={CORES_BCG[q]} fillOpacity={0.55} stroke={CORES_BCG[q]} strokeWidth={2} />
            <text x={direita ? cx + r + 4 : cx - r - 4} y={cy + 4} textAnchor={direita ? "start" : "end"} fontSize={11.5} fontWeight={600} fill="currentColor">
              {p.productName}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Quadros explicativos: estratégia e fluxo de caixa de cada quadrante. */
export function BcgLegenda({ produtos }: { produtos: ProdutoBcg[] }) {
  const contagem = produtos.reduce<Record<string, number>>((acc, p) => {
    const q = classificarBcg(Number(p.marketGrowth) || 0, Number(p.relativeMarketShare) || 0);
    acc[q] = (acc[q] || 0) + 1;
    return acc;
  }, {});
  const ordem: QuadranteBcg[] = ["Estrela", "Ponto de Interrogação", "Vaca Leiteira", "Abacaxi"];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {ordem.map((q) => {
          const Icone = ICONES_BCG[q];
          return (
            <div key={q} className="rounded-lg border-l-4 bg-muted/30 p-3 text-sm" style={{ borderLeftColor: CORES_BCG[q] }} data-testid={`bcg-legenda-${q}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: CORES_BCG[q] }}>
                  <Icone className="h-4 w-4" />
                  {q}
                </span>
                <span className="text-xs text-muted-foreground">{contagem[q] || 0} produto(s)</span>
              </div>
              <p className="text-muted-foreground">{BCG_ESTRATEGIA[q].resumo}</p>
              <p className="mt-1"><span className="font-medium">Caixa:</span> {BCG_ESTRATEGIA[q].caixa}</p>
              <p className="mt-1"><span className="font-medium">Estratégia:</span> {BCG_ESTRATEGIA[q].estrategia}</p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
        <span className="font-medium">Ciclo do portfólio:</span>
        <span style={{ color: CORES_BCG["Vaca Leiteira"] }} className="font-medium">Vacas Leiteiras</span>
        <span className="text-muted-foreground">financiam</span>
        <span style={{ color: CORES_BCG["Ponto de Interrogação"] }} className="font-medium">Pontos de Interrogação</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <span style={{ color: CORES_BCG["Estrela"] }} className="font-medium">Estrelas</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <span style={{ color: CORES_BCG["Vaca Leiteira"] }} className="font-medium">futuras Vacas Leiteiras</span>
        <span className="text-muted-foreground">quando o mercado amadurece.</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Modelo da Boston Consulting Group (Henderson, 1970). O tamanho de cada bolha é proporcional à receita do produto na última rodada com resultado; sem resultado, todas têm o mesmo tamanho.
      </p>
    </div>
  );
}
