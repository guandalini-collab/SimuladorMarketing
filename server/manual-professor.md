# Manual do Professor — Simula+

## Sobre este manual

Este manual tem dois objetivos complementares. O primeiro é operacional: explicar, passo a passo, como configurar uma turma, conduzir rodadas e interpretar os resultados. O segundo é acadêmico: mostrar **em que teoria de gestão e marketing cada ferramenta e cada decisão do simulador se apoia**, para que você possa conectar explicitamente o que o aluno faz na tela ao que ele estuda em sala de aula. A Seção 2 concentra esse segundo objetivo; as demais seções tratam do uso prático do sistema.

## 1. Visão Geral do Sistema

O Simula+ é uma plataforma educacional que simula o ambiente de negócios: equipes de estudantes competem em um mercado virtual, tomando decisões estratégicas de marketing ao longo de rodadas sucessivas.

### Objetivos Pedagógicos

1. **Aplicação Prática**: transformar teoria de marketing em decisões concretas
2. **Pensamento Estratégico**: desenvolver a capacidade de análise e planejamento
3. **Trabalho em Equipe**: promover colaboração e negociação
4. **Análise de Dados**: interpretar KPIs e métricas de desempenho

## 2. Fundamentação Teórica: quais autores embasam o Simula+

Nenhuma regra do simulador foi criada de forma arbitrária: cada ferramenta de análise estratégica e cada decisão de Mix de Marketing tem uma teoria de referência específica, que orientou tanto o desenho pedagógico quanto — sempre que aplicável — a lógica de cálculo implementada no sistema. Esta seção existe para que você possa, em sala de aula, dizer ao aluno não apenas "preencha a Matriz BCG", mas "preencha a Matriz BCG porque ela aplica o modelo de Bruce Henderson (1970) de gestão de portfólio de produtos".

### 2.1 As cinco ferramentas de diagnóstico estratégico

As cinco ferramentas ficam na tela **Estratégia**. Quatro delas são pré-requisito obrigatório para a equipe acessar a tela de Decisões (Marketing Mix); a quinta (Segmentação de Mercado) não bloqueia esse acesso, mas compõe a pontuação de Alinhamento Estratégico da equipe — ambas, portanto, merecem atenção do professor, ainda que por razões distintas (ver Seção 4).

| Ferramenta | Autor(es) de referência | Conceito-chave | O que ela ensina ao aluno |
|---|---|---|---|
| **Análise SWOT** | Albert Humphrey (década de 1960); Kotler & Armstrong; Pride & Ferrell; Hoskisson, Hitt, Ireland & Harrison | Diagnóstico interno (Forças/Fraquezas) e externo (Oportunidades/Ameaças) | Ligar o autodiagnóstico da empresa a uma decisão concreta — no simulador, a coerência entre a SWOT declarada e o preço praticado é verificada automaticamente |
| **5 Forças de Porter** | Michael Porter (1979; 1980; 2008) | Intensidade competitiva do setor (rivalidade, poder de barganha de clientes e fornecedores, ameaça de novos entrantes e de substitutos) | Traduzir a leitura do ambiente competitivo em decisões de preço e investimento promocional |
| **Matriz BCG** | Bruce Henderson / Boston Consulting Group (1970) | Gestão de portfólio por crescimento de mercado × participação relativa (Estrela, Vaca Leiteira, Ponto de Interrogação, Abacaxi) | Diferenciar a lógica de investimento conforme a posição do produto no portfólio |
| **PESTEL** | Hoskisson, Hitt, Ireland & Harrison; Kotler & Armstrong; Piercy, Hooley & Nicoulaud | Macroambiente (Político, Econômico, Social, Tecnológico, Ambiental, Legal) | Conectar variáveis macroambientais amplas a decisões táticas de preço e canal |
| **Segmentação — B2C** | Kotler & Keller (modelo STP: Segmentation, Targeting, Positioning); Wedel & Kamakura | Critérios demográfico, geográfico, psicográfico e comportamental | Ajustar preço e canal ao segmento-alvo declarado, evitando dissonância entre discurso e prática |
| **Segmentação — B2B** | Hutt & Speh; Kotler & Armstrong | Variáveis firmográficas e centro de compras organizacional | Reconhecer que a lógica de segmentação organizacional difere estruturalmente da segmentação de consumidor final |

