# Manual do Professor — Simula+

## Sobre este manual

Este manual foi escrito para que um professor que **nunca usou o Simula+** consiga, sozinho, ler este documento do início ao fim e sair sabendo configurar uma turma inteira, matricular alunos, conduzir todas as rodadas da simulação e interpretar os resultados — sem depender de treinamento presencial ou de qualquer outra pessoa. Ele está organizado na ordem em que as tarefas realmente acontecem: acesso ao sistema, criação da turma, matrícula dos alunos, formação das equipes, condução das rodadas (abertura, acompanhamento, encerramento), análise dos resultados e, por fim, as configurações e ferramentas administrativas que você usa com menor frequência.

A fundamentação teórica e acadêmica que embasa cada ferramenta do simulador — os autores de marketing e estratégia por trás de cada tela — está reunida no **Apêndice A**, ao final do documento, junto com a lista de referências bibliográficas no padrão ABNT (Apêndice C). Ela não é necessária para operar o sistema, mas é útil caso você queira conectar explicitamente, em sala de aula, o que o aluno faz na tela com a teoria que ele estuda.

Todas as afirmações deste manual foram verificadas diretamente no código-fonte do sistema em setembro de 2026. Onde alguma informação não pôde ser confirmada com segurança, isso é sinalizado explicitamente no texto, em vez de apresentada como certeza.

Este manual também está disponível dentro do próprio sistema: no Painel do Professor, o botão **Manual** (no canto superior direito) abre a versão em PDF deste mesmo documento a qualquer momento.

## 1. Visão Geral do Sistema

O Simula+ é uma plataforma educacional que simula um ambiente de negócios: equipes de estudantes competem em um mercado virtual, tomando decisões estratégicas de marketing ao longo de rodadas sucessivas. Ao final de cada rodada, o sistema calcula resultados financeiros e de mercado para cada equipe, com base nas decisões tomadas e nas condições de mercado configuradas.

Os papéis do sistema são dois: **professor** (que configura a turma, conduz as rodadas e avalia os resultados) e **aluno/equipe** (que toma as decisões de marketing dentro de uma equipe). Um professor pode conduzir múltiplas turmas simultaneamente, cada uma de forma independente.

### Objetivos pedagógicos

1. **Aplicação prática**: transformar teoria de marketing em decisões concretas, com consequências financeiras simuladas.
2. **Pensamento estratégico**: desenvolver a capacidade de diagnóstico, planejamento e execução coerente entre eles.
3. **Trabalho em equipe**: promover colaboração e negociação dentro de cada equipe.
4. **Análise de dados**: interpretar KPIs e métricas de desempenho ao longo de várias rodadas.

## 2. Antes de Começar: Acesso ao Sistema

O acesso de professor **não é autoautorizável** — diferentemente dos alunos, um professor não consegue simplesmente se cadastrar pela tela de login. Contas de professor são liberadas previamente por quem administra o sistema, por meio de uma lista de emails autorizados. Se você é um novo professor e ainda não tem acesso, entre em contato com o administrador do sistema na sua instituição para que seu email seja incluído nessa lista e sua conta seja criada; você receberá as instruções de primeiro acesso diretamente dele.

Depois de autorizado, o login do professor é feito na mesma tela de login do sistema (`www.simulamarketing.com.br`), com email e senha. Ao entrar, você cai diretamente no **Painel do Professor**.

Uma observação importante sobre os alunos, que evita um mal-entendido comum: **os alunos se cadastram sozinhos**, mas apenas com email institucional — o sistema aceita apenas emails terminados em `@aluno.iffar.edu.br` (à data deste manual; se a sua instituição for diferente, confirme o domínio aceito com o administrador do sistema, pois ele é configurado no código do servidor). Qualquer outro email é recusado automaticamente na hora do cadastro, com uma mensagem de erro — não fica pendente de aprovação, simplesmente não é aceito. Isso é relevante porque o menu **Aprovações**, que você verá no topo da tela, é um resquício de uma versão anterior do sistema: hoje, um cadastro de aluno com email aceito é **aprovado automaticamente**, na hora, sem qualquer ação sua. Na prática, você não precisa (e normalmente não vai encontrar nada para fazer) nessa tela. O texto de ajuda que aparece nela também está desatualizado — não leve em conta as instruções escritas lá.

![Tela de Aprovações: o texto "Como funciona?" cita o domínio @iffarroupilha.edu.br, diferente do domínio realmente aceito pelo sistema — outro sinal de que esse texto ficou desatualizado.](12-aprovacoes.jpg)

## 3. Passo a Passo: Criar uma Turma

1. No Painel do Professor, clique no botão **Nova Turma** (canto superior direito).
2. Preencha o formulário "Criar Nova Turma". A imagem abaixo numera cada campo do diálogo; a lista logo depois explica cada número:

![Diálogo "Criar Nova Turma" com cada campo numerado.](14-criar-turma-campos.jpg)

   1. **Nome da Turma** (obrigatório) — é o identificador que você e os alunos verão em toda a interface (ex.: "Marketing 2026-2"). É o único campo que precisa ser preenchido nesta tela. O sistema **não permite que você tenha duas turmas suas com o mesmo nome** (a comparação ignora maiúsculas/minúsculas e espaços nas pontas); se tentar, aparece um aviso pedindo para escolher outro nome. Essa restrição vale só entre turmas do mesmo professor — professores diferentes podem, sim, ter turmas com nomes iguais (por exemplo, duas turmas "Marketing 2026-1" de professores diferentes).
   2. **Número de Rodadas** — quantas rodadas a simulação terá ao todo. Valor padrão: 10 (pode variar de 1 a 20). Você pode alterar esse número depois, a qualquer momento, na aba "Aula" da turma.
   3. **Setor de Mercado** — o setor econômico simulado (ver lista completa no Apêndice B). Pode ser deixado em branco e definido depois.
   4. **Tipo de Comércio** — B2C, B2B ou Híbrido. Pode ser deixado em branco e definido depois.
   5. **Orçamento Padrão (R$)** — orçamento inicial de cada equipe. Valor padrão: R$ 100.000,00. Vale para a rodada de teste e para turmas que já estavam em andamento no motor anterior; a partir da Rodada 1, o motor de mercado competitivo calcula a verba pelo setor (Seção 10.2).
   6. **Nível de Concorrência** — Baixa, Média ou Alta. Pode ser deixado em branco e definido depois.
   7. **Criar Turma** — botão que confirma a criação. Fica habilitado assim que o campo 1 (Nome da Turma) está preenchido; os demais campos podem ficar em branco.
3. Clique em **Criar Turma** (campo 7 na imagem acima).

:::alerta Ponto de atenção
Como só o Nome da Turma é obrigatório, é perfeitamente possível criar uma turma preenchendo apenas esse campo e clicando em Criar. O sistema permite — mas ao tentar iniciar a primeira rodada, ele vai avisar (sem bloquear) que a configuração de mercado (setor, nível de concorrência, estrutura de mercado) e o orçamento ainda não foram preenchidos.

O recomendado é, logo depois de criar a turma, preencher a configuração completa de mercado antes de iniciar a Rodada 1 (ver Seção 4).
:::

### 3.1 Completar a configuração de mercado

Depois de criar a turma, selecione-a no seletor de turma (barra logo abaixo do topo da tela) e vá até a aba **Configurar** → seção **Configuração de Mercado** → botão **Abrir Configurações de Mercado**. Esse painel reúne todos os parâmetros de mercado da turma, incluindo alguns que não aparecem na tela de criação:

- **Setor** e **Tipo de Comércio** (os mesmos da criação, editáveis a qualquer momento)
- **Orçamento Padrão (R$)**
- **Nível de Concorrência**
- **Número de Concorrentes** — quantas empresas concorrentes o mercado simulado tem
- **Estrutura de Mercado** — Monopólio, Oligopólio, Concorrência Monopolística, Concorrência Perfeita ou Fragmentado (esse campo já se chamou "Concentração de Mercado" na interface; o nome foi corrigido, mas o valor salvo internamente continua com o nome antigo — isso não afeta seu uso)
- **Força dos Concorrentes** — Fraca, Média, Forte ou Muito Forte
- **Tamanho do Mercado (R$)**, **Crescimento (% ao ano)** e **Consumidores Potenciais** — no quadro **Dados reais do setor**, que mostra os números de referência do setor escolhido com a fonte e o ano (por exemplo, Abinee para Eletrônicos ou Abit para Moda). O botão **Preencher com dados reais do setor** copia esses números para os três campos; você pode ajustá-los depois. Quando o número é uma estimativa (por exemplo, a graduação privada em Educação), isso aparece escrito ao lado.

