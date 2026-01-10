import type { EconomicData, InsertMarketEvent, AutoEventConfig } from "@shared/schema";
import { economicService } from "./economic";

interface EventTemplate {
  type: "economico" | "tecnologico" | "social" | "competitivo" | "regulatorio";
  title: string;
  description: string;
  impact: string;
  severity: "baixo" | "medio" | "alto" | "critico";
  condition?: string[];
}

export class EventGenerator {
  private economicEvents: EventTemplate[] = [
    {
      type: "economico",
      title: "Aumento da Taxa de Câmbio",
      description: "O dólar registrou forte alta, elevando custos de importação e matérias-primas importadas.",
      impact: "Aumento de 15-25% nos custos de produtos importados. Empresas com fornecedores internacionais serão mais afetadas.",
      severity: "alto",
      condition: ["alta"],
    },
    {
      type: "economico",
      title: "Queda do Dólar",
      description: "O dólar apresentou queda significativa, favorecendo importações e reduzindo custos.",
      impact: "Redução de 10-20% nos custos de importação. Oportunidade para expansão internacional.",
      severity: "medio",
      condition: ["baixa"],
    },
    {
      type: "economico",
      title: "Inflação em Alta",
      description: "Taxa de inflação acima da meta, pressionando o poder de compra dos consumidores.",
      impact: "Consumidores mais sensíveis a preço. Necessário ajustar estratégia de precificação.",
      severity: "alto",
      condition: ["crise", "recessao"],
    },
    {
      type: "economico",
      title: "Crescimento do PIB",
      description: "Economia em expansão com aumento do PIB e confiança do consumidor.",
      impact: "Aumento de 20-30% na demanda. Consumidores mais dispostos a experimentar novos produtos.",
      severity: "medio",
      condition: ["crescimento", "expansao"],
    },
    {
      type: "economico",
      title: "Recessão Econômica",
      description: "Economia em retração com queda do PIB e aumento do desemprego.",
      impact: "Redução de 30-40% na demanda. Consumidores buscam produtos mais baratos.",
      severity: "alto",
      condition: ["crise", "recessao"],
    },
    {
      type: "economico",
      title: "Estabilidade do Câmbio",
      description: "Dólar mantém estabilidade dentro da faixa esperada pelo mercado.",
      impact: "Previsibilidade para planejamento. Custos de importação estáveis.",
      severity: "baixo",
      condition: ["estavel"],
    },
    {
      type: "economico",
      title: "Economia em Equilíbrio",
      description: "Indicadores econômicos mostram situação equilibrada sem grandes variações.",
      impact: "Ambiente favorável para decisões de médio prazo. Consumo estável.",
      severity: "baixo",
      condition: ["estavel"],
    },
    {
      type: "economico",
      title: "Aumento da Taxa Selic",
      description: "Banco Central eleva taxa de juros para conter inflação, encarecendo crédito.",
      impact: "Redução de 20% nas vendas a prazo. Consumidores preferem pagamento à vista. Custos financeiros aumentam.",
      severity: "alto",
    },
    {
      type: "economico",
      title: "Queda da Taxa Selic",
      description: "Banco Central reduz taxa de juros, facilitando acesso ao crédito.",
      impact: "Aumento de 25% nas vendas parceladas. Maior apetite do consumidor para compras de maior valor.",
      severity: "medio",
    },
    {
      type: "economico",
      title: "Crise no Varejo",
      description: "Grandes redes varejistas anunciam fechamento de lojas e demissões em massa.",
      impact: "Redução de 15% no consumo geral. Oportunidade para capturar clientes insatisfeitos.",
      severity: "medio",
    },
    {
      type: "economico",
      title: "Boom do Crédito Consignado",
      description: "Expansão do crédito consignado aumenta poder de compra de aposentados e servidores.",
      impact: "Aumento de 30% nas vendas para público 50+. Oportunidade em produtos premium.",
      severity: "medio",
    },
  ];