### 2.2 As decisões de Mix de Marketing (4 Ps)

| Decisão | Autor(es) de referência | Ideia central aplicada |
|---|---|---|
| Qualidade e Características do Produto | Kotler & Armstrong (três níveis de produto; produto ampliado); Pride & Ferrell | Produto como pacote de benefícios — qualidade superior custa mais e não é "grátis" |
| Posicionamento de Marca | Ries & Trout; Piercy, Hooley & Nicoulaud | Posicionamento como disputa pela percepção do consumidor; consistência da mensagem |
| Estratégia e Valor de Preço | Kotler & Armstrong; Piercy, Hooley & Nicoulaud | Preço como único elemento do mix que gera receita diretamente, e como sinal de valor percebido |
| Canais e Cobertura de Distribuição | Pride & Ferrell; Kotler & Armstrong; Piercy, Hooley & Nicoulaud | Distribuição como conjunto de decisões de canal e alcance, com custo de oportunidade |
| Seleção de Mídias e Intensidade Promocional | Kotler & Armstrong (mix promocional); Krugman (1972), Naples (1979), Tellis (1997) — frequência efetiva de mídia; Pride & Ferrell | Planejar composição e intensidade de mídia sob restrição orçamentária, com retornos decrescentes |
| Identidade da Empresa (nome, slogan, logomarca) | Aaker (1991) — Brand Equity | Construção de identidade de marca como exercício próprio, complementar ao cálculo financeiro |

### 2.3 O elo entre teoria e prática: o Alinhamento Estratégico

A pontuação de **Alinhamento Estratégico** — descrita em detalhe na Seção 9 — não é uma ferramenta isolada: é o mecanismo que conecta as cinco ferramentas de diagnóstico (Seção 2.1) às decisões de Mix de Marketing (Seção 2.2). Cada uma das cinco ferramentas contribui igualmente para o bloco de coerência (70% da pontuação); a completude das cinco ferramentas soma os 30% restantes. Pedagogicamente, é neste ponto que o simulador testa se o aluno integrou diagnóstico e execução — não apenas se preencheu cada instrumento isoladamente. Vale destacar isso para a turma: uma SWOT bem escrita que não se reflete no preço praticado é penalizada, exatamente como aconteceria numa análise real malconduzida.

### 2.4 Referências bibliográficas

As obras abaixo compõem o aparato acadêmico já incorporado ao Simula+ (citado no manual do aluno embutido no aplicativo). Duas entradas têm a edição/editora da tradução brasileira ainda não confirmada com segurança bibliográfica — isso está sinalizado explicitamente, em vez de apresentar uma edição não verificada como certa.

AAKER, David A. **Managing Brand Equity**. New York: Free Press, 1991.

ANSOFF, H. Igor. Strategies for Diversification. **Harvard Business Review**, 1957.

ASSAF NETO, Alexandre. **Finanças Corporativas e Valor**. 7. ed. São Paulo: Atlas, 2014.

BUZZELL, Robert D.; GALE, Bradley T. **The PIMS Principles: Linking Strategy to Performance**. New York: Free Press, 1987.

CABRAL, Luís M. B. **Introduction to Industrial Organization**. Cambridge: MIT Press, 2000.

CHIAVENATO, Idalberto; SAPIRO, Arão. **Planejamento Estratégico: Fundamentos e Aplicações**. Rio de Janeiro: Elsevier, 2003.

CHRISTENSEN, Clayton M. **The Innovator's Dilemma: When New Technologies Cause Great Firms to Fail**. Boston: Harvard Business School Press, 1997.

DAMODARAN, Aswath. **Investment Valuation: Tools and Techniques for Determining the Value of Any Asset**. 3. ed. Hoboken: Wiley Finance, 2012.

DRÈZE, Xavier; HUSSHERR, François-Xavier. Internet advertising: Is anybody watching? **Journal of Interactive Marketing**, 2003.

DRUCKER, Peter F. **The Essential Drucker: The Best of Sixty Years of Peter Drucker's Essential Writings on Management**. New York: HarperBusiness, 2001.

