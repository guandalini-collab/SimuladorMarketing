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

  async fetchLatestData(): Promise<InsertEconomicData> {
    const now = Date.now();
    if (this.cache.data && now - this.cache.timestamp < this.CACHE_DURATION) {
      return {
        date: this.cache.data.date,
        exchangeRateUSD: this.cache.data.exchangeRateUSD,
        exchangeRateTrend: this.cache.data.exchangeRateTrend,
        inflationRate: this.cache.data.inflationRate,
        interestRate: this.cache.data.interestRate,
        gdpGrowth: this.cache.data.gdpGrowth,
        consumerConfidence: this.cache.data.consumerConfidence,
        source: this.cache.data.source,
      };
    }

    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();
      const brlRate = data.rates.BRL;

      const previousRate = this.cache.data?.exchangeRateUSD || brlRate;
      const trend = this.calculateTrend(brlRate, previousRate);

      const economicData: InsertEconomicData = {
        date: new Date(data.time_last_update_utc),
        exchangeRateUSD: brlRate,
        exchangeRateTrend: trend,
        inflationRate: this.simulateInflation(brlRate),
        interestRate: this.simulateInterestRate(),
        gdpGrowth: this.simulateGDPGrowth(),
        consumerConfidence: this.simulateConsumerConfidence(trend),
        source: "open.er-api.com",
      };

      const cacheDate = economicData.date || new Date();
      this.cache = {
        data: {
          id: "",
          date: cacheDate,
          exchangeRateUSD: economicData.exchangeRateUSD,
          exchangeRateTrend: economicData.exchangeRateTrend || null,
          inflationRate: economicData.inflationRate || null,
          interestRate: economicData.interestRate || null,
          gdpGrowth: economicData.gdpGrowth || null,
          consumerConfidence: economicData.consumerConfidence || null,
          source: economicData.source || "",
          createdAt: cacheDate,
        },
        timestamp: now,
      };

      return economicData;
    } catch (error) {
      console.error("Error fetching economic data:", error);
      const fallbackData = this.getFallbackData();
      
      const fallbackCacheDate = fallbackData.date || new Date();
      this.cache = {
        data: {
          id: "",
          date: fallbackCacheDate,
          exchangeRateUSD: fallbackData.exchangeRateUSD,
          exchangeRateTrend: fallbackData.exchangeRateTrend || null,
          inflationRate: fallbackData.inflationRate || null,
          interestRate: fallbackData.interestRate || null,
          gdpGrowth: fallbackData.gdpGrowth || null,
          consumerConfidence: fallbackData.consumerConfidence || null,
          source: fallbackData.source || "",
          createdAt: fallbackCacheDate,
        },
        timestamp: now,
      };
      
      return fallbackData;
    }
  }

  private calculateTrend(current: number, previous: number): string {
    const change = ((current - previous) / previous) * 100;
    if (change > 2) return "alta";
    if (change < -2) return "baixa";
    return "estavel";
  }

  private simulateInflation(exchangeRate: number): number {
    const baseInflation = 4.5;
    const exchangeImpact = (exchangeRate - 5) * 0.3;
    return Math.max(0, Math.min(15, baseInflation + exchangeImpact + Math.random() * 2 - 1));
  }

  private simulateInterestRate(): number {
    return 10.5 + Math.random() * 3 - 1.5;
  }

  private simulateGDPGrowth(): number {
    return 1.5 + Math.random() * 2 - 1;
  }

  private simulateConsumerConfidence(trend: string): number {
    let base = 50;
    if (trend === "alta") base = 45;
    if (trend === "baixa") base = 55;
    return Math.max(0, Math.min(100, base + Math.random() * 10 - 5));
  }

  private getFallbackData(): InsertEconomicData {
    return {
      date: new Date(),
      exchangeRateUSD: 5.5,
      exchangeRateTrend: "estavel",
      inflationRate: 4.5,
      interestRate: 10.5,
      gdpGrowth: 1.5,
      consumerConfidence: 50,
      source: "fallback",
    };
  }

  analyzeEconomicCondition(data: EconomicData): {
    condition: "crise" | "recessao" | "estavel" | "crescimento" | "expansao";
    severity: "baixa" | "media" | "alta";
  } {
    const inflationScore = data.inflationRate! > 8 ? -2 : data.inflationRate! > 6 ? -1 : 0;
    const gdpScore = data.gdpGrowth! > 3 ? 2 : data.gdpGrowth! > 1.5 ? 1 : data.gdpGrowth! > 0 ? 0 : -2;
    const confidenceScore = data.consumerConfidence! > 60 ? 1 : data.consumerConfidence! < 40 ? -1 : 0;

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