  private technologicalEvents: EventTemplate[] = [
    {
      type: "tecnologico",
      title: "Revolução do E-commerce",
      description: "Explosão nas vendas online com consumidores migrando para plataformas digitais.",
      impact: "Canais digitais apresentam crescimento de 50%. Necessário investir em presença online.",
      severity: "medio",
    },
    {
      type: "tecnologico",
      title: "Avanço em Automação",
      description: "Novas tecnologias de automação permitem redução de custos operacionais.",
      impact: "Possibilidade de reduzir custos em até 15% através de automação de processos.",
      severity: "medio",
    },
    {
      type: "tecnologico",
      title: "Inteligência Artificial no Varejo",
      description: "IA permite personalização em massa e melhor entendimento do consumidor.",
      impact: "Empresas que adotarem IA podem aumentar satisfação do cliente em 25%.",
      severity: "baixo",
    },
    {
      type: "tecnologico",
      title: "Expansão do 5G",
      description: "Chegada da tecnologia 5G revoluciona experiência mobile e IoT.",
      impact: "Velocidade 10x maior permite novos modelos de negócio. Streaming e realidade aumentada viáveis.",
      severity: "medio",
    },
    {
      type: "tecnologico",
      title: "Boom das Redes Sociais",
      description: "Redes sociais se tornam principal canal de descoberta e compra de produtos.",
      impact: "Social commerce cresce 80%. Marketing de influência torna-se essencial.",
      severity: "alto",
    },
    {
      type: "tecnologico",
      title: "Chatbots e Atendimento IA",
      description: "Assistentes virtuais transformam atendimento ao cliente 24/7.",
      impact: "Redução de 40% nos custos de atendimento. Satisfação aumenta com respostas instantâneas.",
      severity: "medio",
    },
    {
      type: "tecnologico",
      title: "Criptomoedas como Pagamento",
      description: "Estabelecimentos começam a aceitar criptomoedas como forma de pagamento.",
      impact: "Acesso a novo público tech-savvy. Redução de taxas de transação.",
      severity: "baixo",
    },
    {
      type: "tecnologico",
      title: "Realidade Aumentada no Varejo",
      description: "AR permite clientes experimentarem produtos virtualmente antes de comprar.",
      impact: "Redução de 30% em devoluções. Aumento de 45% na confiança de compra online.",
      severity: "medio",
    },
  ];

  private socialEvents: EventTemplate[] = [
    {
      type: "social",
      title: "Tendência de Sustentabilidade",
      description: "Consumidores valorizam cada vez mais produtos sustentáveis e empresas responsáveis.",
      impact: "Produtos sustentáveis podem ter premium de preço de até 20%. Aumenta percepção de marca.",
      severity: "medio",
    },
    {
      type: "social",
      title: "Mudança de Hábitos Pós-Pandemia",
      description: "Consumidores adotaram novos hábitos de consumo com foco em conveniência.",
      impact: "Delivery e compras online são preferência de 60% dos consumidores.",
      severity: "medio",
    },
    {
      type: "social",
      title: "Movimento de Valorização Local",
      description: "Crescente preferência por produtos e marcas locais em detrimento de importados.",
      impact: "Marcas nacionais ganham 15% de market share. Oportunidade para posicionamento local.",
      severity: "baixo",
    },
    {
      type: "social",
      title: "Geração Z Domina Consumo",
      description: "Jovens entre 18-25 anos se tornam força dominante de consumo com valores distintos.",
      impact: "Autenticidade e propósito são mais importantes que preço. Influência digital é decisiva.",
      severity: "medio",
    },
    {
      type: "social",
      title: "Envelhecimento da População",
      description: "Brasil tem crescimento acelerado da população acima de 60 anos.",
      impact: "Mercado sênior cresce 35%. Produtos adaptados para terceira idade em alta demanda.",
      severity: "medio",
    },
    {
      type: "social",
      title: "Movimento Fitness e Saudável",
      description: "Explosão da preocupação com saúde, bem-estar e vida ativa.",
      impact: "Produtos saudáveis crescem 60%. Mercado fitness se torna mainstream.",
      severity: "medio",
    },
    {
      type: "social",
      title: "Cultura do Cancelamento",
      description: "Consumidores boicotam empresas por posicionamentos polêmicos ou escândalos.",
      impact: "Reputação da marca pode afetar vendas em 40%. Atenção redobrada em comunicação.",
      severity: "alto",
    },
    {
      type: "social",
      title: "Home Office Permanente",
      description: "Trabalho remoto se consolida mudando padrões de consumo e mobilidade.",
      impact: "Consumo no bairro aumenta 50%. Delivery se torna permanente. Vestuário casual domina.",
      severity: "medio",
    },
    {
      type: "social",
      title: "Ascensão das Famílias Não-Tradicionais",
      description: "Novos arranjos familiares mudam dinâmica de consumo doméstico.",
      impact: "Produtos para famílias monoparentais e LGBTQIA+ crescem 40%. Marketing inclusivo é diferencial.",
      severity: "baixo",
    },
  ];

