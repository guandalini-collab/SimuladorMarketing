import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

// Grupo de correções pós-auditoria (setembro/2026), item 3 relatado pelo
// professor: o download do Manual do Professor não gerava um PDF de
// verdade — /api/manual/professor apenas devolvia o markdown bruto
// (manual-professor.md) com Content-Type text/markdown e extensão .md.
// O navegador baixava o arquivo e o sistema operacional abria com o que
// estivesse associado a .md (no caso do professor, o programa R/RStudio),
// nunca um leitor de PDF. Este arquivo gera um PDF de verdade a partir do
// mesmo markdown, seguindo o padrão visual já usado no manual do aluno
// (manualAlunoPDF.ts): mesma paleta de cores, mesma logomarca na capa,
// mesmo estilo de títulos/caixas, e agora também sumário com números de
// página e tabelas com bordas (o conteúdo de manual-professor.md passou a
// ter tabelas na Seção 2, que o renderizador anterior não suportava).

const PRIMARY_COLOR = '#6366f1'; // Indigo — mesma cor usada em manualAlunoPDF.ts
const SECONDARY_COLOR = '#8b5cf6'; // Purple
const ACCENT_COLOR = '#22d3ee'; // Cyan
const TEXT_COLOR = '#1f2937'; // Gray 800
const DARK_GRAY = '#6b7280'; // Gray 500
const LIGHT_GRAY = '#f3f4f6'; // Gray 100
const ZEBRA_GRAY = '#f9fafb'; // Gray 50 (listras de tabela)

const LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Simula_logo_navy_dourado_final.png');

// Prints de tela do sistema usados para ilustrar o manual, capturados em
// setembro/2026. Cada arquivo é referenciado no markdown como
// ![legenda](arquivo.jpg) e resolvido dentro desta pasta.
const SCREENSHOTS_DIR = path.join(process.cwd(), 'server', 'manual-assets', 'professor');

const PAGE_MARGIN = { top: 50, bottom: 50, left: 60, right: 60 };
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN.left - PAGE_MARGIN.right; // A4 width em pt

interface TocEntry {
  title: string;
  page: number;
  level: 2 | 3;
}

export function generateManualProfessorPDF(): PassThrough {
  const manualPath = path.join(process.cwd(), 'server', 'manual-professor.md');
  const rawMarkdown = fs.readFileSync(manualPath, 'utf-8');
  const markdown = stripUnsupportedGlyphs(stripTitleLine(rawMarkdown));

  // Passo 1 (medição, descartado): o Sumário precisa saber em que página
  // física cada seção caiu, e isso só se sabe depois de renderizar o
  // conteúdo inteiro. A tentação óbvia — renderizar o conteúdo primeiro,
  // voltar com switchToPage() até a página do Sumário (já concluída) e
  // desenhá-lo ali — foi testada e comprovadamente corrompe a paginação do
  // pdfkit no modo bufferPages: qualquer desenho feito depois de voltar a
  // uma página anterior a páginas já existentes faz a biblioteca inserir
  // páginas em branco extras no fim do documento (reproduzido de forma
  // isolada, fora deste arquivo, antes desta correção). Por isso o
  // conteúdo é renderizado duas vezes: a primeira, num documento
  // descartável, só para descobrir a paginação; a segunda, no documento
  // real, desenhando tudo em ordem natural — sem nunca voltar a uma
  // página anterior já finalizada.
  const measureDoc = new PDFDocument({ size: 'A4', margins: PAGE_MARGIN, bufferPages: true });
  measureDoc.pipe(fs.createWriteStream('/dev/null'));
  measureDoc.addPage(); // posição 1: Sumário (em branco nesta passagem)
  measureDoc.addPage(); // posição 2: início do conteúdo
  const toc = renderMarkdown(measureDoc, markdown);
  measureDoc.end();

  // Passo 2 (real)
  const doc = new PDFDocument({
    size: 'A4',
    margins: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: 'Manual do Professor - Simula+',
      Author: 'Simula+',
      Subject: 'Guia do Professor do Simulador de Marketing',
    },
  });

  const stream = new PassThrough();
  doc.pipe(stream);

  // CAPA
  addCoverPage(doc);

  // SUMÁRIO — preenchido já na posição natural, logo após a capa, com a
  // paginação descoberta no passo 1.
  doc.addPage();
  renderTableOfContents(doc, toc);

  // CONTEÚDO
  doc.addPage();
  renderMarkdown(doc, markdown);

  // Números de página — sempre em ordem crescente, terminando na última
  // página do documento (padrão testado e seguro no pdfkit).
  addPageNumbers(doc);

  doc.end();
  return stream;
}

