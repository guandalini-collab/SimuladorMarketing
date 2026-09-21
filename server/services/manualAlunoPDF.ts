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
const ALERT_BORDER = '#f59e0b'; // Amber 500 — mesma paleta do Manual do Professor
const ALERT_BG = '#fffbeb'; // Amber 50
const ALERT_TEXT = '#78350f'; // Amber 900

// A fonte padrão do pdfkit (Helvetica/WinAnsi) não tem glyphs para emoji
// nem para vários símbolos tipográficos usados no conteúdo deste manual
// (emojis como \u26A0\uFE0F/\uD83D\uDE80, setas "\u2192", etc.) — sem
// tratamento, eles imprimem caracteres quebrados no PDF. Mesmo utilitário
// usado em manualProfessorPDF.ts, mas aqui aplicado via monkey-patch em
// doc.text() logo após a criação do documento (ver generateManualAlunoPDF),
// porque o conteúdo deste arquivo não vem de um único markdown-fonte —
// está espalhado em dezenas de chamadas .text() literais pelo arquivo.
function stripUnsupportedGlyphs(text: string): string {
  return text
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\uFE0F/g, '')
    .replace(/\u2192/g, '->')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\u2212/g, '-')
    .replace(/\u03A3/g, 'Soma de')
    .replace(/\u25B6/g, '->')
    .replace(/\u25C0/g, '<-')
    .replace(/[ \t]+\n/g, '\n');
}

const LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Simula_logo_wordmark_crop.png');
// ^ versão recortada rente ao conteúdo visível do logo — ver o comentário
// equivalente em manualProfessorPDF.ts. O PNG original tem uma margem
// transparente enorme ao redor de um lockup horizontal largo e baixo, o
// que deixava a logo pequena e desproporcional ao cartão branco da capa.
const SWOT_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Diagrama_SWOT_em_português_0a7241aa.png');
const PORTER_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Diagrama_5_Forças_Porter_português_06e5802d.png');
const BCG_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Matriz_BCG_em_português_023ea876.png');
const PESTEL_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Diagrama_PESTEL_em_português_823fea8b.png');
const FUNNEL_DIAGRAM_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Funil_de_marketing_português_18ac4bd9.png');
// Prints de tela reais capturados navegando o aplicativo como aluno teste —
// ver server/manual-assets/aluno/. Mesmo tratamento visual (borda leve +
// legenda) usado para os screenshots do Manual do Professor.
const SCREENSHOTS_DIR = path.join(process.cwd(), 'server', 'manual-assets', 'aluno');

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

  // Sanitiza automaticamente TODO texto passado para doc.text(...) daqui
  // em diante — evita ter que editar uma por uma as centenas de chamadas
  // .text() literais espalhadas pelo arquivo.
  const originalText = doc.text.bind(doc);
  (doc as any).text = function (text: unknown, ...rest: unknown[]) {
    const safe = typeof text === 'string' ? stripUnsupportedGlyphs(text) : text;
    return (originalText as any)(safe, ...rest);
  };
  const originalHeightOfString = doc.heightOfString.bind(doc);
  (doc as any).heightOfString = function (text: unknown, ...rest: unknown[]) {
    const safe = typeof text === 'string' ? stripUnsupportedGlyphs(text) : text;
    return (originalHeightOfString as any)(safe, ...rest);
  };

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
  // Caixa dimensionada para a proporção real do lockup recortado (~3,54:1
  // largura por altura) — ver o comentário equivalente em
  // manualProfessorPDF.ts. Auditoria de 2026-09: cartão aumentado e a
  // logo dentro dele agora ocupa o espaço proporcionalmente, sem sobra de
  // branco. Todos os textos abaixo foram deslocados para baixo para
  // acompanhar o cartão maior.
  if (fs.existsSync(LOGO_PATH)) {
    const boxWidth = 420;
    const boxHeight = 154;
    const boxX = (pageWidth - boxWidth) / 2;
    const boxY = 100;
    const padding = 24;

    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 16).fill('#ffffff');

    doc.image(LOGO_PATH, boxX + padding, boxY + padding, {
      fit: [boxWidth - padding * 2, boxHeight - padding * 2],
      align: 'center',
      valign: 'center'
    });
  }

  // Título — capa simplificada: a marca já está representada pela
  // logomarca no cartão acima, então não repetimos "Simula+" /
  // "Simulador de Marketing no Mercado" como texto (mesmo ajuste feito
  // na capa do Manual do Professor).
  doc.fontSize(44)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text('MANUAL DO ALUNO', 60, 310, {
       width: pageWidth - 120,
       align: 'center'
     });

  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#e0e7ff')
     .text(
       'Guia passo a passo para participar das rodadas, tomar as decisões de cada ferramenta e acompanhar seus resultados',
       80, 385,
       { align: 'center', width: pageWidth - 160, lineGap: 4 }
     );

  // Autor
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text('Alexandre Guandalini Bossa', 60, 470, {
       width: pageWidth - 120,
       align: 'center'
     });

  doc.fontSize(14)
     .font('Helvetica')
     .text('Professor de Marketing', 60, 500, {
       width: pageWidth - 120,
       align: 'center'
     });

  // Versão
  doc.fontSize(11)
     .fillColor('#c7d2fe')
     .text('Versão 1.2', 60, pageHeight - 90, {
       width: pageWidth - 120,
       align: 'center'
     });

  // Ano
  doc.fontSize(10)
     .text(`© ${new Date().getFullYear()} - Todos os direitos reservados`, 60, pageHeight - 68, {
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
    { title: '4. Como os Resultados São Calculados' },
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

  addBulletPoint(doc, 'Sistema multi-produto: gerencie um ou mais produtos por rodada (a quantidade é definida pelo professor) dentro do mesmo setor');
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
    'ETAPA 1 -> Análises Estratégicas (bloqueado até completar SWOT, Porter, BCG e PESTEL)\n' +
    'ETAPA 2 -> Marketing Mix (Produto, Preço, Praça, Promoção de cada produto da rodada)\n' +
    'ETAPA 3 -> Envio da Decisão da Equipe\n\n' +
    'Não é possível acessar a ETAPA 2 sem completar a ETAPA 1 — o sistema impede tecnicamente o acesso e informa quais análises estão faltando.',
    'Sequência forçada pelo sistema'
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
    'Com base nas análises, a equipe configura o mix de marketing de cada produto da rodada. O professor define quantos produtos cada equipe gerencia; a tela "Selecione o Produto", no topo do Marketing Mix, mostra quantos e quais produtos estão disponíveis:'
  );
  addBulletPoint(doc, 'Produto: qualidade, características e design');
  addBulletPoint(doc, 'Preço: estratégia de precificação e valor');
  addBulletPoint(doc, 'Praça: canais de distribuição e cobertura geográfica');
  addBulletPoint(doc, 'Promoção: mix promocional e intensidade de comunicação');

  doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_COLOR);
  doc.text('3. Submissão e Cálculo de Resultados', { continued: false });
  doc.font('Helvetica').fontSize(10);
  addParagraph(doc,
    'Após configurar todos os produtos da rodada e completar as análises estratégicas, a equipe submete suas decisões clicando em "Enviar Decisão da Equipe". O sistema calcula os resultados em duas etapas:'
  );

  addInfoBox(doc, '🔄 PROCESSAMENTO INDIVIDUAL → CONSOLIDADO',
    'ETAPA 1 - Cálculo Individual:\n' +
    '• O sistema calcula os KPIs de cada produto separadamente (Receita, Lucro, Market Share próprios)\n\n' +
    'ETAPA 2 - Consolidação:\n' +
    '• Receita Total = soma das receitas de todos os produtos da equipe\n' +
    '• Lucro Total = soma dos lucros de todos os produtos\n' +
    '• Market Share = média entre os produtos\n\n' +
    'RESULTADO: a tela "Resultados e KPIs" mostra o desempenho consolidado da equipe e a comparação entre os produtos na aba "Desempenho por Produto".'
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
    'Esse score aparece na tela "Resultados", na seção "Alinhamento Estratégico", junto com uma lista de "Inconsistências Detectadas" sempre que alguma análise está incompleta ou desalinhada das decisões de marketing (mais detalhes na seção 4 deste manual).'
  );

  doc.moveDown();
  addWarningBox(doc,
    'Copiar o conteúdo gerado pela IA sem editar é detectado pelo sistema e reduz o score de alinhamento estratégico. Edite sempre as análises com suas próprias ideias antes de salvar.',
    'Penalização por conteúdo de IA não editado'
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
    'Na tela "Ferramentas Estratégicas", a aba SWOT tem quatro campos — Forças, Fraquezas, Oportunidades e Ameaças — cada um com um botão "+" para adicionar itens e uma lixeira para remover. Na Rodada 1, a IA pré-preenche um item de exemplo em cada quadrante; edite ou complemente e clique em "Salvar Análise SWOT" para gravar.'
  );

  renderScreenshot(doc, 'ft-01-swot.jpg', 'Tela de Análise SWOT no Simula+, com os quatro quadrantes e o botão Salvar Análise SWOT');

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
    'Na tela "Ferramentas Estratégicas", a aba "5 Forças" traz um controle deslizante de 1 a 10 para cada força, com um campo de texto logo abaixo para a justificativa. Clique em "Salvar Análise de Porter" para gravar.'
  );

  renderScreenshot(doc, 'ft-02-porter.jpg', 'Tela das 5 Forças de Porter no Simula+, com os controles deslizantes de 1 a 10 e os campos de notas');

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
    'Na tela "Ferramentas Estratégicas", a aba BCG pede o nome do produto e dois controles deslizantes — Crescimento do Mercado (%) e Participação Relativa. O botão "Adicionar Produto" grava o item na lista "Produtos Mapeados", já classificado automaticamente no quadrante correspondente (Estrela, Vaca Leiteira, Interrogação ou Abacaxi). Diferente das outras ferramentas, a Matriz BCG salva a cada produto adicionado — não existe um botão "Salvar" separado.'
  );

  renderScreenshot(doc, 'ft-03-bcg.jpg', 'Tela da Matriz BCG no Simula+, com os campos de nome do produto, os controles deslizantes e a lista de Produtos Mapeados');

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
    'Na tela "Ferramentas Estratégicas", a aba PESTEL tem seis campos — Político, Econômico, Social, Tecnológico, Ambiental e Legal — cada um com um botão "+" para adicionar fatores. Clique em "Salvar Análise PESTEL" para gravar.'
  );

  renderScreenshot(doc, 'ft-04-pestel.jpg', 'Tela de Análise PESTEL no Simula+, com os seis fatores macroambientais');

  doc.moveDown(0.8);
  addSubsectionTitle(doc, '3.5 Segmentação de Mercado');
  doc.moveDown(0.6);

  addParagraph(doc,
    'A quinta aba de "Ferramentas Estratégicas" é a Segmentação de Mercado, com quatro campos — Demográfica, Geográfica, Psicográfica e Comportamental —, preenchidos da mesma forma que a SWOT e a PESTEL. Clique em "Salvar Segmentação" para gravar.'
  );

  renderScreenshot(doc, 'ft-05-segmentacao.jpg', 'Tela de Segmentação de Mercado no Simula+, com os quatro campos de critérios');

  doc.moveDown();
  addWarningBox(doc,
    'A Segmentação de Mercado NÃO aparece no painel "Ferramentas Estratégicas Obrigatórias" do Marketing Mix e não é exigida para desbloquear essa tela — mas o sistema recusa o envio da decisão final se ela estiver vazia, mostrando o erro "ETAPA OBRIGATÓRIA: Complete todas as Análises Estratégicas primeiro!" mesmo com SWOT, Porter, BCG e PESTEL completas. Preencha e salve a Segmentação de Mercado antes de enviar a decisão da equipe.',
    'Segmentação também é exigida no envio da decisão'
  );
}

