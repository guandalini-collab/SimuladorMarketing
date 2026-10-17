export interface Product {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  orderIndex: number;
}

export interface MarketSector {
  id: string;
  name: string;
  description: string;
  marketSize: number;
  growthRate: number;
  /**
   * Fonte dos números reais (pedido do professor, out/2026). Atualização
   * anual lembrada por tarefa agendada (15 de julho).
   */
  fonte?: {
    tamanho: string;
    crescimento: string;
    ano: number;
    estimativa?: boolean;
  };
  /** Consumidores potenciais estimados (calculado abaixo do array). */
  consumidoresPotenciais?: number;
  fonteConsumidores?: string;
  averageMargin: number;
  /**
   * Dados reais (out/2026) para o motor competitivo — mantidos ao lado de
   * averageMargin (que segue em uso nas telas e recomendações atuais) para
   * não alterar nada antes de o motor novo entrar.
   * margemBruta: (receita − custo dos produtos) ÷ receita, em %.
   * margemLiquida: lucro líquido ÷ receita, em %.
   */
  margemBruta?: number;
  margemLiquida?: number;
  fonteMargem?: string;
  /** Verba de marketing como % da receita (método da porcentagem sobre vendas). */
  verbaMarketingPct?: number;
  fonteVerbaMarketing?: string;
  competitionLevel: "baixa" | "media" | "alta";
  businessTypes: string[];
  categories: {
    id: string;
    name: string;
    description: string;
    averagePrice: number;
    demandLevel: "baixa" | "media" | "alta";
    /** Unidade de venda à qual o preço se refere (out/2026). */
    unidade?: string;
    /** Fonte e data do preço médio (pedido do professor: "nada inventado"). */
    fontePreco?: string;
    /** Confiança da fonte: alta (institucional), media (levantamento amplo), baixa (poucas ofertas). */
    confiancaPreco?: "alta" | "media" | "baixa";
  }[];
  products?: Product[];
  trends: string[];
  challenges: string[];
  opportunities: string[];
}