GITMAN, Lawrence J. **Princípios de Administração Financeira**. 12. ed. São Paulo: Pearson Prentice Hall, 2010.

HENDERSON, Bruce D. **The Product Portfolio**. Boston: Boston Consulting Group, 1970.

HOSKISSON, Robert E.; HITT, Michael A.; IRELAND, R. Duane; HARRISON, Jeffrey S. **Estratégia Competitiva**. São Paulo: Cengage Learning, 2013.

HUTT, Michael D.; SPEH, Thomas W. **Business Marketing Management: B2B**. Mason: Cengage Learning. [Edição consultada não confirmada com segurança.]

JOHNSON, Gerry; SCHOLES, Kevan; WHITTINGTON, Richard. **Explorando a Estratégia Corporativa: Texto e Casos**. 7. ed. Porto Alegre: Bookman, 2007.

KOTLER, Philip; ARMSTRONG, Gary. **Princípios de Marketing**. 15. ed. São Paulo: Pearson Education do Brasil, 2018.

KOTLER, Philip; KELLER, Kevin Lane. **Administração de Marketing**. 15. ed. São Paulo: Pearson Education do Brasil, 2016.

KRUGMAN, Herbert E. Why three exposures may be enough. **Journal of Advertising Research**, v. 12, n. 6, p. 11-14, 1972.

MINTZBERG, Henry; AHLSTRAND, Bruce; LAMPEL, Joseph. **Safári de Estratégia: Um Roteiro pela Selva do Planejamento Estratégico**. 2. ed. Porto Alegre: Bookman, 2010.

NAPLES, Michael J. **Effective Frequency: The Relationship Between Frequency and Advertising Effectiveness**. New York: Association of National Advertisers, 1979.

PIERCY, Nigel F.; HOOLEY, Graham J.; NICOULAUD, Brigitte. **Estratégia de Marketing e Posicionamento Competitivo**. 5. ed. São Paulo: Pearson Prentice Hall, 2017.

PORTER, Michael E. **Competitive Strategy: Techniques for Analyzing Industries and Competitors**. New York: Free Press, 1980.

PORTER, Michael E. How competitive forces shape strategy. **Harvard Business Review**, v. 57, n. 2, p. 137-145, mar./abr. 1979.

PORTER, Michael E. **Vantagem Competitiva: Criando e Sustentando um Desempenho Superior**. Rio de Janeiro: Elsevier, 1989.

PORTER, Michael E. What is strategy? **Harvard Business Review**, v. 74, n. 6, p. 61-78, nov./dez. 1996.

PORTER, Michael E. The five competitive forces that shape strategy. **Harvard Business Review**, v. 86, n. 1, p. 78-93, jan. 2008.

PRIDE, William M.; FERRELL, O. C. **Fundamentos de Marketing: Conceitos e Estratégias**. São Paulo: Cengage Learning, 2015.

REICHHELD, Frederick F. **The Ultimate Question: Driving Good Profits and True Growth**. Boston: Harvard Business School Press, 2006.

RIES, Al; TROUT, Jack. **Posicionamento: A Batalha por sua Mente**. São Paulo: Pearson Makron Books, 2009.

TELLIS, Gerard J. Effective frequency: One exposure or three factors? **Journal of Advertising Research**, v. 37, n. 4, 1997.

THOMPSON, Arthur A.; STRICKLAND, A. J. **Strategic Management: Concepts and Cases**. 12. ed. Boston: McGraw-Hill, 2000.

TIROLE, Jean. **The Theory of Industrial Organization**. Cambridge: MIT Press, 1988.

VARIAN, Hal R. **Microeconomia: Uma Abordagem Moderna**. 8. ed. Rio de Janeiro: Elsevier, 2012.

VYGOTSKY, Lev S. **Mind in Society: The Development of Higher Psychological Processes**. Cambridge: Harvard University Press, 1978.

WEDEL, Michel; KAMAKURA, Wagner A. **Market Segmentation: Conceptual and Methodological Foundations**. 2. ed. Boston: Kluwer Academic Publishers. [Edição consultada não confirmada com segurança.]

## 3. Como Configurar uma Turma