// Versão assíncrona, caso o chamador prefira ler o arquivo fora do caminho
// síncrono (mantida por conveniência; a rota usa a versão síncrona acima).
export async function generateManualProfessorPDFAsync(): Promise<PassThrough> {
  await fsPromises.access(path.join(process.cwd(), 'server', 'manual-professor.md'));
  return generateManualProfessorPDF();
}

// O título "# Manual do Professor — Simula+" já aparece, com mais destaque,
// na capa — repeti-lo como um H1 na primeira página de conteúdo seria
// redundante, então essa primeira linha (e a linha em branco seguinte) é
// removida antes de renderizar.
function stripTitleLine(markdown: string): string {
  const lines = markdown.split('\n');
  if (lines[0] && lines[0].startsWith('# ')) {
    lines.shift();
    if (lines[0] !== undefined && lines[0].trim() === '') {
      lines.shift();
    }
  }
  return lines.join('\n');
}

function addCoverPage(doc: PDFKit.PDFDocument) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.rect(0, 0, pageWidth, pageHeight).fill(PRIMARY_COLOR);
  doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2)
     .fillOpacity(0.3)
     .fill(ACCENT_COLOR)
     .fillOpacity(1);

  // Logo corporativo Simula+ sobre um cartão branco, para manter a
  // legibilidade da marca (navy + dourado) contra o fundo colorido —
  // mesmo tratamento usado na capa do Manual do Aluno.
  if (fs.existsSync(LOGO_PATH)) {
    try {
      const boxWidth = 300;
      const boxHeight = 110;
      const boxX = (pageWidth - boxWidth) / 2;
      const boxY = 120;
      const padding = 18;

      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 14).fill('#ffffff');
      doc.image(LOGO_PATH, boxX + padding, boxY + padding, {
        fit: [boxWidth - padding * 2, boxHeight - padding * 2],
        align: 'center',
        valign: 'center',
      });
    } catch {
      // Se a imagem não puder ser carregada, segue sem logo — não deve
      // impedir a geração do restante do manual.
    }
  }

  doc.fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(34)
    .text('MANUAL DO PROFESSOR', 60, 290, { width: pageWidth - 120, align: 'center' });

  doc.font('Helvetica')
    .fontSize(20)
    .text('Simula+', 60, 345, { width: pageWidth - 120, align: 'center' });

  doc.fontSize(14)
    .text('Simulador de Marketing no Mercado', 60, 378, { width: pageWidth - 120, align: 'center' });

  doc.fontSize(11)
    .fillColor('#e0e7ff')
    .text(
      'Guia completo para configurar turmas, conduzir rodadas e interpretar resultados — e a fundamentação teórica que embasa cada ferramenta do simulador',
      80, 430,
      { align: 'center', width: pageWidth - 160, lineGap: 3 }
    );

  doc.fontSize(9)
    .fillColor('#c7d2fe')
    .text(`Versão 2.1 | ${new Date().getFullYear()}`, 60, pageHeight - 70, {
      width: pageWidth - 120,
      align: 'center',
    });
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  const originalBottomMargin = doc.page.margins.bottom;
  for (let i = 1; i < range.count; i++) {
    // Página 0 é a capa, sem numeração.
    doc.switchToPage(i);
    // O rodapé é desenhado dentro da margem inferior (doc.page.height - 40
    // fica abaixo do limite de texto normal). Sem isto, o pdfkit interpreta
    // esse ponto como "não cabe na página" e insere automaticamente uma
    // página em branco extra a cada chamada — zerar a margem inferior
    // apenas para esta chamada evita esse gatilho de paginação automática.
    doc.page.margins.bottom = 0;
    doc.fontSize(8).fillColor(DARK_GRAY).font('Helvetica')
      .text(`${i} / ${range.count - 1}`, 0, doc.page.height - 40, {
        align: 'center',
        width: doc.page.width,
        lineBreak: false,
      });
    doc.page.margins.bottom = originalBottomMargin;
  }
}

