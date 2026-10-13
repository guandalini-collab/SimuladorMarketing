/**
 * Matriz BCG (crescimento × participação), conforme o modelo original da
 * Boston Consulting Group (HENDERSON, 1970). Pedido do professor (out/2026):
 * uma única regra para o aluno, a IA, o servidor e os gráficos.
 *
 * - Eixo vertical: taxa de crescimento do mercado (% ao ano). Corte em 10%.
 * - Eixo horizontal: participação de mercado RELATIVA = participação da
 *   empresa ÷ participação do maior concorrente (se a empresa é a líder, o
 *   maior concorrente é o segundo colocado). Corte em 1,0×. Escala
 *   logarítmica de 0,1× a 10×, com a participação ALTA à ESQUERDA.
 * - Quadrantes: Estrela (alto à esquerda), Ponto de Interrogação (alto à
 *   direita), Vaca Leiteira (embaixo à esquerda), Abacaxi (embaixo à direita).
 * - Tamanho da bolha: receita do produto.
 *
 * Os rótulos em português são os mesmos já gravados no banco e usados no
 * cálculo e no alinhamento estratégico — não mudam.
 */
export const BCG_LIMIAR_CRESCIMENTO = 10;
export const BCG_LIMIAR_PARTICIPACAO = 1;
export const BCG_PARTICIPACAO_MIN = 0.1;
export const BCG_PARTICIPACAO_MAX = 10;

export type QuadranteBcg = "Estrela" | "Vaca Leiteira" | "Ponto de Interrogação" | "Abacaxi";

export function classificarBcg(crescimento: number, participacaoRelativa: number): QuadranteBcg {
  const altoCrescimento = crescimento >= BCG_LIMIAR_CRESCIMENTO;
  const altaParticipacao = participacaoRelativa >= BCG_LIMIAR_PARTICIPACAO;
  if (altoCrescimento && altaParticipacao) return "Estrela";
  if (!altoCrescimento && altaParticipacao) return "Vaca Leiteira";
  if (altoCrescimento && !altaParticipacao) return "Ponto de Interrogação";
  return "Abacaxi";
}

/** Participação relativa a partir das participações (%) da empresa e do maior concorrente. */
export function participacaoRelativa(participacaoEmpresa: number, participacaoMaiorConcorrente: number): number | null {
  if (!(participacaoEmpresa >= 0) || !(participacaoMaiorConcorrente > 0)) return null;
  return participacaoEmpresa / participacaoMaiorConcorrente;
}

export const BCG_ESTRATEGIA: Record<QuadranteBcg, { resumo: string; caixa: string; estrategia: string }> = {
  "Estrela": {
    resumo: "Alto crescimento e alta participação relativa.",
    caixa: "Gera muito caixa, mas também consome muito para acompanhar o crescimento do mercado (saldo próximo de zero).",
    estrategia: "Investir para manter a liderança. Quando o mercado desacelerar, tende a virar Vaca Leiteira.",
  },
  "Vaca Leiteira": {
    resumo: "Baixo crescimento e alta participação relativa.",
    caixa: "Gera mais caixa do que consome (saldo positivo).",
    estrategia: "Manter a posição com investimento moderado e usar o excedente para financiar Estrelas e Pontos de Interrogação.",
  },
  "Ponto de Interrogação": {
    resumo: "Alto crescimento e baixa participação relativa.",
    caixa: "Consome mais caixa do que gera (saldo negativo).",
    estrategia: "Investir seletivamente para ganhar participação e virar Estrela, ou desinvestir se não houver chance de liderança.",
  },
  "Abacaxi": {
    resumo: "Baixo crescimento e baixa participação relativa.",
    caixa: "Gera e consome pouco caixa (saldo baixo ou negativo).",
    estrategia: "Colher o que ainda gera, reposicionar para um nicho ou descontinuar.",
  },
};
