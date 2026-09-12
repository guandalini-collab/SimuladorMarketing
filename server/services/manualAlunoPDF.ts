import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';

const PRIMARY_COLOR = '#6366f1'; // Indigo
const SECONDARY_COLOR = '#8b5cf6'; // Purple
const ACCENT_COLOR = '#22d3ee'; // Cyan
const TEXT_COLOR = '#1f2937'; // Gray 800
const LIGHT_GRAY = '#f3f4f6'; // Gray 100
const DARK_GRAY = '#6b7280'; // Gray 500

const LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Simula_logo_navy_dourado_final.png');
const SWOT_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Diagrama_SWOT_em_português_0a7241aa.png');
const PORTER_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Diagrama_5_Forças_Porter_português_06e5802d.png');
const BCG_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Matriz_BCG_em_português_023ea876.png');
const PESTEL_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Diagrama_PESTEL_em_português_823fea8b.png');
const FUNNEL_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Funil_de_marketing_português_18ac4bd9.png');

export function generateManualAlunoPDF(): PassThrough {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 60, right: 60 },
    info: {
      Title: 'Manual do Aluno - Simula+ v1.0',
      Author: 'Simula+',
      Subject: 'Guia Completo do Simulador de Marketing',
    }
  });

  const stream = new PassThrough();
  doc.pipe(stream);

  // CAPA
  addCoverPage(doc);

  // SOBRE O AUTOR
  doc.addPage();
  addAuthorPage(doc);

  // SUMÁRIO
  doc.addPage();
  addTableOfContents(doc);

  // 1. APRESENTAÇÃO
  doc.addPage();
  addPresentationSection(doc);

  // 2. COMO FUNCIONA O JOGO - Nova página para seção principal
  doc.addPage();
  addHowItWorksSection(doc);

  // 3. FERRAMENTAS ESTRATÉGICAS - Nova página para seção principal
  doc.addPage();
  addStrategicToolsSection(doc);

  // 4. FÓRMULAS MATEMÁTICAS - Nova página para seção principal
  doc.addPage();
  addFormulasSection(doc);

  // 5. PASSO A PASSO - Nova página para seção principal
  doc.addPage();
  addStepByStepSection(doc);

  // 6. FAQ - Nova página para seção principal
  doc.addPage();
  addFAQSection(doc);

  // 7. REFERÊNCIAS - Nova página para seção principal
  doc.addPage();
  addReferencesSection(doc);

  doc.end();
  return stream;
}

// =====================
// FUNÇÕES AUXILIARES
// =====================

function addCoverPage(doc: PDFKit.PDFDocument) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Fundo gradiente (simulado com retângulos)
  doc.rect(0, 0, pageWidth, pageHeight).fill(PRIMARY_COLOR);
  doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2)
     .fillOpacity(0.3)
     .fill(ACCENT_COLOR)
     .fillOpacity(1);

  // Logo corporativo Simula+ (imagem, lockup horizontal navy + dourado)
  // Fica sobre um cartão branco para manter a legibilidade do texto navy no fundo colorido.
  if (fs.existsSync(LOGO_PATH)) {
    const boxWidth = 300;
    const boxHeight = 110;
    const boxX = (pageWidth - boxWidth) / 2;
    const boxY = 120;
    const padding = 18;

    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 14).fill('#ffffff');

    doc.image(LOGO_PATH, boxX + padding, boxY + padding, {
      fit: [boxWidth - padding * 2, boxHeight - padding * 2],
      align: 'center',
      valign: 'center'
    });
  }

  // Título
  doc.fontSize(48)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text('MANUAL DO ALUNO', 60, 280, {
       width: pageWidth - 120,
       align: 'center'
     });

  // Subtítulo
  doc.fontSize(28)
     .font('Helvetica')
     .text('Simula+', 60, 350, {
       width: pageWidth - 120,
       align: 'center'
     });

  doc.fontSize(18)
     .text('Simulador de Marketing no Mercado', 60, 390, {
       width: pageWidth - 120,
       align: 'center'
     });

  // Autor
  doc.moveDown(3);
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Alexandre Guandalini Bossa', 60, 500, {
       width: pageWidth - 120,
       align: 'center'
     });
  
  doc.fontSize(14)
     .font('Helvetica')
     .text('Professor de Marketing', 60, 530, {
       width: pageWidth - 120,
       align: 'center'
     });

  // Versão
  doc.fontSize(14)
     .text('Versão 1.0', 60, 680, {
       width: pageWidth - 120,
       align: 'center'
     });

  // Ano
  doc.fontSize(12)
     .text(`© ${new Date().getFullYear()} - Todos os direitos reservados`, 60, 750, {
       width: pageWidth - 120,
       align: 'center'
     });
}

function addAuthorPage(doc: PDFKit.PDFDocument) {
  const pageWidth = doc.page.width;
  
  addSectionTitle(doc, 'SOBRE O AUTOR');
  doc.moveDown(2);

  // Nome do autor em destaque
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_COLOR)
     .text('Alexandre Guandalini Bossa', 60, doc.y, { align: 'left' });
  
  doc.moveDown(0.5);
  doc.fontSize(14)
     .font('Helvetica-Oblique')
     .fillColor(TEXT_COLOR)
     .text('Professor de Marketing', 60, doc.y);
  
  doc.moveDown(2);

  // Mini currículo
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor(TEXT_COLOR);

  addParagraph(doc,
    'Alexandre Guandalini Bossa é professor de Marketing com vasta experiência no ensino de estratégias empresariais e gestão de negócios. Graduado em Administração de Empresas e com especialização em Marketing Estratégico, dedica-se ao desenvolvimento de metodologias inovadoras para o ensino de marketing no nível médio e superior.'
  );

  addParagraph(doc,
    'Com mais de duas décadas de experiência docente, o professor Alexandre tem como missão tornar os conceitos de marketing acessíveis e práticos para jovens estudantes, preparando-os para os desafios do mercado contemporâneo. O Simula+ representa a materialização dessa visão: uma ferramenta educacional que une teoria acadêmica e prática empresarial de forma gamificada e envolvente.'
  );

  doc.moveDown(1);

  // Citação em destaque (estilo do PDF de exemplo)
  doc.rect(60, doc.y, pageWidth - 120, 80)
     .fillOpacity(0.05)
     .fill(PRIMARY_COLOR)
     .fillOpacity(1);

  doc.fontSize(13)
     .font('Helvetica-Oblique')
     .fillColor(PRIMARY_COLOR)
     .text('"O marketing não é apenas sobre vender produtos,', 80, doc.y + 20, {
       width: pageWidth - 160,
       align: 'center'
     });
  
  doc.text('mas sobre criar valor e construir relacionamentos', 80, doc.y, {
    width: pageWidth - 160,
    align: 'center'
  });
  
  doc.text('duradouros com os clientes."', 80, doc.y, {
    width: pageWidth - 160,
    align: 'center'
  });

  doc.moveDown(3);
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(DARK_GRAY)
     .text('- Alexandre Guandalini Bossa', 80, doc.y, {
       width: pageWidth - 160,
       align: 'right'
     });
}

function addTableOfContents(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, 'SUMÁRIO');
  doc.moveDown();

  const contents = [
    { title: '1. Apresentação do Simulador' },
    { title: '2. Como Funciona o Jogo' },
    { title: '3. Ferramentas Estratégicas' },
    { title: '   3.1 Análise SWOT' },
    { title: '   3.2 As 5 Forças de Porter' },
    { title: '   3.3 Matriz BCG' },
    { title: '   3.4 Análise PESTEL' },
    { title: '4. Fórmulas Matemáticas Utilizadas' },
    { title: '5. Passo a Passo para os Alunos' },
    { title: '6. Perguntas Frequentes (FAQ)' },
    { title: '7. Referências Bibliográficas' },
  ];

  doc.font('Helvetica').fontSize(11);
  
  contents.forEach((item) => {
    doc.fillColor(TEXT_COLOR)
       .text(item.title, 60, doc.y, { width: 475 });
    doc.moveDown(0.5);
  });
}

