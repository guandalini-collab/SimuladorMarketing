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
export const CONJUNTURA_ATUALIZADA_EM = "2026-10-13";

export const CONJUNTURA_PADRAO = `ECONOMIA
- Juros: o Copom reduziu a Selic para 13,75% ao ano em 16/09/2026, o sexto corte seguido desde janeiro (15%). O crédito segue caro, mas em trajetória de queda.
- Inflação: o IPCA subiu 0,82% em setembro e acumula 4,58% em 12 meses, acima do teto da meta (4,5%), pressionado por energia elétrica (fim do bônus de Itaipu e bandeira amarela) e pela volta da alta dos alimentos.
- Atividade: o PIB cresceu 0,5% no 2º trimestre de 2026 (1,9% em quatro trimestres), puxado pela agropecuária e pela indústria extrativa; o consumo das famílias recuou 0,4% no trimestre.
- Emprego e renda: a desocupação ficou em 5,3% no trimestre até agosto, a menor da série para o período, com rendimento habitual de R$ 3.777. Desde 2026, a isenção do Imposto de Renda para quem ganha até R$ 5 mil por mês ampliou a renda disponível (injeção estimada de R$ 26,2 bilhões, segundo o Dieese).
- Câmbio: o dólar voltou a ficar abaixo de R$ 5 no início de outubro (R$ 4,975 em 06/10), com queda de cerca de 9% no ano, o que barateia insumos e produtos importados.

POLÍTICA E REGULAÇÃO
- Eleições gerais: no 1º turno presidencial (04/10/2026), Flávio Bolsonaro (PL) obteve 47,03% e Lula (PT) 45,16% dos votos válidos; os dois disputam o 2º turno em 25/10/2026. Períodos eleitorais costumam elevar a incerteza, e famílias e empresas tendem a adiar compras e investimentos de maior valor até a definição do cenário.
- Reforma tributária: 2026 é o ano de testes da CBS (0,9%) e do IBS (0,1%), valores compensados nos tributos atuais. Desde 03/08/2026, os campos de CBS e IBS são obrigatórios nas notas fiscais eletrônicas, com novas etapas até janeiro de 2027 (inclusive para o Simples Nacional), o que exige adaptação de sistemas e da gestão fiscal das empresas.

Fontes: IBGE (IPCA, PIB, PNAD Contínua), Banco Central/Copom, TSE, Agência Brasil, Dieese (via InfoMoney) e Mercado&Consumo (calendário da reforma tributária).`;