Uma turma nova já nasce com esses três campos preenchidos pelos dados do setor escolhido na criação. Em turmas antigas, use o botão para preenchê-los. Os alunos veem os mesmos números, com as fontes, na tela Análise de Mercado.

![Diálogo Configurações de Mercado (imagem anterior à inclusão do quadro Dados reais do setor).](02-config-mercado.jpg)

Clique em **Salvar** ao terminar. Essas configurações valem para toda a turma (não são por rodada) e podem ser revisadas a qualquer momento, inclusive com a simulação já em andamento.

## 4. Passo a Passo: Matricular Alunos

Este é o ponto do fluxo mais fácil de deixar passar despercebido: **um aluno que se cadastra sozinho no sistema não fica automaticamente vinculado a nenhuma turma.** Depois de se cadastrar e entrar, ele vê a mensagem "Você não está matriculado em nenhuma turma" e fica nessa tela, sem conseguir fazer mais nada, até que **você, professor, o matricule manualmente** em uma das suas turmas. Não existe, hoje, nenhuma forma de o próprio aluno escolher ou entrar em uma turma sozinho — mesmo que ele saiba o nome exato da turma.

Há dois caminhos possíveis para matricular um aluno. Você pode combinar os dois livremente dentro da mesma turma.

### Caminho A — o aluno se cadastra primeiro, você matricula depois

1. Peça para o aluno acessar `www.simulamarketing.com.br` e se cadastrar (nome, email institucional, senha), pela própria tela de login (opção de cadastro).
2. Assim que o aluno se cadastra, a conta já existe no sistema — mesmo sem estar em nenhuma turma ainda.
3. No Painel do Professor, selecione a turma, vá até a aba **Alunos** → card **Alunos Matriculados** → use o menu suspenso (que lista todos os alunos já cadastrados e ainda sem turma) para selecionar o aluno → clique em **Adicionar**.

### Caminho B — você cadastra o aluno diretamente, já com senha definida

1. Na aba **Alunos** (ou na aba **Equipes**) de qualquer turma, clique em **Cadastrar Aluno**.
2. Preencha **Nome Completo**, **Email** e **Senha Inicial** (os três são obrigatórios) — aqui você pode usar qualquer email, inclusive um não institucional, pois essa restrição vale só para o autocadastro do aluno, não para o cadastro feito por você.
3. Em **Matricular na Turma**, selecione a turma desejada (ou deixe "Não matricular ainda", se quiser só criar a conta por enquanto).
![Diálogo Cadastrar Novo Aluno.](03-cadastrar-aluno.jpg)

4. Clique em **Cadastrar**. O aluno já pode fazer login imediatamente com o email e a senha que você definiu.

Esse segundo caminho é o mais prático quando você já tem a lista de alunos da turma e quer economizar o passo de pedir para cada um se cadastrar sozinho.

**Observação sobre a tela de Aprovações**: como explicado na Seção 2, você não precisa aprovar nada — qualquer aluno cadastrado (por qualquer um dos dois caminhos) já está com status aprovado. O trabalho real é apenas matriculá-lo em uma turma, pelos passos acima.

## 5. As Equipes São Formadas Pelos Alunos, Não Por Você

![Aba Equipes, com uma equipe já formada pelos alunos (imagem anterior à criação da aba Alunos).](04-equipes-tab.jpg)

![Antes de qualquer equipe existir, a aba Aula mostra "Turma sem equipes" e um atalho para os alunos criarem a primeira.](05-aula-sem-equipes.jpg)

Depois de matriculado em uma turma, o aluno passa a ver, na primeira tela do seu painel, a opção de **criar uma nova equipe** ou **entrar em uma equipe já existente** daquela turma. A formação de equipes é feita pelos próprios alunos — não existe, na interface do professor, nenhum botão para criar uma equipe em nome deles. O aluno que cria a equipe se torna automaticamente o líder dela. A interface mostrada ao aluno sugere um limite de até 5 alunos por equipe, mas esse limite é apenas uma orientação de tela — não há, hoje, um bloqueio no servidor que impeça uma equipe de crescer além disso.

O que você, professor, pode fazer sobre as equipes, na aba **Equipes** de cada turma:

![Aba Equipes completa (imagem anterior à criação da aba Alunos; a lista de matriculados agora fica nessa aba).](16-equipes-completo.jpg)

1. **Cadastrar Aluno** — cria a conta do aluno diretamente (Caminho B da Seção 4), já com senha definida por você.
2. **Card da equipe** — clique para expandir e ver detalhes; o ícone de adicionar membro (ao lado do card) matricula um aluno já cadastrado na turma dentro dessa equipe.
3. **Adicionar** (na aba **Alunos**, card "Alunos Matriculados") — matricula, na turma, um aluno que já tem conta no sistema mas ainda não está nesta turma.
4. **Orçamento (R$) da equipe** — campo editável, na tabela "Orçamentos das Equipes": permite ajustar manualmente o orçamento de uma equipe específica, sem alterar o Orçamento Padrão da turma (útil para corrigir um caso pontual, por exemplo).
5. **Ícone de lixeira** — exclui a equipe (ação irreversível; os alunos que eram membros dela ficam sem equipe, mas continuam matriculados na turma).

O que você, professor, pode fazer sobre as equipes, na aba **Equipes** de cada turma:

- **Adicionar um membro** a uma equipe já formada (ícone de adicionar membro no card da equipe, informando o email do aluno já matriculado na turma).
- **Remover um membro** de uma equipe.
- **Ajustar o orçamento** de uma equipe específica, na tabela "Orçamentos das Equipes" (marcador 4 acima).
- **Ver as decisões** já tomadas por uma equipe (produtos, mix de marketing, análises estratégicas).
- **Corrigir a identidade da empresa** (ícone de prédio no card da equipe): para os alunos, nome e slogan ficam definitivos depois de salvos, e a logomarca depois do primeiro envio; só você pode alterá-los ou remover a logomarca.
- Acompanhar quantos alunos estão matriculados e quantos ainda estão sem equipe: a aba Equipes mostra um resumo, e a aba **Alunos** traz a lista completa.

### 5.1 A aba Alunos

A aba **Alunos** (entre Equipes e Analisar) reúne os alunos matriculados na turma numa tabela com **Nome**, **E-mail**, **Equipe** (com a marca "líder" ou o aviso "Sem equipe") e **Ações** (redefinir senha e remover da turma). Quando há alunos sem equipe, a aba mostra um número ao lado do nome. É também nela que ficam o botão **Cadastrar Aluno** e o campo para matricular um aluno já cadastrado.

Se, ao iniciar uma rodada, existir alguma equipe sem nenhum membro, o sistema avisa (sem bloquear) que essa equipe não vai conseguir enviar decisões na rodada — vale conferir isso antes de abrir cada rodada, especialmente a primeira.

## 6. Entendendo a "Rodada 0": o tutorial do aluno

Antes de participar da Rodada 1, cada aluno passa por um tutorial interno de boas-vindas, dividido em 6 seções (boas-vindas, como funcionam as rodadas, mix de marketing, ferramentas estratégicas, eventos e resultados, e regras de equipe). O sistema exige um tempo mínimo de leitura de 2 minutos por seção antes de liberar a seção seguinte — é uma trava de tempo, não de conteúdo, pensada para evitar que o aluno pule direto para o final sem ler.

Isso costuma aparecer, informalmente, como "Rodada 0" — mas é importante que fique claro: **não é uma rodada de verdade**. Ela não existe como registro no banco de dados da turma, não conta para o número de rodadas configurado, não aparece no seu painel de professor em nenhum momento, e não afeta a numeração das rodadas reais (a Rodada 1 é sempre a primeira rodada de fato). É inteiramente uma etapa do lado do aluno, e você não precisa fazer nada em relação a ela — apenas saber que, quando um aluno recém-matriculado entra pela primeira vez, é por esse tutorial que ele vai passar antes de ver a tela normal de decisões.

## 7. Passo a Passo: Iniciar a Rodada 1

Com a turma criada, o mercado configurado (Seção 3.1) e ao menos uma equipe formada, você está pronto para abrir a primeira rodada. Isso é feito na aba **Aula** da turma.