function addPresentationSection(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, '1. APRESENTAÇÃO DO SIMULADOR');
  doc.moveDown();

  addParagraph(doc, 
    'O Simula+ é um simulador educacional de marketing desenvolvido para proporcionar aos estudantes do ensino médio uma experiência prática e imersiva no mundo dos negócios e da estratégia empresarial.'
  );

  addQuoteBox(doc,
    'Marketing é a ciência e a arte de explorar, criar e entregar valor para satisfazer as necessidades de um mercado-alvo com lucro.',
    'Philip Kotler, 2012'
  );

  addParagraph(doc,
    'Conforme destacado por Kotler e Keller (2012), o marketing moderno transcende a simples venda de produtos, envolvendo a criação de valor para o cliente e a construção de relacionamentos duradouros. O Simula+ foi concebido com base nesses princípios, permitindo que os estudantes compreendam, na prática, como as decisões estratégicas impactam o desempenho organizacional.'
  );

  addSubsectionTitle(doc, 'Propósito Educativo');
  doc.moveDown(0.5);

  addParagraph(doc,
    'O simulador tem como objetivo principal desenvolver competências em:'
  );

  doc.moveDown(0.3);
  addBulletPoint(doc, 'Pensamento estratégico e tomada de decisão');
  addBulletPoint(doc, 'Análise de mercado e identificação de oportunidades');
  addBulletPoint(doc, 'Gestão do mix de marketing (4 Ps: Produto, Preço, Praça, Promoção)');
  addBulletPoint(doc, 'Interpretação de indicadores de desempenho (KPIs)');
  addBulletPoint(doc, 'Trabalho colaborativo e gestão de equipes');

  doc.moveDown();
  addParagraph(doc,
    'Como afirma Drucker (2001), "a melhor maneira de prever o futuro é criá-lo". No Simula+, os alunos não apenas observam o mercado, mas ativamente moldam os resultados de suas empresas virtuais através de decisões fundamentadas.'
  );

  addSubsectionTitle(doc, 'Diferenciais do Simula+');
  doc.moveDown(0.5);

  addBulletPoint(doc, 'Sistema multi-produto: gerencie 4 produtos simultaneamente no mesmo setor');
  addBulletPoint(doc, 'Assistência de IA progressiva: apoio de 100% na Rodada 1, diminuindo até 0% na Rodada 3');
  addBulletPoint(doc, '19 KPIs calculados automaticamente com base em suas decisões');
  addBulletPoint(doc, 'Eventos econômicos dinâmicos que afetam o mercado');
  addBulletPoint(doc, 'Feedback inteligente pós-rodada para aprendizado contínuo');

  doc.moveDown(1);
  addDiagramImage(doc, FUNNEL_DIAGRAM_PATH, 'Figura: Funil de Marketing - Da Consciência à Compra');
}

function addHowItWorksSection(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, '2. COMO FUNCIONA O JOGO');
  doc.moveDown();

  addSubsectionTitle(doc, 'Visão Geral das Rodadas');
  doc.moveDown(0.5);

  addParagraph(doc,
    'O Simula+ opera em ciclos de decisão chamados "rodadas". Cada rodada representa um período de tempo no qual as equipes devem tomar decisões estratégicas para seus produtos e submeter ao sistema para avaliação.'
  );

  addParagraph(doc,
    'Segundo Mintzberg, Ahlstrand e Lampel (2010), a estratégia empresarial é um processo iterativo que combina planejamento e adaptação ao ambiente. No simulador, cada rodada exige que os alunos planejem, executem e reflitam sobre suas decisões.'
  );

  addQuoteBox(doc,
    'A estratégia não é a consequência do planejamento, mas o oposto: o ponto de partida. A estratégia determina o tipo de planejamento que precisa ser feito.',
    'Henry Mintzberg, 2010'
  );

  addSubsectionTitle(doc, 'Fluxo de uma Rodada - ORDEM OBRIGATÓRIA');
  doc.moveDown(0.5);

  addWarningBox(doc,
    '🚨 SEQUÊNCIA FORÇADA PELO SISTEMA\n\n' +
    'ETAPA 1 → Análises Estratégicas (BLOQUEADO até completar)\n' +
    'ETAPA 2 → Marketing Mix dos 4 Produtos\n' +
    'ETAPA 3 → Submissão Final\n\n' +
    'Você NÃO CONSEGUE pular para ETAPA 2 sem completar ETAPA 1!\n' +
    'O sistema impede tecnicamente o acesso.'
  );

  doc.moveDown();
  doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_COLOR);
  doc.text('1. Análises Estratégicas (OBRIGATÓRIO PRIMEIRO)', { continued: false });
  doc.font('Helvetica').fontSize(10);
  addParagraph(doc,
    'Antes de tomar decisões de marketing, as equipes DEVEM completar quatro ferramentas estratégicas: SWOT, Porter, BCG e PESTEL. O sistema BLOQUEIA o acesso ao Marketing Mix até que TODAS as 4 análises sejam submetidas. Esta é uma validação técnica obrigatória.'
  );

  doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_COLOR);
  doc.text('2. Decisões de Marketing Mix (4 Ps)', { continued: false });
  doc.font('Helvetica').fontSize(10);
  addParagraph(doc,
    'Com base nas análises, as equipes configuram independentemente o mix de marketing para cada um dos 4 produtos disponíveis em seu setor:'
  );
  addBulletPoint(doc, 'Produto: qualidade, características e design');
  addBulletPoint(doc, 'Preço: estratégia de precificação e valor');
  addBulletPoint(doc, 'Praça: canais de distribuição e cobertura geográfica');
  addBulletPoint(doc, 'Promoção: mix promocional e intensidade de comunicação');

  doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_COLOR);
  doc.text('3. Submissão e Cálculo de Resultados', { continued: false });
  doc.font('Helvetica').fontSize(10);
  addParagraph(doc,
    'Após configurar todos os 4 produtos e completar as análises estratégicas, a equipe submete suas decisões. O sistema usa um PROCESSO HÍBRIDO importante de compreender:'
  );

  addInfoBox(doc, '🔄 PROCESSAMENTO INDIVIDUAL → CONSOLIDADO', 
    'ETAPA 1 - Cálculo Individual:\n' +
    '• Sistema calcula KPIs para CADA produto separadamente\n' +
    '• Produto 1: Receita, Lucro, Market Share próprios\n' +
    '• Produto 2: Receita, Lucro, Market Share próprios\n' +
    '• Produto 3 e 4: Mesma coisa\n\n' +
    'ETAPA 2 - Consolidação:\n' +
    '• Receita Total = Soma das 4 receitas\n' +
    '• Lucro Total = Soma dos 4 lucros\n' +
    '• Market Share Médio = Média dos 4 market shares\n\n' +
    'RESULTADO: Você vê AMBOS os resultados (individuais + consolidado)'
  );

  doc.moveDown(0.5);
  addParagraph(doc,
    'O sistema considera automaticamente:'
  );
  addBulletPoint(doc, 'As decisões de marketing mix de cada produto');
  addBulletPoint(doc, 'O alinhamento entre análises estratégicas e decisões');
  addBulletPoint(doc, 'Eventos econômicos ativos');
  addBulletPoint(doc, 'Penalizações por uso inadequado de IA');

  doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_COLOR);
  doc.text('4. Análise de Desempenho e Feedback', { continued: false });
  doc.font('Helvetica').fontSize(10);
  addParagraph(doc,
    'Ao final da rodada, as equipes recebem feedback inteligente gerado por IA, analisando suas decisões, comparando com os resultados obtidos e sugerindo melhorias para a próxima rodada.'
  );

  doc.moveDown(0.8);
  addSubsectionTitle(doc, 'Sistema de Assistência de IA Progressiva');
  doc.moveDown(0.6);

  addParagraph(doc,
    'O Simula+ implementa um sistema pedagógico de scaffolding (andaime educacional) que gradualmente reduz o apoio da IA conforme os alunos avançam:'
  );

  doc.moveDown(0.5);
  
  // Tabela de assistência
  const tableTop = doc.y;
  const col1 = 60;
  const col2 = 180;
  const col3 = 350;
  const rowHeight = 25;

  // Cabeçalho
  doc.rect(col1, tableTop, 490, rowHeight).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('Rodada', col1 + 10, tableTop + 8);
  doc.text('Assistência IA', col2 + 10, tableTop + 8);
  doc.text('Descrição', col3 + 10, tableTop + 8);

  // Linha 1
  doc.rect(col1, tableTop + rowHeight, 490, rowHeight).stroke(DARK_GRAY);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_COLOR);
  doc.text('Rodada 1', col1 + 10, tableTop + rowHeight + 8);
  doc.text('100%', col2 + 10, tableTop + rowHeight + 8);
  doc.text('Análises pré-geradas + recomendações', col3 + 10, tableTop + rowHeight + 8);

  // Linha 2
  doc.rect(col1, tableTop + 2 * rowHeight, 490, rowHeight).stroke(DARK_GRAY);
  doc.text('Rodada 2', col1 + 10, tableTop + 2 * rowHeight + 8);
  doc.text('70%', col2 + 10, tableTop + 2 * rowHeight + 8);
  doc.text('Análises parciais para editar', col3 + 10, tableTop + 2 * rowHeight + 8);

  // Linha 3
  doc.rect(col1, tableTop + 3 * rowHeight, 490, rowHeight).stroke(DARK_GRAY);
  doc.text('Rodada 3+', col1 + 10, tableTop + 3 * rowHeight + 8);
  doc.text('0%', col2 + 10, tableTop + 3 * rowHeight + 8);
  doc.text('Autonomia total - sem assistência', col3 + 10, tableTop + 3 * rowHeight + 8);

  doc.y = tableTop + 4 * rowHeight + 10;

  addParagraph(doc,
    'Este sistema, fundamentado nos princípios de Vygotsky sobre zona de desenvolvimento proximal, permite que os estudantes desenvolvam autonomia gradualmente (VYGOTSKY, 1978).'
  );

  addSubsectionTitle(doc, 'Sistema de Pontuação e Alinhamento Estratégico');
  doc.moveDown(0.5);

  addParagraph(doc,
    'O sistema calcula um score de alinhamento estratégico (0-100) que mede a coerência entre as análises estratégicas e as decisões de marketing mix. Como explica Porter (1996), "a essência do posicionamento estratégico é escolher atividades diferentes das dos rivais".'
  );

  addParagraph(doc,
    'O score de alinhamento impacta diretamente os KPIs através de modificadores:'
  );

  doc.moveDown(0.3);
  addBulletPoint(doc, 'Score ≥ 90: +15% receita, +20% lucro, +10% market share');
  addBulletPoint(doc, 'Score 70-89: +5% receita, +10% lucro, +5% market share');
  addBulletPoint(doc, 'Score 50-69: sem modificadores');
  addBulletPoint(doc, 'Score 30-49: -10% receita, -15% lucro, -5% market share');
  addBulletPoint(doc, 'Score < 30: -25% receita, -35% lucro, -15% market share');

  doc.moveDown();
  addWarningBox(doc, 
    '⚠️ ATENÇÃO: Copiar análises da IA sem editar resulta em penalizações severas! Conteúdo não editado entre 70-100% de similaridade aplica -30 pontos no score de alinhamento.'
  );
}

