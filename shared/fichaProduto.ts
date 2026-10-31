/**
 * Ficha dos produtos (grupo G, nov/2026).
 *
 * Pedido do professor: o aluno escolhia "básico, médio ou premium" sem saber o
 * que isso significa para cada produto (é um celular barato? caro?
 * tecnológico?). A ficha descreve, para cada categoria de Eletrônicos, o que
 * cada nível de qualidade e de características representa em termos
 * concretos, e o custo unitário que o motor usa.
 *
 * As descrições são EXEMPLOS ILUSTRATIVOS de mercado (o tipo de aparelho que
 * costuma estar em cada nível), não especificações técnicas oficiais nem
 * dados de pesquisa. Os números (preço de referência, margem, fatores) são os
 * mesmos do motor competitivo e do Manual do Aluno (Apêndices A e C).
 */

export const FATOR_VALOR_QUALIDADE: Record<string, number> = { basico: 0.85, medio: 1.0, premium: 1.3 };
export const FATOR_VALOR_RECURSOS: Record<string, number> = { basico: 0.96, intermediario: 1.0, completo: 1.08 };
export const FATOR_CUSTO_QUALIDADE: Record<string, number> = { basico: 0.82, medio: 1.0, premium: 1.2 };
export const FATOR_CUSTO_RECURSOS: Record<string, number> = { basico: 0.94, intermediario: 1.0, completo: 1.08 };
/** Tributos sobre vendas usados no motor (alíquota simplificada). */
const TRIBUTOS = 0.12;

export interface FichaCategoria {
  qualidade: Record<"basico" | "medio" | "premium", string>;
  recursos: Record<"basico" | "intermediario" | "completo", string>;
}

export const FICHAS_ELETRONICOS: Record<string, FichaCategoria> = {
  smartphone: {
    qualidade: {
      basico: "Aparelho de entrada: corpo em plástico, componentes de menor custo e vida útil mais curta",
      medio: "Intermediário: acabamento e componentes no padrão mais vendido do mercado",
      premium: "Topo de linha: vidro e metal, componentes de maior durabilidade e resistência à água",
    },
    recursos: {
      basico: "Uma câmera simples, tela HD+, pouca memória e armazenamento",
      intermediario: "Duas ou mais câmeras, tela Full HD, 5G e armazenamento médio",
      completo: "Câmeras múltiplas com zoom óptico, tela de alta taxa de atualização, carregamento rápido e NFC",
    },
  },
  notebook: {
    qualidade: {
      basico: "Entrada: carcaça plástica, construção simples, para navegação e documentos",
      medio: "Intermediário: construção no padrão de estudo e trabalho do dia a dia",
      premium: "Topo de linha: carcaça metálica, mais leve e resistente, melhor teclado e tela",
    },
    recursos: {
      basico: "Processador de entrada, pouca memória, armazenamento menor e tela HD",
      intermediario: "Processador intermediário, SSD e tela Full HD",
      completo: "Processador de alto desempenho, mais memória, placa de vídeo dedicada ou tela de alta resolução",
    },
  },
  tablet: {
    qualidade: {
      basico: "Entrada: corpo em plástico, componentes de menor custo",
      medio: "Intermediário: acabamento e componentes no padrão mais vendido do mercado",
      premium: "Topo de linha: corpo em metal, tela e componentes de maior qualidade",
    },
    recursos: {
      basico: "Tela de 8 a 10 polegadas, para vídeo, leitura e navegação",
      intermediario: "Tela maior e de melhor resolução, mais armazenamento",
      completo: "Suporte a caneta e teclado, conexão móvel e tela de alta resolução",
    },
  },
  smartwatch: {
    qualidade: {
      basico: "Entrada: caixa e pulseira em plástico, menor resistência",
      medio: "Intermediário: acabamento no padrão mais vendido do mercado",
      premium: "Topo de linha: caixa em metal ou titânio, vidro mais resistente",
    },
    recursos: {
      basico: "Contador de passos, notificações e frequência cardíaca",
      intermediario: "GPS integrado e mais modos de exercício",
      completo: "GPS, conexão móvel (eSIM), pagamento por aproximação e sensores avançados de saúde",
    },
  },
};

export function fichaDaCategoria(setorId: string | undefined, categoriaId: string | undefined): FichaCategoria | null {
  if (setorId !== "eletronicos" || !categoriaId) return null;
  return FICHAS_ELETRONICOS[categoriaId] ?? null;
}

/**
 * Custo unitário estimado na semana-base (antes do efeito do dólar e da
 * inflação), igual ao do motor: preço de referência × (1 − tributos) ×
 * (1 − margem bruta) × fator de qualidade × fator de características.
 */
export function custoUnitarioEstimado(precoReferencia: number, margemBrutaPct: number, qualidade: string, recursos: string): number {
  const base = precoReferencia * (1 - TRIBUTOS) * (1 - margemBrutaPct / 100);
  return base * (FATOR_CUSTO_QUALIDADE[qualidade] ?? 1) * (FATOR_CUSTO_RECURSOS[recursos] ?? 1);
}