### 3.1 Criar Nova Turma

1. Acesse o **Painel do Professor**
2. Clique em **Nova Turma**
3. Preencha os dados:
   - **Nome da Turma**: identificação única
   - **Código de Acesso**: senha para estudantes se registrarem
   - **Número de Rodadas**: quantas rodadas a simulação terá (sugerido: 5-10)
   - **Setor de Mercado**: setor econômico da simulação
   - **Orçamento Inicial**: valor que cada equipe começará (padrão: R$ 100.000)

### 3.2 Configurar Parâmetros de Mercado

Após criar a turma, você pode ajustar:

- **Tamanho do Mercado**: número de consumidores potenciais
- **Taxa de Crescimento**: expansão ou retração do mercado
- **Nível de Competição**: intensidade competitiva
- **Número de Concorrentes**: quantas empresas competem
- **Concentração de Mercado**: distribuição de market share
- **Força dos Concorrentes**: nível de sofisticação da concorrência

### 3.3 Gerenciar Rodadas

**Configuração Automática (Recomendado)**

- Defina data/hora de início e fim para cada rodada
- O sistema automaticamente ativa a rodada no horário definido, completa e processa resultados ao final, e calcula KPIs e rankings

**Controle Manual**

- **Iniciar Rodada**: libera para as equipes fazerem decisões
- **Finalizar Rodada**: processa decisões e gera resultados
- **Avançar Rodada**: move para a próxima rodada

## 4. Fluxo de Trabalho da Simulação

### Antes da Rodada

1. **Preparação**:
   - Configure eventos de mercado (opcional)
   - Revise configurações da turma
   - Comunique prazos aos estudantes

2. **Ferramentas do Professor**:
   - **Gerar Análises Estratégicas**: use IA para criar análises automáticas (SWOT, Porter, BCG, PESTEL)
   - **Criar Eventos de Mercado**: adicione eventos que impactam o mercado (crise, tendência, regulação)

### Durante a Rodada

Os estudantes devem completar as cinco ferramentas estratégicas, mas com regras de acesso diferentes:

- **SWOT, 5 Forças de Porter, Matriz BCG e PESTEL — obrigatórias**: sem as quatro completas, a equipe não consegue acessar a tela de Decisões (Marketing Mix)
- **Segmentação de Mercado (B2C e/ou B2B) — não bloqueia o acesso**, mas compõe 20% da pontuação de Alinhamento Estratégico da equipe (ver Seção 2.1 e Seção 9)

Vale orientar a turma explicitamente sobre essa diferença: é comum um aluno concluir (corretamente) que "destravou" o Marketing Mix e deixar a Segmentação de lado, sem perceber que isso reduz sua pontuação de alinhamento.

Depois, os estudantes tomam as **Decisões de Marketing Mix** para cada produto:

- **Produto**: qualidade, características, posicionamento de marca
- **Preço**: estratégia e valor de precificação
- **Praça**: canais de distribuição e cobertura
- **Promoção**: seleção de mídias e intensidade promocional

### Após a Rodada

1. **Análise de Resultados**:
   - Acesse **Ver Analytics** na turma
   - Visualize ranking de equipes, evolução de KPIs ao longo do tempo, métricas de engajamento e comparativos entre equipes

2. **Feedback**:
   - Use o botão **Regenerar Feedback** para criar análises de IA para as equipes
   - O feedback é personalizado com base em desempenho e decisões

## 5. Sistema de IA e Assistência Estratégica

### Como funciona, tecnicamente

O sistema tem três níveis de assistência de IA definidos no código (parâmetro por rodada), com comportamentos distintos de geração das cinco ferramentas estratégicas:

- **Nível 1** (padrão): a IA gera uma versão inicial completa das cinco ferramentas estratégicas, que o aluno deve revisar e personalizar
- **Nível 2**: a IA gera uma versão parcial, deixando lacunas para o aluno preencher
- **Nível 3**: a IA não gera conteúdo — o aluno parte do zero

### Ponto de atenção para o professor