1. Selecione a turma no seletor do topo.
2. Na aba **Aula**, confira o painel **Gerenciamento de Rodadas**. Antes de haver qualquer rodada ativa, ele mostra um seletor de **"Produtos por equipe na próxima rodada"** — defina quantos produtos cada equipe vai poder cadastrar e decidir nesta rodada.
3. Clique em **Iniciar Rodada**.
4. A rodada abre na hora e o sistema pede o **fechamento** (horário de Brasília). Em todas as rodadas que valem nota, inclusive a **Rodada 1**, você informa só o horário de fechamento de hoje; a sugestão é 2 horas a partir de agora. Se marcar **Rodada de teste**, escolhe também o dia de fechamento (sugestão: próximo domingo às 23h59). Confirme em **Iniciar rodada**.
5. Se houver algum ponto de atenção — equipe sem nenhum aluno, configuração de mercado incompleta (setor, tipo de comércio, nível de concorrência, estrutura de mercado, tamanho do mercado, consumidores potenciais, crescimento ou número de concorrentes) ou orçamento padrão em R$ 0 — o sistema mostra um aviso listando exatamente o que falta, mas **não bloqueia o início da rodada**: você pode prosseguir mesmo assim, se for uma decisão intencional (por exemplo, uma turma de teste). Se não houver nenhum ponto de atenção, o aviso não aparece e você vai direto ao calendário do passo 4.

![Painel Gerenciamento de Rodadas, pronto para iniciar a primeira rodada.](06-iniciar-rodada.jpg)

A partir daqui, a Rodada 1 fica ativa e as equipes já podem tomar decisões.

### 7.1 Um detalhe importante sobre rodadas futuras pré-adicionadas

No mesmo painel de **Gerenciamento de Rodadas**, existe um botão **Adicionar** que cria uma rodada extra já travada ("bloqueada"), ao final da lista — útil quando você quer garantir o número total de rodadas com antecedência.

![Painel Gerenciamento de Rodadas: seletor de produtos, total de rodadas e os botões Adicionar/Remover Última.](15-adicionar-rodadas.jpg)

1. **Produtos por equipe na próxima rodada** — vale apenas para o botão **Iniciar Rodada** (canto 3 do passo a passo da Seção 7).
2. **Total de Rodadas** — quantas rodadas a turma terá ao todo; editável a qualquer momento.
3. **Adicionar** — cria uma rodada extra já travada, ao final da lista.
4. **Remover Última** — exclui a última rodada da lista (só funciona se ela ainda não tiver sido iniciada).

:::alerta Atenção — quantidade de produtos fica travada
Uma rodada criada pelo botão **Adicionar** (marcador 3) sempre nasce configurada para **1 produto por equipe**, independentemente do que estiver selecionado no seletor "Produtos por equipe na próxima rodada" (marcador 1) — esse seletor só vale para o botão **Iniciar Rodada**, não para o **Adicionar**.

Se você usa rodadas agendadas (Seção 10) e a rodada foi criada pelo botão "Adicionar", ela vai abrir automaticamente com 1 produto por equipe. Se, em vez de esperar o agendamento, você abrir essa mesma rodada pelo botão **Iniciar Rodada**, vale o seletor de produtos.

Uma vez que a rodada é criada/iniciada, a quantidade de produtos por equipe fica travada: não existe nenhuma forma de alterá-la depois — só é possível definir a configuração para a próxima rodada. Escolher esse número corretamente, no momento certo, é uma decisão do professor: na dúvida, prefira sempre iniciar as rodadas manualmente pelo botão **Iniciar Rodada**, que respeita o seletor de quantidade de produtos, e confira o valor antes de clicar.
:::

## 8. Durante uma Rodada Ativa

Cada rodada corresponde a **um mês** de operação, e um ano de jogo tem sempre 12 rodadas. Enquanto a rodada está ativa, cada equipe segue um **percurso obrigatório**, na ordem do menu do aluno; cada etapa só abre depois que a anterior foi concluída:

1. **Feedback e Resultados da rodada anterior** — leitura; a equipe confirma com o botão **Li e entendi**.
2. **Simula+ News e Análise de Mercado** — leitura dos eventos do mês, do Boletim do mês e da Conjuntura Brasil; confirmação com **Li e entendi**.
3. **Ferramentas Estratégicas** — SWOT, 5 Forças de Porter, Matriz BCG e PESTEL são obrigatórias. A **Segmentação de Mercado** não bloqueia o avanço, mas conta na pontuação de Alinhamento Estratégico (Seção 11.2); vale reforçar isso em sala.
4. **Identidade da Empresa** — nome, slogan e logomarca, definitivos para os alunos depois de salvos (só o professor corrige; Seção 5).
5. **Mix de Marketing** — as decisões da rodada; o envio final é recusado enquanto houver etapa pendente.

Os itens do grupo **Consulta** (Fechamento anual, Insights de Mercado, Orçamento, Manual do Aluno, Guia de Mídias e Meu Perfil) ficam sempre livres.

**O que o sistema faz sozinho.** Na **preparação** (30 minutos antes da abertura) e na **abertura** de cada rodada: entrega as **análises estratégicas prontas** da rodada (Seção 10.3); gera de 2 a 4 eventos de mercado com IA, se a geração automática estiver ligada e a rodada ainda não tiver eventos; e publica o **Boletim do mês** (demanda e sensibilidade a preço), que pesa no resultado pela adequação ao mercado (até 12% para mais ou para menos). No **encerramento**, gera o Feedback Inteligente para cada equipe com resultado.

**Conjuntura real.** A IA usa, na PESTEL, nos eventos e no boletim, os **indicadores oficiais do Banco Central** (Selic, IPCA, dólar, PIB, desemprego e confiança do consumidor, atualizados automaticamente) e o texto **Conjuntura Brasil** (fatos econômicos e políticos atuais, com data e fonte; Seção 12). Os alunos veem o mesmo conteúdo na aba Economia e Política da Análise de Mercado.

**Tela de decisões dos alunos.** O preço de cada produto **começa em branco** em toda rodada e é obrigatório: sem ele, o envio é recusado. A tela não traz mais os cartões de “Orientações Estratégicas” gerados pela IA nem textos de recomendação; mostra apenas dados de mercado com fonte (preço médio de referência da categoria, margens do setor e investimento típico em marketing). A equipe decide e descobre as consequências nos resultados.

**Sem dicas aos alunos.** O sistema não diz aos alunos o que fazer. O Feedback Inteligente é só diagnóstico (o que aconteceu, por quê e a literatura relacionada), sem sugestões de ação; o cartão de Recomendações Estratégicas saiu da tela Insights de Mercado; e a linha "Análise de Tendência" dos eventos descreve os efeitos sobre o mercado, sem recomendar decisões. As recomendações por P do feedback determinístico continuam visíveis só para você, na aba Analisar.

Durante a rodada, você tem três ferramentas à disposição na aba **Aula**, seção **Eventos de Mercado**:

1. **Criar Manual** — você mesmo escreve um evento (tipo, severidade, título, descrição e impacto esperado) e aplica a uma rodada específica.
2. **Gerar com IA** — você escolhe uma quantidade e a IA gera eventos contextualizados para a turma, com base no setor configurado, nos indicadores oficiais do Banco Central e na Conjuntura Brasil.
3. **Geração automática** — um interruptor liga/desliga a criação automática de 2 a 4 eventos com IA na abertura de cada rodada (quando a rodada ainda não tem eventos), além dos que você cria manualmente ou por IA.

Os dois primeiros botões (Criar Manual e Gerar com IA) só ficam habilitados quando já existe ao menos uma rodada ativa ou concluída na turma — ou seja, **você não consegue criar eventos de mercado antes de iniciar a primeira rodada**.

![Painel de acompanhamento da rodada, com os dados econômicos do momento e o aviso de que nenhuma decisão foi enviada ainda.](07-durante-rodada.jpg)

Ao longo da rodada, acompanhe na aba **Aula** quantas equipes já enviaram suas decisões — o número aparece diretamente ali, e a própria aba mostra um indicador (um número em destaque) quando há equipes com decisões pendentes. Isso é só um indicador visual: nada no sistema te impede de encerrar a rodada mesmo com equipes pendentes, o que nos leva ao ponto mais importante desta seção.

![Cabeçalho e painel "Situação da Aula" com a Rodada 1 ativa: contador de submissões, botão Acompanhar Submissões e os dois pontos onde se encerra a rodada.](18-rodada-ativa.jpg)

1. **Encerrar** (canto superior direito, ao lado do nome da turma) — atalho rápido para encerrar a rodada ativa a partir de qualquer aba.
2. **"0 de 1 equipes enviaram"** — contador de quantas equipes já enviaram as decisões desta rodada, atualizado em tempo real.
3. **Acompanhar Submissões** — abre o detalhamento de quais equipes específicas já enviaram e quais ainda faltam.
4. **Encerrar Rodada** — o mesmo botão do marcador 1, disponível também dentro do card "Rodadas da Turma".

## 9. Passo a Passo: Encerrar uma Rodada

Na aba **Aula**, com a rodada ativa, clique em **Encerrar Rodada** (marcadores 1 ou 4 na imagem acima). Isso dispara o cálculo de todos os resultados e KPIs daquela rodada para todas as equipes, com base nas decisões enviadas.