function renderTableOfContents(doc: PDFKit.PDFDocument, entries: TocEntry[]) {
  doc.x = doc.page.margins.left;
  doc.y = doc.page.margins.top;

  doc.fontSize(20).font('Helvetica-Bold').fillColor(PRIMARY_COLOR)
    .text('Sumário', { width: CONTENT_WIDTH });
  doc.moveDown(0.3);
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .lineWidth(2)
    .stroke(PRIMARY_COLOR);
  doc.y += 14;

  const numWidth = 40;
  const titleWidth = CONTENT_WIDTH - numWidth;
  // Alturas de linha fixas (em vez de moveDown, cujo incremento depende da
  // fonte corrente e é difícil de somar com precisão): o sumário tem ~44
  // entradas e precisa caber com folga dentro da página reservada.
  const ROW_HEIGHT_L2 = 15.5;
  const ROW_HEIGHT_L3 = 11.5;

  entries.forEach((entry) => {
    const y = doc.y;
    const isTopLevel = entry.level === 2;
    const rowHeight = isTopLevel ? ROW_HEIGHT_L2 : ROW_HEIGHT_L3;
    doc.font(isTopLevel ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isTopLevel ? 10.5 : 9)
      .fillColor(isTopLevel ? TEXT_COLOR : DARK_GRAY)
      .text(entry.title, doc.page.margins.left + (isTopLevel ? 0 : 16), y, {
        width: titleWidth - (isTopLevel ? 0 : 16),
        continued: false,
        lineBreak: false,
        ellipsis: true,
      });
    doc.font('Helvetica').fontSize(isTopLevel ? 10.5 : 9).fillColor(DARK_GRAY)
      .text(String(entry.page), doc.page.margins.left + titleWidth, y, {
        width: numWidth,
        align: 'right',
        lineBreak: false,
      });
    doc.y = y + rowHeight;
  });
}

// A fonte padrão do pdfkit (Helvetica/WinAnsi) não tem glyphs para emoji
// nem para vários símbolos tipográficos usados no markdown de origem
// (→ ≥ ≤ e o sinal de menos tipográfico "−", diferente do hífen comum)
// — sem tratamento, a geração falha ou imprime caracteres quebrados.
function stripUnsupportedGlyphs(text: string): string {
  return text
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[☀-➿⬀-⯿️]/g, '')
    .replace(/→/g, '->')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/−/g, '-')
    .replace(/[ \t]+\n/g, '\n');
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

/**
 * Renderiza texto com suporte a **negrito** inline, quebrando em múltiplos
 * segmentos na mesma linha lógica (pdfkit não interpreta markdown sozinho).
 */
function renderInlineText(
  doc: PDFKit.PDFDocument,
  line: string,
  options: { size: number; color: string; indent?: number; gap?: number }
) {
  const { size, color, indent = 0, gap = 6 } = options;
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);

  const x = doc.page.margins.left + indent;
  const width = CONTENT_WIDTH - indent;

  doc.x = x;
  doc.fontSize(size).fillColor(color);

  if (parts.length === 0) {
    doc.moveDown();
    return;
  }

  parts.forEach((part, i) => {
    const isBold = part.startsWith('**') && part.endsWith('**');
    const text = isBold ? part.slice(2, -2) : part;
    doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(text, {
      width,
      continued: i < parts.length - 1,
      lineGap: 2,
    });
  });

  doc.moveDown(gap / 12);
}

// ---- Tabelas markdown (| col | col | ...) ----

function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((c) => c.trim());
}

function isTableSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  return /^\|?[\s:|-]+\|?$/.test(trimmed) && trimmed.includes('-');
}

function columnWeights(colCount: number): number[] {
  if (colCount === 4) return [0.17, 0.24, 0.27, 0.32];
  if (colCount === 3) return [0.30, 0.30, 0.40];
  const equal = 1 / colCount;
  return new Array(colCount).fill(equal);
}

// Leitor mínimo de dimensões JPEG (sem dependência externa): percorre os
// marcadores do arquivo até achar um segmento SOFn, de onde vêm largura e
// altura reais da imagem — necessário para calcular a altura renderizada
// no PDF e reservar o espaço certo antes de desenhar.
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