  private competitiveEvents: EventTemplate[] = [
    {
      type: "competitivo",
      title: "Entrada de Novo Concorrente",
      description: "Grande player internacional anuncia entrada no mercado nacional.",
      impact: "Aumento da competição pode reduzir market share em 10-15%. Necessário reforçar diferenciais.",
      severity: "alto",
    },
    {
      type: "competitivo",
      title: "Guerra de Preços",
      description: "Principais concorrentes iniciam agressiva estratégia de redução de preços.",
      impact: "Pressão por redução de preços de 15-20%. Margens podem ser comprimidas.",
      severity: "alto",
    },
    {
      type: "competitivo",
      title: "Consolidação do Setor",
      description: "Fusões e aquisições reduzem número de players no mercado.",
      impact: "Mercado mais concentrado. Oportunidade para nichos específicos.",
      severity: "medio",
    },
    {
      type: "competitivo",
      title: "Líder de Mercado Lança Inovação",
      description: "Principal concorrente lança produto revolucionário que muda o jogo.",
      impact: "Risco de perder 25% dos clientes. Necessário acelerar inovação ou reposicionar.",
      severity: "alto",
    },
    {
      type: "competitivo",
      title: "Startup Disruptiva Ganha Tração",
      description: "Startup com modelo de negócio inovador atrai atenção e investimentos.",
      impact: "Novos modelos de negócio desafiam status quo. Necessário se reinventar rapidamente.",
      severity: "medio",
    },
    {
      type: "competitivo",
      title: "Concorrente Declara Falência",
      description: "Importante player do mercado anuncia encerramento das atividades.",
      impact: "Oportunidade de capturar 20-30% dos clientes órfãos. Contratar talentos disponíveis.",
      severity: "medio",
    },
    {
      type: "competitivo",
      title: "Aliança Entre Concorrentes",
      description: "Dois grandes players anunciam parceria estratégica ou fusão.",
      impact: "Novo gigante concentra 40% do mercado. Pequenos players precisam se diferenciar.",
      severity: "alto",
    },
    {
      type: "competitivo",
      title: "Guerra de Marketing",
      description: "Concorrentes aumentam drasticamente investimento em propaganda.",
      impact: "Custo de aquisição de cliente sobe 35%. Share of voice diminui sem investimento equivalente.",
      severity: "medio",
    },
  ];

  private regulatoryEvents: EventTemplate[] = [
    {
      type: "regulatorio",
      title: "Nova Legislação Ambiental",
      description: "Governo implementa novas exigências ambientais para produtos e embalagens.",
      impact: "Necessário adequar processos e embalagens, podendo aumentar custos em 8-12%.",
      severity: "medio",
    },
    {
      type: "regulatorio",
      title: "Redução de Impostos",
      description: "Governo anuncia redução de impostos para setor produtivo.",
      impact: "Redução de custos de 10-15%. Oportunidade para reduzir preços ou aumentar margem.",
      severity: "medio",
    },
    {
      type: "regulatorio",
      title: "LGPD em Vigor",
      description: "Lei Geral de Proteção de Dados entra em vigor com fiscalização rigorosa.",
      impact: "Necessário investir em compliance e segurança. Multas podem chegar a 2% do faturamento.",
      severity: "alto",
    },
    {
      type: "regulatorio",
      title: "Aumento de Impostos",
      description: "Reforma tributária aumenta carga fiscal sobre produtos e serviços.",
      impact: "Aumento de 8-15% nos custos. Necessário repassar ou absorver impacto.",
      severity: "alto",
    },
    {
      type: "regulatorio",
      title: "Novas Regras de Publicidade",
      description: "CONAR e governo estabelecem restrições mais rígidas para propaganda.",
      impact: "Campanhas precisam ser mais transparentes. Influencer marketing regulamentado.",
      severity: "medio",
    },
    {
      type: "regulatorio",
      title: "Lei de Incentivo Fiscal",
      description: "Governo cria incentivos para empresas que investirem em inovação e sustentabilidade.",
      impact: "Redução de até 25% em impostos para projetos aprovados. Oportunidade estratégica.",
      severity: "medio",
    },
    {
      type: "regulatorio",
      title: "Regulamentação de Marketplace",
      description: "Nova lei responsabiliza plataformas por produtos vendidos por terceiros.",
      impact: "Marketplaces aumentam exigências. Pequenos vendedores precisam se profissionalizar.",
      severity: "medio",
    },
    {
      type: "regulatorio",
      title: "Proibição de Plástico Descartável",
      description: "Municípios proíbem uso de embalagens plásticas descartáveis.",
      impact: "Necessário substituir embalagens. Custo adicional de 10-20% mas melhora imagem.",
      severity: "medio",
    },
    {
      type: "regulatorio",
      title: "Código de Defesa do Consumidor Atualizado",
      description: "Atualização amplia direitos do consumidor no comércio digital.",
      impact: "Prazo de arrependimento ampliado. Maior transparência exigida. Devoluções aumentam 15%.",
      severity: "medio",
    },
    {
      type: "regulatorio",
      title: "Salário Mínimo Reajustado",
      description: "Governo anuncia reajuste acima da inflação no salário mínimo.",
      impact: "Aumento de 10% no poder de compra da base da pirâmide. Custos trabalhistas sobem 8%.",
      severity: "medio",
    },
  ];