:::alerta Atenção — este é o ponto mais importante deste manual
Se uma equipe **não enviou nenhuma decisão** na rodada, o sistema **não cria nenhum registro de resultado para ela** ao encerrar — ela simplesmente fica de fora do processamento daquela rodada, silenciosamente, sem nenhum aviso ou bloqueio. O contador de "equipes que enviaram" mencionado na Seção 8 é só informativo; ele não impede o encerramento.

Antes de clicar em Encerrar Rodada, confira manualmente na aba Aula se todas as equipes que deveriam participar já enviaram suas decisões — essa conferência é uma decisão e responsabilidade do professor, feita no momento do encerramento. Se uma equipe ficou de fora por engano, a forma de corrigir depois é reabrir a rodada e reprocessá-la — mais trabalhoso do que simplesmente conferir antes.
:::

Depois de encerrada, uma rodada não pode ser reaberta pela mesma tela com um clique simples de "desfazer" — trate o encerramento como uma ação que vale a pena confirmar visualmente antes de executar.

## 10. Rodadas Seguintes e Agendamento

Repita o ciclo: abra a próxima rodada (Seção 7), acompanhe eventos e submissões (Seção 8), encerre conferindo as equipes pendentes (Seção 9). Uma diferença em relação à Rodada 1 vale menção:

- A partir da Rodada 2, a **Segmentação de Mercado** de cada equipe é copiada automaticamente da rodada anterior e pode ser editada. SWOT, 5 Forças, BCG e PESTEL são refeitas pelo sistema a cada rodada, com os resultados da rodada anterior (Seção 10.3). Em turmas que já estavam em andamento no motor anterior, as cinco análises continuam como antes: copiadas da rodada anterior e editáveis pela equipe.

Você pode ajustar o número total de rodadas da turma a qualquer momento na aba **Aula**, no campo **Total de Rodadas** (não pode ser menor que a rodada atual). Também é possível remover a última rodada da lista, mas só se ela ainda estiver bloqueada (não iniciada) e sem nenhum dado associado — o botão **Remover Última** fica desabilitado automaticamente quando isso não é possível, e explica o motivo ao passar o mouse.

### Rodadas semanais: datas de abertura e fechamento

Cada rodada corresponde a **uma semana real do calendário**: uma aula em 21/12 simula a semana do Natal, por exemplo.

Para definir as datas, crie as rodadas com o botão **Adicionar** (Seção 7.1) e, no card de cada rodada, clique em **Definir datas**. Abre um calendário e dois campos de horário, sempre no **horário oficial de Brasília** (UTC-3), qualquer que seja o fuso do dispositivo de cada aluno:

| Rodada | No calendário você escolhe | Horário de abertura | Horário de fechamento |
|---|---|---|---|
| **Rodada de teste** | o dia de abertura e o dia de fechamento (pode durar vários dias) | você informa | sugerido 23h59 do dia de fechamento |
| **Todas as rodadas que valem nota, inclusive a Rodada 1** | só o dia da aula | o da aula (você informa) | sugerido **2 horas depois da abertura**, editável |

- **Horário da aula variável:** o horário de abertura vem preenchido com o da rodada anterior (ou 20h50, se for a primeira) e pode ser mudado a cada rodada. Exemplo: abertura às 19h → fechamento sugerido às 21h.
- **Fechamento editável:** se a aula tiver outra duração, mude o horário de fechamento. Exemplo: abertura às 20h50, fechamento às 22h30. Depois que você altera o fechamento, ele não acompanha mais a abertura.
- **Regra única (out/2026):** desde a Rodada 1, a decisão é tomada durante a aula. A semana para conhecer o sistema, ler os manuais e treinar é a **rodada de teste**, que não vale nota.

A **semana simulada** é a semana de segunda a domingo que contém o dia de abertura: uma aula em 26/10/2026 simula a semana de 26/10 a 01/11/2026.

**Preparação 30 minutos antes:** a IA gera os eventos de mercado, o boletim e as análises da rodada sempre 30 minutos antes do horário de abertura — às 18h30 para uma abertura às 19h. O diálogo mostra esse horário. Assim, na abertura os alunos encontram tudo pronto.

Com as datas salvas, o sistema abre e encerra a rodada sozinho, sem que você precise clicar em Iniciar Rodada ou Encerrar Rodada. O alerta da Seção 9 continua valendo: o encerramento automático não verifica se todas as equipes enviaram algo.

- **Férias, recessos e feriados:** não há geração automática de semanas. Você escolhe as datas rodada a rodada e pode pular as semanas sem aula ou adiantar uma rodada. Semana sem rodada não entra na nota. Para um **sábado letivo de reposição**, basta marcar a rodada no sábado, com o horário da aula.
- **Feriados nacionais no calendário:** aparecem sublinhados em laranja. Se você escolher um deles, o diálogo avisa (por exemplo, "02/11/2026 é feriado nacional (Finados)"), mas não bloqueia. Entram os feriados nacionais fixos, a Sexta-feira Santa e os pontos facultativos nacionais de Carnaval e Corpus Christi. Feriados estaduais, municipais e recessos da instituição o sistema não conhece: nesses dias, simplesmente não marque rodada.
- **Semanas ocupadas:** no calendário, os dias que já pertencem a outra rodada da turma aparecem desabilitados, e o sistema recusa datas que se sobreponham.
- **Rodada em andamento:** o botão passa a se chamar **Alterar fechamento** e permite mudar o dia e o **horário** do fechamento, por exemplo para 22h45 se a aula atrasar. O horário precisa ser futuro.
- **Remover datas:** numa rodada que ainda não abriu, o botão **Remover datas** apaga o agendamento.

Tanto no card da rodada (aba Aula) quanto no painel do aluno aparece um contador de tempo restante até o fechamento, atualizado automaticamente.

### Rodada de teste e o botão "Iniciar o jogo"

Antes da Rodada 1, você pode abrir uma **rodada de teste** para a turma conhecer o simulador, por exemplo na primeira semana de aula.

1. Crie a rodada com **Adicionar**, clique em **Definir datas** e marque a opção **Rodada de teste**. A mesma opção existe no diálogo de **Iniciar Rodada**. O card mostra o selo **Rodada de teste**, e os alunos veem o aviso de que ela não vale nota nem resultado.
2. A rodada de teste funciona como uma rodada normal (decisões, resultados, eventos), mas **nunca entra no Sistema de Notas**.
3. Quando a turma estiver pronta, encerre a rodada de teste e clique em **Iniciar o jogo**, no painel que aparece na aba **Aula**. O sistema pede confirmação e então **apaga definitivamente** tudo o que as rodadas de teste geraram (decisões, resultados, eventos, boletins, análises, feedbacks e as próprias rodadas), **devolve a verba inicial** a cada equipe e renumera as rodadas futuras já criadas a partir da Rodada 1. Alunos, equipes, produtos e configuração de mercado ficam intactos.
4. O botão só aparece enquanto nenhuma rodada que não seja de teste tiver sido aberta.

### Última rodada do ano letivo

No card de cada rodada há o botão **Marcar como última rodada**. Só uma rodada por turma pode ter essa marca; ao marcar outra, a anterior é desmarcada. A rodada marcada exibe o selo **Última rodada**.

Quando a rodada marcada é encerrada, o **ano letivo da turma termina**: nenhuma rodada nova é aberta, nem manualmente nem por agendamento, e o painel mostra **Ano letivo encerrado**. Se precisar continuar, clique em **Desmarcar última rodada**.

### 10.1 Fechamento anual

A cada 12 rodadas (um ano de jogo) e ao fim do jogo, o sistema monta o **Fechamento anual** de cada equipe: receita e lucro acumulados, margem média, participação no fim do ano, comparação com a média da turma e com o ano anterior, gráficos e a tabela mês a mês. Em seguida vêm **perguntas reflexivas** montadas a partir dos números da própria equipe. Elas não dizem o que a equipe deveria ter feito; pedem que ela explique, com as próprias palavras, o que aconteceu e o que aprendeu.

- A equipe pode salvar rascunho; depois de **enviada**, a reflexão não pode mais ser alterada.
- No primeiro mês de um ano novo (Rodada 13, 25…), a etapa 1 do percurso só é concluída depois que a equipe envia a reflexão do ano que terminou.
- Você acompanha tudo pelo botão **Fechamento anual**, ao lado de Analytics no topo do painel: uma tabela da turma por ano (receita, lucro, margem, participação e se a reflexão foi enviada) e, ao clicar numa equipe, os indicadores e as respostas dela.

### 10.2 Motor de mercado competitivo (a partir da Rodada 1)