function addStrategicToolsSection(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, '3. FERRAMENTAS ESTRATÉGICAS');
  doc.moveDown();

  addParagraph(doc,
    'O Simula+ utiliza quatro ferramentas clássicas de análise estratégica que são fundamentais para a compreensão do ambiente competitivo e para a tomada de decisões gerenciais fundamentadas.'
  );

  // ========== SWOT ==========
  doc.moveDown(0.8);
  addSubsectionTitle(doc, '3.1 Análise SWOT');
  doc.moveDown(0.6);

  addParagraph(doc,
    'A análise SWOT (Strengths, Weaknesses, Opportunities, Threats) é uma ferramenta que permite identificar forças e fraquezas internas da organização, bem como oportunidades e ameaças externas do ambiente (CHIAVENATO; SAPIRO, 2003).'
  );

  addQuoteBox(doc, 
    'O conhecimento das forças e fraquezas internas, combinado com a compreensão das oportunidades e ameaças externas, permite à organização desenvolver estratégias que maximizam seus recursos e minimizam suas vulnerabilidades.',
    'Chiavenato e Sapiro, 2003'
  );

  addDiagramImage(doc, SWOT_DIAGRAM_PATH, 'Figura 1: Matriz de Análise SWOT');

  addInfoBox(doc, 'CONCEITO: SWOT', 
    'Forças (Strengths): Competências internas que geram vantagem competitiva\n' +
    'Fraquezas (Weaknesses): Limitações internas que prejudicam o desempenho\n' +
    'Oportunidades (Opportunities): Fatores externos favoráveis a serem explorados\n' +
    'Ameaças (Threats): Fatores externos desfavoráveis que exigem resposta'
  );

  addParagraph(doc,
    'Como o Simulador Usa SWOT:'
  );
  addBulletPoint(doc, 'Forças e Oportunidades aumentam percepção de marca, satisfação e lealdade');
  addBulletPoint(doc, 'Fraquezas e Ameaças reduzem esses indicadores');
  addBulletPoint(doc, 'O alinhamento entre SWOT e decisões de marketing impacta o score estratégico');

  addParagraph(doc,
    'Como Interpretar Resultados: Uma SWOT bem construída deve ter entre 3-5 itens em cada quadrante, ser específica ao contexto do setor escolhido e estar diretamente conectada às decisões do mix de marketing (THOMPSON; STRICKLAND, 2000).'
  );

  // ========== PORTER ==========
  doc.moveDown(0.8);
  addSubsectionTitle(doc, '3.2 As 5 Forças de Porter');
  doc.moveDown(0.6);

  addParagraph(doc,
    'Desenvolvida por Michael Porter em 1979, esta ferramenta analisa cinco forças competitivas que determinam a intensidade da competição e a atratividade de uma indústria (PORTER, 1979).'
  );

  addQuoteBox(doc,
    'A concorrência em uma indústria está enraizada em sua estrutura econômica básica e vai bem além do comportamento dos atuais concorrentes. O estado da concorrência depende de cinco forças competitivas básicas.',
    'Michael Porter, 1979'
  );

  addDiagramImage(doc, PORTER_DIAGRAM_PATH, 'Figura 2: As 5 Forças Competitivas de Porter');

  addInfoBox(doc, 'AS 5 FORÇAS', 
    '1. Rivalidade entre Concorrentes: Intensidade da competição direta\n' +
    '2. Poder de Negociação dos Fornecedores: Capacidade dos fornecedores de influenciar preços\n' +
    '3. Poder de Negociação dos Compradores: Capacidade dos clientes de pressionar preços\n' +
    '4. Ameaça de Produtos Substitutos: Risco de produtos alternativos\n' +
    '5. Ameaça de Novos Entrantes: Facilidade de novas empresas entrarem no mercado'
  );

  addParagraph(doc,
    'Como o Simulador Usa Porter:'
  );
  addBulletPoint(doc, 'Cada força é avaliada em escala de 1 (baixa) a 10 (alta)');
  addBulletPoint(doc, 'Forças altas (≥7) indicam maior pressão competitiva');
  addBulletPoint(doc, 'A soma das forças impacta a receita e market share');
  addBulletPoint(doc, 'Análises detalhadas nas notas de cada força aumentam o score');

  addParagraph(doc,
    'Como Interpretar Resultados: Indústrias com soma de forças alta (>35) são altamente competitivas e exigem estratégias diferenciadas. Setores com forças baixas (<25) oferecem maior margem para lucratividade (PORTER, 2008).'
  );

  // ========== BCG ==========
  doc.moveDown(0.8);
  addSubsectionTitle(doc, '3.3 Matriz BCG');
  doc.moveDown(0.6);

  addParagraph(doc,
    'Criada pelo Boston Consulting Group, a Matriz BCG classifica produtos de um portfólio em quatro categorias baseadas em crescimento de mercado e participação relativa de mercado (HENDERSON, 1970).'
  );

  addQuoteBox(doc,
    'Para ser bem-sucedida, uma empresa precisa ter um portfólio de produtos com diferentes taxas de crescimento e diferentes participações de mercado. O portfólio deve gerar tanto caixa quanto consumir caixa.',
    'Bruce Henderson, BCG, 1970'
  );

  addDiagramImage(doc, BCG_DIAGRAM_PATH, 'Figura 3: Matriz BCG (Boston Consulting Group)');

  addInfoBox(doc, 'QUADRANTES BCG', 
    'Estrelas (Stars): Alto crescimento + Alta participação - Investir para manter posição\n' +
    'Vacas Leiteiras (Cash Cows): Baixo crescimento + Alta participação - Maximizar lucro\n' +
    'Interrogações (Question Marks): Alto crescimento + Baixa participação - Avaliar potencial\n' +
    'Abacaxis (Dogs): Baixo crescimento + Baixa participação - Considerar descontinuar'
  );

  addParagraph(doc,
    'Como o Simulador Usa BCG:'
  );
  addBulletPoint(doc, 'Cada produto é posicionado em um quadrante');
  addBulletPoint(doc, 'Crescimento de mercado ≥ 5% = alto crescimento');
  addBulletPoint(doc, 'Participação relativa ≥ 1.0 = alta participação');
  addBulletPoint(doc, 'Produtos "Estrela" recebem bônus de receita e percepção');
  addBulletPoint(doc, '"Abacaxis" sofrem penalizações se receberem alto investimento');

  addParagraph(doc,
    'Como Interpretar Resultados: Um portfólio equilibrado deve ter Vacas Leiteiras financiando Estrelas e Interrogações selecionadas. Muitos Abacaxis indicam desperdício de recursos (KOTLER; KELLER, 2012).'
  );

  // ========== PESTEL ==========
  doc.moveDown(0.8);
  addSubsectionTitle(doc, '3.4 Análise PESTEL');
  doc.moveDown(0.6);

  addParagraph(doc,
    'A análise PESTEL examina fatores macroambientais que afetam as organizações: Políticos, Econômicos, Sociais, Tecnológicos, Ambientais e Legais (KOTLER; KELLER, 2012).'
  );

  addQuoteBox(doc,
    'O ambiente de marketing de uma empresa consiste em atores e forças externas ao marketing que afetam a capacidade da administração de marketing de desenvolver e manter relacionamentos bem-sucedidos com os clientes-alvo.',
    'Kotler e Keller, 2012'
  );

  addDiagramImage(doc, PESTEL_DIAGRAM_PATH, 'Figura 4: Fatores da Análise PESTEL');

  addInfoBox(doc, 'DIMENSÕES PESTEL', 
    'P - Político: Estabilidade política, políticas governamentais, tributação\n' +
    'E - Econômico: Inflação, câmbio, crescimento econômico, desemprego\n' +
    'S - Social: Demografia, cultura, educação, estilo de vida\n' +
    'T - Tecnológico: Inovação, automação, P&D, infraestrutura tecnológica\n' +
    'E - Ambiental: Sustentabilidade, mudanças climáticas, regulações ambientais\n' +
    'L - Legal: Leis trabalhistas, proteção ao consumidor, propriedade intelectual'
  );

  addParagraph(doc,
    'Como o Simulador Usa PESTEL:'
  );
  addBulletPoint(doc, 'Cada dimensão deve ter 1-5 fatores identificados');
  addBulletPoint(doc, 'Fatores econômicos têm peso maior nos cálculos');
  addBulletPoint(doc, 'Análises completas (todas dimensões preenchidas) maximizam o score');
  addBulletPoint(doc, 'A PESTEL conecta-se aos eventos econômicos ativos no jogo');

  addParagraph(doc,
    'Como Interpretar Resultados: Uma PESTEL eficaz antecipa mudanças no ambiente externo e permite adaptação proativa. Segundo Johnson, Scholes e Whittington (2007), organizações que monitoram sistematicamente o macroambiente têm vantagem competitiva.'
  );
}

