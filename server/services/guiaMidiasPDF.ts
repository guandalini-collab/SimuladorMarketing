import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';
import type { Midia } from '@shared/schema';

// Mesmo padrão visual do Manual do Aluno (manualAlunoPDF.ts), mas gerado
// dinamicamente a partir da tabela `midias` do banco — ao contrário do PDF
// estático anterior (que nunca foi versionado no git e sumiu em produção),
// este documento nunca fica desatualizado nem se perde num deploy.
const PRIMARY_COLOR = '#6366f1';
const SECONDARY_COLOR = '#8b5cf6';
const TEXT_COLOR = '#1f2937';
const LIGHT_GRAY = '#e5e7eb';
const DARK_GRAY = '#6b7280';
const WHITE = '#ffffff';

// Uma cor de destaque por categoria — usada na barra do card, no selo de
// preço e na legenda da capa, para o aluno reconhecer visualmente cada
// grupo de mídia ao folhear o guia.
const CATEGORY_COLORS: Record<string, string> = {
  'Mídia Impressa': '#0ea5e9',
  'Marketing Digital': '#6366f1',
  'Mídia Exterior (OOH)': '#f59e0b',
  'Mídia Eletrônica': '#ef4444',
  'Mídia Display e Programática': '#06b6d4',
  'Marketing Direto': '#10b981',
  'Relações Públicas': '#8b5cf6',
  'Promoção de Vendas': '#ec4899',
  'Product Placement': '#14b8a6',
};
const FALLBACK_COLOR = '#6b7280';

function corDaCategoria(categoria: string): string {
  return CATEGORY_COLORS[categoria] ?? FALLBACK_COLOR;
}

// Clareia uma cor hex misturando com branco — usada como fundo suave do
// card, mantendo a cor forte só na barra lateral e no selo de preço.
function clarear(hex: string, fator: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (canal: number) => Math.round(canal + (255 - canal) * fator);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

const LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Simula_logo_navy_dourado_final.png');

const MARGIN_LEFT = 60;
const MARGIN_RIGHT = 60;
const PAGE_BOTTOM = 780;

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateGuiaMidiasPDF(midias: Midia[]): PassThrough {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: MARGIN_LEFT, right: MARGIN_RIGHT },
    info: {
      Title: 'Guia de Mídias - Simula+',
      Author: 'Simula+',
      Subject: 'Formatos de mídia disponíveis e valores de investimento',
    },
  });

  const stream = new PassThrough();
  doc.pipe(stream);

  const categorias = Array.from(new Set(midias.map(m => m.categoria)));

  addCoverPage(doc, categorias, midias);

  categorias.forEach((categoria) => {
    doc.addPage();
    addCategoriaSection(doc, categoria, midias.filter(m => m.categoria === categoria));
  });

  doc.end();
  return stream;
}

