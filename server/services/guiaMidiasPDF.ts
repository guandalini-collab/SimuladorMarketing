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
const LIGHT_GRAY = '#f3f4f6';
const DARK_GRAY = '#6b7280';

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

  addCoverPage(doc);

  const categorias = Array.from(new Set(midias.map(m => m.categoria)));

  categorias.forEach((categoria, index) => {
    doc.addPage();
    addCategoriaSection(doc, categoria, midias.filter(m => m.categoria === categoria));
  });

  doc.end();
  return stream;
}

function addCoverPage(doc: PDFKit.PDFDocument) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.rect(0, 0, pageWidth, pageHeight).fill(PRIMARY_COLOR);
  doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2)
     .fillOpacity(0.3)
     .fill(SECONDARY_COLOR)
     .fillOpacity(1);

  if (fs.existsSync(LOGO_PATH)) {
    const boxWidth = 300;
    const boxHeight = 110;
    const boxX = (pageWidth - boxWidth) / 2;
    const boxY = 150;
    const padding = 18;

    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 14).fill('#ffffff');
    doc.image(LOGO_PATH, boxX + padding, boxY + padding, {
      fit: [boxWidth - padding * 2, boxHeight - padding * 2],
      align: 'center',
      valign: 'center',
    });
  }

  doc.fontSize(40)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text('GUIA DE MÍDIAS', 60, 320, { width: pageWidth - 120, align: 'center' });

  doc.fontSize(20)
     .font('Helvetica')
     .text('Formatos, valores e quantidades sugeridas', 60, 380, { width: pageWidth - 120, align: 'center' });

  doc.fontSize(14)
     .text('Simula+ — Simulador de Marketing', 60, 415, { width: pageWidth - 120, align: 'center' });

  doc.fontSize(11)
     .text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 60, 720, { width: pageWidth - 120, align: 'center' });
}

function addCategoriaSection(doc: PDFKit.PDFDocument, categoria: string, itens: Midia[]) {
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_COLOR)
     .text(categoria, MARGIN_LEFT, 50, { align: 'left' });

  doc.moveDown(0.3);
  doc.moveTo(MARGIN_LEFT, doc.y)
     .lineTo(doc.page.width - MARGIN_RIGHT, doc.y)
     .lineWidth(2)
     .stroke(PRIMARY_COLOR);
  doc.moveDown(0.8);

  itens
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach(midia => {
      ensureSpace(doc, 90);
      addMidiaCard(doc, midia);
    });
}

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number) {
  if (doc.y + neededHeight > PAGE_BOTTOM) {
    doc.addPage();
    doc.y = 50;
  }
}

function addMidiaCard(doc: PDFKit.PDFDocument, midia: Midia) {
  const contentWidth = doc.page.width - MARGIN_LEFT - MARGIN_RIGHT;
  const startY = doc.y;

  const titulo = midia.formato ? `${midia.nome} — ${midia.formato}` : midia.nome;

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(SECONDARY_COLOR)
     .text(titulo, MARGIN_LEFT, startY, { width: contentWidth });

  doc.moveDown(0.2);

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(TEXT_COLOR)
     .text(`Custo unitário mínimo: `, MARGIN_LEFT, doc.y, { continued: true })
     .font('Helvetica')
     .text(`${formatarMoeda(midia.custoUnitarioMinimo)} por ${midia.unidade}`);

  if (midia.quantidadeSugerida) {
    doc.font('Helvetica-Bold')
       .text(`Quantidade sugerida: `, MARGIN_LEFT, doc.y, { continued: true })
       .font('Helvetica')
       .text(midia.quantidadeSugerida);
  }

  if (midia.descricao) {
    doc.fontSize(9)
       .font('Helvetica-Oblique')
       .fillColor(DARK_GRAY)
       .text(midia.descricao, MARGIN_LEFT, doc.y, { width: contentWidth });
  }

  doc.moveDown(0.4);
  doc.moveTo(MARGIN_LEFT, doc.y)
     .lineTo(doc.page.width - MARGIN_RIGHT, doc.y)
     .lineWidth(0.5)
     .stroke(LIGHT_GRAY);
  doc.moveDown(0.6);
}