A partir da Rodada 1, as equipes da turma disputam **o mesmo mercado**, ao mesmo tempo, com concorrentes simulados já estabelecidos. A receita de cada equipe nasce das vendas que ela conquista, e não mais do orçamento investido. As fórmulas completas, com a distinção entre dados reais e parâmetros do modelo, estão no **Apêndice “Como o mercado é calculado”** do Manual do Aluno; aqui ficam os pontos que dizem respeito à condução da turma.

- **Praça:** Rio Grande do Sul. O mercado semanal de cada categoria é o tamanho anual do setor (campo **Tamanho do Mercado** da turma ou, se vazio, o dado real do setor) × 5,26% (participação do RS na população, IBGE 2025) ÷ 52 ÷ número de categorias do setor.
- **Participação de mercado:** modelo de atratividade (Cooper e Nakanishi, 1988). Pesam o preço em relação ao valor percebido do produto, a lembrança de marca construída pela comunicação, a distribuição, a fidelidade e o alinhamento estratégico. As fatias de equipes e concorrentes somam 100%.
- **Concorrentes simulados:** quatro perfis fictícios (Alfa, líder premium; Beta, popular de volume; Gama, intermediário; Delta, regional), que reagem a cortes de preço e a aumentos de comunicação das equipes. O campo **Número de Concorrentes** da turma define quantos entram (de 1 a 12; acima de 4, os perfis se repetem com numeração).
- **Verba de marketing:** método da porcentagem sobre as vendas (Kotler e Keller). Na Rodada 1, percentual de marketing do setor × receita de referência × número de produtos; nas seguintes, o mesmo percentual × receita obtida na rodada anterior, com piso de 30% da verba inicial. A verba não acumula. Comunicação **e distribuição** saem dela, e o envio final acima da verba não é aceito. O campo **Orçamento Padrão** deixa de ser usado nas rodadas valendo.
- **Custos:** custo dos produtos pela margem bruta real do setor; despesas administrativas calibradas para que uma empresa “média” obtenha a margem líquida real do setor (Damodaran, 2026; Apêndice B.2); tributos sobre vendas de 12% e IR/CSLL de 34% sobre lucro positivo.
- **Campos sem efeito no novo motor:** Nível de Concorrência, Estrutura de Mercado e Força dos Concorrentes continuam visíveis na configuração, mas não entram no cálculo das rodadas valendo.

:::alerta Turmas já em andamento
Para não mudar as regras no meio do jogo, uma turma que já tem resultados de rodadas valendo calculados pelo motor anterior continua nele até o fim. O motor competitivo vale para turmas que começam do zero. A rodada de teste sempre usa o motor anterior e não conta para essa regra, porque é apagada em **Iniciar o jogo**.
:::

### 10.3 Análises estratégicas prontas a cada rodada

Nas turmas do motor competitivo, SWOT, 5 Forças de Porter, Matriz BCG e PESTEL são **entregues prontas** a cada rodada, na preparação (30 minutos antes da abertura) ou, se a rodada for aberta manualmente, logo após a abertura. Os alunos só as leem; a **Segmentação de Mercado** continua sendo feita pela equipe e é a única análise exigida para o envio da decisão.

| Análise | Como é feita |
|---|---|
| **PESTEL** | Pela IA, uma para a turma, com os indicadores oficiais do Banco Central, a Conjuntura Brasil, os dados reais do setor, os eventos e o boletim da semana |
| **5 Forças de Porter** | Pela IA, uma para a turma, com os dados reais do setor e a estrutura do mercado do jogo (número de empresas e participações da rodada anterior) |
| **SWOT** | Pela IA, uma por equipe: forças e fraquezas a partir dos números da equipe (resultado, participação, preço, lembrança de marca, satisfação); oportunidades e ameaças a partir da PESTEL e de Porter |
| **Matriz BCG** | Calculada, sem IA: participação relativa de cada produto na rodada anterior (equipe ÷ maior concorrente) e crescimento real do setor (fonte setorial). Na Rodada 1, a participação relativa é zero |

As instruções dadas à IA proíbem recomendar decisões e inventar números: os textos são diagnóstico, com os dados fornecidos pelo sistema. As análises ficam gravadas por rodada; reabrir a tela não gera conteúdo novo.

O botão **Gerar Análises**, no cartão **Análises Estratégicas Automáticas** da aba **Aula**, refaz as quatro análises da rodada ativa (útil se a IA estiver indisponível na preparação). Se mesmo assim alguma análise não puder ser gerada, a tela do aluno mostra "em preparação", o envio da decisão não é bloqueado e o alinhamento estratégico daquela equipe fica neutro na rodada.

:::alerta Rodada de teste e Segmentação
A rodada de teste também recebe as análises prontas. A Segmentação feita nela é apagada em **Iniciar o jogo**; na Rodada 1, cada equipe registra a sua de novo.
:::

## 11. Analisar Resultados

![Aba Analisar antes de qualquer rodada ser encerrada.](08-analisar-vazio.jpg)

Depois de encerrar ao menos uma rodada, a aba **Analisar** da turma reúne tudo o que você precisa para interpretar o desempenho das equipes.

### 11.1 Ranking

Uma tabela mostra, para a última rodada concluída, cada equipe ordenada por lucro, com Receita, Lucro, ROI e Market Share. Ao lado de cada equipe, um botão de feedback permite gerar (ou visualizar, se já gerado) um retorno personalizado por IA para aquela equipe naquela rodada, combinando análise de desempenho e das decisões tomadas.

### 11.2 Relatório de Alinhamento Estratégico

Logo abaixo do ranking, o Relatório de Alinhamento mostra **todas as equipes da turma**, classificadas por criticidade:

- **Crítico**: score de alinhamento abaixo de 30
- **Fraco**: score entre 30 e 49
- **Sem dados**: equipe que não submeteu nada na rodada
- **OK**: score igual ou acima de 50

Cada linha traz os principais problemas identificados naquela equipe (por exemplo, ferramentas estratégicas incompletas ou inconsistência entre o diagnóstico e as decisões de preço). É o primeiro lugar a olhar depois de encerrar uma rodada — comece pelas equipes em Crítico e Sem dados.

O score de alinhamento combina dois blocos: 70% mede a coerência entre as cinco ferramentas de diagnóstico e as decisões de Mix de Marketing realmente tomadas; 30% mede a completude das cinco ferramentas. Nas turmas com análises prontas, quatro delas são entregues pelo sistema, e o score passa a medir a coerência entre as decisões da equipe, o diagnóstico da rodada e a Segmentação feita pela equipe. Se alguma análise da rodada não puder ser gerada (falha da IA), a equipe fica sem score de alinhamento naquela rodada: o motor usa efeito neutro, e o peso do alinhamento na nota é redistribuído. Os detalhes teóricos desse mecanismo estão no Apêndice A.3.

### 11.3 Sistema de Notas

Assim que a primeira rodada é encerrada, aparece a seção **Sistema de Notas**, com uma nota de **0 a 100, com uma casa decimal**, por equipe (todos os membros da equipe recebem a mesma nota). Ela é recalculada sozinha a cada rodada encerrada, com uma fórmula fixa e os seguintes pesos:

| Métrica | Peso |
|---|---|
| Lucro Líquido | 25% |
| ROI | 20% |
| Market Share | 15% |
| NPS (satisfação do cliente) | 15% |
| Margem | 15% |
| Alinhamento Estratégico | 10% |

Cada métrica é normalizada (0 a 100) comparando o resultado da equipe com os resultados de todas as equipes da turma nas rodadas encerradas, antes de aplicar os pesos — ou seja, é uma nota relativa à turma, não uma escala absoluta.

- **Todas as rodadas encerradas contam**, inclusive a Rodada 1. A rodada de teste não conta.
- **Rodada sem decisão enviada vale 0** e entra na média, como uma falta à atividade daquele dia. Na tabela, essa célula aparece como "0,0 · sem envio". Só não contam as rodadas encerradas antes de a equipe ser formada.
- A **Nota Final** é a média das notas de cada rodada.
- O número total de rodadas da turma não interfere na nota: você pode aumentar o "Total de Rodadas" a qualquer momento.

A tabela de notas pode ser exportada em **CSV** pela tela, com ponto e vírgula como separador e vírgula decimal (abre direto no Excel em português), para lançamento em outro sistema de avaliação.

### 11.4 Relatório de semelhança

A penalidade automática por conteúdo da IA foi **desativada** (out/2026), em todas as turmas. Em seu lugar, a aba **Analisar** traz o **Relatório de semelhança**, que só você vê e que não altera nota nem resultado. Para a rodada escolhida, ele mostra, por equipe:

