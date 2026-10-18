import type { EconomicData, InsertEconomicData } from "@shared/schema";

interface ExchangeRateResponse {
  result: string;
  time_last_update_utc: string;
  base_code: string;
  rates: Record<string, number>;
}

export class EconomicService {
  private readonly API_URL = "https://open.er-api.com/v6/latest/USD";
  private cache: { data: EconomicData | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };
  private readonly CACHE_DURATION = 3600000; // 1 hora em ms

  /**
   * Indicadores oficiais (pedido do professor, out/2026): antes, só o câmbio
   * era real; inflação, juros, PIB e confiança eram sorteados. Agora todos
   * vêm do Sistema Gerenciador de Séries Temporais do Banco Central (SGS),
   * API pública e sem chave. Se uma série falhar, usa o último valor salvo
   * (ou um valor de referência), nunca um número aleatório.
   *   432   Selic meta (% a.a.)              13522 IPCA acumulado 12 meses (%)
   *   1     Dólar PTAX venda (R$)            7326  PIB, variação real no ano (%)
   *   4393  Confiança do Consumidor (Fecomercio-SP; acima de 100 = otimismo)
   *   24369 Taxa de desocupação (PNAD Contínua, %)
   * As datas de referência e a desocupação vão em "source" (JSON), para não
   * alterar a tabela economic_data.
   */
  private async serieBCB(codigo: number): Promise<{ valor: number; data: string } | null> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) return null;
      const arr = await r.json();
      const ult = Array.isArray(arr) ? arr[arr.length - 1] : null;
      const valor = ult ? Number(String(ult.valor).replace(",", ".")) : NaN;
      return Number.isFinite(valor) ? { valor, data: String(ult.data) } : null;
    } catch {
      return null;
    }
  }

  /**
   * Grupo H (out/2026, pedido do professor): no Railway as consultas ao
   * Banco Central passaram a falhar, e os indicadores ficavam parados nos
   * valores de referência. IPCA, PIB e desocupação são pesquisas do IBGE,
   * então agora vêm DIRETO do IBGE (API de agregados do SIDRA, pública e sem
   * chave); o Banco Central fica como segunda opção para essas três.
   * Selic, dólar e confiança do consumidor não são do IBGE e continuam no BCB.
   *   1737 / 2265  IPCA, variação acumulada em 12 meses (%), mensal
   *   5932 / 6563  PIB a preços de mercado, taxa acumulada no ano (%),
   *                trimestral; o 4º trimestre dá o "último ano fechado",
   *                o mesmo conceito da série 7326 do BCB usada antes
   *   6381 / 4099  Taxa de desocupação, PNAD Contínua mensal (trimestre móvel)
   * A data de referência é gravada no formato do BCB (dd/mm/aaaa) para a tela
   * continuar mostrando "ref. 09/2026" (mensal) ou o ano (PIB).
   */
  private async serieIBGE(
    agregado: number,
    variavel: number,
    opcoes: { periodos?: string; classificacao?: string; escolher?: (periodo: string) => boolean } = {},
  ): Promise<{ valor: number; data: string } | null> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const cls = opcoes.classificacao ? `&classificacao=${opcoes.classificacao}` : "";
      const url = `https://servicodados.ibge.gov.br/api/v3/agregados/${agregado}/periodos/${opcoes.periodos ?? "-1"}/variaveis/${variavel}?localidades=N1[all]${cls}`;
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) return null;
      const arr = await r.json();
      const serie: Record<string, string> | undefined = arr?.[0]?.resultados?.[0]?.series?.[0]?.serie;
      if (!serie) return null;
      const periodos = Object.keys(serie)
        .filter((p) => /^\d{6}$/.test(p) && (!opcoes.escolher || opcoes.escolher(p)))
        .sort();
      for (let i = periodos.length - 1; i >= 0; i--) {
        const p = periodos[i];
        const valor = Number(String(serie[p]).replace(",", "."));
        if (!Number.isFinite(valor)) continue; // "..." ou "-" = sem dado ainda
        const ano = p.slice(0, 4);
        const sufixo = Number(p.slice(4));
        // Trimestral (PIB): "202504" → 4º tri de 2025. Mensal: "202609" → 09/2026.
        const data = agregado === 5932 ? `01/01/${ano}` : `01/${String(sufixo).padStart(2, "0")}/${ano}`;
        return { valor, data };
      }
      return null;
    } catch {
      return null;
    }
  }

  async fetchLatestData(): Promise<InsertEconomicData> {
    const now = Date.now();
    if (this.cache.data && now - this.cache.timestamp < this.CACHE_DURATION) {
      const { id, createdAt, ...resto } = this.cache.data;
      return resto as InsertEconomicData;
    }

    const [selic, ptax, confianca, ipcaIBGE, pibIBGE, desocupacaoIBGE] = await Promise.all([
      this.serieBCB(432), this.serieBCB(1), this.serieBCB(4393),
      this.serieIBGE(1737, 2265),
      // Últimos 8 trimestres; fica o mais recente que seja um 4º trimestre.
      this.serieIBGE(5932, 6563, { periodos: "-8", classificacao: "11255[90707]", escolher: (p) => p.endsWith("04") }),
      this.serieIBGE(6381, 4099),
    ]);
    // Banco Central só como segunda opção para as três pesquisas do IBGE.
    const [ipcaBCB, pibBCB, desocupacaoBCB] = await Promise.all([
      ipcaIBGE ? null : this.serieBCB(13522),
      pibIBGE ? null : this.serieBCB(7326),
      desocupacaoIBGE ? null : this.serieBCB(24369),
    ]);
    const ipca = ipcaIBGE ?? ipcaBCB;
    const pib = pibIBGE ?? pibBCB;
    const desocupacao = desocupacaoIBGE ?? desocupacaoBCB;

    const falharam = [
      !selic && "Selic", !ptax && "dólar", !confianca && "confiança",
      !ipca && "IPCA", !pib && "PIB", !desocupacao && "desocupação",
    ].filter(Boolean);
    if (falharam.length) {
      console.log(`[ECONOMIA] Sem resposta das fontes oficiais para: ${falharam.join(", ")} (IBGE: IPCA ${ipcaIBGE ? "ok" : "falhou"}, PIB ${pibIBGE ? "ok" : "falhou"}, desocupação ${desocupacaoIBGE ? "ok" : "falhou"}; BCB: Selic ${selic ? "ok" : "falhou"}, dólar ${ptax ? "ok" : "falhou"}, confiança ${confianca ? "ok" : "falhou"}).`);
    }

    let cambio = ptax?.valor ?? null;
    let cambioFonte = ptax ? "BCB" : null;
    if (cambio === null) {
      try {
        const response = await fetch(this.API_URL);
        if (response.ok) {
          const data: ExchangeRateResponse = await response.json();
          cambio = data.rates.BRL;
          cambioFonte = "open.er-api.com";
        }
      } catch { /* segue para o valor anterior */ }
    }

    const anterior = this.cache.data;
    const ref = this.getFallbackData();
    const exchangeRateUSD = cambio ?? anterior?.exchangeRateUSD ?? ref.exchangeRateUSD;
    const previousRate = anterior?.exchangeRateUSD || exchangeRateUSD;

    const algumaSerie = selic || ipca || ptax || pib || confianca || desocupacao;
    const algumIBGE = ipcaIBGE || pibIBGE || desocupacaoIBGE;
    const algumBCB = selic || ptax || confianca || ipcaBCB || pibBCB || desocupacaoBCB;
    const fonteAtual =
      algumIBGE && algumBCB ? "IBGE (IPCA, PIB e PNAD Contínua) e Banco Central do Brasil (Selic, dólar e confiança)"
      : algumIBGE ? "IBGE (IPCA, PIB e PNAD Contínua); Selic e confiança: últimos valores conhecidos (Banco Central indisponível)"
      : "Banco Central do Brasil (SGS)";
    const meta = {
      fonte: algumaSerie
        ? fonteAtual
        : lerMetaIndicadores(anterior?.source)?.fonte ?? "Últimos valores conhecidos (IBGE e Banco Central indisponíveis)",
      referencias: {
        // A série da Selic meta é diária e já vem preenchida até a próxima
        // reunião do Copom; a data não ajuda o leitor, então vale "vigente".
        selic: selic ? "vigente" : null,
        ipca12m: ipca?.data ?? null,
        cambio: ptax?.data ?? null,
        pib: pib?.data ?? null,
        confianca: confianca?.data ?? null,
        desocupacao: desocupacao?.data ?? null,
      },
      cambioFonte,
      // Sem fonte e sem valor anterior, usa o de referência (antes ficava vazio).
      desocupacao: desocupacao?.valor ?? (anterior ? lerMetaIndicadores(anterior.source)?.desocupacao ?? null : null) ?? lerMetaIndicadores(ref.source)?.desocupacao ?? null,
      confiancaEscala: "fecomercio-0-200",
    };

    const economicData: InsertEconomicData = {
      date: new Date(),
      exchangeRateUSD,
      exchangeRateTrend: this.calculateTrend(exchangeRateUSD, previousRate),
      inflationRate: ipca?.valor ?? anterior?.inflationRate ?? ref.inflationRate,
      interestRate: selic?.valor ?? anterior?.interestRate ?? ref.interestRate,
      gdpGrowth: pib?.valor ?? anterior?.gdpGrowth ?? ref.gdpGrowth,
      consumerConfidence: confianca?.valor ?? anterior?.consumerConfidence ?? ref.consumerConfidence,
      source: JSON.stringify(meta),
    };

    if (!algumaSerie) console.error("[ECONOMIA] IBGE e Banco Central indisponíveis — mantidos os últimos valores conhecidos.");

    this.cache = {
      data: {
        id: "",
        date: economicData.date as Date,
        exchangeRateUSD,
        exchangeRateTrend: economicData.exchangeRateTrend || null,
        inflationRate: economicData.inflationRate ?? null,
        interestRate: economicData.interestRate ?? null,
        gdpGrowth: economicData.gdpGrowth ?? null,
        consumerConfidence: economicData.consumerConfidence ?? null,
        source: economicData.source || "",
        createdAt: economicData.date as Date,
      },
      timestamp: now,
    };
    return economicData;
  }

  private calculateTrend(current: number, previous: number): string {
    const change = ((current - previous) / previous) * 100;
    if (change > 2) return "alta";
    if (change < -2) return "baixa";
    return "estavel";
  }

  private getFallbackData(): InsertEconomicData {
    return {
      date: new Date(),
      // Últimos valores oficiais conferidos em 13/10/2026 (BCB/SGS; IPCA e
      // desocupação reconferidos no IBGE em 18/10/2026: 4,58% em set/2026 e
      // 5,3% no trimestre até ago/2026), usados só se as fontes estiverem
      // fora do ar e não houver dado salvo.
      exchangeRateUSD: 4.99,
      exchangeRateTrend: "estavel",
      inflationRate: 4.58,
      interestRate: 13.75,
      gdpGrowth: 2.29,
      consumerConfidence: 120.84,
      source: JSON.stringify({ fonte: "Valores de referência (BCB, 13/10/2026)", referencias: {}, desocupacao: 5.3, confiancaEscala: "fecomercio-0-200" }),
    };
  }

  analyzeEconomicCondition(data: EconomicData): {
    condition: "crise" | "recessao" | "estavel" | "crescimento" | "expansao";
    severity: "baixa" | "media" | "alta";
  } {
    const inflationScore = data.inflationRate! > 8 ? -2 : data.inflationRate! > 6 ? -1 : 0;
    const gdpScore = data.gdpGrowth! > 3 ? 2 : data.gdpGrowth! > 1.5 ? 1 : data.gdpGrowth! > 0 ? 0 : -2;
    // Fecomercio-SP vai de 0 a 200 (100 = neutro); registros antigos usavam 0-100.
    const escala200 = lerMetaIndicadores(data.source)?.confiancaEscala === "fecomercio-0-200";
    const conf = data.consumerConfidence ?? (escala200 ? 100 : 50);
    const confidenceScore = escala200 ? (conf > 110 ? 1 : conf < 90 ? -1 : 0) : (conf > 60 ? 1 : conf < 40 ? -1 : 0);

    const totalScore = inflationScore + gdpScore + confidenceScore;

    let condition: "crise" | "recessao" | "estavel" | "crescimento" | "expansao";
    let severity: "baixa" | "media" | "alta";

    if (totalScore <= -3) {
      condition = "crise";
      severity = "alta";
    } else if (totalScore <= -1) {
      condition = "recessao";
      severity = "media";
    } else if (totalScore <= 1) {
      condition = "estavel";
      severity = "baixa";
    } else if (totalScore <= 3) {
      condition = "crescimento";
      severity = "media";
    } else {
      condition = "expansao";
      severity = "alta";
    }

    return { condition, severity };
  }
}