// Renderiza um print de tela (![legenda](arquivo.jpg) no markdown de
// origem) como uma imagem de largura total, com borda leve e legenda em
// itálico logo abaixo — mesmo tratamento visual das tabelas (borda em
// LIGHT_GRAY). Se o arquivo não existir, não interrompe a geração do PDF:
// registra um aviso no console e segue para a próxima linha.
function renderScreenshot(doc: PDFKit.PDFDocument, fileName: string, caption: string) {
  const fullPath = path.join(SCREENSHOTS_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[manualProfessorPDF] screenshot não encontrado, ignorando: ${fileName}`);
    return;
  }

  let imgWidth = CONTENT_WIDTH;
  let imgHeight = CONTENT_WIDTH * 0.6;
  try {
    const buffer = fs.readFileSync(fullPath);
    const dims = getJpegDimensions(buffer);
    if (dims && dims.width > 0) {
      imgHeight = (CONTENT_WIDTH * dims.height) / dims.width;
    }
  } catch {
    // Mantém a altura estimada padrão se a leitura falhar.
  }

  const captionHeight = doc.font('Helvetica-Oblique').fontSize(8.5)
    .heightOfString(caption, { width: CONTENT_WIDTH });
  const totalBlockHeight = imgHeight + captionHeight + 20;

  // Bloco de imagem + legenda não deve ser quebrado ao meio entre páginas;
  // se não couber inteiro no espaço restante, mas couber numa página nova,
  // pula para a próxima página em vez de fatiar a imagem.
  const remaining = doc.page.height - doc.page.margins.bottom - doc.y;
  if (totalBlockHeight > remaining && totalBlockHeight <= doc.page.height - doc.page.margins.top - doc.page.margins.bottom) {
    doc.addPage();
  } else {
    ensureSpace(doc, totalBlockHeight);
  }

  doc.moveDown(0.3);
  const x = doc.page.margins.left;
  const y = doc.y;

  doc.rect(x - 3, y - 3, imgWidth + 6, imgHeight + 6).fillAndStroke('#ffffff', LIGHT_GRAY);
  doc.image(fullPath, x, y, { width: imgWidth, height: imgHeight });
  doc.y = y + imgHeight + 8;

  doc.x = x;
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(DARK_GRAY)
    .text(caption, x, doc.y, { width: CONTENT_WIDTH, align: 'center' });
  doc.moveDown(0.6);
  doc.x = doc.page.margins.left;
}

function renderTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]) {
  const weights = columnWeights(headers.length);
  const colWidths = weights.map((w) => w * CONTENT_WIDTH);
  const colX: number[] = [];
  let acc = doc.page.margins.left;
  for (const w of colWidths) {
    colX.push(acc);
    acc += w;
  }
  const cellPadding = 6;
  const headerFontSize = 9;
  const bodyFontSize = 8.5;

  const drawHeaderRow = () => {
    const y = doc.y;
    const heights = headers.map((h, i) =>
      doc.font('Helvetica-Bold').fontSize(headerFontSize)
        .heightOfString(h, { width: colWidths[i] - cellPadding * 2 })
    );
    const rowHeight = Math.max(...heights) + cellPadding * 2;

    doc.rect(doc.page.margins.left, y, CONTENT_WIDTH, rowHeight).fill(PRIMARY_COLOR);
    headers.forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(headerFontSize).fillColor('#ffffff')
        .text(h, colX[i] + cellPadding, y + cellPadding, { width: colWidths[i] - cellPadding * 2 });
    });
    doc.y = y + rowHeight;
    doc.x = doc.page.margins.left;
  };

  ensureSpace(doc, 60);
  doc.x = doc.page.margins.left;
  drawHeaderRow();

  rows.forEach((row, rowIdx) => {
    const cellData = row.map((raw) => {
      const boldMatch = raw.match(/^\*\*(.+)\*\*$/);
      return { text: boldMatch ? boldMatch[1] : raw, bold: !!boldMatch };
    });

    const heights = cellData.map((c, i) =>
      doc.font(c.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bodyFontSize)
        .heightOfString(c.text, { width: colWidths[i] - cellPadding * 2 })
    );
    const rowHeight = Math.max(...heights) + cellPadding * 2;

    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      doc.x = doc.page.margins.left;
      drawHeaderRow();
    }

    const y = doc.y;
    const bg = rowIdx % 2 === 0 ? '#ffffff' : ZEBRA_GRAY;
    doc.rect(doc.page.margins.left, y, CONTENT_WIDTH, rowHeight).fillAndStroke(bg, LIGHT_GRAY);

    cellData.forEach((c, i) => {
      doc.font(c.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bodyFontSize).fillColor(TEXT_COLOR)
        .text(c.text, colX[i] + cellPadding, y + cellPadding, { width: colWidths[i] - cellPadding * 2, lineGap: 1 });
    });

    doc.y = y + rowHeight;
    doc.x = doc.page.margins.left;
  });

  doc.moveDown(0.8);
  doc.x = doc.page.margins.left;
}

function renderMarkdown(doc: PDFKit.PDFDocument, markdown: string): TocEntry[] {
  const lines = markdown.split('\n');
  const toc: TocEntry[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const line = raw.trimEnd();

    if (line.trim() === '') {
      continue;
    }

    // Imagem ilustrativa: ![legenda](arquivo.jpg), resolvida dentro de
    // SCREENSHOTS_DIR. Precisa vir antes de qualquer outro tratamento de
    // linha, já que "![...]" também bateria com o parágrafo comum.
    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      renderScreenshot(doc, image[2].trim(), image[1].trim());
      continue;
    }

    if (line.trim() === '---') {
      ensureSpace(doc, 20);
      doc.moveDown(0.3);
      doc.strokeColor(LIGHT_GRAY).lineWidth(1)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      doc.moveDown(0.6);
      continue;
    }

    // Tabelas markdown — uma linha "| ... |" seguida por uma linha
    // separadora "|---|---|" identifica o início de uma tabela.
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const next = lines[idx + 1] ? lines[idx + 1] : '';
      if (isTableSeparatorRow(next)) {
        const headers = parseTableRow(line);
        let j = idx + 2;
        const rows: string[][] = [];
        while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
          rows.push(parseTableRow(lines[j]));
          j++;
        }
        renderTable(doc, headers, rows);
        idx = j - 1;
        continue;
      }
    }

    // Cabeçalhos
    const h1 = line.match(/^#\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const h4 = line.match(/^####\s+(.*)/);

    if (h1) {
      ensureSpace(doc, 40);
      doc.x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(20).fillColor(PRIMARY_COLOR)
        .text(h1[1], { width: CONTENT_WIDTH });
      doc.moveDown(0.5);
      continue;
    }
    if (h2) {
      ensureSpace(doc, 44);
      doc.moveDown(0.5);
      const pageIndex = doc.bufferedPageRange().count - 1;
      toc.push({ title: h2[1], page: pageIndex, level: 2 });
      doc.x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(16).fillColor(PRIMARY_COLOR)
        .text(h2[1], { width: CONTENT_WIDTH });
      doc.moveDown(0.25);
      doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .lineWidth(1.5)
        .stroke(PRIMARY_COLOR);
      doc.moveDown(0.4);
      continue;
    }
    if (h3) {
      ensureSpace(doc, 30);
      doc.moveDown(0.35);
      const pageIndex = doc.bufferedPageRange().count - 1;
      toc.push({ title: h3[1], page: pageIndex, level: 3 });
      doc.x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(12.5).fillColor(SECONDARY_COLOR)
        .text(h3[1], { width: CONTENT_WIDTH });
      doc.moveDown(0.25);
      continue;
    }
    if (h4) {
      ensureSpace(doc, 24);
      doc.moveDown(0.2);
      doc.x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(11.5).fillColor(TEXT_COLOR)
        .text(h4[1], { width: CONTENT_WIDTH });
      doc.moveDown(0.15);
      continue;
    }

    // Listas não numeradas ("- item")
    const bullet = line.match(/^(\s*)-\s+(.*)/);
    if (bullet) {
      const depth = Math.floor(bullet[1].length / 2);
      ensureSpace(doc, 16);
      doc.x = doc.page.margins.left + 14 + depth * 14;
      doc.font('Helvetica').fontSize(10.5).fillColor(ACCENT_COLOR)
        .text('•  ', { continued: true, width: CONTENT_WIDTH - 14 - depth * 14 });
      renderInlineText(doc, bullet[2], { size: 10.5, color: TEXT_COLOR, indent: 14 + depth * 14, gap: 3 });
      continue;
    }

    // Listas numeradas ("1. item")
    const numbered = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (numbered) {
      const depth = Math.floor(numbered[1].length / 2);
      ensureSpace(doc, 16);
      doc.x = doc.page.margins.left + 14 + depth * 14;
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(PRIMARY_COLOR)
        .text(`${numbered[2]}.  `, { continued: true, width: CONTENT_WIDTH - 14 - depth * 14 });
      renderInlineText(doc, numbered[3], { size: 10.5, color: TEXT_COLOR, indent: 14 + depth * 14, gap: 3 });
      continue;
    }

    // Parágrafo comum — uma linha em **negrito total** funciona como um
    // rótulo de subseção informal (ex.: "**Controle Manual**"), então
    // ganha um pouco mais de destaque.
    const boldLabel = line.trim().match(/^\*\*([^*]+)\*\*$/);
    if (boldLabel) {
      ensureSpace(doc, 20);
      doc.moveDown(0.15);
      doc.x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT_COLOR)
        .text(boldLabel[1], { width: CONTENT_WIDTH });
      doc.moveDown(0.25);
      continue;
    }

    ensureSpace(doc, 16);
    renderInlineText(doc, line.trim(), { size: 10.5, color: TEXT_COLOR, gap: 4 });
  }

  return toc;
}