function addFormulasSection(doc: PDFKit.PDFDocument) {
  addSectionTitle(doc, '4. COMO OS RESULTADOS SÃO CALCULADOS');
  doc.moveDown();

  addParagraph(doc,
    'Ao final de cada rodada, o Simula+ calcula automaticamente os indicadores de desempenho (KPIs) da equipe a partir das decisões de marketing mix, das análises estratégicas preenchidas e dos eventos econômicos ativos no período. Este manual não detalha os pesos e fórmulas internas de cálculo — qual estratégia seguir é uma decisão sua e da sua equipe.'
  );

  addQuoteBox(doc,
    'O que não se mede não se gerencia. Os indicadores de desempenho são ferramentas essenciais para transformar dados em decisões estratégicas eficazes.',
    'Peter Drucker, 2001'
  );

  addSubsectionTitle(doc, 'Onde ver os resultados');
  doc.moveDown(0.5);

  addParagraph(doc,
    'Depois que o professor encerra a rodada, os resultados ficam disponíveis em dois lugares:'
  );
  addBulletPoint(doc, 'No Dashboard: cartões resumidos de Orçamento Disponível, ROI Médio, Participação de Mercado e Rodadas Concluídas');
  addBulletPoint(doc, 'Em "Resultados", no menu lateral: a tela completa de KPIs e Desempenho');

  doc.moveDown(0.3);
  addBulletPoint(doc, 'Aba "KPIs e Desempenho": Receita, Lucro, Margem, ROI, Market Share e Fidelização, seguidos dos blocos "KPIs Completos" (indicadores de clientes, DRE e Balanço Patrimonial) e "Alinhamento Estratégico"');
  addBulletPoint(doc, 'Aba "Demonstrativo Financeiro": a DRE completa da rodada, linha a linha, com opção de exportar para Excel');

  doc.moveDown();
  addSubsectionTitle(doc, 'Alinhamento Estratégico');
  doc.moveDown(0.5);

  addParagraph(doc,
    'O sistema calcula um score de 0 a 100 que mede a coerência entre as análises estratégicas (SWOT, Porter, BCG, PESTEL) e as decisões de marketing mix. Esse score aparece na tela "Resultados", junto com uma lista de "Inconsistências Detectadas" sempre que alguma análise está incompleta ou desalinhada.'
  );

  doc.moveDown();
  addWarningBox(doc,
    'O critério de "completa" usado no score de Alinhamento Estratégico é mais rigoroso do que o critério que libera o envio da decisão no Marketing Mix. Uma análise pode aparecer como "Completa" no painel "Ferramentas Estratégicas Obrigatórias" e, mesmo assim, ser listada em "Inconsistências Detectadas" na tela de Resultados. Preencha as análises com conteúdo próprio, não apenas o mínimo para desbloquear a próxima tela.',
    'Duas checagens diferentes de completude'
  );

  doc.moveDown();
  addWarningBox(doc,
    'Copiar o conteúdo gerado pela IA sem editar é detectado pelo sistema e reduz o score de Alinhamento Estratégico.'
  );

  doc.moveDown();
  addParagraph(doc,
    'Na aba "Desempenho por Produto", cada produto da rodada aparece com sua Receita, Lucro, ROI e Margem individuais. Em algumas telas, essa área pode mostrar o identificador interno do produto (um código técnico) em vez do nome cadastrado — é uma exibição do sistema, não um erro seu.'
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
  addInfoBox(doc, 'CADASTRO EXCLUSIVO - EMAIL INSTITUCIONAL',
    'O cadastro exige seu email institucional de aluno do IFFar:\n\n' +
    '• @aluno.iffar.edu.br\n' +
    '• Maiúsculas/minúsculas NÃO importam (@ALUNO.IFFAR.EDU.BR funciona!)\n\n' +
    'Outros emails não são aceitos no cadastro.'
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
    'O link de recuperação expira em 1 hora. Verifique a pasta de spam se não receber o e-mail; se ainda assim não chegar, tente novamente ou contate o professor.',
    'Recuperação de senha'
  );

  doc.moveDown();
  addSubsectionTitle(doc, 'Introdução ao Jogo (Rodada 0)');
  doc.moveDown(0.5);

  addParagraph(doc,
    'No primeiro acesso, antes de qualquer rodada valendo nota, o sistema abre a "Rodada 0 — Introdução ao jogo": uma leitura guiada em 6 seções (Bem-vindo ao Simula+, Como o Jogo Funciona: Rodadas, O Mix de Marketing (4 Ps), Ferramentas Estratégicas, Eventos de Mercado e Resultados, Trabalho em Equipe e Regras). Cada seção libera o botão "Próxima seção" só depois de um tempo mínimo de leitura (contador visível no canto inferior); a última seção libera "Concluir introdução".'
  );

  renderScreenshot(doc, 'r0-01-boasvindas.jpg', 'Primeira seção da Rodada 0 - Introdução ao jogo, com o contador de leitura mínima');

  addWarningBox(doc,
    'A Rodada 0 é individual: cada integrante da equipe precisa concluí-la, não apenas um representante. Ela não conta para nenhuma nota ou estatística do jogo — existe só para nivelar o entendimento antes da primeira decisão real.',
    'Conceito fundamental'
  );

  renderScreenshot(doc, 'r0-06-equiperegras.jpg', 'Última seção da Rodada 0, com o botão Concluir introdução');

  doc.moveDown();
  addSubsectionTitle(doc, 'Como Criar ou Entrar em uma Equipe');
  doc.moveDown(0.5);

  addParagraph(doc,
    'Depois de concluir a Rodada 0, o sistema mostra a tela "Selecione ou Crie uma Equipe", com as equipes já existentes na turma (se houver) e a opção de criar uma nova.'
  );

  renderScreenshot(doc, 'eq-01-selecionar-criar.jpg', 'Tela Selecione ou Crie uma Equipe, com as equipes existentes na turma');

  addNumberedStep(doc, '1', 'Para entrar em uma equipe existente, clique nela na lista');
  addNumberedStep(doc, '2', 'Para criar uma equipe nova, clique em "Criar Nova Equipe" e informe o Nome da Equipe');
  addNumberedStep(doc, '3', 'Quem cria a equipe se torna automaticamente o líder, com o orçamento padrão definido pelo professor para a turma');

  renderScreenshot(doc, 'eq-02-criar-nova-equipe-form.jpg', 'Formulário Criar Nova Equipe, com o campo Nome da Equipe');

  doc.moveDown();
  addParagraph(doc,
    'Depois de criar ou entrar na equipe, o Dashboard mostra o "Roteiro da Rodada": um checklist com as etapas da rodada atual.'
  );

  renderScreenshot(doc, 'eq-03-dashboard-equipe-criada.jpg', 'Dashboard da equipe recém-criada, com o Roteiro da Rodada 1');

  doc.moveDown();
  addSubsectionTitle(doc, '🚨 ETAPA 1 (OBRIGATÓRIA): Análises Estratégicas PRIMEIRO');
  doc.moveDown(0.5);

  addWarningBox(doc,
    'O sistema bloqueia o acesso ao Marketing Mix até que as 4 análises estratégicas (SWOT, Porter, BCG e PESTEL) estejam completas — não é possível configurar produtos antes disso. Essa regra é aplicada pelo sistema, não é opcional.',
    'Ordem obrigatória'
  );

  doc.moveDown();
  addNumberedStep(doc, '1', 'Acesse "Ferramentas Estratégicas" no menu lateral');
  addNumberedStep(doc, '2', 'Complete AS 4 FERRAMENTAS obrigatórias para o Marketing Mix (mais a Segmentação de Mercado, exigida no envio final — ver seção 3.5):');

  doc.fontSize(9).font('Helvetica-Bold').fillColor(PRIMARY_COLOR);
  addBulletPoint(doc, '✓ SWOT: mínimo 1 item em cada quadrante (Forças, Fraquezas, Oportunidades, Ameaças)');
  addBulletPoint(doc, '✓ PORTER: avaliar as 5 forças de 1 a 10 com notas explicativas');
  addBulletPoint(doc, '✓ BCG: adicionar cada produto da rodada na Matriz BCG');
  addBulletPoint(doc, '✓ PESTEL: preencher os 6 fatores macroambientais');
  doc.moveDown(0.3);

  addNumberedStep(doc, '3', 'Na Rodada 1: use o botão "Gerar com IA" como ponto de partida');
  addNumberedStep(doc, '4', 'IMPORTANTE: sempre edite o conteúdo da IA — copiar sem editar reduz o score de alinhamento');
  addNumberedStep(doc, '5', 'Clique no botão "Salvar" de cada ferramenta depois de editar (a Matriz BCG salva ao clicar em "Adicionar Produto")');

  doc.moveDown();
  addInfoBox(doc, '🔒 O QUE ACONTECE SE NÃO COMPLETAR?',
    'Se tentar acessar o Marketing Mix sem completar as 4 análises, você verá:\n\n' +
    '"ETAPA OBRIGATÓRIA: Complete todas as Análises Estratégicas primeiro!"\n\n' +
    'O sistema informa exatamente quais análises estão faltando, e você não consegue salvar nenhuma decisão de produto até completar todas.'
  );

  doc.moveDown();
  addSubsectionTitle(doc, 'Como Configurar o Marketing Mix');
  doc.moveDown(0.5);

  addWarningBox(doc,
    'O número de produtos que a equipe configura por rodada é definido pelo professor (na Rodada 1, o padrão é 1 produto por equipe). A tela "Selecione o Produto", no topo do Marketing Mix, mostra os produtos disponíveis na rodada; cada produto é configurado separadamente, e o sistema calcula os KPIs de cada um individualmente antes de consolidar o resultado da equipe.',
    'Conceito fundamental'
  );

  addNumberedStep(doc, '1', 'Acesse "Mix de Marketing (4 Ps)" no menu lateral');
  addNumberedStep(doc, '2', 'Em "Selecione o Produto", escolha o produto que vai configurar (se houver mais de um na rodada)');

  renderScreenshot(doc, 'mix-01-produto.jpg', 'Aba Produto do Marketing Mix, com Qualidade do Produto, Características e Posicionamento de Marca');

  addNumberedStep(doc, '3', 'Configure a aba PRODUTO: qualidade, características e posicionamento de marca');
  addNumberedStep(doc, '4', 'Configure a aba PREÇO: estratégia de precificação e valor');

  renderScreenshot(doc, 'mix-03-preco-requisito.jpg', 'Aba Preço do Marketing Mix, com o painel Ferramentas Estratégicas Obrigatórias mostrando o status de cada análise');

  addNumberedStep(doc, '5', 'Configure a aba PRAÇA: canais de distribuição e cobertura geográfica');

  renderScreenshot(doc, 'mix-04-praca.jpg', 'Aba Praça do Marketing Mix, com Canais e Cobertura de Distribuição');

  addNumberedStep(doc, '6', 'Configure a aba PROMOÇÃO: catálogo de mídias e intensidade');

  renderScreenshot(doc, 'mix-05-promocao.jpg', 'Aba Promoção do Marketing Mix, com o Catálogo de Mídias e a Intensidade');

  addNumberedStep(doc, '7', 'Se houver mais de um produto na rodada, repita os passos 3 a 6 para cada um');

  doc.moveDown();
  addParagraph(doc,
    'Ao final da página, o painel "Ferramentas Estratégicas Obrigatórias" mostra o status de SWOT, Porter, BCG e PESTEL (X vermelho = pendente, "Completa" em verde = ok). O botão "Enviar Decisão da Equipe" fica desativado até que as 4 apareçam como "Completa".'
  );

  renderScreenshot(doc, 'mix-06-envio-bloqueado.jpg', 'Rodapé do Marketing Mix com as 4 ferramentas pendentes e o botão Enviar Decisão da Equipe desativado');
  renderScreenshot(doc, 'mix-07-envio-liberado.jpg', 'Rodapé do Marketing Mix com as 4 ferramentas completas e o botão Enviar Decisão da Equipe ativo');

  doc.moveDown(0.8);
  addSubsectionTitle(doc, 'Como Enviar a Decisão da Equipe');
  doc.moveDown(0.6);

  addParagraph(doc,
    'Há dois botões distintos no rodapé do Marketing Mix: "Salvar Rascunho", que pode ser usado quantas vezes quiser durante a rodada, e "Enviar Decisão da Equipe", que é o envio final.'
  );

  addWarningBox(doc,
    'Depois de clicar em "Confirmar e Enviar" no modal de confirmação, NÃO é possível modificar a decisão até a próxima rodada. Revise as abas de cada produto antes de confirmar.',
    'Envio é definitivo'
  );

  addNumberedStep(doc, '1', 'Clique em "Enviar Decisão da Equipe"');

  renderScreenshot(doc, 'mix-08-confirmar-envio-modal.jpg', 'Modal de confirmação Confirmar Envio de Decisão Final, com os botões Revisar Decisão e Confirmar e Enviar');

  addNumberedStep(doc, '2', 'No modal "Confirmar Envio de Decisão Final", clique em "Revisar Decisão" para voltar e ajustar, ou em "Confirmar e Enviar" para enviar definitivamente');

  doc.moveDown();
  addInfoBox(doc, 'SE O ENVIO FOR RECUSADO',
    'Mesmo com SWOT, Porter, BCG e PESTEL completas, o envio pode ser recusado com a mensagem "Falha ao submeter [produto]: ETAPA OBRIGATÓRIA: Complete todas as Análises Estratégicas primeiro!" se a Segmentação de Mercado (seção 3.5) estiver vazia. Preencha e salve a Segmentação e tente enviar novamente.'
  );

  renderScreenshot(doc, 'mix-09-erro-envio-produto.jpg', 'Mensagem de erro ao tentar enviar a decisão com a Segmentação de Mercado vazia');

  addNumberedStep(doc, '3', 'Depois de corrigir, clique novamente em "Enviar Decisão da Equipe" e confirme');

  renderScreenshot(doc, 'mix-10-decisao-enviada-sucesso.jpg', 'Confirmação Decisão enviada com sucesso, exibida após o envio válido');

  doc.moveDown(0.8);
  addSubsectionTitle(doc, 'Resultados e KPIs da Rodada');
  doc.moveDown(0.6);

  addParagraph(doc,
    'Depois que o professor encerra a rodada, o Dashboard passa a mostrar quatro cartões: Orçamento Disponível, ROI Médio, Participação de Mercado e Rodadas Concluídas.'
  );

  renderScreenshot(doc, 'res-01-dashboard-pos-rodada.jpg', 'Dashboard da equipe após o encerramento da rodada, com os cartões de KPI');

  addParagraph(doc,
    'Em "Resultados", no menu lateral, a aba "KPIs e Desempenho" traz Receita, Lucro, Margem, ROI, Market Share e Fidelização em destaque, seguidos do bloco "Alinhamento Estratégico".'
  );

  renderScreenshot(doc, 'res-02-kpis-desempenho.jpg', 'Tela Resultados e KPIs, aba KPIs e Desempenho, com os indicadores principais e o Alinhamento Estratégico');

  addParagraph(doc,
    'O bloco "Alinhamento Estratégico" mostra o score de 0 a 100 e, quando aplicável, a lista "Inconsistências Detectadas" — indicando exatamente quais análises o sistema considerou incompletas, mesmo que tenham aparecido como "Completa" no Marketing Mix (ver seção 4).'
  );

  renderScreenshot(doc, 'res-04-alinhamento-inconsistencias.jpg', 'Bloco Alinhamento Estratégico expandido, com a lista de Inconsistências Detectadas');

  addParagraph(doc,
    'Clicando em "KPIs Completos", a tela expande para mostrar Indicadores de Clientes (CAC, LTV, LTV/CAC, Taxa de Conversão, Ticket Médio, NPS, Tempo Médio de Conversão), a DRE da rodada e o Balanço Patrimonial.'
  );

  renderScreenshot(doc, 'res-05-kpis-completos-dre.jpg', 'Bloco KPIs Completos expandido, com Indicadores de Clientes e a DRE');

  addParagraph(doc,
    'A aba "Demonstrativo Financeiro" mostra a DRE completa em formato de tabela, linha a linha, com um botão "Exportar Excel".'
  );

  renderScreenshot(doc, 'res-07-demonstrativo-financeiro-dre.jpg', 'Aba Demonstrativo Financeiro, com a DRE completa e o botão Exportar Excel');

  doc.moveDown();
  addWarningBox(doc,
    'Na aba "Desempenho por Produto", o nome do produto pode aparecer como um código técnico (por exemplo, "2270bcf4-dc68-4c31-...") em vez do nome cadastrado. É uma exibição do sistema — não é um erro seu.'
  );

  doc.moveDown(0.8);
  addSubsectionTitle(doc, 'O Que Fazer e o Que Evitar');
  doc.moveDown(0.6);

  addInfoBox(doc, '✅ BOAS PRÁTICAS',
    '• Leia o Manual do Aluno antes de começar\n' +
    '• Edite SEMPRE os conteúdos gerados pela IA antes de salvar\n' +
    '• Salve rascunhos frequentemente\n' +
    '• Preencha e salve as 5 ferramentas estratégicas (incluindo Segmentação) antes de tentar enviar a decisão\n' +
    '• Revise todas as abas de cada produto antes de clicar em Enviar Decisão da Equipe\n' +
    '• Combine com a equipe quem vai fazer o envio final\n' +
    '• Leia o feedback automático da rodada em Resultados'
  );

  doc.moveDown();
  addWarningBox(doc,
    '- Copiar conteúdo da IA sem editar (reduz o score de alinhamento)\n' +
    '- Submeter análises incompletas ou deixar a Segmentação de Mercado vazia\n' +
    '- Configurar menos produtos do que os disponíveis na rodada, quando todos são obrigatórios\n' +
    '- Não salvar rascunhos (risco de perder o trabalho digitado)\n' +
    '- Deixar para enviar na última hora (a rodada fecha automaticamente no horário programado)\n' +
    '- Não se comunicar com a equipe sobre quem vai submeter a decisão final',
    'Erros operacionais comuns'
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
    'O sistema mede o quanto você editou o conteúdo gerado pela IA (por similaridade de texto) e aplica uma penalização no score de alinhamento estratégico quando o conteúdo é copiado sem edição significativa. Use a IA como ponto de partida, mas complemente sempre com suas próprias análises antes de salvar.'
  );

  addFAQ(doc, 
    'Posso alterar a estratégia ao longo das rodadas?',
    'Sim. Cada rodada é uma nova oportunidade de revisar suas análises estratégicas e suas decisões de marketing mix antes de enviar.'
  );

  doc.moveDown(0.8);
  addFAQ(doc, 
    'O que são os eventos econômicos?',
    'São situações do mercado (inflação, crise, inovação tecnológica, etc.) que afetam todas as equipes da turma durante uma rodada. Você pode acompanhar os eventos ativos na tela de Insights de Mercado.'
  );

  addFAQ(doc, 
    'Preciso configurar todos os produtos da rodada?',
    'Sim — o sistema só aceita o envio da decisão da equipe quando todos os produtos disponíveis na rodada estiverem com as 4 abas completas (Produto, Preço, Praça, Promoção). O professor define quantos produtos cada equipe gerencia por rodada.'
  );

  addFAQ(doc, 
    'Como o sistema calcula os resultados: individual ou consolidado?',
    'Durante a rodada, você configura e salva cada produto separadamente. Ao processar a rodada, o sistema calcula os KPIs de cada produto individualmente e depois consolida o resultado da equipe (receita e lucro somados, market share em média). A tela "Resultados" mostra os dois níveis: o consolidado da equipe e, na aba "Desempenho por Produto", o detalhe de cada produto.'
  );

  addFAQ(doc, 
    'Por que não consigo acessar o Marketing Mix?',
    'O sistema bloqueia o acesso ao Marketing Mix até que você complete as 4 análises estratégicas obrigatórias (SWOT, Porter, BCG, PESTEL) da rodada atual. Você verá uma mensagem indicando quais análises estão faltando; complete todas para que o Marketing Mix seja liberado automaticamente.'
  );

  addFAQ(doc, 
    'Preenchi as 4 ferramentas estratégicas e mesmo assim não consigo enviar a decisão. Por quê?',
    'Confira se a Segmentação de Mercado — a 5ª aba de "Ferramentas Estratégicas" — também está preenchida e salva. Ela não aparece no painel "Ferramentas Estratégicas Obrigatórias" do Marketing Mix, mas o sistema exige que esteja preenchida para aceitar o envio final da decisão.'
  );

  addFAQ(doc, 
    'O que significa "Assistência IA: 70%" na Rodada 2?',
    'Significa que a IA gera análises parcialmente preenchidas. Você precisa completar o restante e editar o que foi gerado. Na Rodada 3 em diante, a assistência é 0% — você preenche tudo a partir do zero.'
  );

  addFAQ(doc, 
    'Como funciono a Matriz BCG quando tenho mais de um produto na rodada?',
    'Adicione cada produto separadamente pelo botão "Adicionar Produto": o sistema classifica automaticamente cada um no quadrante correspondente (Estrela, Vaca Leiteira, Interrogação ou Abacaxi) com base nos valores de Crescimento do Mercado e Participação Relativa que você informar.'
  );

  addFAQ(doc, 
    'Posso mudar de equipe durante o jogo?',
    'Não. Uma vez associado a uma equipe, você permanece nela até o fim do jogo. Escolha seus colegas com cuidado e mantenha boa comunicação.'
  );

  addFAQ(doc, 
    'Onde vejo por que meu score de Alinhamento Estratégico ficou baixo?',
    'Na tela "Resultados", o bloco "Alinhamento Estratégico" mostra o score de 0 a 100 e, abaixo dele, a lista "Inconsistências Detectadas" — indicando exatamente quais análises o sistema considerou incompletas ou desalinhadas das decisões de marketing daquela rodada.'
  );

  addFAQ(doc, 
    'Como o orçamento afeta meus resultados?',
    'O orçamento da equipe é definido pelo professor no início da turma e aparece no topo de cada tela do simulador. Ele não muda automaticamente durante o jogo.'
  );

  addFAQ(doc, 
    'O feedback inteligente é automático?',
    'Sim. Ao final de cada rodada, o sistema gera automaticamente um feedback personalizado usando IA, analisando suas decisões e resultados. Leia com atenção — é uma ferramenta de aprendizado.'
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
  doc.text(`Versão 1.2 | ${new Date().getFullYear()}`, { align: 'center' });
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

// Quadro de alerta — mesma lógica visual usada no Manual do Professor
// (server/services/manualProfessorPDF.ts -> renderAlertBox): fundo âmbar,
// barra lateral colorida e título em negrito. Usado para qualquer coisa
// que o aluno não pode esquecer (regras do sistema, prazos, bloqueios).
// Sem símbolo/emoji no título ou no corpo: as fontes padrão do PDFKit
// (Helvetica) não têm esses glifos no encoding WinAnsi e renderizam um
// caractere errado no lugar — o alerta já fica claro pela barra lateral
// colorida, o fundo âmbar e o título em negrito.
function addWarningBox(doc: PDFKit.PDFDocument, content: string, title: string = 'Atenção') {
  const boxX = 60;
  const boxWidth = 475;
  const barWidth = 4;
  const paddingX = 14;
  const paddingY = 10;
  const innerX = boxX + barWidth + paddingX;
  const innerWidth = boxWidth - barWidth - paddingX * 2;

  doc.font('Helvetica-Bold').fontSize(10.5);
  const titleHeight = doc.heightOfString(title, { width: innerWidth });

  doc.font('Helvetica').fontSize(9.5);
  const bodyHeight = doc.heightOfString(content, { width: innerWidth, lineGap: 2 });

  const boxHeight = paddingY * 2 + titleHeight + 6 + bodyHeight;

  const pageHeight = doc.page.height;
  const bottomMargin = doc.page.margins.bottom;
  const remaining = pageHeight - bottomMargin - doc.y;
  if (boxHeight > remaining && boxHeight <= pageHeight - doc.page.margins.top - bottomMargin) {
    doc.addPage();
  }

  const boxY = doc.y;
  doc.rect(boxX, boxY, boxWidth, boxHeight).fill(ALERT_BG);
  doc.rect(boxX, boxY, barWidth, boxHeight).fill(ALERT_BORDER);

  let cursorY = boxY + paddingY;
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(ALERT_BORDER)
     .text(title, innerX, cursorY, { width: innerWidth });
  cursorY += titleHeight + 6;

  doc.font('Helvetica').fontSize(9.5).fillColor(ALERT_TEXT)
     .text(content, innerX, cursorY, { width: innerWidth, lineGap: 2 });

  doc.y = boxY + boxHeight;
  doc.moveDown(0.6);
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

// Leitor mínimo de dimensões JPEG (sem dependência externa) — mesmo
// utilitário usado em manualProfessorPDF.ts. Necessário para calcular a
// altura correta ao renderizar um print de tela real (proporção different
// de um diagrama ilustrativo 16:9).
function getJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9) break; // EOI
    const length = buffer.readUInt16BE(offset + 2);
    const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

// Renderiza um print de tela real (arquivo em SCREENSHOTS_DIR) com borda
// leve e legenda em itálico abaixo. Se o arquivo não existir, não
// interrompe a geração do PDF: registra um aviso no console e segue.
function renderScreenshot(doc: PDFKit.PDFDocument, fileName: string, caption: string) {
  const fullPath = path.join(SCREENSHOTS_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[manualAlunoPDF] screenshot não encontrado, ignorando: ${fileName}`);
    return;
  }

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = doc.page.margins.left;
  const imgWidth = pageWidth - margin * 2;
  let imgHeight = imgWidth * 0.56;
  try {
    const buffer = fs.readFileSync(fullPath);
    const dims = getJpegDimensions(buffer);
    if (dims && dims.width > 0) {
      imgHeight = (imgWidth * dims.height) / dims.width;
    }
  } catch {
    // mantém a altura estimada se a leitura falhar
  }

  const captionHeight = doc.font('Helvetica-Oblique').fontSize(8.5)
    .heightOfString(caption, { width: imgWidth });
  const totalBlockHeight = imgHeight + captionHeight + 20;
  const remaining = pageHeight - doc.page.margins.bottom - doc.y;
  if (totalBlockHeight > remaining && totalBlockHeight <= pageHeight - doc.page.margins.top - doc.page.margins.bottom) {
    doc.addPage();
  }

  doc.moveDown(0.3);
  const x = margin;
  const y = doc.y;

  doc.rect(x - 3, y - 3, imgWidth + 6, imgHeight + 6).fillAndStroke('#ffffff', LIGHT_GRAY);
  doc.image(fullPath, x, y, { width: imgWidth, height: imgHeight });
  doc.y = y + imgHeight + 8;

  doc.x = x;
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(DARK_GRAY)
    .text(caption, x, doc.y, { width: imgWidth, align: 'center' });
  doc.moveDown(0.6);
  doc.x = margin;

  doc.fontSize(10).font('Helvetica').fillColor(TEXT_COLOR);
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
