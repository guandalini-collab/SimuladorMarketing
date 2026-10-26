/**
 * Conjuntura Brasil — texto padrão usado pela IA (PESTEL, eventos do
 * Simula+ News e boletim do mês) e mostrado aos alunos na Análise de Mercado.
 *
 * Pedido do professor (out/2026): a IA deve considerar o momento econômico e
 * político real do país, em vez de supor. O modelo de linguagem não conhece
 * fatos recentes, então eles entram aqui, com data e fonte. O professor pode
 * substituir este texto em cada turma (aba Configurar). Atualização prevista
 * pelo lembrete anual de dados de mercado e sempre que houver fato relevante.
 *
 * Os indicadores numéricos (Selic, IPCA, dólar, PIB, desemprego, confiança)
 * NÃO ficam aqui: vêm atualizados do Banco Central (services/economic.ts).
 */
export const CONJUNTURA_ATUALIZADA_EM = "2026-10-26";

export const CONJUNTURA_PADRAO = `ECONOMIA
- Juros: o Copom reduziu a Selic para 13,75% ao ano em 16/09/2026, o sexto corte seguido desde janeiro (15%). Não houve reunião em outubro; a próxima está marcada para 3 e 4 de novembro. O crédito segue caro.
- Inflação: o IPCA subiu 0,82% em setembro e acumula 4,58% em 12 meses, acima do teto da meta (4,5%), pressionado por energia elétrica (fim do bônus de Itaipu e bandeira amarela) e pela volta da alta dos alimentos. A prévia de outubro (IPCA-15) desacelerou para 0,32%, com queda de energia elétrica, água, passagens aéreas e frutas, e acumula 4,62% em 12 meses.
- Atividade: o PIB cresceu 0,5% no 2º trimestre de 2026 (1,9% em quatro trimestres), puxado pela agropecuária e pela indústria extrativa; o consumo das famílias recuou 0,4% no trimestre.
- Emprego e renda: a desocupação ficou em 5,3% no trimestre até agosto, a menor da série para o período, com rendimento habitual de R$ 3.777. Desde 2026, a isenção do Imposto de Renda para quem ganha até R$ 5 mil por mês ampliou a renda disponível (injeção estimada de R$ 26,2 bilhões, segundo o Dieese).
- Câmbio e mercado: na sexta-feira anterior ao 2º turno (23/10), o dólar fechou em R$ 4,99 e o Ibovespa em 205 mil pontos. No primeiro pregão após o resultado da eleição (26/10), o dólar subiu 8,4% e fechou em R$ 5,41; o Ibovespa caiu 13,9%, para 176,6 mil pontos, com acionamento do circuit breaker pela primeira vez desde 2020; e os juros futuros com vencimento em janeiro de 2028 subiram de 12,86% para 14,80% ao ano. Dólar mais alto encarece insumos e produtos importados, e juros futuros mais altos tendem a encarecer o crédito.

POLÍTICA E REGULAÇÃO
- Eleições gerais: no 2º turno presidencial (25/10/2026), Luiz Inácio Lula da Silva (PT) foi reeleito com 51,79% dos votos válidos, contra 48,21% de Flávio Bolsonaro (PL), segundo o TSE. Resultados eleitorais costumam provocar ajustes no câmbio, na bolsa e nos juros nos dias seguintes, e famílias e empresas tendem a aguardar sinais da política econômica do próximo mandato antes de decisões de maior valor.
- Reforma tributária: 2026 é o ano de testes da CBS (0,9%) e do IBS (0,1%), valores compensados nos tributos atuais. Desde 03/08/2026, os campos de CBS e IBS são obrigatórios nas notas fiscais eletrônicas, com novas etapas até janeiro de 2027 (inclusive para o Simples Nacional), o que exige adaptação de sistemas e da gestão fiscal das empresas.

Fontes: IBGE (IPCA, IPCA-15, PIB, PNAD Contínua), Banco Central/Copom, TSE, Agência Brasil, Agência Gov, Dieese (via InfoMoney), Folhapress (via O Tempo), Money Times, CNN Brasil (fechamento do mercado em 26/10) e Mercado&Consumo (calendário da reforma tributária).`;