- **Semelhança com outra equipe:** percentual de palavras da Segmentação de Mercado que coincidem com as da equipe mais parecida da turma (coeficiente de Dice sobre as palavras significativas).
- **Igual à rodada anterior:** a mesma medida, comparando a Segmentação da equipe com a dela própria na rodada anterior.
- **Texto sugerido pelo sistema sem edição:** em turmas no fluxo anterior, a parte de cada ferramenta que permaneceu igual à sugestão do sistema.

Valores a partir de 70% aparecem em vermelho e merecem leitura atenta; de 40% a 69%, em laranja. São indícios, não prova de cópia, e o relatório **não identifica textos produzidos com ferramentas externas de IA**.

## 12. A Aba Configurar

![Aba Configurar, com as quatro seções de configuração pouco frequente.](09-configurar-tab.jpg)

![Aba Configurar rolada até o final, mostrando o botão de configuração de mercado e a Zona de Perigo.](17-configurar-completo.jpg)

A aba **Configurar** reúne o que você mexe com pouca frequência, depois da configuração inicial da turma:

1. **Abrir Configurações de Mercado** — já descrita na Seção 3.1.
- **Conjuntura Brasil (economia e política)** — mostra os indicadores oficiais do Banco Central e o texto de conjuntura que a IA usa na PESTEL, nos eventos e no boletim. O texto padrão é atualizado pelo sistema (com data e fontes); se quiser, edite-o para a sua turma e clique em **Salvar para esta turma**, ou use **Voltar ao texto padrão**. Mantenha o texto factual, datado e neutro em temas políticos.
- **Relatório de Acessos** — um painel expansível que mostra o histórico de acessos dos alunos à turma (quem acessou, quando), com exportação em CSV.
- **Enviar Email para Equipes** — permite mandar uma mensagem por email para uma ou mais equipes da turma diretamente pelo sistema.
2. **Excluir Turma** (dentro da **Zona de Perigo**) — exclusão definitiva da turma. Apaga permanentemente equipes, alunos matriculados nela, rodadas e todas as decisões. Não há como desfazer; use apenas quando tiver certeza absoluta.

## 13. Painel de Administração (Dados Brutos)

![Painel de Administração, aba Usuários.](10-admin-usuarios.jpg)

![Painel de Administração, aba Turmas.](11-admin-turmas.jpg)

O botão **Admin**, no topo do Painel do Professor, abre um painel separado com seis abas de dados brutos, sempre restritos às suas próprias turmas: **Usuários**, **Turmas**, **Equipes**, **Rodadas**, **Mix Marketing** e **Eventos**. É útil quando você precisa consultar ou conferir um dado específico fora do fluxo normal das telas (por exemplo, verificar rapidamente um registro de decisão de uma equipe). Para o uso do dia a dia descrito neste manual, você não vai precisar dele — ele é um recurso de consulta avançada, não uma etapa obrigatória do fluxo.

## 14. Recuperação de Senha dos Alunos

Quando um aluno esquece a senha, ele tem duas opções na tela de login, no link **"Esqueci minha senha"**:

1. **Aba "Código"**: no momento do cadastro, cada aluno recebe um código de recuperação no formato `XXXX-XXXX-XXXX`, mostrado uma única vez, em uma janela que pede explicitamente para ele guardar ou fotografar o código. Com email + código + nova senha, o aluno redefine a senha na hora, sem depender de email.
2. **Aba "Email"**: um link de redefinição de senha é enviado para o email cadastrado do aluno.

Vale orientar a turma, logo na apresentação do sistema, a guardar esse código de recuperação assim que se cadastrarem — é o caminho mais rápido, e o código não é mostrado de novo depois.

## 15. Checklist Resumido

Para consulta rápida, depois de já ter lido o manual completo uma vez:

1. Criar a turma (Nome da Turma é o único campo obrigatório).
2. Completar a configuração de mercado em Configurar → Configuração de Mercado (use **Preencher com dados reais do setor** para tamanho, crescimento e consumidores potenciais) e conferir a Conjuntura Brasil.
3. Matricular os alunos (pedir que se cadastrem sozinhos com email institucional e depois adicioná-los à turma, ou cadastrá-los você mesmo já com turma definida).
4. Aguardar os alunos formarem suas próprias equipes (você não cria equipes).
5. Definir as datas e horários de cada rodada no calendário (rodada de teste: vários dias, até 23h59 do último; rodadas que valem nota, inclusive a Rodada 1: dia da aula, abertura no horário da aula e fechamento sugerido 2 horas depois) ou definir a quantidade de produtos e clicar em Iniciar Rodada. Marcar a última rodada do ano letivo.
6. Acompanhar submissões e, se quiser, criar ou gerar eventos de mercado.
7. Conferir se todas as equipes enviaram decisões antes de clicar em Encerrar Rodada.
8. Analisar o ranking e o Relatório de Alinhamento na aba Analisar.
9. Repetir os passos 5 a 8 para cada rodada seguinte.
10. A partir da primeira rodada concluída, consultar o Sistema de Notas (rodada sem envio vale 0).
11. A cada 12 rodadas, acompanhar o Fechamento anual e as reflexões das equipes (botão Fechamento anual).

## 16. Solução de Problemas Comuns

**Uma equipe ficou de fora dos resultados de uma rodada** — normalmente é porque ela não enviou nenhuma decisão antes do encerramento (Seção 9). Não há aviso automático disso; é preciso conferir antes de encerrar. Dois pontos importantes para reduzir esse risco:

- **A responsabilidade pelo envio é do líder da equipe**: o sistema só permite que o líder submeta as decisões de Mix de Marketing — os demais membros podem preencher e salvar rascunhos, mas não enviar. Se uma equipe está com decisões pendentes, é o líder quem precisa entrar e clicar em enviar; vale reforçar isso com a turma logo no início.
- **Recomendação de prazo**: cerca de **3 horas antes do horário previsto para encerrar a rodada** (manualmente ou por agendamento, Seção 10), verifique na aba Aula quais equipes ainda não enviaram e avise **todos os membros** dessas equipes — não só o líder, já que qualquer um pode preencher o rascunho, mesmo que só o líder consiga enviar. A forma mais direta é pelo recurso **Enviar Email para Equipes** (Seção 12): selecione a(s) equipe(s) pendente(s) e envie a mensagem — o sistema manda o email para o endereço cadastrado de cada membro da equipe automaticamente, não é preciso digitar os emails um a um. Isso dá tempo hábil para a equipe corrigir antes do fechamento, já que o sistema não bloqueia nem avisa automaticamente sobre equipes pendentes.

**Uma rodada pré-adicionada abriu com só 1 produto por equipe, mesmo eu tendo configurado mais** — é o comportamento das rodadas criadas pelo botão "Adicionar" e abertas pelo agendamento (Seção 7.1). Para usar outra quantidade, abra essa rodada pelo botão "Iniciar Rodada", que respeita o seletor de produtos.

**Um aluno diz que se cadastrou mas não consegue fazer nada** — confira se ele já foi matriculado em uma turma (Seção 4). Cadastro sozinho não inclui matrícula automática.

**Não consigo achar onde configurar algo, e o botão de ajuda "Onde está o quê?" do sistema me manda para uma aba que não existe** — esse painel de ajuda interno ainda referencia nomes antigos de abas (por exemplo, "Resultados" e "Notas", que hoje são a aba "Analisar"; ou "Visão Geral" e "Acessos", que hoje ficam dentro de "Aula" e "Configurar"). Use a estrutura de abas real descrita neste manual (Aula, Equipes, Analisar, Configurar) em vez do texto desse painel.

![O painel "Onde está o quê?" (Mapa do Painel do Professor) ainda referencia abas antigas, como "Aba Rodadas" e "Aba Resultados".](13-onde-esta-o-que.jpg)

**O aluno não consegue se cadastrar** — confira se o email usado é institucional (termina no domínio aceito pelo sistema). Qualquer outro email é recusado automaticamente, com uma mensagem de erro explicando o motivo.

**As equipes não conseguem acessar as Decisões de Marketing Mix** — lembre que SWOT, Porter, BCG e PESTEL são obrigatórias antes; a Segmentação não bloqueia, mas conta na nota (Seção 8).

---

## Apêndice A — Fundamentação Teórica

Nenhuma regra do simulador foi criada de forma arbitrária: cada ferramenta de análise estratégica e cada decisão de Mix de Marketing tem uma teoria de referência específica, que orientou tanto o desenho pedagógico quanto — sempre que aplicável — a lógica de cálculo implementada no sistema. Esta seção existe para que você possa, em sala de aula, dizer ao aluno não apenas "preencha a Matriz BCG", mas "preencha a Matriz BCG porque ela aplica o modelo de Bruce Henderson (1970) de gestão de portfólio de produtos".