  generateEvents(
    economicData: EconomicData,
    config: AutoEventConfig,
    classId: string,
    roundId: string
  ): Omit<InsertMarketEvent, "roundId" | "classId">[] {
    const { condition, severity } = economicService.analyzeEconomicCondition(economicData);
    const events: Omit<InsertMarketEvent, "roundId" | "classId">[] = [];

    const numEvents = Math.floor(
      Math.random() * (config.maxEventsPerRound - config.minEventsPerRound + 1) +
        config.minEventsPerRound
    );

    const weights = {
      economico: config.economicWeight,
      tecnologico: config.technologicalWeight,
      social: config.socialWeight,
      competitivo: config.competitiveWeight,
      regulatorio: 1 - (config.economicWeight + config.technologicalWeight + config.socialWeight + config.competitiveWeight),
    };

    for (let i = 0; i < numEvents; i++) {
      const eventType = this.selectEventType(weights);
      let eventPool: EventTemplate[] = [];

      switch (eventType) {
        case "economico":
          eventPool = this.economicEvents.filter(
            (e) => !e.condition || e.condition.includes(condition) || e.condition.includes(economicData.exchangeRateTrend || "")
          );
          break;
        case "tecnologico":
          eventPool = this.technologicalEvents;
          break;
        case "social":
          eventPool = this.socialEvents;
          break;
        case "competitivo":
          eventPool = this.competitiveEvents;
          break;
        case "regulatorio":
          eventPool = this.regulatoryEvents;
          break;
      }

      if (eventPool.length > 0) {
        const template = eventPool[Math.floor(Math.random() * eventPool.length)];
        events.push({
          type: template.type,
          title: template.title,
          description: template.description,
          impact: template.impact,
          severity: template.severity,
          active: true,
          autoGenerated: true,
        });
      }
    }

    return events;
  }

  private selectEventType(weights: Record<string, number>): "economico" | "tecnologico" | "social" | "competitivo" | "regulatorio" {
    const rand = Math.random();
    let cumulative = 0;

    for (const [type, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return type as "economico" | "tecnologico" | "social" | "competitivo" | "regulatorio";
      }
    }

    return "economico";
  }

  getAllEventTemplates(): EventTemplate[] {
    return [
      ...this.economicEvents,
      ...this.technologicalEvents,
      ...this.socialEvents,
      ...this.competitiveEvents,
      ...this.regulatoryEvents,
    ];
  }

  getEventTemplatesByType(type: "economico" | "tecnologico" | "social" | "competitivo" | "regulatorio"): EventTemplate[] {
    switch (type) {
      case "economico":
        return this.economicEvents;
      case "tecnologico":
        return this.technologicalEvents;
      case "social":
        return this.socialEvents;
      case "competitivo":
        return this.competitiveEvents;
      case "regulatorio":
        return this.regulatoryEvents;
    }
  }
}

export const eventGenerator = new EventGenerator();