function addFormulasSection(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, '4. FÓRMULAS MATEMÁTICAS UTILIZADAS');
  doc.moveDown();

  addParagraph(doc,
    'O Simula+ utiliza 19 indicadores-chave de desempenho (KPIs) calculados automaticamente. Abaixo estão as fórmulas matemáticas que regem o sistema:'
  );

  addQuoteBox(doc,
    'O que não se mede não se gerencia. Os indicadores de desempenho são ferramentas essenciais para transformar dados em decisões estratégicas eficazes.',
    'Peter Drucker, 2001'
  );

  // Custos
  doc.moveDown();
  addFormulaBox(doc, '1. CUSTOS DE MARKETING', 
    'Custos = Custo_Base × Multiplicador_Total\n\n' +
    'Onde:\n' +
    'Custo_Base = R$ 10.000\n\n' +
    'Multiplicador_Total = 1.0 + ajustes:\n' +
    '  • Qualidade Premium: +0.4\n' +
    '  • Qualidade Média: +0.2\n' +
    '  • Qualidade Básica: +0.1\n' +
    '  • Características Completas: +0.3\n' +
    '  • Características Intermediárias: +0.15\n' +
    '  • Canais de Distribuição: +0.1 por canal\n' +
    '  • Mix Promocional: +0.15 por mídia\n' +
    '  • Intensidade Intensiva: +0.5\n' +
    '  • Intensidade Alta: +0.3\n' +
    '  • Intensidade Média: +0.15\n' +
    '  • Cobertura Internacional: +0.4\n' +
    '  • Cobertura Nacional: +0.25\n' +
    '  • Cobertura Regional: +0.1'
  );

  // Receita
  doc.moveDown(0.8);
  addFormulaBox(doc, '2. RECEITA', 
    'Receita = Demanda_Base × Score_Produto × Score_Preço × Score_Praça × Score_Promoção × Impacto_Eventos × (Orçamento/100000)\n\n' +
    'Onde:\n' +
    'Demanda_Base: varia por setor e tipo de negócio (B2B/B2C)\n' +
    'Scores: valores de 0 a 100 normalizados para 0.0 a 1.0\n' +
    'Impacto_Eventos: multiplicador de eventos econômicos (0.5 a 1.5)\n' +
    'Orçamento: orçamento da equipe (padrão R$ 100.000)'
  );

  // Score Produto
  addFormulaBox(doc, '2.1 Score do Produto', 
    'Score_Produto = 50 + ajustes:\n' +
    '  • Qualidade Premium: +40\n' +
    '  • Qualidade Média: +25\n' +
    '  • Qualidade Básica: +10\n' +
    '  • Características Completas: +25\n' +
    '  • Características Intermediárias: +15\n' +
    '  • Características Básicas: +5\n\n' +
    'Máximo: 100'
  );

  // Score Preço
  addFormulaBox(doc, '2.2 Score do Preço', 
    'Score_Preço = 50 + ajuste_estratégia + ajuste_otimalidade + ajuste_tipo_negócio\n\n' +
    'Ajuste por Estratégia:\n' +
    '  • Penetração (preço < 50): +30\n' +
    '  • Competitivo (50 ≤ preço ≤ 100): +35\n' +
    '  • Skimming (preço > 100): +30\n' +
    '  • Valor: +25\n\n' +
    'Otimalidade = 100 - |75 - preço| × 0.5\n\n' +
    'Ajuste Tipo Negócio:\n' +
    '  • B2B com preço > 80: +10\n' +
    '  • B2C com preço < 90: +5'
  );

  // Score Praça
  doc.moveDown(0.8);
  addFormulaBox(doc, '2.3 Score da Praça', 
    'Score_Praça = 40 + (nº canais × 8) + ajuste_cobertura + ajuste_tipo\n\n' +
    'Ajuste Cobertura:\n' +
    '  • Internacional: +40\n' +
    '  • Nacional: +30\n' +
    '  • Regional: +20\n' +
    '  • Local: +10\n\n' +
    'Ajuste Tipo Negócio:\n' +
    '  • B2B com ≥2 canais: +10\n' +
    '  • B2C com ≥3 canais: +10\n\n' +
    'Máximo: 100'
  );

  // Score Promoção
  addFormulaBox(doc, '2.4 Score da Promoção', 
    'Score_Promoção = 40 + (nº mídias × 10) + ajuste_intensidade\n\n' +
    'Ajuste Intensidade:\n' +
    '  • Intensivo: +40\n' +
    '  • Alto: +30\n' +
    '  • Médio: +20\n' +
    '  • Baixo: +10\n\n' +
    'Máximo: 100'
  );

  // Impacto de Eventos
  addFormulaBox(doc, '2.5 Impacto de Eventos Econômicos', 
    'Impacto_Total = 1.0 + Σ(impacto_individual)\n\n' +
    'Para cada evento ativo:\n' +
    '  Severidade Crítica: ±0.25\n' +
    '  Severidade Alta: ±0.15\n' +
    '  Severidade Média: ±0.10\n' +
    '  Severidade Baixa: ±0.05\n\n' +
    'Sinal:\n' +
    '  • Economia/Competição: negativo (-)\n' +
    '  • Tecnologia/Social: positivo (+) × 0.5\n\n' +
    'Limites: 0.5 ≤ Impacto_Total ≤ 1.5'
  );

  // Lucro e Margem
  doc.moveDown(0.8);
  addFormulaBox(doc, '3. LUCRO', 
    'Lucro = Receita - Custos'
  );

  addFormulaBox(doc, '4. MARGEM (%)', 
    'Margem = (Lucro / Receita) × 100\n\n' +
    'Interpretação:\n' +
    '  • > 30%: Excelente\n' +
    '  • 15-30%: Boa\n' +
    '  • 5-15%: Moderada\n' +
    '  • < 5%: Baixa'
  );

  // Market Share
  addFormulaBox(doc, '5. PARTICIPAÇÃO DE MERCADO (Market Share)', 
    'Market_Share = (Receita_Equipe / Tamanho_Mercado_Total) × 100 × Fator_Competição\n\n' +
    'Onde:\n' +
    'Tamanho_Mercado_Total: definido por setor\n' +
    'Fator_Competição:\n' +
    '  • Competição Baixa: 1.2\n' +
    '  • Competição Média: 1.0\n' +
    '  • Competição Alta: 0.8\n' +
    '  • Competição Muito Alta: 0.6'
  );

  // ROI
  addFormulaBox(doc, '6. RETORNO SOBRE INVESTIMENTO (ROI)', 
    'ROI = (Lucro / Custos) × 100\n\n' +
    'Interpretação:\n' +
    '  • > 100%: Excelente retorno\n' +
    '  • 50-100%: Bom retorno\n' +
    '  • 20-50%: Retorno moderado\n' +
    '  • < 20%: Retorno baixo'
  );

  // Percepção de Marca
  doc.moveDown(0.8);
  addFormulaBox(doc, '7. PERCEPÇÃO DE MARCA', 
    'Percepção = (Score_Produto × 0.4 + Score_Promoção × 0.3 + Alinhamento_Mercado × 0.3) + Bônus_SWOT\n\n' +
    'Bônus_SWOT:\n' +
    '  • Por Força identificada: +2 pontos\n' +
    '  • Por Oportunidade: +1.5 pontos\n\n' +
    'Máximo: 100'
  );

  // Satisfação do Cliente
  addFormulaBox(doc, '8. SATISFAÇÃO DO CLIENTE', 
    'Satisfação = (Score_Produto × 0.35 + Score_Preço × 0.25 + Score_Praça × 0.2 + Score_Promoção × 0.2)\n\n' +
    'Ajustes:\n' +
    '  • Preço adequado ao tipo negócio: +5\n' +
    '  • Alta cobertura de distribuição: +3\n\n' +
    'Máximo: 100'
  );

  // Lealdade
  addFormulaBox(doc, '9. LEALDADE DO CLIENTE', 
    'Lealdade = (Satisfação × 0.5 + Percepção × 0.3 + Score_Produto × 0.2) + Bônus_SWOT\n\n' +
    'Bônus_SWOT: +1 ponto por Força\n\n' +
    'Máximo: 100'
  );

  // CAC
  addFormulaBox(doc, '10. CUSTO DE AQUISIÇÃO DE CLIENTE (CAC)', 
    'CAC = Custos_Totais / Nº_Clientes_Estimados\n\n' +
    'Onde:\n' +
    'Nº_Clientes = Receita / Preço_Médio\n\n' +
    'Meta: CAC < (LTV / 3)'
  );

  // Ticket Médio
  doc.moveDown(0.8);
  addFormulaBox(doc, '11. TICKET MÉDIO', 
    'Ticket_Médio = Receita / Nº_Clientes\n\n' +
    'Interpretação:\n' +
    'Indica o valor médio gasto por cliente'
  );

  // LTV
  addFormulaBox(doc, '12. LIFETIME VALUE (LTV)', 
    'LTV = Ticket_Médio × (1 + Lealdade/100) × (1 + Satisfação/200)\n\n' +
    'Fatores que aumentam LTV:\n' +
    '  • Alta lealdade do cliente\n' +
    '  • Alta satisfação\n' +
    '  • Ticket médio elevado'
  );

  // Razão LTV/CAC
  addFormulaBox(doc, '13. RAZÃO LTV/CAC', 
    'Razão_LTV_CAC = LTV / CAC\n\n' +
    'Interpretação:\n' +
    '  • > 3.0: Excelente - Investimento sustentável\n' +
    '  • 2.0-3.0: Bom - Equilíbrio adequado\n' +
    '  • 1.0-2.0: Atenção - Melhorar eficiência\n' +
    '  • < 1.0: Crítico - Negócio insustentável'
  );

  // Taxa de Conversão
  addFormulaBox(doc, '14. TAXA DE CONVERSÃO (%)', 
    'Taxa_Conversão = Base × (Score_Produto/100) × (Score_Preço/100) × (Score_Praça/100) × (Score_Promoção/100) × Ajuste_Competição\n\n' +
    'Onde:\n' +
    'Base:\n' +
    '  • B2C: 3.5%\n' +
    '  • B2B: 2.0%\n' +
    '  • Híbrido: 2.75%\n\n' +
    'Ajuste_Competição:\n' +
    '  • Alta: ×0.7\n' +
    '  • Média: ×1.0\n' +
    '  • Baixa: ×1.3'
  );

  // NPS
  doc.moveDown(0.8);
  addFormulaBox(doc, '15. NET PROMOTER SCORE (NPS)', 
    'NPS = (Satisfação × 0.4 + Lealdade × 0.4 + Percepção × 0.2) - 50\n\n' +
    'Escala: -100 a +100\n\n' +
    'Interpretação:\n' +
    '  • 75-100: Zona de Excelência\n' +
    '  • 50-74: Zona de Qualidade\n' +
    '  • 0-49: Zona de Aperfeiçoamento\n' +
    '  • -100 a -1: Zona Crítica'
  );

  // Tempo Médio de Conversão
  addFormulaBox(doc, '16. TEMPO MÉDIO DE CONVERSÃO (dias)', 
    'Tempo = Base - (Score_Produto × 0.2) - (Score_Preço × 0.15) + Ajuste_Competição\n\n' +
    'Onde:\n' +
    'Base:\n' +
    '  • B2C: 15 dias\n' +
    '  • B2B: 45 dias\n' +
    '  • Híbrido: 30 dias\n\n' +
    'Ajuste_Competição:\n' +
    '  • Alta: +10 dias\n' +
    '  • Média: +5 dias\n' +
    '  • Baixa: 0 dias\n\n' +
    'Mínimo: 1 dia'
  );

  // Receita Bruta e Líquida
  addFormulaBox(doc, '17. RECEITA BRUTA E LÍQUIDA', 
    'Receita_Bruta = Receita (calculada anteriormente)\n\n' +
    'Receita_Líquida = Receita_Bruta × (1 - Taxa_Dedução)\n\n' +
    'Taxa_Dedução base: 5%\n\n' +
    'Acréscimos:\n' +
    '  • Promoções de desconto/cupons: +8%\n' +
    '  • Marketplaces: +12%'
  );

  // Margem de Contribuição
  doc.moveDown(0.8);
  addFormulaBox(doc, '18. MARGEM DE CONTRIBUIÇÃO (%)', 
    'Margem_Contribuição = ((Receita_Líquida - Custos_Variáveis) / Receita_Líquida) × 100\n\n' +
    'Onde:\n' +
    'Custos_Variáveis = Custos_Totais × 0.6 (60% dos custos)\n\n' +
    'Interpretação:\n' +
    '  • > 50%: Excelente contribuição\n' +
    '  • 30-50%: Boa contribuição\n' +
    '  • 15-30%: Moderada\n' +
    '  • < 15%: Baixa - risco de inviabilidade'
  );

  // Modificadores Estratégicos
  addFormulaBox(doc, '19. MODIFICADORES DE ALINHAMENTO ESTRATÉGICO', 
    'Score_Alinhamento = Σ(Completude + Alinhamento_SWOT + Alinhamento_Porter + Alinhamento_BCG + Alinhamento_PESTEL) - Penalidades_IA\n\n' +
    'Penalidades por Conteúdo IA não editado:\n' +
    '  • 70-100% similaridade: -30 pontos (severa)\n' +
    '  • 30-69% similaridade: -10 pontos (moderada)\n' +
    '  • 0-29% similaridade: sem penalidade\n\n' +
    'Impacto nos KPIs:\n' +
    '  Score ≥ 90: Receita +15%, Lucro +20%, Market Share +10%\n' +
    '  Score 70-89: Receita +5%, Lucro +10%, Market Share +5%\n' +
    '  Score 50-69: Sem modificadores\n' +
    '  Score 30-49: Receita -10%, Lucro -15%, Market Share -5%\n' +
    '  Score < 30: Receita -25%, Lucro -35%, Market Share -15%'
  );

  doc.moveDown();
  addWarningBox(doc,
    '⚠️ IMPORTANTE: Todas as fórmulas são aplicadas de forma integrada. O desempenho final é resultado da combinação de decisões de marketing, análises estratégicas, eventos econômicos e alinhamento entre estratégia e execução.'
  );
}