### A.1 As cinco ferramentas de diagnóstico estratégico

As cinco ferramentas ficam na tela **Estratégia**. Quatro delas são pré-requisito obrigatório para a equipe acessar a tela de Decisões (Marketing Mix); a quinta (Segmentação de Mercado) não bloqueia esse acesso, mas compõe a pontuação de Alinhamento Estratégico da equipe (ver Seção 11.2).

| Ferramenta | Autor(es) de referência | Conceito-chave | O que ela ensina ao aluno |
|---|---|---|---|
| **Análise SWOT** | Albert Humphrey (década de 1960); Kotler & Armstrong; Pride & Ferrell; Hoskisson, Hitt, Ireland & Harrison | Diagnóstico interno (Forças/Fraquezas) e externo (Oportunidades/Ameaças) | Ligar o autodiagnóstico da empresa a uma decisão concreta — no simulador, a coerência entre a SWOT declarada e o preço praticado é verificada automaticamente |
| **5 Forças de Porter** | Michael Porter (1979; 1980; 2008) | Intensidade competitiva do setor (rivalidade, poder de barganha de clientes e fornecedores, ameaça de novos entrantes e de substitutos) | Traduzir a leitura do ambiente competitivo em decisões de preço e investimento promocional |
| **Matriz BCG** | Bruce Henderson / Boston Consulting Group (1970) | Gestão de portfólio por crescimento de mercado (corte em 10% ao ano) × participação relativa (empresa ÷ maior concorrente, corte em 1,0×), no desenho original: escala logarítmica com a participação alta à esquerda e bolhas proporcionais à receita (Estrela, Vaca Leiteira, Ponto de Interrogação, Abacaxi) | Diferenciar a lógica de investimento conforme a posição do produto no portfólio; no simulador, o aluno parte das participações reais do último mês e o sistema calcula a posição |
| **PESTEL** | Hoskisson, Hitt, Ireland & Harrison; Kotler & Armstrong; Piercy, Hooley & Nicoulaud | Macroambiente (Político, Econômico, Social, Tecnológico, Ambiental, Legal) | Conectar variáveis macroambientais amplas a decisões táticas de preço e canal |
| **Segmentação — B2C** | Kotler & Keller (modelo STP: Segmentation, Targeting, Positioning); Wedel & Kamakura | Critérios demográfico, geográfico, psicográfico e comportamental | Ajustar preço e canal ao segmento-alvo declarado, evitando dissonância entre discurso e prática |
| **Segmentação — B2B** | Hutt & Speh; Kotler & Armstrong | Variáveis firmográficas e centro de compras organizacional | Reconhecer que a lógica de segmentação organizacional difere estruturalmente da segmentação de consumidor final |

### A.2 As decisões de Mix de Marketing (4 Ps)

| Decisão | Autor(es) de referência | Ideia central aplicada |
|---|---|---|
| Qualidade e Características do Produto | Kotler & Armstrong (três níveis de produto; produto ampliado); Pride & Ferrell | Produto como pacote de benefícios — qualidade superior custa mais e não é "grátis" |
| Posicionamento de Marca | Ries & Trout; Piercy, Hooley & Nicoulaud | Posicionamento como disputa pela percepção do consumidor; consistência da mensagem |
| Estratégia e Valor de Preço | Kotler & Armstrong; Piercy, Hooley & Nicoulaud | Preço como único elemento do mix que gera receita diretamente, e como sinal de valor percebido |
| Canais e Cobertura de Distribuição | Pride & Ferrell; Kotler & Armstrong; Piercy, Hooley & Nicoulaud | Distribuição como conjunto de decisões de canal e alcance, com custo de oportunidade |
| Seleção de Mídias e Intensidade Promocional | Kotler & Armstrong (mix promocional); Krugman (1972), Naples (1979), Tellis (1997) — frequência efetiva de mídia; Pride & Ferrell | Planejar composição e intensidade de mídia sob restrição orçamentária, com retornos decrescentes |
| Identidade da Empresa (nome, slogan, logomarca) | Aaker (1991) — Brand Equity | Construção de identidade de marca como exercício próprio, complementar ao cálculo financeiro |

### A.3 O elo entre teoria e prática: o Alinhamento Estratégico

A pontuação de Alinhamento Estratégico (Seção 11.2) não é uma ferramenta isolada: é o mecanismo que conecta as cinco ferramentas de diagnóstico (A.1) às decisões de Mix de Marketing (A.2). Cada uma das cinco ferramentas contribui igualmente para o bloco de coerência (70% da pontuação); a completude das cinco ferramentas soma os 30% restantes. Pedagogicamente, é neste ponto que o simulador testa se o aluno integrou diagnóstico e execução — não apenas se preencheu cada instrumento isoladamente. Nas turmas com análises prontas, o teste passa a ser se a equipe lê o diagnóstico entregue e decide de forma coerente com ele e com a própria segmentação.

## Apêndice B — Setores de Mercado Disponíveis

Os setores disponíveis para configurar uma turma (Seção 3) são:

1. Eletrônicos e Tecnologia
2. Alimentos e Bebidas
3. Vestuário e Moda
4. Cosméticos e Beleza
5. Móveis e Decoração
6. Automotivo
7. Esportes e Fitness
8. Saúde e Bem-estar
9. Educação e Cursos
10. Pet Care
11. Construção e Materiais
12. Entretenimento e Mídia

Cada setor tem quatro categorias de produto associadas e dados de referência de tamanho de mercado e crescimento, com fonte e ano (Seção 3.1). Os números vêm de entidades setoriais e órgãos oficiais (base 2024 na maioria dos setores) e são revisados uma vez por ano. Alguns são estimativas, e isso aparece indicado na tela:

| Setor | Tamanho de referência | Crescimento | Fonte principal |
|---|---|---|---|
| Eletrônicos e Tecnologia | R$ 227 bi | 11% | Abinee (2024) |
| Alimentos e Bebidas | R$ 918 bi (mercado interno) | 6,1% (real) | ABIA (2024) |
| Vestuário e Moda | R$ 215 bi | 7% | Abit (2024) |
| Cosméticos e Beleza | cerca de R$ 200 bi (estimativa) | 7% | Abihpec/Euromonitor (2024) |
| Móveis e Decoração | R$ 91,5 bi | 12,1% | Abimóvel (2024) |
| Automotivo (reposição de autopeças) | R$ 43 bi | 3,3% | McKinsey para Sindipeças/Abipeças (2024) |
| Esportes e Fitness | R$ 183,4 bi (PIB do Esporte, estimativa) | 8% | Sou do Esporte/EY (2023); Abenutri (2024) |
| Saúde e Bem-estar | R$ 160,7 bi (mercado farmacêutico) | 12,9% | CMED/Anvisa (2024) |
| Educação e Cursos | R$ 44,7 bi (graduação privada, estimativa) | 3,3% | Censo INEP 2024; Hoper/ABMES |
| Pet Care | R$ 77 bi | 12,1% | Abinpet/Instituto Pet Brasil (2024) |
| Construção e Materiais | R$ 318,6 bi | 6,1% | Abramat/Ecconit (2024) |
| Entretenimento e Mídia | cerca de R$ 279 bi (estimativa) | 6,7% | PwC (2024) |

Atenção: em alguns setores, o dado disponível cobre um recorte diferente dos produtos do jogo. Em Saúde e Bem-estar, por exemplo, o número é do mercado farmacêutico, enquanto as categorias do jogo são suplementos. Ajuste os campos da turma se quiser um recorte mais próximo.

### B.1 Preço médio de cada categoria

Cada categoria tem um **preço médio real**, usado como referência de preço no cálculo dos resultados e mostrado aos alunos na Análise de Mercado (aba Setor), com a unidade e a fonte. A ordem de preferência das fontes é:

1. **Fonte institucional**, quando existe (IDC, Procon, as próprias empresas, pesquisa Hoper/ABMES).
2. **Levantamento de preços em lojas online**: mediana das ofertas reunidas no comparador Buscapé em 17/10/2026, sem kits nem pacotes. Reflete o mercado de massa e o varejo on-line, que pode ficar acima do preço de gôndola em itens de supermercado.

A coluna Confiança indica **alta** (fonte institucional), **média** (levantamento com muitas ofertas) ou **baixa** (poucas ofertas). Em Educação e Entretenimento, que são **serviços**, o preço é uma mensalidade, assinatura ou ingresso.