function addCoverPage(doc: PDFKit.PDFDocument, categorias: string[], midias: Midia[]) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.rect(0, 0, pageWidth, pageHeight).fill(PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 320)
     .fillOpacity(0.35)
     .fill(SECONDARY_COLOR)
     .fillOpacity(1);

  if (fs.existsSync(LOGO_PATH)) {
    const boxWidth = 260;
    const boxHeight = 96;
    const boxX = (pageWidth - boxWidth) / 2;
    const boxY = 60;
    const padding = 16;

    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 14).fill(WHITE);
    doc.image(LOGO_PATH, boxX + padding, boxY + padding, {
      fit: [boxWidth - padding * 2, boxHeight - padding * 2],
      align: 'center',
      valign: 'center',
    });
  }

  doc.fontSize(34)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text('GUIA DE MÍDIAS', 60, 190, { width: pageWidth - 120, align: 'center' });

  doc.fontSize(15)
     .font('Helvetica')
     .text('Formatos, valores e quantidades sugeridas para suas campanhas', 60, 236, { width: pageWidth - 120, align: 'center' });

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Simula+ — Simulador de Marketing', 60, 262, { width: pageWidth - 120, align: 'center' });

  // Legenda: um card branco arredondado listando cada categoria com sua
  // cor, para o aluno já saber o que encontrará em cada seção do guia.
  const legendX = MARGIN_LEFT;
  const legendY = 350;
  const legendWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;
  const rowHeight = 30;
  const legendHeight = 50 + categorias.length * rowHeight;

  doc.roundedRect(legendX, legendY, legendWidth, legendHeight, 12).fill(WHITE);

  doc.fontSize(13)
     .font('Helvetica-Bold')
     .fillColor(TEXT_COLOR)
     .text('O QUE VOCÊ ENCONTRA NESTE GUIA', legendX + 24, legendY + 20);

  let rowY = legendY + 52;
  categorias.forEach((categoria) => {
    const cor = corDaCategoria(categoria);
    const total = midias.filter(m => m.categoria === categoria).length;

    doc.roundedRect(legendX + 24, rowY, 14, 14, 4).fill(cor);

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(TEXT_COLOR)
       .text(categoria, legendX + 48, rowY, { continued: false });

    const plural = total === 1 ? 'formato' : 'formatos';
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(DARK_GRAY)
       .text(`${total} ${plural}`, legendX, rowY + 1, { width: legendWidth - 48, align: 'right' });

    rowY += rowHeight;
  });

  // Posicionado com folga da margem inferior (doc.margins.bottom = 50): um
  // texto colado na borda faz o PDFKit iniciar uma página nova e desenhá-lo
  // lá, deixando esta página em branco no rodapé e a próxima só com essa
  // linha solta.
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(WHITE)
     .text(`${midias.length} formatos de mídia · Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 60, pageHeight - 80, { width: pageWidth - 120, align: 'center' });
}

function addCategoriaSection(doc: PDFKit.PDFDocument, categoria: string, itens: Midia[]) {
  const cor = corDaCategoria(categoria);
  const pageWidth = doc.page.width;
  const headerHeight = 56;

  doc.rect(0, 0, pageWidth, headerHeight).fill(cor);

  doc.fontSize(19)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text(categoria, MARGIN_LEFT, 18, { width: pageWidth - MARGIN_LEFT - MARGIN_RIGHT - 100 });

  const plural = itens.length === 1 ? 'formato' : 'formatos';
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(WHITE)
     .text(`${itens.length} ${plural}`, pageWidth - MARGIN_RIGHT - 100, 24, { width: 100, align: 'right' });

  doc.y = headerHeight + 24;

  itens
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach(midia => {
      addMidiaCard(doc, midia, cor, categoria);
    });
}

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number, categoria: string, cor: string) {
  if (doc.y + neededHeight > PAGE_BOTTOM) {
    doc.addPage();
    const pageWidth = doc.page.width;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(cor)
       .text(categoria.toUpperCase(), MARGIN_LEFT, 40, { width: pageWidth - MARGIN_LEFT - MARGIN_RIGHT });
    doc.moveTo(MARGIN_LEFT, 56).lineTo(pageWidth - MARGIN_RIGHT, 56).lineWidth(1).stroke(cor);
    doc.y = 70;
  }
}

function addMidiaCard(doc: PDFKit.PDFDocument, midia: Midia, cor: string, categoria: string) {
  const contentWidth = doc.page.width - MARGIN_LEFT - MARGIN_RIGHT;
  const innerPadding = 14;
  const accentWidth = 6;
  const textX = MARGIN_LEFT + accentWidth + innerPadding;

  const titulo = midia.formato ? `${midia.nome} — ${midia.formato}` : midia.nome;
  const precoTexto = `${formatarMoeda(midia.custoUnitarioMinimo)} / ${midia.unidade}`;
  const badgeWidth = doc.font('Helvetica-Bold').fontSize(10).widthOfString(precoTexto) + 20;
  const tituloWidth = contentWidth - accentWidth - innerPadding * 2 - badgeWidth - 10;

  // Calcula a altura do card antes de desenhar, para decidir se precisa
  // quebrar página (não deixando o card cortado ao meio).
  doc.font('Helvetica-Bold').fontSize(12);
  const tituloHeight = doc.heightOfString(titulo, { width: tituloWidth });

  let descricaoHeight = 0;
  if (midia.descricao) {
    doc.font('Helvetica').fontSize(9.5);
    descricaoHeight = doc.heightOfString(midia.descricao, { width: contentWidth - accentWidth - innerPadding * 2 }) + 6;
  }

  const cardHeight = innerPadding * 2 + Math.max(tituloHeight, 16) + descricaoHeight + 4;

  ensureSpace(doc, cardHeight + 14, categoria, cor);

  const cardY = doc.y;
  const cardX = MARGIN_LEFT;

  // Fundo suave do card + barra de destaque colorida à esquerda.
  doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 8).fill(clarear(cor, 0.92));
  doc.save();
  doc.roundedRect(cardX, cardY, accentWidth + 4, cardHeight, 8).clip();
  doc.rect(cardX, cardY, accentWidth, cardHeight).fill(cor);
  doc.restore();

  // Selo de preço no canto superior direito do card.
  const badgeX = cardX + contentWidth - innerPadding - badgeWidth;
  const badgeY = cardY + innerPadding - 2;
  doc.roundedRect(badgeX, badgeY, badgeWidth, 20, 10).fill(cor);
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text(precoTexto, badgeX, badgeY + 5, { width: badgeWidth, align: 'center' });

  // Título.
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(TEXT_COLOR)
     .text(titulo, textX, cardY + innerPadding, { width: tituloWidth });

  const cursorY = cardY + innerPadding + Math.max(tituloHeight, 16) + 2;

  if (midia.descricao) {
    doc.fontSize(9.5)
       .font('Helvetica')
       .fillColor(DARK_GRAY)
       .text(midia.descricao, textX, cursorY, { width: contentWidth - accentWidth - innerPadding * 2 });
  }

  doc.y = cardY + cardHeight + 12;
}