function addStepByStepSection(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, '5. PASSO A PASSO PARA OS ALUNOS');
  doc.moveDown();

  addSubsectionTitle(doc, 'Como Acessar o Simulador');
  doc.moveDown(0.5);

  addNumberedStep(doc, '1', 'Acesse o site simulamarketing.com.br');
  addNumberedStep(doc, '2', 'Clique em "Cadastrar" se for seu primeiro acesso');
  addNumberedStep(doc, '3', 'Preencha: Nome, Email, Senha, Código da Turma (fornecido pelo professor)');

  doc.moveDown();
  addInfoBox(doc, '✅ APROVAÇÃO AUTOMÁTICA - EMAILS INSTITUCIONAIS', 
    'Se você usar um email institucional, será APROVADO AUTOMATICAMENTE:\n\n' +
    '• @iffarroupilha.edu.br\n' +
    '• @aluno.iffar.edu.br\n' +
    '• @aluno.iffarroupilha.edu.br\n' +
    '• Maiúsculas/minúsculas NÃO importam (@ALUNO.IFFAR.EDU.BR funciona!)\n\n' +
    'Emails de outros domínios precisam de aprovação manual do professor.'
  );

  doc.moveDown();
  addNumberedStep(doc, '4', 'Faça login com suas credenciais');

  doc.moveDown();
  addSubsectionTitle(doc, 'Esqueceu Sua Senha?');
  doc.moveDown(0.5);

  addNumberedStep(doc, '1', 'Na tela de login, clique em "Esqueci minha senha"');
  addNumberedStep(doc, '2', 'Digite seu email cadastrado');
  addNumberedStep(doc, '3', 'Clique em "Enviar link de recuperação"');
  addNumberedStep(doc, '4', 'Verifique seu email (inclusive pasta de SPAM)');
  addNumberedStep(doc, '5', 'Clique no link recebido (válido por 1 hora)');
  addNumberedStep(doc, '6', 'Digite sua nova senha e confirme');

  doc.moveDown();
  addWarningBox(doc,
    '⚠️ IMPORTANTE SOBRE RECUPERAÇÃO DE SENHA\n\n' +
    '• O link de recuperação expira em 1 HORA\n' +
    '• Verifique a pasta de SPAM se não receber o email\n' +
    '• Se não receber, tente novamente ou contate o professor'
  );

  doc.moveDown();
  addSubsectionTitle(doc, 'Como Formar/Entrar em uma Equipe');
  doc.moveDown(0.5);

  addNumberedStep(doc, '1', 'No dashboard, clique em "Criar Equipe" ou "Entrar em Equipe"');
  addNumberedStep(doc, '2', 'Se criar: escolha nome da equipe, setor e produtos');
  addNumberedStep(doc, '3', 'Se entrar: digite o código da equipe existente');
  addNumberedStep(doc, '4', 'Equipes têm até 5 membros');

  doc.moveDown();
  addSubsectionTitle(doc, '🚨 ETAPA 1 (OBRIGATÓRIA): Análises Estratégicas PRIMEIRO');
  doc.moveDown(0.5);

  addWarningBox(doc,
    '⚠️ ATENÇÃO - ORDEM OBRIGATÓRIA\n\n' +
    'O sistema BLOQUEIA o acesso ao Marketing Mix até que você complete TODAS as 4 análises estratégicas.\n\n' +
    'Você NÃO PODE configurar produtos antes de completar: SWOT, Porter, BCG e PESTEL.\n\n' +
    'Esta é uma regra FORÇADA pelo sistema - não é opcional!'
  );

  doc.moveDown();
  addNumberedStep(doc, '1', 'Acesse "Análises Estratégicas" no menu lateral');
  addNumberedStep(doc, '2', 'Complete AS 4 FERRAMENTAS obrigatórias:');
  
  doc.fontSize(9).font('Helvetica-Bold').fillColor(PRIMARY_COLOR);
  addBulletPoint(doc, '✓ SWOT: Mínimo 1 item em cada quadrante (Forças, Fraquezas, Oportunidades, Ameaças)');
  addBulletPoint(doc, '✓ PORTER: Avaliar as 5 forças de 1-10 com notas explicativas');
  addBulletPoint(doc, '✓ BCG: Posicionar os 4 produtos nos quadrantes');
  addBulletPoint(doc, '✓ PESTEL: Analisar os 6 fatores macroambientais');
  doc.moveDown(0.3);

  addNumberedStep(doc, '3', 'Na Rodada 1: use o botão "Gerar com IA" como ponto de partida');
  addNumberedStep(doc, '4', '⚠️ IMPORTANTE: SEMPRE edite o conteúdo da IA! Copiar sem editar gera penalizações');
  addNumberedStep(doc, '5', 'Salve rascunhos frequentemente');
  addNumberedStep(doc, '6', '✅ SUBMETA todas as 4 ferramentas');

  doc.moveDown();
  addInfoBox(doc, '🔒 O QUE ACONTECE SE NÃO COMPLETAR?', 
    'Se tentar acessar Marketing Mix sem completar as análises, você verá:\n\n' +
    '"⚠️ ETAPA OBRIGATÓRIA: Complete todas as Análises Estratégicas primeiro!"\n\n' +
    'O sistema informará exatamente quais análises estão faltando.\n' +
    'Você será IMPEDIDO de salvar qualquer decisão de produto até completar TODAS.'
  );

  doc.moveDown();
  addSubsectionTitle(doc, 'Como Configurar o Marketing Mix (4 Produtos Individuais)');
  doc.moveDown(0.5);

  addWarningBox(doc,
    '🎯 CONCEITO FUNDAMENTAL\n\n' +
    'Você configura CADA um dos 4 produtos SEPARADAMENTE, um de cada vez.\n' +
    'Cada produto pode ter uma estratégia DIFERENTE (ex: Produto 1 = Premium, Produto 2 = Popular).\n' +
    'O sistema calcula KPIs para CADA produto individualmente e depois CONSOLIDA tudo.'
  );

  doc.moveDown();
  addNumberedStep(doc, '1', 'Acesse "Marketing Mix" no menu lateral');
  addNumberedStep(doc, '2', 'Selecione PRODUTO 1 - Configure os 4 Ps completos:');
  
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_COLOR);
  addBulletPoint(doc, 'PRODUTO: Qualidade (alta/média/básica), Características, Posicionamento');
  addBulletPoint(doc, 'PREÇO: Estratégia (premium/competitivo/penetração), Valor em R$');
  addBulletPoint(doc, 'PRAÇA: Canais de distribuição, Cobertura geográfica');
  addBulletPoint(doc, 'PROMOÇÃO: Mix promocional, Intensidade, Orçamento por canal');
  doc.moveDown(0.3);

  addNumberedStep(doc, '3', '✅ SALVE O RASCUNHO do Produto 1');
  addNumberedStep(doc, '4', 'Use a SETA DIREITA (▶) para ir ao PRODUTO 2');
  addNumberedStep(doc, '5', 'Configure o PRODUTO 2 com os 4 Ps (pode ser estratégia diferente!)');
  addNumberedStep(doc, '6', '✅ SALVE O RASCUNHO do Produto 2');
  addNumberedStep(doc, '7', 'Repita para PRODUTO 3 e PRODUTO 4');
  addNumberedStep(doc, '8', 'Revise os 4 produtos navegando com as setas ◀▶');
  addNumberedStep(doc, '9', '⚠️ SUBMETA TUDO junto quando os 4 estiverem prontos');

  doc.moveDown();
  addInfoBox(doc, '📊 COMO O SISTEMA PROCESSA', 
    'DURANTE A RODADA:\n' +
    '• Você salva cada produto individualmente (rascunhos independentes)\n\n' +
    'AO FINALIZAR A RODADA:\n' +
    '• Sistema calcula KPIs de CADA produto separadamente\n' +
    '• Revenue Produto 1 + Revenue Produto 2 + ... = Revenue Total\n' +
    '• Lucro Produto 1 + Lucro Produto 2 + ... = Lucro Total\n' +
    '• Market Share = Média dos 4 produtos\n' +
    '• Você verá resultados INDIVIDUAIS e CONSOLIDADOS'
  );

  doc.moveDown(0.8);
  addSubsectionTitle(doc, 'O Que Fazer e o Que Evitar');
  doc.moveDown(0.6);

  addInfoBox(doc, '✅ BOAS PRÁTICAS', 
    '• Leia o Manual do Aluno antes de começar\n' +
    '• Discuta estratégias com sua equipe antes de decidir\n' +
    '• Pesquise sobre o setor escolhido (tendências, concorrentes)\n' +
    '• Edite SEMPRE os conteúdos gerados pela IA\n' +
    '• Alinhe análises estratégicas com decisões de marketing\n' +
    '• Salve rascunhos frequentemente\n' +
    '• Analise os KPIs após cada rodada\n' +
    '• Leia o feedback inteligente e aplique melhorias\n' +
    '• Experimente estratégias diferentes entre produtos\n' +
    '• Monitore eventos econômicos ativos'
  );

  doc.moveDown();
  addWarningBox(doc, 
    '❌ ERROS COMUNS A EVITAR\n\n' +
    '• Copiar conteúdo da IA sem editar (PENALIZAÇÃO SEVERA!)\n' +
    '• Submeter análises incompletas\n' +
    '• Ignorar o alinhamento entre SWOT/Porter/BCG/PESTEL e 4Ps\n' +
    '• Configurar apenas 1 ou 2 produtos (todos os 4 são obrigatórios)\n' +
    '• Não salvar rascunhos (risco de perder trabalho)\n' +
    '• Escolher preço sem considerar a estratégia de precificação\n' +
    '• Ignorar o orçamento disponível\n' +
    '• Não ler o feedback da rodada anterior\n' +
    '• Deixar para última hora (sistema fecha automaticamente)\n' +
    '• Não comunicar com a equipe'
  );

  doc.moveDown();
  addSubsectionTitle(doc, 'Dicas para Maximizar o Desempenho');
  doc.moveDown(0.5);

  addParagraph(doc,
    '🎯 Foco no Alinhamento Estratégico: O score de alinhamento (0-100) é o fator mais importante. Garanta que suas decisões de marketing sejam coerentes com suas análises.'
  );

  addParagraph(doc,
    '📚 Estude os Conceitos: Entender SWOT, Porter, BCG e PESTEL na teoria facilita a aplicação prática.'
  );

  addParagraph(doc,
    '💡 Use a IA como Ferramenta de Aprendizado: Na Rodada 1, a IA gera análises completas. Use-as como exemplo, mas SEMPRE personalize com insights próprios.'
  );

  addParagraph(doc,
    '📊 Analise Concorrentes: No painel de Insights, veja como outras equipes estão performando e identifique gaps competitivos.'
  );

  addParagraph(doc,
    '🔄 Itere e Melhore: Cada rodada é uma oportunidade de aprender. Ajuste estratégias com base nos resultados anteriores.'
  );

  doc.moveDown();
  addInfoBox(doc, '📊 EXEMPLO PRÁTICO DE PRODUTOS INDIVIDUAIS', 
    'Imagine sua equipe no setor de Tecnologia:\n\n' +
    'PRODUTO 1 - Smartphone Premium:\n' +
    '  • Estratégia: Alta qualidade, preço R$ 2.500, distribuição seletiva\n' +
    '  • Resultado: Receita R$ 80.000, Lucro R$ 25.000, Market Share 3%\n\n' +
    'PRODUTO 2 - Smartphone Médio:\n' +
    '  • Estratégia: Custo-benefício, preço R$ 1.200, distribuição ampla\n' +
    '  • Resultado: Receita R$ 120.000, Lucro R$ 35.000, Market Share 6%\n\n' +
    'PRODUTO 3 - Smartphone Básico:\n' +
    '  • Estratégia: Penetração, preço R$ 600, distribuição massiva\n' +
    '  • Resultado: Receita R$ 90.000, Lucro R$ 18.000, Market Share 8%\n\n' +
    'PRODUTO 4 - Smartphone Kids:\n' +
    '  • Estratégia: Nicho, preço R$ 800, distribuição especializada\n' +
    '  • Resultado: Receita R$ 50.000, Lucro R$ 12.000, Market Share 2%\n\n' +
    'RESULTADO CONSOLIDADO DA EQUIPE:\n' +
    '  ✓ Receita Total: R$ 340.000 (soma de todos)\n' +
    '  ✓ Lucro Total: R$ 90.000 (soma de todos)\n' +
    '  ✓ Market Share Médio: 4,75% (média dos 4)\n' +
    '  ✓ Margem: 26,5% (lucro/receita)\n\n' +
    'Perceba: Produto 2 teve maior receita/lucro, mas Produto 3 teve maior\n' +
    'market share. Isso é gestão de portfólio real!'
  );
}