export const economicService = new EconomicService();

export interface MetaIndicadores {
  fonte?: string;
  referencias?: Record<string, string | null>;
  cambioFonte?: string | null;
  desocupacao?: number | null;
  confiancaEscala?: string;
}

export function lerMetaIndicadores(source: string | null | undefined): MetaIndicadores | null {
  if (!source || !source.trim().startsWith("{")) return null;
  try { return JSON.parse(source); } catch { return null; }
}

const fmt = (v: number | null | undefined, casas = 2) =>
  v === null || v === undefined ? "n/d" : v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** Texto curto com os indicadores oficiais, para os prompts da IA. */
export function indicadoresEmTexto(data: EconomicData | undefined | null): string {
  if (!data) return "";
  const meta = lerMetaIndicadores(data.source);
  if (!meta) return "";
  const r = meta.referencias || {};
  const quando = (k: string) => (r[k] ? ` (${r[k] === "vigente" ? "vigente" : `ref. ${r[k]}`})` : "");
  return [
    `Indicadores oficiais (${meta.fonte || "Banco Central do Brasil"}):`,
    `- Selic meta: ${fmt(data.interestRate)}% a.a.${quando("selic")}`,
    `- IPCA acumulado em 12 meses: ${fmt(data.inflationRate)}%${quando("ipca12m")}`,
    `- Dólar (PTAX): R$ ${fmt(data.exchangeRateUSD, 4)}${quando("cambio")}`,
    `- PIB, variação real no último ano fechado: ${fmt(data.gdpGrowth)}%${quando("pib")}`,
    meta.desocupacao != null ? `- Taxa de desocupação (IBGE, PNAD Contínua, trimestre móvel): ${fmt(meta.desocupacao, 1)}%${quando("desocupacao")}` : "",
    data.consumerConfidence != null ? `- Índice de Confiança do Consumidor (Fecomercio-SP, 100 = neutro): ${fmt(data.consumerConfidence, 1)}${quando("confianca")}` : "",
  ].filter(Boolean).join("\n");
}
