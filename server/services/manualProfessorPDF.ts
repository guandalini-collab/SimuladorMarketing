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
// (manualAlunoPDF.ts).

const PRIMARY_COLOR = '#6366f1'; // Indigo
const TEXT_COLOR = '#1f2937'; // Gray 800
const DARK_GRAY = '#6b7280'; // Gray 500
const LIGHT_GRAY = '#f3f4f6'; // Gray 100

const LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Simula_logo_navy_dourado_final.png');

const PAGE_MARGIN = { top: 60, bottom: 60, left: 60, right: 60 };
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN.left - PAGE_MARGIN.right; // A4 width em pt

export function generateManualProfessorPDF(): PassThrough {
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

  addCoverPage(doc);

  const manualPath = path.join(process.cwd(), 'server', 'manual-professor.md');
  const markdown = stripEmoji(fs.readFileSync(manualPath, 'utf-8'));

  doc.addPage();
  renderMarkdown(doc, markdown);

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

function addCoverPage(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(PRIMARY_COLOR);

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, doc.page.width / 2 - 70, 130, { width: 140 });
    } catch {
      // Se a imagem não puder ser carregada, segue sem logo — não deve
      // impedir a geração do restante do manual.
    }
  }

  doc.fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(30)
    .text('Manual do Professor', 0, 320, { align: 'center' });

  doc.font('Helvetica')
    .fontSize(16)
    .text('Simula+ | Simulador de Marketing no Mercado', 0, 365, { align: 'center' });

  doc.fontSize(11)
    .fillColor('#e0e7ff')
    .text('Guia completo para configurar turmas, conduzir rodadas e interpretar resultados', 80, 420, {
      align: 'center',
      width: doc.page.width - 160,
    });
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = 1; i < range.count; i++) {
    // Página 0 é a capa, sem numeração.
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(DARK_GRAY).font('Helvetica')
      .text(`${i} / ${range.count - 1}`, 0, doc.page.height - 40, {
        align: 'center',
        width: doc.page.width,
      });
  }
}

// A fonte padrão do pdfkit (Helvetica/WinAnsi) não tem glyphs para emoji
// (🔴 🟠 ⚪ 🟢 usados no relatório de alinhamento estratégico) nem para
// símbolos como → e ≥ — sem tratamento, a geração falha ou imprime
// caracteres quebrados. O texto ao lado do emoji (ex.: "**Crítico**") já
// identifica o item sozinho, então os emoji são só removidos; → e ≥ viram
// equivalentes em ASCII.
function stripEmoji(text: string): string {
  return text
    // Emoji fora do BMP (ex.: 🔴🟠🟢) são pares substitutos em UTF-16;
    // TypeScript aqui está configurado sem "target" >= es6, então a flag
    // "u" do regex (necessária para \u{...}) não compila — por isso o
    // primeiro ramo casa qualquer par substituto (cobre todo emoji
    // astral), e o segundo cobre os símbolos do BMP usados no documento
    // (⚪ está em ☀-➿).
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[☀-➿⬀-⯿️]/g, '')
    .replace(/→/g, '->')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
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

function renderMarkdown(doc: PDFKit.PDFDocument, markdown: string) {
  const lines = markdown.split('\n');

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const line = raw.trimEnd();

    if (line.trim() === '') {
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
      ensureSpace(doc, 34);
      doc.moveDown(0.4);
      doc.x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(16).fillColor(PRIMARY_COLOR)
        .text(h2[1], { width: CONTENT_WIDTH });
      doc.moveDown(0.3);
      continue;
    }
    if (h3) {
      ensureSpace(doc, 28);
      doc.moveDown(0.3);
      doc.x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(13).fillColor(TEXT_COLOR)
        .text(h3[1], { width: CONTENT_WIDTH });
      doc.moveDown(0.2);
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
      doc.font('Helvetica').fontSize(10.5).fillColor(TEXT_COLOR)
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
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT_COLOR)
        .text(`${numbered[2]}.  `, { continued: true, width: CONTENT_WIDTH - 14 - depth * 14 });
      renderInlineText(doc, numbered[3], { size: 10.5, color: TEXT_COLOR, indent: 14 + depth * 14, gap: 3 });
      continue;
    }

    // Parágrafo comum
    ensureSpace(doc, 16);
    renderInlineText(doc, line.trim(), { size: 10.5, color: TEXT_COLOR, gap: 4 });
  }
}