function addFAQSection(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, '6. PERGUNTAS FREQUENTES (FAQ)');
  doc.moveDown();

  addFAQ(doc, 
    'O que acontece se eu não enviar as decisões no prazo?',
    'Se a rodada encerrar sem que sua equipe tenha submetido as decisões, vocês receberão pontuação zero naquela rodada. É fundamental respeitar os prazos estabelecidos pelo professor. Recomendamos finalizar com pelo menos 1 dia de antecedência.'
  );

  addFAQ(doc, 
    'Como funciona a penalização por uso de IA?',
    'O sistema rastreia o quanto você editou o conteúdo gerado pela IA usando algoritmo de similaridade (Levenshtein Distance). Se a similaridade for 70-100% (pouco editado), você perde 30 pontos no score de alinhamento. Se for 30-69%, perde 10 pontos. Abaixo de 30% não há penalização. A mensagem é clara: USE a IA para aprender, mas PERSONALIZE com suas análises.'
  );

  addFAQ(doc, 
    'Posso alterar a estratégia ao longo das rodadas?',
    'Sim! Na verdade, é esperado que você ajuste suas estratégias com base nos resultados anteriores e nas mudanças do mercado (eventos econômicos). Estratégias rígidas raramente funcionam em ambientes dinâmicos (MINTZBERG et al., 2010).'
  );

  addFAQ(doc, 
    'Como interpretar meu desempenho?',
    'Foque em três métricas principais: (1) Score de Alinhamento Estratégico - indica coerência; (2) Lucro e Margem - indicam viabilidade financeira; (3) NPS e Satisfação - indicam sucesso com clientes. Um bom desempenho equilibra as três dimensões.'
  );

  doc.moveDown(0.8);
  addFAQ(doc, 
    'O que são os eventos econômicos?',
    'São situações do mercado (inflação, crise, inovação tecnológica, etc.) que afetam todas as equipes. Eles multiplicam a receita em até ±50%. Eventos negativos (economia/competição) reduzem receita, enquanto positivos (tecnologia/social) aumentam. Monitore-os na tela de Insights.'
  );

  addFAQ(doc, 
    'Preciso configurar os 4 produtos ou posso focar em 1?',
    'Você DEVE configurar todos os 4 produtos. O sistema só aceita submissão quando todos estiverem completos. Isso reflete a realidade de gestão de portfólio, onde empresas gerenciam múltiplos produtos simultaneamente (KOTLER; KELLER, 2012).'
  );

  addFAQ(doc, 
    'Como o sistema calcula os resultados: individual ou consolidado?',
    'O sistema usa um SISTEMA HÍBRIDO muito importante de entender: (1) DURANTE A RODADA: Você configura cada produto separadamente, salvando rascunhos individuais. (2) AO PROCESSAR: O sistema calcula KPIs para CADA produto individualmente (Receita Produto 1, Lucro Produto 1, etc.). (3) CONSOLIDAÇÃO: Soma as receitas dos 4 produtos, soma os lucros, faz média do market share. (4) RESULTADOS: Você vê tanto os resultados INDIVIDUAIS de cada produto quanto o CONSOLIDADO da equipe. Exemplo: Se Produto 1 teve R$ 50k de receita e Produto 2 teve R$ 30k, sua receita total é R$ 80k.'
  );

  addFAQ(doc, 
    'Posso usar estratégias diferentes para cada produto?',
    'SIM! E é altamente recomendado! Produto 1 pode ser premium de alta qualidade, Produto 2 pode ser popular de preço competitivo, Produto 3 pode ser básico de penetração de mercado. Cada produto tem seus próprios 4 Ps independentes. Isso simula a realidade de gestão de portfólio onde produtos diferentes atendem segmentos diferentes (Matriz BCG).'
  );

  addFAQ(doc, 
    'Por que não consigo acessar o Marketing Mix?',
    'O sistema BLOQUEIA o acesso ao Marketing Mix até que você complete TODAS as 4 análises estratégicas (SWOT, Porter, BCG, PESTEL) da rodada atual. Esta é uma regra OBRIGATÓRIA forçada tecnicamente pelo sistema. Você verá uma mensagem clara indicando quais análises estão faltando. Complete todas elas primeiro, depois o Marketing Mix será liberado automaticamente.'
  );

  addFAQ(doc, 
    'O que significa "Assistência IA: 70%" na Rodada 2?',
    'Significa que a IA gera análises 70% completas (parciais). Você precisa completar os 30% restantes e editar o que foi gerado. Na Rodada 3+, a assistência é 0% - você cria tudo do zero. Este sistema visa desenvolver sua autonomia gradualmente.'
  );

  addFAQ(doc, 
    'Como funciona a Matriz BCG com 4 produtos?',
    'Você posiciona cada produto em um dos 4 quadrantes (Estrela, Vaca Leiteira, Interrogação, Abacaxi) com base em crescimento de mercado e participação relativa. O ideal é ter um portfólio equilibrado: Vacas financiando Estrelas, algumas Interrogações promissoras, poucos Abacaxis.'
  );

  addFAQ(doc, 
    'Posso mudar de equipe durante o jogo?',
    'Não. Uma vez associado a uma equipe, você permanece nela até o fim do jogo. Escolha seus colegas com cuidado e mantenha boa comunicação.'
  );

  addFAQ(doc, 
    'O que fazer se meu score de alinhamento estiver baixo?',
    'Revise suas análises estratégicas e decisões de marketing. Identifique incoerências. Por exemplo: se sua SWOT indica "preço competitivo" como força, mas você escolheu preço premium, há desalinhamento. Ajuste na próxima rodada.'
  );

  addFAQ(doc, 
    'Como o orçamento afeta meus resultados?',
    'O orçamento (padrão R$ 100.000) é usado como multiplicador nos cálculos de receita. Equipes com orçamento maior têm potencial de receita maior, mas isso é definido pelo professor no início e não muda durante o jogo.'
  );

  addFAQ(doc, 
    'O feedback inteligente é automático?',
    'Sim. Ao final de cada rodada, o sistema gera automaticamente um feedback personalizado usando IA, analisando suas decisões, resultados, KPIs e sugerindo melhorias. Leia com atenção - é uma ferramenta valiosa de aprendizado.'
  );
}