O Nível 1 (assistência completa) é o valor padrão de toda rodada nova, e **não foi localizado, na interface do professor atual, nenhum controle para alterar esse nível por rodada**. Na prática, portanto, isso significa que todas as rodadas de uma turma operam no Nível 1, a menos que o parâmetro seja alterado diretamente no banco de dados. A ideia de uma progressão automática de assistência ao longo das rodadas (por exemplo, 100% na Rodada 1, caindo nas rodadas seguintes) não foi confirmada no código-fonte atual e não deve ser presumida como comportamento real do sistema nesta versão. Se a sua instituição precisar desse controle por rodada, trate-o como uma solicitação de melhoria ao desenvolvedor, não como um recurso já disponível.

### Sistema de Penalização por Cópia

Para incentivar a personalização, análises copiadas diretamente da IA e não editadas pelo aluno recebem penalidades conforme o percentual de similaridade:

- **0-29% similar**: sem penalidade
- **30-69% similar**: penalidade moderada (−10 pontos)
- **70-100% similar**: penalidade severa (−30 pontos)

Essas penalidades afetam o score de alinhamento estratégico e, por consequência, os KPIs financeiros (receita, lucro) e o market share da equipe.

## 6. KPIs Calculados Automaticamente

O sistema calcula 19 KPIs para cada equipe:

**Financeiros**: Receita, Lucro, Margem de Lucro, ROI (Return on Investment), Custo de Aquisição de Cliente (CAC)

**Mercado**: Market Share, Taxa de Crescimento, Alcance de Mercado, Índice de Satisfação do Cliente

**Eficiência**: Eficiência de Campanha, Taxa de Conversão, Valor do Tempo de Vida do Cliente (LTV), Relação LTV/CAC

**Estratégicos**: Brand Equity, Score de Alinhamento Estratégico, Nível de Inovação, Índice de Competitividade

**Adicionais**: Engajamento da Equipe, Qualidade das Decisões

## 7. Eventos de Mercado

### Tipos de Eventos

1. **Positivos**: aumento de demanda, tendências favoráveis
2. **Negativos**: crise econômica, regulações, concorrência
3. **Neutros**: mudanças estruturais do mercado

### Como Criar Eventos

1. Selecione a rodada
2. Clique em **Criar Evento Manual** ou **Gerar com IA**
3. Configure tipo e severidade, título e descrição, impacto esperado

### Geração por IA

A geração é baseada em: contexto do setor, dados econômicos reais (câmbio, inflação), histórico da turma e momento da simulação.

## 8. Aprovações e Gerenciamento

### Aprovação de Equipes

1. Acesse **Aprovações** no menu
2. Revise solicitações de registro
3. Aprove ou rejeite equipes
4. Gerencie membros das equipes

### Adição Manual de Membros

- Adicione estudantes diretamente às equipes
- Remova membros quando necessário
- Ajuste lideranças

## 9. Análise de Turma (Analytics)

### Dashboard do Professor

O dashboard é organizado em abas:

1. **Visão Geral**: cards de estatísticas (turmas, equipes, rodadas ativas, alunos), dados econômicos atuais, eventos de mercado ativos e visão geral das decisões de Marketing Mix
2. **Equipes**: lista de equipes com busca, cards expansíveis com gestão de membros, ajuste de orçamento e matrícula de alunos
3. **Rodadas**: timeline visual com status de cada rodada, agendamento automático de início/fim e geração de análises estratégicas por IA
4. **Resultados**: ranking de equipes por KPIs, geração de feedback por IA e o Relatório de Alinhamento Estratégico (ver abaixo)

### Relatório de Alinhamento Estratégico

O relatório mostra **todas as equipes da turma**, ordenadas por criticidade:

- **Crítico**: equipes com score < 30
- **Fraco**: equipes com score entre 30 e 49
- **Sem dados**: equipes que não submeteram
- **OK**: equipes com score ≥ 50

**Recursos**: alerta visual destacando equipes que precisam de atenção urgente, ícones de status em cada linha da tabela, linhas coloridas por criticidade e lista dos principais problemas detectados por equipe.

**Como usar**:
1. Acesse a aba **Resultados** no dashboard
2. O relatório aparece após o encerramento de uma rodada
3. Foque primeiro nas equipes em **Crítico** e **Sem dados**
4. Use os problemas listados para orientar feedback individual