export const marketSectors: MarketSector[] = [
  {
    id: "eletronicos",
    name: "Eletrônicos e Tecnologia",
    description: "Produtos eletrônicos de consumo, computadores, smartphones e acessórios",
    marketSize: 227000000000,
    growthRate: 11.0,
    fonte: {
      tamanho: "Abinee: faturamento da indústria elétrica e eletrônica em 2024",
      crescimento: "Abinee: crescimento de 11% do faturamento em 2024",
      ano: 2024,
    },
    averageMargin: 25,
    margemBruta: 18.6,
    margemLiquida: 1.7,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Electronics (Consumer & Office)",
    verbaMarketingPct: 9.5,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), manufatura",
    competitionLevel: "alta",
    businessTypes: ["B2C", "B2B", "Híbrido"],
    categories: [
      {
        id: "smartphone",
        name: "Smartphone",
        description: "Telefone celular inteligente de última geração",
        averagePrice: 2557,
        demandLevel: "alta",
        unidade: "unidade",
        fontePreco: "IDC Brasil, ticket médio de smartphones, 1º trim. 2025",
        confiancaPreco: "alta"
      },
      {
        id: "tablet",
        name: "Tablet",
        description: "Dispositivo portátil com tela sensível ao toque",
        averagePrice: 1573,
        demandLevel: "media",
        unidade: "unidade",
        fontePreco: "IDC Brasil, ticket médio de tablets, 3º trim. 2023",
        confiancaPreco: "media"
      },
      {
        id: "notebook",
        name: "Notebook",
        description: "Computador portátil para trabalho e entretenimento",
        averagePrice: 3430,
        demandLevel: "alta",
        unidade: "unidade",
        fontePreco: "IDC Brazil PCs Tracker, preço médio de notebooks, 4º trim. 2022",
        confiancaPreco: "media"
      },
      {
        id: "smartwatch",
        name: "Smartwatch",
        description: "Relógio inteligente com funcionalidades conectadas",
        averagePrice: 1564,
        demandLevel: "media",
        unidade: "unidade",
        fontePreco: "IDC Brasil, ticket médio de smartwatches básicos, 2º trim. 2023",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Crescimento de IoT e dispositivos conectados",
      "5G impulsionando vendas de smartphones",
      "Trabalho remoto aumentando demanda por notebooks"
    ],
    challenges: [
      "Alta volatilidade cambial afeta preços",
      "Rápida obsolescência tecnológica",
      "Competição acirrada de marcas globais"
    ],
    opportunities: [
      "Mercado de usados e recondicionados em crescimento",
      "Acessórios e periféricos com margens melhores",
      "Serviços de garantia estendida e suporte"
    ]
  },
  {
    id: "alimentos",
    name: "Alimentos e Bebidas",
    description: "Produtos alimentícios processados, bebidas e snacks",
    marketSize: 918000000000,
    growthRate: 6.1,
    fonte: {
      tamanho: "ABIA: vendas da indústria de alimentos e bebidas ao mercado interno em 2024 (faturamento total, com exportações: R$ 1,277 tri)",
      crescimento: "ABIA: crescimento real das vendas em 2024 (nominal: 9,98%)",
      ano: 2024,
    },
    averageMargin: 18,
    margemBruta: 23.5,
    margemLiquida: 5.1,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Food Processing",
    verbaMarketingPct: 9.7,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), bens de consumo",
    competitionLevel: "alta",
    businessTypes: ["B2C", "B2B", "Híbrido"],
    categories: [
      {
        id: "refrigerante",
        name: "Refrigerante",
        description: "Bebida gaseificada sabor cola, guaraná ou laranja",
        averagePrice: 14.9,
        demandLevel: "alta",
        unidade: "garrafa 2 L",
        fontePreco: "Levantamento de preços em lojas online (mediana de 17 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "suco-natural",
        name: "Suco Natural",
        description: "Suco de frutas 100% natural sem conservantes",
        averagePrice: 30.22,
        demandLevel: "alta",
        unidade: "1 L (integral)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 4 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "baixa"
      },
      {
        id: "snack-saudavel",
        name: "Snack Saudável",
        description: "Barra de cereais, nuts, frutas desidratadas",
        averagePrice: 16.99,
        demandLevel: "media",
        unidade: "unidade (barra)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 15 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "chocolate",
        name: "Chocolate",
        description: "Barra de chocolate ao leite, meio amargo ou branco",
        averagePrice: 11.83,
        demandLevel: "alta",
        unidade: "barra 90 g",
        fontePreco: "Procon-SP, chocolate em barra R$ 131,49/kg, mar. 2026",
        confiancaPreco: "alta"
      }
    ],
    trends: [
      "Aumento da demanda por produtos saudáveis",
      "Crescimento de alimentos plant-based",
      "Consumidores buscam praticidade e conveniência"
    ],
    challenges: [
      "Margens apertadas e alta competição",
      "Regulamentação sanitária rigorosa",
      "Inflação de insumos agrícolas"
    ],
    opportunities: [
      "Nicho de produtos premium e gourmet",
      "E-commerce de alimentos em expansão",
      "Parcerias com restaurantes e delivery"
    ]
  },
  {
    id: "moda",
    name: "Vestuário e Moda",
    description: "Roupas, calçados e acessórios de moda",
    marketSize: 215000000000,
    growthRate: 7.0,
    fonte: {
      tamanho: "Abit: faturamento do setor têxtil e de confecção em 2024",
      crescimento: "Abit: crescimento de cerca de 7% em 2024",
      ano: 2024,
    },
    averageMargin: 45,
    margemBruta: 22.0,
    margemLiquida: 4.2,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Apparel",
    verbaMarketingPct: 7.7,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), média geral",
    competitionLevel: "alta",
    businessTypes: ["B2C", "Híbrido"],
    categories: [
      {
        id: "tenis-esportivo",
        name: "Tênis Esportivo",
        description: "Calçado esportivo para corrida e atividades físicas",
        averagePrice: 98.9,
        demandLevel: "alta",
        unidade: "par",
        fontePreco: "Levantamento de preços em lojas online (mediana de 11 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "jaqueta",
        name: "Jaqueta",
        description: "Jaqueta casual ou esportiva para uso diário",
        averagePrice: 192.95,
        demandLevel: "media",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 18 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "mochila",
        name: "Mochila",
        description: "Mochila urbana ou esportiva para trabalho e lazer",
        averagePrice: 238.25,
        demandLevel: "alta",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 16 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "relogio-pulso",
        name: "Relógio de Pulso",
        description: "Relógio analógico ou digital de moda",
        averagePrice: 389.9,
        demandLevel: "media",
        unidade: "unidade (analógico)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 23 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Sustentabilidade e moda consciente",
      "Influenciadores digitais impulsionam vendas",
      "Fast fashion vs. slow fashion"
    ],
    challenges: [
      "Sazonalidade afeta vendas",
      "Gestão de estoque complexa",
      "Retorno de produtos no e-commerce"
    ],
    opportunities: [
      "Personalização e customização",
      "Moda plus size em crescimento",
      "Aluguel de roupas (moda circular)"
    ]
  },
  {
    id: "cosmeticos",
    name: "Cosméticos e Beleza",
    description: "Produtos de cuidados pessoais, maquiagem e perfumaria",
    marketSize: 200000000000,
    growthRate: 7.0,
    fonte: {
      tamanho: "Abihpec/Euromonitor: vendas ao consumidor de US$ 37,4 bi em 2024 (cerca de R$ 200 bi)",
      crescimento: "Euromonitor: projeção de 7% ao ano até 2027",
      ano: 2024,
      estimativa: true,
    },
    averageMargin: 52,
    margemBruta: 47.5,
    margemLiquida: 5.5,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Household Products",
    verbaMarketingPct: 9.7,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), bens de consumo",
    competitionLevel: "media",
    businessTypes: ["B2C", "B2B"],
    categories: [
      {
        id: "perfume",
        name: "Perfume",
        description: "Fragrância masculina ou feminina de alta qualidade",
        averagePrice: 123.41,
        demandLevel: "alta",
        unidade: "frasco 100 ml",
        fontePreco: "Levantamento de preços em lojas online (mediana de 24 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "creme-facial",
        name: "Creme Facial",
        description: "Hidratante ou anti-idade para o rosto",
        averagePrice: 53.9,
        demandLevel: "alta",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 29 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "shampoo",
        name: "Shampoo",
        description: "Shampoo para diferentes tipos de cabelo",
        averagePrice: 32.99,
        demandLevel: "alta",
        unidade: "frasco",
        fontePreco: "Levantamento de preços em lojas online (mediana de 25 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "batom",
        name: "Batom",
        description: "Batom matte, cremoso ou líquido",
        averagePrice: 30.08,
        demandLevel: "media",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 24 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Clean beauty e ingredientes naturais",
      "Personalização de produtos",
      "Homens consumindo mais cosméticos"
    ],
    challenges: [
      "Regulação ANVISA rigorosa",
      "Alto investimento em marketing",
      "Concorrência de marcas internacionais"
    ],
    opportunities: [
      "Mercado masculino em expansão",
      "Produtos para peles brasileiras",
      "Kits e assinaturas mensais"
    ]
  },
  {
    id: "moveis",
    name: "Móveis e Decoração",
    description: "Móveis residenciais, comerciais e artigos de decoração",
    marketSize: 91500000000,
    growthRate: 12.1,
    fonte: {
      tamanho: "Abimóvel: faturamento da indústria moveleira em 2024",
      crescimento: "Abimóvel: crescimento de 12,1% em 2024",
      ano: 2024,
    },
    averageMargin: 38,
    margemBruta: 27.9,
    margemLiquida: 8.2,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Furn/Home Furnishings",
    verbaMarketingPct: 9.5,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), manufatura",
    competitionLevel: "media",
    businessTypes: ["B2C", "B2B", "Híbrido"],
    categories: [
      {
        id: "sofa",
        name: "Sofá",
        description: "Sofá de 2, 3 ou 5 lugares para sala de estar",
        averagePrice: 1437.34,
        demandLevel: "alta",
        unidade: "unidade (3 lugares)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 20 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "mesa-jantar",
        name: "Mesa de Jantar",
        description: "Mesa para 4, 6 ou 8 pessoas em madeira ou vidro",
        averagePrice: 828.73,
        demandLevel: "media",
        unidade: "unidade (4 lugares)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 25 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "luminaria",
        name: "Luminária",
        description: "Luminária de piso, mesa ou teto decorativa",
        averagePrice: 75.91,
        demandLevel: "media",
        unidade: "unidade (de mesa)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 29 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "estante",
        name: "Estante",
        description: "Estante para livros ou TV em diversos estilos",
        averagePrice: 343.77,
        demandLevel: "media",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 30 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Home office impulsiona vendas",
      "Móveis multifuncionais para espaços pequenos",
      "Sustentabilidade e madeira certificada"
    ],
    challenges: [
      "Logística e entrega complexas",
      "Alto custo de matéria-prima",
      "Ciclo de compra longo"
    ],
    opportunities: [
      "Personalização e design exclusivo",
      "Realidade aumentada para visualização",
      "Aluguel de móveis para eventos"
    ]
  },
  {
    id: "automotivo",
    name: "Automotivo",
    description: "Peças, acessórios e produtos para manutenção automotiva",
    marketSize: 43000000000,
    growthRate: 3.3,
    fonte: {
      tamanho: "McKinsey, para Sindipeças/Abipeças: receita do mercado de reposição (autopeças) em 2024",
      crescimento: "McKinsey: projeção de 3% a 3,5% ao ano até 2040 (R$ 79 bi)",
      ano: 2024,
    },
    averageMargin: 12,
    margemBruta: 18.8,
    margemLiquida: 4.5,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Auto Parts",
    verbaMarketingPct: 9.5,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), manufatura",
    competitionLevel: "alta",
    businessTypes: ["B2C", "B2B"],
    categories: [
      {
        id: "oleo-motor",
        name: "Óleo de Motor",
        description: "Óleo lubrificante sintético ou mineral para motores",
        averagePrice: 52.08,
        demandLevel: "alta",
        unidade: "1 L (sintético 5W30)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 20 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "filtro-ar",
        name: "Filtro de Ar",
        description: "Filtro de ar do motor original ou genérico",
        averagePrice: 22.84,
        demandLevel: "alta",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 4 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "baixa"
      },
      {
        id: "pastilha-freio",
        name: "Pastilha de Freio",
        description: "Jogo de pastilhas de freio dianteiras ou traseiras",
        averagePrice: 116.41,
        demandLevel: "alta",
        unidade: "jogo (dianteira)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 26 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "amortecedor",
        name: "Amortecedor",
        description: "Amortecedor dianteiro ou traseiro",
        averagePrice: 400.5,
        demandLevel: "media",
        unidade: "unidade (dianteiro)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 14 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Crescimento de veículos elétricos e híbridos",
      "Conectividade e carros autônomos",
      "Serviços de compartilhamento de veículos"
    ],
    challenges: [
      "Alta carga tributária",
      "Dependência de financiamento",
      "Mudanças em regulamentações ambientais"
    ],
    opportunities: [
      "Mercado de seminovos aquecido",
      "Serviços de manutenção e garantia",
      "E-commerce de peças automotivas"
    ]
  },
  {
    id: "esportes",
    name: "Esportes e Fitness",
    description: "Artigos esportivos, equipamentos de treino e suplementação",
    marketSize: 183400000000,
    growthRate: 8.0,
    fonte: {
      tamanho: "Sou do Esporte/EY: PIB do Esporte de R$ 183,4 bi em 2023 (1,69% do PIB); academias faturam cerca de R$ 17 bi (Fitness Brasil/EY)",
      crescimento: "Abenutri: suplementos cresceram 8% em 2024 (referência aproximada para o setor)",
      ano: 2023,
      estimativa: true,
    },
    averageMargin: 48,
    margemBruta: 31.8,
    margemLiquida: 3.9,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Recreation",
    verbaMarketingPct: 7.7,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), média geral",
    competitionLevel: "media",
    businessTypes: ["B2C", "B2B", "Híbrido"],
    categories: [
      {
        id: "tenis-corrida",
        name: "Tênis de Corrida",
        description: "Tênis específico para corrida e treinos",
        averagePrice: 341.24,
        demandLevel: "alta",
        unidade: "par",
        fontePreco: "Levantamento de preços em lojas online (mediana de 20 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "bicicleta",
        name: "Bicicleta",
        description: "Bicicleta mountain bike ou speed para treinos",
        averagePrice: 1145.37,
        demandLevel: "media",
        unidade: "unidade (aro 29)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 16 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "bola-futebol",
        name: "Bola de Futebol",
        description: "Bola de futebol de campo, tamanho oficial",
        averagePrice: 132.4,
        demandLevel: "alta",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 18 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "smartband",
        name: "Smartband",
        description: "Pulseira inteligente para monitoramento fitness",
        averagePrice: 354.02,
        demandLevel: "alta",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 15 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Crescimento de academias e treinos ao ar livre",
      "Wearables fitness em alta demanda",
      "Suplementação personalizada"
    ],
    challenges: [
      "Sazonalidade de vendas",
      "Necessidade de certificação ANVISA para suplementos",
      "Concorrência de importados"
    ],
    opportunities: [
      "Vendas online e assinaturas",
      "Personal trainers como influenciadores",
      "Fitness tech e aplicativos"
    ]
  },
  {
    id: "saude",
    name: "Saúde e Bem-estar",
    description: "Suplementos vitamínicos, nutracêuticos e produtos wellness",
    marketSize: 160700000000,
    growthRate: 12.9,
    fonte: {
      tamanho: "CMED/Anvisa: faturamento do mercado farmacêutico em 2024",
      crescimento: "CMED/Anvisa: crescimento nominal de 12,9% em 2024",
      ano: 2024,
    },
    averageMargin: 52,
    margemBruta: 45.6,
    margemLiquida: 10.0,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Healthcare Products",
    verbaMarketingPct: 9.0,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), farmacêutico",
    competitionLevel: "media",
    businessTypes: ["B2C", "B2B"],
    categories: [
      {
        id: "vitamina-c",
        name: "Vitamina C",
        description: "Suplemento de vitamina C em cápsulas ou efervescente",
        averagePrice: 44.26,
        demandLevel: "alta",
        unidade: "frasco",
        fontePreco: "Levantamento de preços em lojas online (mediana de 18 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "whey-protein",
        name: "Whey Protein",
        description: "Proteína isolada do soro do leite para ganho muscular",
        averagePrice: 177.9,
        demandLevel: "alta",
        unidade: "pote 900 g",
        fontePreco: "Levantamento de preços em lojas online (mediana de 24 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "omega-3",
        name: "Ômega 3",
        description: "Suplemento de óleo de peixe para saúde cardiovascular",
        averagePrice: 75.91,
        demandLevel: "alta",
        unidade: "frasco",
        fontePreco: "Levantamento de preços em lojas online (mediana de 21 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "probiotico",
        name: "Probiótico",
        description: "Suplemento probiótico para saúde intestinal",
        averagePrice: 72.89,
        demandLevel: "media",
        unidade: "frasco",
        fontePreco: "Levantamento de preços em lojas online (mediana de 11 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Crescimento do mercado wellness",
      "Autocuidado e prevenção em alta",
      "Suplementação personalizada"
    ],
    challenges: [
      "Regulação ANVISA para suplementos",
      "Necessidade de registro de produtos",
      "Concorrência de importados"
    ],
    opportunities: [
      "Nicho de suplementos naturais",
      "Assinaturas e vendas recorrentes",
      "Educação e conteúdo sobre saúde"
    ]
  },
  {
    id: "educacao",
    name: "Educação e Cursos",
    description: "Ensino privado: cursos técnicos, graduação (presencial e EAD) e pós-graduação",
    marketSize: 44700000000,
    growthRate: 3.3,
    fonte: {
      tamanho: "Estimativa da graduação privada: cerca de 3,2 mi de matrículas presenciais × R$ 835 e 4,9 mi em EAD × R$ 214 por mês (Censo INEP 2024; Hoper/ABMES 2026)",
      crescimento: "Censo INEP: matrículas privadas passaram de 5,8 mi (2014) para 8,1 mi (2024), cerca de 3,3% ao ano",
      ano: 2024,
      estimativa: true,
    },
    averageMargin: 75,
    margemBruta: 51.1,
    margemLiquida: 13.4,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Education",
    verbaMarketingPct: 7.7,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), média geral",
    competitionLevel: "media",
    businessTypes: ["B2C", "B2B"],
    categories: [
      {
        id: "curso-tecnico",
        name: "Curso Técnico",
        description: "Curso técnico de nível médio (CNCT/MEC), mensalidade",
        averagePrice: 109.0,
        demandLevel: "alta",
        unidade: "mensalidade",
        fontePreco: "Senac SP, parcela fixa dos cursos técnicos, turmas de 2026 (Guia da Carreira: média EAD de R$ 99,05)",
        confiancaPreco: "media"
      },
      {
        id: "graduacao-ead",
        name: "Graduação EAD",
        description: "Curso superior a distância (bacharelado, licenciatura ou tecnólogo), mensalidade",
        averagePrice: 214.0,
        demandLevel: "alta",
        unidade: "mensalidade",
        fontePreco: "Pesquisa Hoper de Mensalidades 2026 / ABMES, mediana nacional EAD",
        confiancaPreco: "alta"
      },
      {
        id: "graduacao-presencial",
        name: "Graduação Presencial",
        description: "Curso superior presencial (bacharelado, licenciatura ou tecnólogo), mensalidade",
        averagePrice: 835.0,
        demandLevel: "media",
        unidade: "mensalidade",
        fontePreco: "Pesquisa Hoper de Mensalidades 2026 / ABMES, mediana nacional presencial",
        confiancaPreco: "alta"
      },
      {
        id: "pos-graduacao",
        name: "Pós-graduação (Especialização/MBA)",
        description: "Pós-graduação lato sensu, especialização ou MBA, mensalidade",
        averagePrice: 550.0,
        demandLevel: "alta",
        unidade: "mensalidade",
        fontePreco: "Editais 2025 de Unifran, Braz Cubas e Rio Branco (mediana de 42 cursos presenciais)",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Explosão de educação online pós-pandemia",
      "Microlearning e cursos rápidos",
      "Gamificação no aprendizado"
    ],
    challenges: [
      "Alta taxa de evasão em cursos online",
      "Necessidade de certificação reconhecida",
      "Pirataria de conteúdo"
    ],
    opportunities: [
      "Upskilling e reskilling profissional",
      "Cursos para terceira idade",
      "Educação corporativa B2B"
    ]
  },
  {
    id: "pets",
    name: "Pet Care",
    description: "Produtos e serviços para animais de estimação",
    marketSize: 77000000000,
    growthRate: 12.1,
    fonte: {
      tamanho: "Abinpet/Instituto Pet Brasil: faturamento previsto do mercado pet em 2024",
      crescimento: "Abinpet/Instituto Pet Brasil: crescimento de 12,1% em 2024",
      ano: 2024,
    },
    averageMargin: 42,
    margemBruta: 32.1,
    margemLiquida: 3.5,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Retail (Special Lines), aproximação: a base não tem categoria pet",
    verbaMarketingPct: 7.7,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), média geral",
    competitionLevel: "media",
    businessTypes: ["B2C", "B2B"],
    categories: [
      {
        id: "racao-premium",
        name: "Ração Premium",
        description: "Ração super premium para cães e gatos",
        averagePrice: 175.89,
        demandLevel: "alta",
        unidade: "saco 15 kg",
        fontePreco: "Levantamento de preços em lojas online (mediana de 21 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "petisco",
        name: "Petisco",
        description: "Snacks e petiscos naturais para pets",
        averagePrice: 29.0,
        demandLevel: "alta",
        unidade: "pacote 500 g",
        fontePreco: "Levantamento de preços em lojas online (mediana de 27 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "brinquedo-pet",
        name: "Brinquedo",
        description: "Brinquedos interativos e educativos",
        averagePrice: 21.76,
        demandLevel: "media",
        unidade: "unidade (mordedor)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 25 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "caminha",
        name: "Caminha",
        description: "Cama confortável para cães e gatos",
        averagePrice: 67.85,
        demandLevel: "media",
        unidade: "unidade",
        fontePreco: "Levantamento de preços em lojas online (mediana de 23 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Humanização dos pets (pet parents)",
      "Produtos premium e gourmet",
      "Telemedicina veterinária"
    ],
    challenges: [
      "Sazonalidade em alguns produtos",
      "Necessidade de aprovação MAPA",
      "Logística de produtos perecíveis"
    ],
    opportunities: [
      "Assinaturas de produtos pet",
      "Seguros e planos de saúde pet",
      "E-commerce especializado"
    ]
  },
  {
    id: "construcao",
    name: "Construção e Materiais",
    description: "Materiais de construção, ferramentas e acabamentos",
    marketSize: 318600000000,
    growthRate: 6.1,
    fonte: {
      tamanho: "Abramat/Ecconit: vendas de materiais de construção em 2024",
      crescimento: "Abramat/Ecconit: crescimento nominal de 6,1% em 2024",
      ano: 2024,
    },
    averageMargin: 22,
    margemBruta: 23.9,
    margemLiquida: 3.8,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Building Materials",
    verbaMarketingPct: 1.0,
    fonteVerbaMarketing: "The CMO Survey (Duke), primavera 2024 (EUA), mineração/construção",
    competitionLevel: "media",
    businessTypes: ["B2B", "B2C", "Híbrido"],
    categories: [
      {
        id: "cimento",
        name: "Cimento",
        description: "Saco de cimento 50kg para construção",
        averagePrice: 47.37,
        demandLevel: "alta",
        unidade: "saco 50 kg",
        fontePreco: "Levantamento de preços em lojas online (mediana de 5 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "tinta-latex",
        name: "Tinta Látex",
        description: "Tinta látex acrílica para paredes internas e externas",
        averagePrice: 337.25,
        demandLevel: "alta",
        unidade: "lata 18 L",
        fontePreco: "Levantamento de preços em lojas online (mediana de 27 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      },
      {
        id: "porcelanato",
        name: "Porcelanato",
        description: "Piso porcelanato 60x60cm",
        averagePrice: 77.51,
        demandLevel: "media",
        unidade: "caixa (60×60)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 2 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "baixa"
      },
      {
        id: "torneira",
        name: "Torneira",
        description: "Torneira de bancada ou parede",
        averagePrice: 218.8,
        demandLevel: "media",
        unidade: "unidade (cozinha)",
        fontePreco: "Levantamento de preços em lojas online (mediana de 22 ofertas, comparador Buscapé), 17/10/2026",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Construção sustentável e eco-friendly",
      "Automação residencial (smart homes)",
      "Pré-fabricados e construção modular"
    ],
    challenges: [
      "Volatilidade de preços de commodities",
      "Dependência do mercado imobiliário",
      "Sazonalidade das obras"
    ],
    opportunities: [
      "Reformas residenciais pós-pandemia",
      "Produtos eco-sustentáveis premium",
      "Consultoria e projetos personalizados"
    ]
  },
  {
    id: "entretenimento",
    name: "Entretenimento e Mídia",
    description: "Streaming, eventos, jogos e conteúdo digital",
    marketSize: 278700000000,
    growthRate: 6.7,
    fonte: {
      tamanho: "PwC: receita de US$ 51,7 bi do mercado de entretenimento e mídia em 2024 (cerca de R$ 279 bi)",
      crescimento: "PwC: crescimento de 6,7% em 2024; projeção de 4,4% ao ano até 2029",
      ano: 2024,
      estimativa: true,
    },
    averageMargin: 58,
    margemBruta: 58.5,
    margemLiquida: 12.1,
    fonteMargem: "Damodaran (NYU Stern), Margins by Sector – Emerging Markets, jan. 2026, categoria Entertainment",
    verbaMarketingPct: 7.7,
    fonteVerbaMarketing: "Gartner CMO Spend Survey 2025 (América do Norte e Europa), média geral",
    competitionLevel: "alta",
    businessTypes: ["B2C", "B2B"],
    categories: [
      {
        id: "streaming-video",
        name: "Streaming de Vídeo",
        description: "Assinatura mensal de plataforma de vídeo sob demanda",
        averagePrice: 44.9,
        demandLevel: "alta",
        unidade: "assinatura mensal",
        fontePreco: "Netflix Padrão R$ 44,90 (mediana dos planos padrão de Netflix, Prime Video, Disney+, Max e Globoplay), Oficina da Net, ago. 2026",
        confiancaPreco: "alta"
      },
      {
        id: "streaming-musica",
        name: "Streaming de Música",
        description: "Assinatura mensal de serviço de música online",
        averagePrice: 23.9,
        demandLevel: "alta",
        unidade: "assinatura mensal",
        fontePreco: "Spotify Premium Individual, reajuste de ago. 2025 (Tecnoblog)",
        confiancaPreco: "alta"
      },
      {
        id: "jogo-digital",
        name: "Jogo Digital",
        description: "Game para PC, console ou mobile",
        averagePrice: 399.9,
        demandLevel: "alta",
        unidade: "unidade (lançamento)",
        fontePreco: "Sony, preço padrão de lançamentos first-party para PS5, maio 2025 (Fast Company Brasil)",
        confiancaPreco: "alta"
      },
      {
        id: "ingresso-show",
        name: "Ingresso de Show",
        description: "Ingresso para show ou evento presencial",
        averagePrice: 200.0,
        demandLevel: "media",
        unidade: "ingresso",
        fontePreco: "Serasa/Opinion Box 2025: faixa de gasto mais comum por ingresso R$ 101–300 (valor central)",
        confiancaPreco: "media"
      }
    ],
    trends: [
      "Bundling de serviços de streaming",
      "Conteúdo original e exclusivo",
      "Gaming como serviço (cloud gaming)"
    ],
    challenges: [
      "Alta concorrência entre plataformas",
      "Pirataria digital",
      "Custo de produção de conteúdo"
    ],
    opportunities: [
      "Conteúdo regional e local",
      "Eventos híbridos (presencial + online)",
      "NFTs e conteúdo exclusivo digital"
    ]
  }
];

/**
 * Consumidores potenciais (pedido do professor, out/2026). Quando há base
 * conhecida, usa-se o público do setor; senão, a população do país (IBGE:
 * 213,4 milhões em 1º/07/2025), e o professor pode refinar para um nicho.
 * Para eletrônicos e móveis, a estimativa é o tamanho do mercado ÷ preço
 * médio das categorias do setor no jogo.
 */
export const POPULACAO_BRASIL = 213_400_000;
const BASE_CONSUMIDORES: Record<string, { valor: number; fonte: string }> = {
  esportes: { valor: 15_000_000, fonte: "Alunos de academias em 2024 (Panorama Setorial Fitness Brasil/EY)" },
  educacao: { valor: 8_100_000, fonte: "Matrículas na graduação privada em 2024 (Censo da Educação Superior/INEP)" },
};
export const FONTE_CONSUMIDORES: Record<string, string> = {};
// (o texto da fonte também vai em setor.fonteConsumidores, para a tela)
for (const setor of marketSectors) {
  const base = BASE_CONSUMIDORES[setor.id];
  if (base) {
    setor.consumidoresPotenciais = base.valor;
    FONTE_CONSUMIDORES[setor.id] = base.fonte;
    setor.fonteConsumidores = base.fonte;
    continue;
  }
  const precos = setor.categories.map((c) => c.averagePrice).filter((v) => v > 0);
  const precoMedio = precos.length ? precos.reduce((x, y) => x + y, 0) / precos.length : 0;
  const estimado = precoMedio > 0 ? Math.round(setor.marketSize / precoMedio) : POPULACAO_BRASIL;
  if (estimado < POPULACAO_BRASIL) {
    setor.consumidoresPotenciais = estimado;
    FONTE_CONSUMIDORES[setor.id] = "Estimativa: tamanho do mercado ÷ preço médio das categorias do setor no jogo";
  } else {
    setor.consumidoresPotenciais = POPULACAO_BRASIL;
    FONTE_CONSUMIDORES[setor.id] = "População do Brasil (IBGE, 1º/07/2025); refine se o produto atender a um nicho";
  }
  setor.fonteConsumidores = FONTE_CONSUMIDORES[setor.id];
}

export interface TargetAudience {
  socialClass: {
    id: string;
    name: string;
    description: string;
    monthlyIncome: string;
    buyingBehavior: string;
  }[];
  ageRanges: {
    id: string;
    name: string;
    range: string;
    characteristics: string;
  }[];
  profiles: {
    id: string;
    name: string;
    description: string;
    preferredChannels: string[];
  }[];
}

export const targetAudiences: TargetAudience = {
  socialClass: [
    {
      id: "classe_a",
      name: "Classe A",
      description: "Alta renda, padrão de vida elevado",
      monthlyIncome: "Acima de R$ 20.000",
      buyingBehavior: "Valoriza qualidade, exclusividade e status. Menos sensível a preço."
    },
    {
      id: "classe_b",
      name: "Classe B",
      description: "Média-alta renda, consumo diversificado",
      monthlyIncome: "R$ 10.000 - R$ 20.000",
      buyingBehavior: "Busca equilíbrio entre qualidade e preço. Valoriza marcas reconhecidas."
    },
    {
      id: "classe_c",
      name: "Classe C",
      description: "Classe média, maior segmento populacional",
      monthlyIncome: "R$ 4.000 - R$ 10.000",
      buyingBehavior: "Sensível a preço mas aspira produtos melhores. Busca promoções e parcelamento."
    },
    {
      id: "classe_d",
      name: "Classe D",
      description: "Baixa renda, consumo básico",
      monthlyIncome: "R$ 2.000 - R$ 4.000",
      buyingBehavior: "Muito sensível a preço. Prioriza necessidades básicas e durabilidade."
    },
    {
      id: "classe_e",
      name: "Classe E",
      description: "Renda muito baixa, consumo essencial",
      monthlyIncome: "Até R$ 2.000",
      buyingBehavior: "Extremamente sensível a preço. Compra apenas essencial."
    }
  ],
  ageRanges: [
    {
      id: "gen_z",
      name: "Geração Z (16-26 anos)",
      range: "16-26 anos",
      characteristics: "Nativos digitais, valorizam autenticidade, sustentabilidade e diversidade. Influenciados por redes sociais."
    },
    {
      id: "millennials",
      name: "Millennials (27-42 anos)",
      range: "27-42 anos",
      characteristics: "Conectados, valorizam experiências sobre posses. Buscam conveniência e personalização."
    },
    {
      id: "gen_x",
      name: "Geração X (43-58 anos)",
      range: "43-58 anos",
      characteristics: "Equilibram tradição e inovação. Valorizam qualidade e boa relação custo-benefício."
    },
    {
      id: "boomers",
      name: "Baby Boomers (59-77 anos)",
      range: "59-77 anos",
      characteristics: "Leais a marcas, valorizam atendimento presencial. Crescente presença digital."
    },
    {
      id: "kids",
      name: "Crianças (0-15 anos)",
      range: "0-15 anos",
      characteristics: "Influenciadores de compra familiar. Atraídos por personagens e gamificação."
    }
  ],
  profiles: [
    {
      id: "jovens_urbanos",
      name: "Jovens Urbanos",
      description: "Moradores de grandes cidades, conectados, buscam tendências",
      preferredChannels: ["Instagram", "TikTok", "E-commerce", "Influencers"]
    },
    {
      id: "familias",
      name: "Famílias",
      description: "Decisão de compra compartilhada, priorizam praticidade e valor",
      preferredChannels: ["Facebook", "WhatsApp", "Supermercados", "TV"]
    },
    {
      id: "profissionais",
      name: "Profissionais",
      description: "Foco em produtividade e desenvolvimento, alto poder aquisitivo",
      preferredChannels: ["LinkedIn", "E-commerce", "Lojas especializadas"]
    },
    {
      id: "aposentados",
      name: "Aposentados",
      description: "Tempo livre, buscam qualidade de vida e saúde",
      preferredChannels: ["TV", "Rádio", "Lojas físicas", "Recomendações"]
    },
    {
      id: "estudantes",
      name: "Estudantes",
      description: "Renda limitada, buscam promoções e marcas jovens",
      preferredChannels: ["Redes sociais", "Apps", "Marketplaces"]
    },
    {
      id: "empreendedores",
      name: "Empreendedores",
      description: "Buscam soluções B2B, valorizam ROI e eficiência",
      preferredChannels: ["LinkedIn", "Google", "Feiras", "Networking"]
    }
  ]
};

export const businessTypes = [
  {
    id: "b2c",
    name: "B2C (Business to Consumer)",
    description: "Venda direta para consumidores finais",
    characteristics: [
      "Volume de vendas maior",
      "Ticket médio menor",
      "Decisão de compra mais rápida",
      "Marketing focado em emoção e lifestyle",
      "Canais: varejo, e-commerce, redes sociais"
    ],
    examples: "Lojas de roupas, supermercados, farmácias, e-commerce"
  },
  {
    id: "b2b",
    name: "B2B (Business to Business)",
    description: "Venda entre empresas",
    characteristics: [
      "Volume de vendas menor",
      "Ticket médio maior",
      "Decisão de compra mais longa (comitê)",
      "Marketing focado em ROI e eficiência",
      "Canais: vendedores, distribuidores, feiras"
    ],
    examples: "Fornecedores industriais, atacadistas, softwares corporativos"
  },
  {
    id: "hibrido",
    name: "Híbrido (B2C + B2B)",
    description: "Opera em ambos os mercados simultaneamente",
    characteristics: [
      "Estratégias diferenciadas por segmento",
      "Maior complexidade operacional",
      "Diversificação de receita",
      "Precificação diferenciada",
      "Canais múltiplos e integrados"
    ],
    examples: "Papelarias, lojas de materiais de construção, tecnologia"
  }
];

export const competitionLevels = [
  {
    id: "baixa",
    name: "Concorrência Baixa",
    description: "Mercado com poucos competidores estabelecidos",
    implications: [
      "Margens de lucro potencialmente maiores",
      "Menor necessidade de investimento em marketing",
      "Risco de entrada de novos competidores",
      "Maior poder de precificação"
    ]
  },
  {
    id: "media",
    name: "Concorrência Média",
    description: "Mercado equilibrado com diversos competidores",
    implications: [
      "Necessidade de diferenciação clara",
      "Margens moderadas",
      "Investimento balanceado em marketing",
      "Foco em qualidade e atendimento"
    ]
  },
  {
    id: "alta",
    name: "Concorrência Alta",
    description: "Mercado saturado com muitos competidores",
    implications: [
      "Margens apertadas",
      "Alto investimento em marketing necessário",
      "Diferenciação crítica para sobrevivência",
      "Guerra de preços frequente"
    ]
  }
];