function addReferencesSection(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, '7. REFERÊNCIAS BIBLIOGRÁFICAS');
  doc.moveDown();

  addParagraph(doc,
    'Todas as citações e conceitos apresentados neste manual são fundamentados em obras acadêmicas reconhecidas. As referências estão formatadas segundo normas ABNT.'
  );

  doc.moveDown();
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_COLOR);

  const references = [
    'CHIAVENATO, I.; SAPIRO, A. Planejamento Estratégico: Fundamentos e Aplicações. Rio de Janeiro: Elsevier, 2003.',
    
    'DRUCKER, P. F. The Essential Drucker: The Best of Sixty Years of Peter Drucker\'s Essential Writings on Management. New York: HarperBusiness, 2001.',
    
    'HENDERSON, B. D. The Product Portfolio. Boston: Boston Consulting Group, 1970.',
    
    'JOHNSON, G.; SCHOLES, K.; WHITTINGTON, R. Explorando a Estratégia Corporativa: Texto e Casos. 7. ed. Porto Alegre: Bookman, 2007.',
    
    'KOTLER, P.; KELLER, K. L. Administração de Marketing. 14. ed. São Paulo: Pearson Education do Brasil, 2012.',
    
    'MINTZBERG, H.; AHLSTRAND, B.; LAMPEL, J. Safári de Estratégia: Um Roteiro pela Selva do Planejamento Estratégico. 2. ed. Porto Alegre: Bookman, 2010.',
    
    'NIELSEN, J.; BUDIU, R. Mobile Usability. Berkeley: New Riders, 2012.',
    
    'PORTER, M. E. How Competitive Forces Shape Strategy. Harvard Business Review, v. 57, n. 2, p. 137-145, mar./abr. 1979.',
    
    'PORTER, M. E. The Five Competitive Forces That Shape Strategy. Harvard Business Review, v. 86, n. 1, p. 78-93, jan. 2008.',
    
    'PORTER, M. E. What is Strategy? Harvard Business Review, v. 74, n. 6, p. 61-78, nov./dez. 1996.',
    
    'THOMPSON, A. A.; STRICKLAND, A. J. Strategic Management: Concepts and Cases. 12. ed. Boston: McGraw-Hill, 2000.',
    
    'VYGOTSKY, L. S. Mind in Society: The Development of Higher Psychological Processes. Cambridge: Harvard University Press, 1978.',
  ];

  references.forEach((ref, index) => {
    doc.text(ref, { indent: 20, align: 'justify', lineGap: 4 });
    if (index < references.length - 1) {
      doc.moveDown(0.7);
    }
  });

  doc.moveDown(2);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(PRIMARY_COLOR);
  doc.text('_______________', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(9).font('Helvetica-Oblique').fillColor(DARK_GRAY);
  doc.text('Simula+ - Transformando estudantes em estrategistas', { align: 'center' });
  doc.text(`Versão 1.0 | ${new Date().getFullYear()}`, { align: 'center' });
}

// =====================
// FUNÇÕES DE FORMATAÇÃO
// =====================

function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_COLOR)
     .text(title, { align: 'left' });
  
  doc.moveDown(0.3);
  doc.moveTo(60, doc.y)
     .lineTo(535, doc.y)
     .lineWidth(2)
     .stroke(PRIMARY_COLOR);
  doc.moveDown(0.5);
}

function addSubsectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(SECONDARY_COLOR)
     .text(title, { align: 'left' });
}

function addParagraph(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(TEXT_COLOR)
     .text(text, { align: 'justify', lineGap: 2 });
  doc.moveDown(0.7);
}

function addBulletPoint(doc: PDFKit.PDFDocument, text: string) {
  const y = doc.y;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(ACCENT_COLOR)
     .text('•', 70, y);
  doc.fillColor(TEXT_COLOR)
     .text(text, 90, y, { width: 445, lineGap: 1 });
  doc.moveDown(0.5);
}