## 10. Boas Práticas Pedagógicas

### Preparação

1. **Apresente o Sistema**: faça uma aula introdutória explicando o Simula+ — esta é uma boa oportunidade para apresentar a Seção 2 deste manual e situar cada ferramenta na teoria que o aluno já viu (ou verá) em sala
2. **Forme Equipes**: 3-5 membros por equipe é o ideal
3. **Defina Objetivos**: esclareça o que será avaliado
4. **Estabeleça Cronograma**: prazos claros para cada rodada

### Durante a Simulação

1. **Monitore Progresso**: use o Analytics para identificar equipes com dificuldades
2. **Promova Discussões**: debata decisões e resultados em sala
3. **Conecte com Teoria**: relacione resultados com os autores da Seção 2 — por exemplo, discutir por que uma equipe "Estrela" na Matriz BCG que investiu pouco em promoção foi penalizada é uma forma direta de retomar Henderson em sala
4. **Incentive Reflexão**: peça relatórios ou apresentações pós-rodada

### Avaliação

Sugestões de critérios:

1. **Desempenho** (40%): KPIs alcançados, evolução ao longo das rodadas, ranking final
2. **Qualidade Estratégica** (30%): completude de análises (SWOT, Porter, BCG, PESTEL, Segmentação), alinhamento entre estratégia e decisões, originalidade (não copiar da IA)
3. **Participação** (30%): engajamento da equipe, pontualidade nas entregas, contribuição de todos os membros

## 11. Solução de Problemas Comuns

### Estudantes esqueceram a senha

O sistema oferece duas opções de recuperação de senha para estudantes:

1. **Por Código de Recuperação** (recomendado): no cadastro, cada estudante recebe um código no formato `XXXX-XXXX-XXXX`, exibido apenas uma vez, após o registro. Na tela de login, o estudante clica em "Esqueci minha senha" → aba "Código", e informa email + código + nova senha
2. **Por Email**: na tela de login, o estudante clica em "Esqueci minha senha" → aba "Email". Um link de recuperação é enviado para o email cadastrado e expira em 1 hora

**Importante**: oriente os estudantes a anotarem ou fotografarem o código de recuperação logo após o cadastro, pois ele não será exibido novamente.

### Estudantes não conseguem se registrar
- Verifique se o código de acesso está correto
- Confirme se a turma está ativa
- Revise aprovações pendentes

### KPIs parecem inconsistentes
- Verifique configurações de mercado
- Revise eventos ativos na rodada
- Confira o alinhamento estratégico da equipe

### Equipes não completam análises estratégicas
- Lembre que a SWOT, o Porter, a BCG e o PESTEL são obrigatórias antes do Marketing Mix (a Segmentação não bloqueia, mas conta na pontuação — ver Seção 4)
- Use o sistema de notificações
- Considere prazo maior para rodadas iniciais

### Feedback da IA não está funcionando
- Verifique se a rodada foi finalizada
- Confirme que as decisões foram submetidas
- Use o botão "Regenerar Feedback" se necessário

## 12. Recursos Técnicos

**Escalabilidade**: suporta 40+ estudantes simultâneos, PostgreSQL serverless auto-scaling, cache de dados econômicos

**Segurança**: autenticação baseada em sessão, isolamento de dados entre turmas, controle de acesso por papel (professor/estudante)

**Integrações**: API de câmbio (USD/BRL em tempo real), OpenAI GPT-4o-mini para IA, sistema de agendamento automatizado

## 13. Suporte e Contato

Para questões técnicas ou sugestões:

- Email: suporte@simulamarketing.com.br
- Site: https://simulamarketing.com.br

## Apêndice: Setores Disponíveis

1. Tecnologia e Inovação
2. Alimentos e Bebidas
3. Moda e Vestuário
4. Saúde e Bem-Estar
5. Educação
6. Turismo e Hospitalidade
7. Entretenimento e Lazer
8. Automóveis
9. Imobiliário
10. Serviços Financeiros
11. Varejo
12. Sustentabilidade e Meio Ambiente

---

**Versão**: 1.2
**Última Atualização**: Setembro 2026
**Simula+ | Simulador de Marketing no Mercado**