| Setor | Categoria | Unidade | Preço médio | Confiança |
|---|---|---|---|---|
| Eletrônicos e Tecnologia | Smartphone | unidade | R$ 2.557,00 | alta |
| Eletrônicos e Tecnologia | Tablet | unidade | R$ 1.573,00 | média |
| Eletrônicos e Tecnologia | Notebook | unidade | R$ 3.430,00 | média |
| Eletrônicos e Tecnologia | Smartwatch | unidade | R$ 1.564,00 | média |
| Alimentos e Bebidas | Refrigerante | garrafa 2 L | R$ 14,90 | média |
| Alimentos e Bebidas | Suco Natural | 1 L (integral) | R$ 30,22 | baixa |
| Alimentos e Bebidas | Snack Saudável | unidade (barra) | R$ 16,99 | média |
| Alimentos e Bebidas | Chocolate | barra 90 g | R$ 11,83 | alta |
| Vestuário e Moda | Tênis Esportivo | par | R$ 98,90 | média |
| Vestuário e Moda | Jaqueta | unidade | R$ 192,95 | média |
| Vestuário e Moda | Mochila | unidade | R$ 238,25 | média |
| Vestuário e Moda | Relógio de Pulso | unidade (analógico) | R$ 389,90 | média |
| Cosméticos e Beleza | Perfume | frasco 100 ml | R$ 123,41 | média |
| Cosméticos e Beleza | Creme Facial | unidade | R$ 53,90 | média |
| Cosméticos e Beleza | Shampoo | frasco | R$ 32,99 | média |
| Cosméticos e Beleza | Batom | unidade | R$ 30,08 | média |
| Móveis e Decoração | Sofá | unidade (3 lugares) | R$ 1.437,34 | média |
| Móveis e Decoração | Mesa de Jantar | unidade (4 lugares) | R$ 828,73 | média |
| Móveis e Decoração | Luminária | unidade (de mesa) | R$ 75,91 | média |
| Móveis e Decoração | Estante | unidade | R$ 343,77 | média |
| Automotivo | Óleo de Motor | 1 L (sintético 5W30) | R$ 52,08 | média |
| Automotivo | Filtro de Ar | unidade | R$ 22,84 | baixa |
| Automotivo | Pastilha de Freio | jogo (dianteira) | R$ 116,41 | média |
| Automotivo | Amortecedor | unidade (dianteiro) | R$ 400,50 | média |
| Esportes e Fitness | Tênis de Corrida | par | R$ 341,24 | média |
| Esportes e Fitness | Bicicleta | unidade (aro 29) | R$ 1.145,37 | média |
| Esportes e Fitness | Bola de Futebol | unidade | R$ 132,40 | média |
| Esportes e Fitness | Smartband | unidade | R$ 354,02 | média |
| Saúde e Bem-estar | Vitamina C | frasco | R$ 44,26 | média |
| Saúde e Bem-estar | Whey Protein | pote 900 g | R$ 177,90 | média |
| Saúde e Bem-estar | Ômega 3 | frasco | R$ 75,91 | média |
| Saúde e Bem-estar | Probiótico | frasco | R$ 72,89 | média |
| Educação e Cursos | Curso Técnico | mensalidade | R$ 109,00 | média |
| Educação e Cursos | Graduação EAD | mensalidade | R$ 214,00 | alta |
| Educação e Cursos | Graduação Presencial | mensalidade | R$ 835,00 | alta |
| Educação e Cursos | Pós-graduação (Especialização/MBA) | mensalidade | R$ 550,00 | média |
| Pet Care | Ração Premium | saco 15 kg | R$ 175,89 | média |
| Pet Care | Petisco | pacote 500 g | R$ 29,00 | média |
| Pet Care | Brinquedo | unidade (mordedor) | R$ 21,76 | média |
| Pet Care | Caminha | unidade | R$ 67,85 | média |
| Construção e Materiais | Cimento | saco 50 kg | R$ 47,37 | média |
| Construção e Materiais | Tinta Látex | lata 18 L | R$ 337,25 | média |
| Construção e Materiais | Porcelanato | caixa (60×60) | R$ 77,51 | baixa |
| Construção e Materiais | Torneira | unidade (cozinha) | R$ 218,80 | média |
| Entretenimento e Mídia | Streaming de Vídeo | assinatura mensal | R$ 44,90 | alta |
| Entretenimento e Mídia | Streaming de Música | assinatura mensal | R$ 23,90 | alta |
| Entretenimento e Mídia | Jogo Digital | unidade (lançamento) | R$ 399,90 | alta |
| Entretenimento e Mídia | Ingresso de Show | ingresso | R$ 200,00 | média |

### B.2 Margens e verba de marketing por setor

| Fonte | Uso |
|---|---|
| **Margens:** Damodaran (NYU Stern), *Margins by Sector – Emerging Markets*, jan. 2026. Pet Care usa a categoria varejo especializado como aproximação. | Custo dos produtos no novo motor de resultados, a partir da Rodada 1 do jogo |
| **Verba de marketing:** Gartner CMO Spend Survey 2025 (América do Norte e Europa); para Construção, The CMO Survey (Duke), 2024. Não há pesquisa brasileira por setor; são referências internacionais. | Verba das rodadas, pelo método da porcentagem sobre as vendas (Kotler e Keller), no novo motor |

| Setor | Margem bruta | Margem líquida | Verba de marketing (% da receita) |
|---|---|---|---|
| Eletrônicos e Tecnologia | 18,6% | 1,7% | 9,5% |
| Alimentos e Bebidas | 23,5% | 5,1% | 9,7% |
| Vestuário e Moda | 22% | 4,2% | 7,7% |
| Cosméticos e Beleza | 47,5% | 5,5% | 9,7% |
| Móveis e Decoração | 27,9% | 8,2% | 9,5% |
| Automotivo | 18,8% | 4,5% | 9,5% |
| Esportes e Fitness | 31,8% | 3,9% | 7,7% |
| Saúde e Bem-estar | 45,6% | 10% | 9% |
| Educação e Cursos | 51,1% | 13,4% | 7,7% |
| Pet Care | 32,1% | 3,5% | 7,7% |
| Construção e Materiais | 23,9% | 3,8% | 1% |
| Entretenimento e Mídia | 58,5% | 12,1% | 7,7% |

## Apêndice C — Referências Bibliográficas (ABNT)

As obras abaixo compõem o aparato acadêmico incorporado ao Simula+. Duas entradas têm a edição/editora da tradução brasileira ainda não confirmada com segurança bibliográfica — isso está sinalizado explicitamente, em vez de apresentar uma edição não verificada como certa.

AAKER, David A. **Managing Brand Equity**. New York: Free Press, 1991.

ANSOFF, H. Igor. Strategies for Diversification. **Harvard Business Review**, 1957.

ASSAF NETO, Alexandre. **Finanças Corporativas e Valor**. 7. ed. São Paulo: Atlas, 2014.

BUZZELL, Robert D.; GALE, Bradley T. **The PIMS Principles: Linking Strategy to Performance**. New York: Free Press, 1987.

CABRAL, Luís M. B. **Introduction to Industrial Organization**. Cambridge: MIT Press, 2000.

CHIAVENATO, Idalberto; SAPIRO, Arão. **Planejamento Estratégico: Fundamentos e Aplicações**. Rio de Janeiro: Elsevier, 2003.

BELL, David E.; KEENEY, Ralph L.; LITTLE, John D. C. A market share theorem. **Journal of Marketing Research**, v. 12, n. 2, p. 136-141, 1975.

BROADBENT, Simon. One way TV advertisements work. **Journal of the Market Research Society**, v. 21, n. 3, p. 139-166, 1979.

CHRISTENSEN, Clayton M. **The Innovator's Dilemma: When New Technologies Cause Great Firms to Fail**. Boston: Harvard Business School Press, 1997.

COOPER, Lee G.; NAKANISHI, Masao. **Market-Share Analysis: Evaluating Competitive Marketing Effectiveness**. Boston: Kluwer Academic Publishers, 1988.

DAMODARAN, Aswath. **Investment Valuation: Tools and Techniques for Determining the Value of Any Asset**. 3. ed. Hoboken: Wiley Finance, 2012.

DRÈZE, Xavier; HUSSHERR, François-Xavier. Internet advertising: Is anybody watching? **Journal of Interactive Marketing**, 2003.

DRUCKER, Peter F. **The Essential Drucker: The Best of Sixty Years of Peter Drucker's Essential Writings on Management**. New York: HarperBusiness, 2001.

FARRIS, Paul W.; BENDLE, Neil T.; PFEIFER, Phillip E.; REIBSTEIN, David J. **Marketing Metrics: The Definitive Guide to Measuring Marketing Performance**. 2. ed. Upper Saddle River: Pearson Education, 2010.

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

---

**Versão**: 2.3
**Última Atualização**: Setembro 2026
**Simula+ | Simulador de Marketing no Mercado**