function addNumberedStep(doc: PDFKit.PDFDocument, number: string, text: string) {
  const y = doc.y;
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_COLOR)
     .text(number + '.', 70, y);
  doc.font('Helvetica')
     .fillColor(TEXT_COLOR)
     .text(text, 90, y, { width: 445, lineGap: 1 });
  doc.moveDown(0.5);
}

function addInfoBox(doc: PDFKit.PDFDocument, title: string, content: string) {
  const margin = 60;
  const pageHeight = doc.page.height;
  const bottomMargin = doc.page.margins.bottom;
  
  if (doc.y > pageHeight - bottomMargin - 120) {
    doc.addPage();
  }
  
  const startY = doc.y;
  
  doc.rect(60, startY, 475, 0)
     .lineWidth(0)
     .fillOpacity(0.1)
     .fill(ACCENT_COLOR)
     .fillOpacity(1);

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_COLOR)
     .text(title, 70, startY + 10, { width: 455 });
  
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(TEXT_COLOR)
     .text(content, 70, doc.y + 5, { width: 455, lineGap: 2 });
  
  const endY = doc.y + 10;
  const boxHeight = endY - startY;
  
  doc.rect(60, startY, 475, boxHeight)
     .lineWidth(1)
     .strokeOpacity(0.3)
     .stroke(ACCENT_COLOR)
     .strokeOpacity(1);
  
  doc.y = endY;
  doc.moveDown(0.5);
}

function addWarningBox(doc: PDFKit.PDFDocument, content: string) {
  const margin = 60;
  const pageHeight = doc.page.height;
  const bottomMargin = doc.page.margins.bottom;
  
  if (doc.y > pageHeight - bottomMargin - 120) {
    doc.addPage();
  }
  
  const startY = doc.y;
  const WARNING_COLOR = '#f59e0b'; // Amber
  
  doc.rect(60, startY, 475, 0)
     .lineWidth(0)
     .fillOpacity(0.1)
     .fill(WARNING_COLOR)
     .fillOpacity(1);

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(TEXT_COLOR)
     .text(content, 70, startY + 10, { width: 455, lineGap: 2 });
  
  const endY = doc.y + 10;
  const boxHeight = endY - startY;
  
  doc.rect(60, startY, 475, boxHeight)
     .lineWidth(2)
     .strokeOpacity(0.8)
     .stroke(WARNING_COLOR)
     .strokeOpacity(1);
  
  doc.y = endY;
  doc.moveDown(0.5);
}

function addFormulaBox(doc: PDFKit.PDFDocument, title: string, formula: string) {
  const margin = 60;
  const pageHeight = doc.page.height;
  const bottomMargin = doc.page.margins.bottom;
  
  if (doc.y > pageHeight - bottomMargin - 150) {
    doc.addPage();
  }
  
  const startY = doc.y;
  
  doc.rect(60, startY, 475, 0)
     .lineWidth(0)
     .fillOpacity(0.05)
     .fill(PRIMARY_COLOR)
     .fillOpacity(1);

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_COLOR)
     .text(title, 70, startY + 10, { width: 455 });
  
  doc.fontSize(9)
     .font('Courier')
     .fillColor(TEXT_COLOR)
     .text(formula, 70, doc.y + 5, { width: 455, lineGap: 1 });
  
  const endY = doc.y + 10;
  const boxHeight = endY - startY;
  
  doc.rect(60, startY, 475, boxHeight)
     .lineWidth(1.5)
     .stroke(PRIMARY_COLOR);
  
  doc.y = endY;
  doc.moveDown(0.5);
}

function addQuoteBox(doc: PDFKit.PDFDocument, quote: string, author: string) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const bottomMargin = doc.page.margins.bottom;
  
  // Calcular altura necessária antes de renderizar
  doc.fontSize(13).font('Helvetica-Oblique');
  const quoteHeight = doc.heightOfString(`"${quote}"`, {
    width: pageWidth - 160,
    align: 'center',
    lineGap: 3
  });
  doc.fontSize(10).font('Helvetica');
  const authorHeight = doc.heightOfString(`- ${author}`, {
    width: pageWidth - 160,
    align: 'right'
  });
  const requiredHeight = 20 + quoteHeight + 10 + authorHeight + 15 + 20; // padding + quote + spacing + author + bottom + moveDown
  
  if (doc.y > pageHeight - bottomMargin - requiredHeight) {
    doc.addPage();
  }
  
  const startY = doc.y;
  
  doc.rect(60, startY, pageWidth - 120, 0)
     .fillOpacity(0.05)
     .fill(PRIMARY_COLOR)
     .fillOpacity(1);

  doc.fontSize(13)
     .font('Helvetica-Oblique')
     .fillColor(PRIMARY_COLOR)
     .text(`"${quote}"`, 80, startY + 20, {
       width: pageWidth - 160,
       align: 'center',
       lineGap: 3
     });

  const quoteEndY = doc.y;
  
  doc.moveDown(0.5);
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(DARK_GRAY)
     .text(`- ${author}`, 80, doc.y, {
       width: pageWidth - 160,
       align: 'right'
     });

  const endY = doc.y + 15;
  const boxHeight = endY - startY;
  
  doc.rect(60, startY, pageWidth - 120, boxHeight)
     .lineWidth(1)
     .strokeOpacity(0.2)
     .stroke(PRIMARY_COLOR)
     .strokeOpacity(1);
  
  doc.y = endY;
  doc.moveDown(0.7);
}

function addDiagramImage(doc: PDFKit.PDFDocument, imagePath: string, caption: string) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 60;
  const bottomMargin = doc.page.margins.bottom;
  const maxImageWidth = pageWidth - (margin * 2);
  
  if (fs.existsSync(imagePath)) {
    try {
      // Altura máxima estimada para screenshots (16:9 típico)
      const estimatedHeight = maxImageWidth * 0.56; // aspect ratio 16:9 = 0.5625
      
      // Verificar se há espaço suficiente (imagem + caption + margem)
      const requiredSpace = estimatedHeight + 40;
      if (doc.y > pageHeight - bottomMargin - requiredSpace) {
        doc.addPage();
      }
      
      const imageStartY = doc.y;
      
      // Renderizar imagem com fit para manter aspect ratio
      const imgInfo = doc.image(imagePath, margin, imageStartY, {
        fit: [maxImageWidth, estimatedHeight + 50],
        align: 'center'
      });
      
      // Calcular altura real da imagem renderizada
      const actualHeight = (imgInfo as any).height || estimatedHeight;
      
      // Atualizar posição Y manualmente para após a imagem
      doc.y = imageStartY + actualHeight + 8;
      
      // Adicionar caption abaixo da imagem
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor(DARK_GRAY)
         .text(caption, margin, doc.y, { 
           width: maxImageWidth, 
           align: 'center' 
         });
         
      doc.moveDown(0.8);
      
    } catch (error) {
      console.log(`[PDF] Aviso: Falha ao carregar imagem ${imagePath}:`, error);
      
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .fillColor(DARK_GRAY)
         .text(`[Ilustração não disponível: ${caption}]`, margin, doc.y, { 
           width: maxImageWidth, 
           align: 'center' 
         });
      doc.moveDown(0.5);
    }
  } else {
    console.log(`[PDF] Aviso: Arquivo de imagem não encontrado: ${imagePath}`);
    
    doc.fontSize(9)
       .font('Helvetica-Oblique')
       .fillColor(DARK_GRAY)
       .text(`[Ilustração não disponível: ${caption}]`, margin, doc.y, { 
         width: maxImageWidth, 
         align: 'center' 
       });
    doc.moveDown(0.5);
  }
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(TEXT_COLOR);
}

function addMockupBox(doc: PDFKit.PDFDocument, title: string, mockup: string) {
  const pageHeight = doc.page.height;
  const bottomMargin = doc.page.margins.bottom;
  
  if (doc.y > pageHeight - bottomMargin - 150) {
    doc.addPage();
  }
  
  const startY = doc.y;
  const MOCKUP_COLOR = '#8b5cf6'; // Purple
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(MOCKUP_COLOR)
     .text(title, 60, startY, { width: 475 });
  
  doc.moveDown(0.3);
  
  doc.rect(60, doc.y, 475, 0)
     .lineWidth(0)
     .fillOpacity(0.03)
     .fill(MOCKUP_COLOR)
     .fillOpacity(1);

  doc.fontSize(8)
     .font('Courier')
     .fillColor(DARK_GRAY)
     .text(mockup, 70, doc.y + 10, { width: 455, lineGap: 0 });
  
  const endY = doc.y + 10;
  const boxHeight = endY - (startY + 25);
  
  doc.rect(60, startY + 25, 475, boxHeight)
     .lineWidth(1)
     .strokeOpacity(0.4)
     .stroke(MOCKUP_COLOR)
     .strokeOpacity(1);
  
  doc.y = endY;
  doc.moveDown(0.8);
}

function addFAQ(doc: PDFKit.PDFDocument, question: string, answer: string) {
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_COLOR)
     .text('❓ ' + question);
  
  doc.moveDown(0.3);
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(TEXT_COLOR)
     .text(answer, { align: 'justify', lineGap: 2 });
  
  doc.moveDown(1);
}
