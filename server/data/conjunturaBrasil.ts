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
export const CONJUNTURA_ATUALIZADA_EM = "2026-11-23";

export const CONJUNTURA_PADRAO = `ECONOMIA
- Juros: em 4/11/2026, o Copom manteve a Selic em 13,75% ao ano e interrompeu a sequência de cortes iniciada em janeiro, citando a inflação resistente e os riscos domésticos e externos. O crédito segue caro.
- Inflação: o IPCA subiu 0,14% em outubro, depois de 0,82% em setembro, e acumula 4,10% no ano e 4,63% em 12 meses, acima do teto da meta (4,5%). Em outubro, alimentação e bebidas subiram 1,04%, e transportes (-0,59%) e habitação (-0,51%) recuaram.
- Atividade: o PIB cresceu 0,5% no 2º trimestre de 2026 (1,9% em quatro trimestres), puxado pela agropecuária e pela indústria extrativa; o consumo das famílias recuou 0,4% no trimestre.
- Emprego e renda: a desocupação ficou em 5,2% no 3º trimestre de 2026, a menor para o período desde 2012, com 103,6 milhões de pessoas ocupadas, recorde da série. O rendimento médio de todos os trabalhos foi de R$ 3.762 no trimestre de maio a julho. Desde 2026, a isenção do Imposto de Renda para quem ganha até R$ 5 mil por mês ampliou a renda disponível.
- Câmbio e mercado: depois do 2º turno (25/10), o dólar subiu de forma contínua: fechou em R$ 5,87 em 18/11, alta de 17,6% desde a eleição e maior valor desde abril de 2025, e a cotação oficial (PTAX) de 23/11 foi de R$ 5,97. O Ibovespa fechou em 167,5 mil pontos em 18/11, abaixo dos 205 mil da véspera da eleição. Dólar mais alto encarece insumos e produtos importados.

POLÍTICA E REGULAÇÃO
- Eleições gerais: no 2º turno presidencial (25/10/2026), Luiz Inácio Lula da Silva (PT) foi reeleito com 51,79% dos votos válidos, contra 48,21% de Flávio Bolsonaro (PL), segundo o TSE.
- Ajuste fiscal: em 11/11/2026, o governo apresentou ao Congresso um pacote com economia estimada de R$ 50 bilhões a R$ 60 bilhões em 2027: limite de 2% para o crescimento real das despesas federais, redução adicional de 10% nos benefícios fiscais, limite ao uso de créditos tributários para pagar impostos e revisão de supersalários. A meta é superávit primário de 0,5% do PIB em 2027. O projeto está em votação no Congresso, e a incerteza sobre as contas públicas tem pressionado o câmbio e os juros.
- Reforma tributária: 2026 é o ano de testes da CBS (0,9%) e do IBS (0,1%), compensados nos tributos atuais. Desde 03/08/2026, os campos de CBS e IBS são obrigatórios nas notas fiscais eletrônicas, com novas etapas até janeiro de 2027, inclusive para o Simples Nacional.

Fontes: IBGE (IPCA de outubro, PIB do 2º trimestre, PNAD Contínua do 3º trimestre), Banco Central (Selic e PTAX), TSE, Agência Brasil, IstoÉ, O Liberal e Correio.`;
