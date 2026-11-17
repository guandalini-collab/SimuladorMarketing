/**
 * PDF do relatório gerencial da rodada (nov/2026). Layout aprovado pelo
 * professor em 17/11/2026, nas normas da ABNT aplicáveis:
 * - A4; margens de 3 cm (superior e esquerda) e 2 cm (direita e inferior);
 * - Helvetica (equivalente à Arial) 12, espaçamento de 1,5 no texto;
 * - seções numeradas; título de tabela e gráfico acima, fonte abaixo;
 *   tabelas e fontes em corpo menor;
 * - logomarca só na primeira folha; a primeira folha conta, mas não mostra
 *   número; a numeração aparece a partir da segunda, no canto superior direito.
 * Não há texto de IA nem conselho de decisão.
 */
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import type { RelatorioGerencial, LinhaPainel, Dre } from "./relatorioGerencial";
import { PESO_PONTO_FERRAMENTA } from "@shared/alertasAlinhamento";

const CM = 72 / 2.54;
const M = { top: 3 * CM, left: 3 * CM, right: 2 * CM, bottom: 2 * CM };
const COR = { texto: "#111827", cinza: "#6b7280", linha: "#9ca3af", equipe: "#0b2f6b", turma: "#f2a900", claro: "#d1d5db", simulado: "#e5e7eb" };
const logoPath = () => path.join(process.cwd(), "server", "assets", "relatorio-logo.png");

// A Helvetica padrão do pdfkit (WinAnsi) não tem alguns símbolos.
function t(s: string): string {
  return s.replace(/−/g, "-").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/≈/g, "~").replace(/[  ]/g, " ");
}

const br = (v: number, c = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });
const sinal = (v: number, c = 1, suf = "") => (Math.abs(v) < Math.pow(10, -c) / 2 ? "0" : (v > 0 ? "+" : "-") + br(Math.abs(v), c) + suf);
const num = (v: number | null | undefined, c = 0) => (v == null || !Number.isFinite(v) ? "–" : (v < 0 ? "-" : "") + br(Math.abs(v), c));
const reais = (v: number) => (Math.round(v) < 0 ? "-" : "") + "R$ " + br(Math.abs(Math.round(v)));
const POR_EXTENSO = ["zero", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze"];
const extenso = (n: number) => POR_EXTENSO[n] ?? String(n);
const listaE = (l: string[]) => (l.length <= 1 ? l.join("") : l.slice(0, -1).join(", ") + " e " + l[l.length - 1]);
const intervalo = (r: number[]) => (r.length === 1 ? `Rodada ${r[0]}` : r.length === 2 ? `Rodadas ${r[0]} e ${r[1]}` : `Rodadas ${r[0]} a ${r[r.length - 1]}`);

interface Coluna { titulo: string; largura: number; alinhar?: "left" | "right" | "center" }
type Linha = string[] | { grupo: string } | { destaque: string[] };

export function gerarRelatorioGerencialPDF(r: RelatorioGerencial): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: "A4",
    margins: M,
    bufferPages: true,
    info: { Title: t(`Relatório gerencial da Rodada ${r.rodada} - ${r.empresa}`), Author: "Simula+", Subject: t(`Turma ${r.turma}`) },
  });
  const W = doc.page.width - M.left - M.right;
  const yMax = () => doc.page.height - M.bottom;
  const ano = r.encerradaEm ? new Date(r.encerradaEm).getFullYear() : new Date().getFullYear();
  const fonteRodadas = (rs: number[]) => `Fonte: Simula+, resultados ${rs.length === 1 ? "da" : "das"} ${intervalo(rs)} (${ano}).`;
  let nTabela = 0, nGrafico = 0, nQuadro = 0;
  const anterior = r.rodadas.length >= 2 ? r.rodadas[r.rodadas.length - 2] : null;

  // ---------- utilitários de texto ----------
  const espaco = (h: number) => { if (doc.y + h > yMax()) doc.addPage(); };
  const paragrafo = (s: string, opts: { recuo?: boolean; tamanho?: number } = {}) => {
    doc.font("Helvetica").fontSize(opts.tamanho ?? 12).fillColor(COR.texto);
    espaco(30);
    doc.text(t(s), M.left, doc.y, { width: W, align: "justify", lineGap: 4, indent: opts.recuo === false ? 0 : 1.25 * CM, paragraphGap: 6 });
  };
  const rotulado = (rotulo: string, s: string) => {
    doc.fontSize(12).fillColor(COR.texto);
    espaco(30);
    doc.font("Helvetica-Bold").text(t(rotulo + " "), M.left, doc.y, { width: W, continued: true, align: "justify", lineGap: 4 });
    doc.font("Helvetica").text(t(s), { width: W, align: "justify", lineGap: 4, paragraphGap: 6 });
  };
  const secao = (s: string, minimo = 90) => {
    espaco(minimo);
    doc.moveDown(0.6);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(COR.texto).text(t(s), M.left, doc.y, { width: W, lineGap: 4 });
    doc.moveDown(0.5);
  };
  const subsecao = (s: string) => {
    espaco(60);
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(12).fillColor(COR.texto).text(t(s), M.left, doc.y, { width: W, lineGap: 4 });
    doc.moveDown(0.4);
  };
  const tituloIlustracao = (s: string) => {
    doc.font("Helvetica").fontSize(10).fillColor(COR.texto).text(t(s), M.left, doc.y, { width: W, align: "center", lineGap: 1 });
    doc.moveDown(0.3);
  };
  const fonte = (s: string) => {
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(10).fillColor(COR.texto).text(t(s), M.left, doc.y, { width: W, lineGap: 1 });
    doc.moveDown(0.8);
  };

  // ---------- tabela (bordas laterais abertas) ----------
  const tabela = (titulo: string, colunas: Coluna[], linhas: Linha[], textoFonte: string, tam = 10) => {
    const total = colunas.reduce((s, c) => s + c.largura, 0);
    const k = W / total;
    const cols = colunas.map((c) => ({ ...c, largura: c.largura * k }));
    const pad = 3;
    const alturaLinha = (cel: string[], negrito = false) => {
      doc.font(negrito ? "Helvetica-Bold" : "Helvetica").fontSize(tam);
      return Math.max(...cel.map((c, i) => doc.heightOfString(t(c || " "), { width: cols[i].largura - 2 * pad }))) + 2 * pad;
    };
    const cab = () => {
      const h = alturaLinha(cols.map((c) => c.titulo), true);
      const y0 = doc.y;
      doc.moveTo(M.left, y0).lineTo(M.left + W, y0).lineWidth(0.8).strokeColor(COR.texto).stroke();
      let x = M.left;
      doc.font("Helvetica-Bold").fontSize(tam).fillColor(COR.texto);
      cols.forEach((c) => { doc.text(t(c.titulo), x + pad, y0 + pad, { width: c.largura - 2 * pad, align: c.alinhar === "left" ? "left" : "center" }); x += c.largura; });
      doc.moveTo(M.left, y0 + h).lineTo(M.left + W, y0 + h).lineWidth(0.5).stroke();
      doc.y = y0 + h;
    };
    const h1 = linhas.length ? alturaLinha(Array.isArray(linhas[0]) ? (linhas[0] as string[]) : ["x"]) : 0;
    espaco(40 + alturaLinha(cols.map((c) => c.titulo), true) + 2 * h1);
    nTabela++;
    tituloIlustracao(`Tabela ${nTabela} – ${titulo}`);
    cab();
    for (const l of linhas) {
      const grupo = !Array.isArray(l) && "grupo" in l;
      const destaque = !Array.isArray(l) && "destaque" in l;
      const cel = grupo ? [(l as any).grupo] : destaque ? (l as any).destaque : (l as string[]);
      const h = grupo ? alturaLinha(["x"], true) : alturaLinha(cel, destaque);
      if (doc.y + h > yMax()) {
        doc.moveTo(M.left, doc.y).lineTo(M.left + W, doc.y).lineWidth(0.8).strokeColor(COR.texto).stroke();
        doc.addPage();
        doc.font("Helvetica").fontSize(10).text(t(`Tabela ${nTabela} – ${titulo} (continuação)`), M.left, doc.y, { width: W, align: "center" });
        doc.moveDown(0.3);
        cab();
      }
      const y0 = doc.y;
      if (grupo) {
        doc.font("Helvetica-Bold").fontSize(tam).fillColor(COR.texto).text(t(cel[0]), M.left + pad, y0 + pad, { width: W - 2 * pad });
      } else {
        let x = M.left;
        doc.font(destaque ? "Helvetica-Bold" : "Helvetica").fontSize(tam).fillColor(COR.texto);
        cel.forEach((c: string, i: number) => {
          doc.text(t(c ?? ""), x + pad, y0 + pad, { width: cols[i].largura - 2 * pad, align: cols[i].alinhar ?? (i === 0 ? "left" : "right") });
          x += cols[i].largura;
        });
      }
      doc.y = y0 + h;
    }
    doc.moveTo(M.left, doc.y).lineTo(M.left + W, doc.y).lineWidth(0.8).strokeColor(COR.texto).stroke();
    fonte(textoFonte);
  };

  // ---------- gráficos ----------
  const escala = (min: number, max: number) => {
    if (min === max) { max = min + 1; }
    const bruto = (max - min) / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto) ?? bruto;
    return { min: Math.floor(min / passo) * passo, max: Math.ceil(max / passo) * passo, passo };
  };
  const legenda = (itens: { nome: string; cor: string; tracejado?: boolean; barra?: boolean }[], y: number) => {
    let x = M.left;
    doc.font("Helvetica").fontSize(9).fillColor(COR.texto);
    for (const it of itens) {
      const w = doc.widthOfString(t(it.nome)) + 30;
      if (x + w > M.left + W) { x = M.left; y += 14; }
      if (it.barra) doc.rect(x, y + 1, 14, 8).fill(it.cor);
      else { doc.moveTo(x, y + 5).lineTo(x + 18, y + 5).lineWidth(2).strokeColor(it.cor); if (it.tracejado) doc.dash(4, { space: 3 }); doc.stroke(); doc.undash(); }
      doc.fillColor(COR.texto).text(t(it.nome), x + 22, y, { lineBreak: false });
      x += w;
    }
    return y + 16;
  };
  const graficoLinhas = (titulo: string, cats: string[], series: { nome: string; valores: (number | null)[]; cor: string; tracejado?: boolean }[], fmt: (v: number) => string, textoFonte: string) => {
    const H = 170;
    espaco(H + 90);
    nGrafico++;
    tituloIlustracao(`Gráfico ${nGrafico} – ${titulo}`);
    const todos = series.flatMap((s) => s.valores.filter((v): v is number => v != null));
    const e = escala(Math.min(0, ...todos), Math.max(0, ...todos));
    const L = M.left + 48, R = M.left + W - 10, T = doc.y + 6, B = T + H;
    const y = (v: number) => B - ((v - e.min) / (e.max - e.min)) * H;
    const x = (i: number) => (cats.length === 1 ? (L + R) / 2 : L + 20 + ((R - L - 40) * i) / (cats.length - 1));
    doc.font("Helvetica").fontSize(8).fillColor(COR.cinza);
    for (let v = e.min; v <= e.max + e.passo / 2; v += e.passo) {
      doc.moveTo(L, y(v)).lineTo(R, y(v)).lineWidth(0.3).strokeColor(Math.abs(v) < e.passo / 1000 ? COR.cinza : COR.claro).stroke();
      doc.fillColor(COR.cinza).text(t(fmt(v)), M.left, y(v) - 4, { width: 44, align: "right", lineBreak: false });
    }
    cats.forEach((c, i) => doc.fillColor(COR.texto).text(t(c), x(i) - 30, B + 5, { width: 60, align: "center", lineBreak: false }));
    for (const s of series) {
      const pts = s.valores.map((v, i) => (v == null ? null : [x(i), y(v)] as [number, number])).filter((p): p is [number, number] => !!p);
      if (pts.length > 1) {
        doc.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach((p) => doc.lineTo(p[0], p[1]));
        doc.lineWidth(s.tracejado ? 1.2 : 2).strokeColor(s.cor);
        if (s.tracejado) doc.dash(4, { space: 3 });
        doc.stroke(); doc.undash();
      }
      pts.forEach((p) => { doc.circle(p[0], p[1], s.tracejado ? 1.8 : 2.6).fill(s.cor); });
    }
    // rótulos só da empresa (séries sem tracejado), no último ponto
    for (const s of series.filter((x) => !x.tracejado)) {
      const i = s.valores.length - 1, v = s.valores[i];
      if (v != null) doc.font("Helvetica-Bold").fontSize(8).fillColor(s.cor).text(t(fmt(v)), x(i) - 40, y(v) - 13, { width: 80, align: "center", lineBreak: false });
    }
    doc.y = legenda(series.map((s) => ({ nome: s.nome, cor: s.cor, tracejado: s.tracejado })), B + 20);
    fonte(textoFonte);
  };
  const graficoBarras = (titulo: string, itens: { nome: string; valor: number; cor: string }[], textoFonte: string, legendaItens: { nome: string; cor: string }[]) => {
    const alt = 15, gap = 4, H = itens.length * (alt + gap);
    espaco(H + 90);
    nGrafico++;
    tituloIlustracao(`Gráfico ${nGrafico} – ${titulo}`);
    const L = M.left + 110, R = M.left + W - 50, T = doc.y + 4;
    const max = Math.max(...itens.map((i) => i.valor), 1);
    itens.forEach((it, k) => {
      const yy = T + k * (alt + gap);
      doc.font("Helvetica").fontSize(9).fillColor(COR.texto).text(t(it.nome), M.left, yy + 3, { width: 104, align: "right", lineBreak: false });
      const w = ((R - L) * it.valor) / max;
      doc.rect(L, yy, Math.max(w, 0.5), alt).fill(it.cor);
      doc.font("Helvetica").fontSize(9).fillColor(COR.texto).text(t(br(it.valor, 2) + "%"), L + w + 4, yy + 3, { lineBreak: false });
    });
    doc.moveTo(L, T - 2).lineTo(L, T + H).lineWidth(0.5).strokeColor(COR.cinza).stroke();
    doc.y = legenda(legendaItens.map((l) => ({ ...l, barra: true })), T + H + 8);
    fonte(textoFonte);
  };

  // =================== Folha 1: logomarca e identificação ===================
  const LOGO = logoPath();
  if (fs.existsSync(LOGO)) {
    const lw = 190;
    doc.image(LOGO, M.left + (W - lw) / 2, M.top - 10, { width: lw });
    doc.y = M.top - 10 + lw * (474 / 1788) + 26;
  }
  doc.font("Helvetica-Bold").fontSize(14).fillColor(COR.texto).text(t(`Relatório gerencial da Rodada ${r.rodada}`), M.left, doc.y, { width: W, align: "center" });
  doc.moveDown(1);
  const encerrada = r.encerradaEm
    ? new Date(r.encerradaEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(/,? (\d{2}):(\d{2})/, ", às $1h$2")
    : null;
  const outras = r.equipesNaTurma - 1;
  const ident: [string, string][] = [
    ["Empresa", r.empresa],
    ["Turma", `${r.turma}${r.setor ? ` (setor de ${r.setor})` : ""}`],
    ["Rodada", `${r.rodada}${encerrada ? `, encerrada em ${encerrada}` : ""}`],
    ["Produtos nesta rodada", listaE(r.produtosAtuais) + (anterior != null && r.produtosAnteriores.join() !== r.produtosAtuais.join() ? ` (na Rodada ${anterior}: ${listaE(r.produtosAnteriores)})` : "")],
    ["Comparações", (r.rodadas.length > 1 ? "com as rodadas anteriores da empresa e " : "") + (outras > 0 ? `com ${outras === 1 ? "a outra equipe" : `as outras ${extenso(outras)} equipes`} da turma` : "")],
  ];
  for (const [k, v] of ident) {
    const y0 = doc.y;
    doc.font("Helvetica-Bold").fontSize(11).text(t(k), M.left, y0, { width: 140 });
    const h1 = doc.y - y0;
    doc.font("Helvetica").fontSize(11).text(t(v), M.left + 145, y0, { width: W - 145 });
    doc.y = Math.max(doc.y, y0 + h1) + 4;
  }
  doc.moveDown(0.6);

  // =================== 1 Apresentação ===================
  secao("1 Apresentação");
  paragrafo("Este relatório reúne os resultados da empresa na rodada, comparados com as rodadas anteriores e com as concorrentes da turma. Ele segue o controle do plano de marketing descrito por Kotler e Keller (2019, p. 746-747): mostrar o que está acontecendo e por que está acontecendo, com análises de vendas, de participação de mercado, das despesas de marketing em relação às vendas e da lucratividade. A decisão sobre o que fazer a seguir cabe à equipe.");
  paragrafo("Os indicadores estão agrupados em resultados financeiros, mercado e clientes, e decisões de marketing, separando os indicadores de resultado dos indicadores que os antecedem, como recomendam Kaplan e Norton (1996). Todas as fórmulas estão na seção 10 e no Apêndice A do Manual do Aluno.");

  // =================== 2 Painel ===================
  secao("2 Painel de indicadores");
  const muitas = r.rodadas.length > 3;
  const emMil = muitas;
  const fmtPainel = (l: LinhaPainel, v: number | null) => {
    if (v == null) return "–";
    if (l.moeda && emMil) return num(v / 1000, 0);
    return num(v, l.casas);
  };
  const variacao = (l: LinhaPainel) => {
    if (anterior == null) return "–";
    const a = l.valores[anterior], b = l.valores[r.rodada];
    if (a == null || b == null) return "–";
    if (l.moeda || l.menorMelhor) return a !== 0 ? sinal(((b - a) / Math.abs(a)) * 100, 1, "%") : "–";
    if (l.indicador.includes("(%)")) return sinal(b - a, l.casas, " p.p.");
    return sinal(b - a, l.casas);
  };
  const colsPainel: Coluna[] = [
    { titulo: "Indicador", largura: 128, alinhar: "left" },
    ...r.rodadas.map((n) => ({ titulo: `R${n}`, largura: 60 })),
    ...(anterior != null ? [{ titulo: `Variação R${r.rodada}/R${anterior}`, largura: 52 }] : []),
    { titulo: `Média da turma R${r.rodada}`, largura: 58 },
    { titulo: `Posição na R${r.rodada}`, largura: 42 },
  ];
  const linhasPainel: Linha[] = [];
  let grupoAtual = "";
  for (const l of r.painel) {
    if (l.grupo !== grupoAtual) { linhasPainel.push({ grupo: l.grupo }); grupoAtual = l.grupo; }
    const nome = l.moeda && emMil ? l.indicador.replace("(R$)", "(R$ mil)") : l.indicador;
    linhasPainel.push([
      nome,
      ...r.rodadas.map((n) => fmtPainel(l, l.valores[n] ?? null)),
      ...(anterior != null ? [variacao(l)] : []),
      l.mediaTurma == null ? "–" : fmtPainel(l, l.mediaTurma),
      l.posicao == null ? "–" : `${l.posicao}º de ${l.equipesNaTurma}`,
    ]);
  }
  tabela(
    `Indicadores da ${r.empresa} ${r.rodadas.length > 1 ? `nas ${intervalo(r.rodadas)}` : `na Rodada ${r.rodada}`} e comparação com a turma na Rodada ${r.rodada}`,
    colsPainel,
    linhasPainel,
    `${fonteRodadas(r.rodadas)} Notas: p.p. = pontos percentuais. No CAC, posição 1 é o menor valor.${emMil ? " Valores em reais em milhares." : ""}`,
    r.rodadas.length > 5 ? 8 : 9,
  );

  if (r.rodadas.length >= 1) {
    const s = r.serieReceitaLucro;
    graficoLinhas(
      `Receita bruta e lucro da ${r.empresa} e média da turma, ${intervalo(s.rodadas)} (R$ milhões)`,
      s.rodadas.map((n) => `Rodada ${n}`),
      [
        { nome: `Receita ${r.empresa}`, valores: s.receita.map((v) => (v == null ? null : v / 1e6)), cor: COR.equipe },
        { nome: `Lucro ${r.empresa}`, valores: s.lucro.map((v) => (v == null ? null : v / 1e6)), cor: COR.turma },
        { nome: "Receita, média da turma", valores: s.receitaTurma.map((v) => (v == null ? null : v / 1e6)), cor: COR.equipe, tracejado: true },
        { nome: "Lucro, média da turma", valores: s.lucroTurma.map((v) => (v == null ? null : v / 1e6)), cor: COR.turma, tracejado: true },
      ],
      (v) => num(v, 1),
      fonteRodadas(s.rodadas),
    );
  }

  // =================== 3 Fatos ===================
  secao("3 O que os números mostram");
  paragrafo("Fatos calculados pelo simulador nesta rodada, sem interpretação:", { recuo: false });
  for (const f of r.fatos) {
    espaco(30);
    doc.font("Helvetica").fontSize(12).fillColor(COR.texto);
    const y0 = doc.y;
    doc.text("•", M.left + 0.6 * CM, y0, { lineBreak: false });
    doc.text(t(f), M.left + 1.25 * CM, y0, { width: W - 1.25 * CM, align: "justify", lineGap: 4, paragraphGap: 4 });
  }

  // =================== 4 Análise de vendas ===================
  secao("4 Análise de vendas");
  paragrafo("A análise de variação de vendas separa quanto da mudança na receita veio do preço e quanto veio do volume (KOTLER; KELLER, 2019, p. 756).");
  if (r.vendas && anterior != null) {
    const v = r.vendas;
    tabela(
      `Variação da receita bruta da Rodada ${anterior} para a Rodada ${r.rodada}, por produto`,
      [
        { titulo: "Produto", largura: 70, alinhar: "left" },
        { titulo: `Preço R${anterior} (R$)`, largura: 55 },
        { titulo: `Preço R${r.rodada} (R$)`, largura: 55 },
        { titulo: `Unidades R${anterior}`, largura: 48 },
        { titulo: `Unidades R${r.rodada}`, largura: 48 },
        { titulo: "Efeito do preço (R$)", largura: 62 },
        { titulo: "Efeito do volume (R$)", largura: 62 },
        { titulo: "Variação total (R$)", largura: 66 },
      ],
      [
        ...v.linhas.map((l) => [l.produto, num(l.precoAnterior, 2), num(l.precoAtual, 2), num(l.unidadesAnterior), num(l.unidadesAtual), num(l.efeitoPreco), num(l.efeitoVolume), num(l.variacao)]),
        { destaque: ["Empresa", "", "", "", "", num(v.efeitoPreco), num(v.efeitoVolume), num(v.variacao)] },
      ],
      `Fonte: Simula+, resultados das Rodadas ${anterior} e ${r.rodada} (${ano}). Efeito do preço = (preço R${r.rodada} - preço R${anterior}) × unidades R${r.rodada}; efeito do volume = preço R${anterior} × (unidades R${r.rodada} - unidades R${anterior}).`,
      9,
    );
  } else {
    paragrafo("Esta é a primeira rodada da empresa; a comparação começa na próxima rodada.");
  }

  // =================== 5 Participação ===================
  secao("5 Participação de mercado");
  paragrafo("A participação é a receita da empresa dividida pela receita de todas as empresas da categoria. A participação relativa compara a empresa com a maior concorrente: abaixo de 1,0, a empresa é menor que a líder (KOTLER; KELLER, 2019, p. 757).");
  for (const p of r.participacao) {
    if (!p.empresas.length) continue;
    graficoBarras(
      `Participação de mercado por empresa na categoria ${p.produto}, Rodada ${r.rodada} (%)`,
      p.empresas.map((e) => ({ nome: e.empresa, valor: e.participacao, cor: e.suaEmpresa ? COR.equipe : e.simulado ? COR.claro : COR.linha })),
      `Fonte: Simula+, análise de concorrentes da Rodada ${r.rodada} (${ano}).`,
      [{ nome: r.empresa, cor: COR.equipe }, { nome: "Outras equipes da turma", cor: COR.linha }, { nome: "Concorrentes simulados", cor: COR.claro }],
    );
  }
  if (r.participacao.length) {
    const nEmp = r.participacao[0].empresasNaCategoria;
    tabela(
      `Participação da ${r.empresa} por produto e rodada`,
      [
        { titulo: "Produto", largura: 70, alinhar: "left" },
        ...r.rodadas.map((n) => ({ titulo: `R${n} (%)`, largura: 40 })),
        { titulo: `Líder na R${r.rodada}`, largura: 85 },
        { titulo: `Participação relativa R${r.rodada}`, largura: 58 },
        { titulo: "Média por empresa (%)", largura: 55 },
      ],
      r.participacao.map((p) => [
        p.produto,
        ...r.rodadas.map((n) => num(p.serie[n] ?? null, 2)),
        p.lider ? `${p.lider.empresa} (${br(p.lider.participacao, 2)}%)` : "–",
        num(p.relativa, 2),
        num(p.mediaPorEmpresa, 2),
      ]),
      `${fonteRodadas(r.rodadas)}${nEmp ? ` Média por empresa = 100% ÷ ${nEmp} empresas na categoria.` : ""}`,
      r.rodadas.length > 4 ? 8 : 9,
    );
  }

  // =================== 6 Despesas ===================
  secao("6 Despesas de marketing em relação à receita");
  paragrafo("Kotler e Keller (2019, p. 758) recomendam acompanhar as despesas de marketing em relação às vendas período a período, para enxergar a tendência.");
  graficoLinhas(
    `Comunicação e distribuição em relação à receita bruta da ${r.empresa}, ${intervalo(r.rodadas)} (%)`,
    r.rodadas.map((n) => `Rodada ${n}`),
    [
      { nome: "Comunicação ÷ receita", valores: r.rodadas.map((n) => r.despesas.comunicacao[n] ?? null), cor: COR.equipe },
      { nome: "Distribuição ÷ receita", valores: r.rodadas.map((n) => r.despesas.distribuicao[n] ?? null), cor: COR.turma },
    ],
    (v) => num(v, 2),
    fonteRodadas(r.rodadas),
  );

  // =================== 7 DRE ===================
  secao("7 Lucratividade por produto");
  const colDre: { nome: string; d: (x: Dre) => number }[] = [
    { nome: "Receita bruta", d: (x) => x.receitaBruta },
    { nome: "(-) Tributos sobre vendas (12%)", d: (x) => x.tributos },
    { nome: "(=) Receita líquida", d: (x) => x.receitaLiquida },
    { nome: "(-) Custo de produção (CPV)", d: (x) => x.cpv },
    { nome: "(=) Lucro bruto", d: (x) => x.lucroBruto },
    { nome: "(-) Comunicação (mídias)", d: (x) => x.comunicacao },
    { nome: "(-) Distribuição (canais e cobertura)", d: (x) => x.distribuicao },
    { nome: "(-) Despesas administrativas", d: (x) => x.administrativas },
    { nome: "(=) Lucro antes do IR", d: (x) => x.resultado },
  ];
  const blocos: { titulo: string; dre: Dre | null }[] = [];
  for (const d of r.dre) {
    if (anterior != null) blocos.push({ titulo: `${d.produto} R${anterior}`, dre: d.anterior });
    blocos.push({ titulo: `${d.produto} R${r.rodada}`, dre: d.atual });
  }
  blocos.push({ titulo: `Empresa R${r.rodada}`, dre: r.dreEmpresa });
  const tamDre = blocos.length > 6 ? 8 : blocos.length > 4 ? 9 : 10;
  tabela(
    `Demonstração do resultado por produto, ${anterior != null ? `Rodadas ${anterior} e ${r.rodada}` : `Rodada ${r.rodada}`} (R$)`,
    [{ titulo: "Linha", largura: 150, alinhar: "left" }, ...blocos.map((b) => ({ titulo: b.titulo, largura: 62 }))],
    [
      ...colDre.map((c) => {
        const linha = [c.nome, ...blocos.map((b) => (b.dre ? num(c.d(b.dre)) : "–"))];
        return c.nome.startsWith("(=) Lucro antes") ? { destaque: linha } : linha;
      }),
      ["Margem (%)", ...blocos.map((b) => (b.dre ? num(b.dre.margem, 1) : "–"))],
    ],
    `Fonte: Simula+, resultados ${anterior != null ? `das Rodadas ${anterior} e ${r.rodada}` : `da Rodada ${r.rodada}`} (${ano}).` +
      r.produtosQueSairam.map((x) => ` Na Rodada ${anterior}, o ${x.produto} teve receita de ${reais(x.receitaBruta)} e lucro de ${reais(x.resultado)}.`).join(""),
    tamDre,
  );

  // =================== 8 Alinhamento ===================
  secao("8 Alinhamento estratégico");
  subsecao("8.1 O que é");
  paragrafo("Em cada rodada, a empresa recebe quatro análises do mercado (SWOT, 5 Forças, Matriz BCG e PESTEL) e faz a sua Segmentação. O alinhamento verifica se as decisões de cada produto (preço, comunicação e canais) combinam com o que essas análises mostram. Quando uma decisão vai na direção contrária do que a própria análise diz sobre o mercado, o simulador registra um alerta e tira pontos.");
  paragrafo("O alinhamento não mede se a empresa ganhou ou perdeu dinheiro. Uma empresa pode ter alinhamento alto e lucro baixo, ou o contrário. Ele pesa de duas formas: vale 10% da nota da rodada e muda a atratividade do produto para os consumidores, conforme a tabela a seguir.");
  const notasProd = r.alinhamento.map((a) => (a.nota == null ? null : Math.round(a.nota)));
  const faixas = [[90, 100, "1,20"], [75, 89, "1,10"], [60, 74, "1,03"], [40, 59, "0,92"], [20, 39, "0,80"], [1, 19, "0,65"], [0, 0, "0,50"]] as const;
  tabela(
    "Efeito da nota de alinhamento sobre a atratividade do produto",
    [{ titulo: "Nota de alinhamento do produto", largura: 120, alinhar: "left" }, ...faixas.map((f) => ({ titulo: f[0] === f[1] ? String(f[0]) : `${f[0]} a ${f[1]}`, largura: 40, alinhar: "center" as const }))],
    [["Atratividade multiplicada por", ...faixas.map((f) => f[2])]],
    `Fonte: Simula+, regra do alinhamento estratégico (Manual do Aluno, Apêndice E.4). Notas dos produtos da ${r.empresa} na Rodada ${r.rodada}: ` +
      r.alinhamento.map((a, i) => `${a.produto}, ${notasProd[i] ?? "–"}`).join("; ") + ".",
  );

  subsecao("8.2 Os alertas desta rodada");
  // agrupa alertas iguais entre produtos
  const grupos = new Map<string, { titulo: string; ferramenta: string; itens: { produto: string; analise: string; decisao: string; porque: string; efeito: number }[] }>();
  for (const a of r.alinhamento) {
    for (const al of a.alertas) {
      const k = al.ferramenta + "|" + al.titulo;
      if (!grupos.has(k)) grupos.set(k, { titulo: al.titulo, ferramenta: al.ferramenta, itens: [] });
      grupos.get(k)!.itens.push({ produto: a.produto, analise: al.analise, decisao: al.decisao, porque: al.porque, efeito: al.efeitoNaNota });
    }
  }
  const nProdutos = r.alinhamento.length;
  if (grupos.size === 0) {
    paragrafo("Nenhum produto recebeu alerta nesta rodada.");
  } else {
    const todosIguais = Array.from(grupos.values()).every((g) => g.itens.length === nProdutos);
    paragrafo(
      (todosIguais && nProdutos > 1
        ? `Os ${extenso(nProdutos).replace("uma", "um").replace("duas", "dois")} produtos receberam os mesmos ${grupos.size === 1 ? "alerta" : `${extenso(grupos.size).replace("uma", "um").replace("duas", "dois")} alertas`}. `
        : "") + "Cada alerta mostra o que a análise da rodada diz, o que a empresa decidiu e por que o simulador considera que as duas coisas não combinam.",
    );
    let k = 0;
    for (const g of Array.from(grupos.values())) {
      k++;
      espaco(110);
      const quais = g.itens.length === nProdutos && nProdutos > 1 ? "" : ` (${listaE(g.itens.map((i) => i.produto))})`;
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(COR.texto).text(t(`Alerta ${k}. ${g.titulo}${quais}`), M.left, doc.y, { width: W, lineGap: 4 });
      doc.moveDown(0.2);
      const junta = (campo: "analise" | "decisao" | "porque") => {
        const unicos = Array.from(new Set(g.itens.map((i) => i[campo])));
        return unicos.length === 1 ? unicos[0] : g.itens.map((i) => (i[campo].includes(i.produto) ? i[campo] : `${i.produto}: ${i[campo]}`)).join(" ");
      };
      rotulado("O que a análise diz:", junta("analise"));
      rotulado("O que a empresa decidiu:", junta("decisao"));
      rotulado("Por que não combina:", junta("porque"));
      const efeito = g.itens[0].efeito;
      rotulado("Quanto pesou:", `cerca de ${br(efeito, 1)} ${efeito === 1 ? "ponto" : "pontos"} a menos no alinhamento ${g.itens.length > 1 ? "de cada produto" : `do ${g.itens[0].produto}`}.`);
    }
  }
  // conta da nota de alinhamento, quando ela fecha com os alertas
  const contasFeitas = new Set<string>();
  for (const a of r.alinhamento) {
    if (a.nota == null) continue;
    const chave = Math.round(a.nota) + "|" + a.partes.map((p) => p.pontos).join(",");
    if (contasFeitas.has(chave)) continue;
    contasFeitas.add(chave);
    const mesmos = r.alinhamento.filter((b) => b.nota != null && Math.round(b.nota) + "|" + b.partes.map((p) => p.pontos).join(",") === chave);
    const sujeito = mesmos.length === r.alinhamento.length && mesmos.length > 1 ? "de cada produto" : `do ${listaE(mesmos.map((m) => m.produto))}`;
    const media = a.partes.reduce((s, p) => s + p.pontos, 0) / a.partes.length;
    const estimada = 30 + 0.7 * media;
    if (Math.round(estimada) !== Math.round(a.nota)) continue;
    const comAlerta = a.partes.filter((p) => p.pontos < 100);
    paragrafo(
      `Conta da nota de alinhamento ${sujeito}: 30 pontos por ter as análises preenchidas, mais 70 × a média das cinco partes.` +
        (comAlerta.length ? ` ${listaE(comAlerta.map((p) => `${p.ferramenta === "Matriz BCG" ? "a BCG" : p.ferramenta === "Segmentação" ? "a Segmentação" : p.ferramenta === "PESTEL" ? "a PESTEL" : p.ferramenta === "SWOT" ? "a SWOT" : "as 5 Forças"} ficou com ${br(p.pontos)}`))} e as demais com 100:` : " Todas as partes ficaram com 100:") +
        ` 30 + 70 × (${a.partes.map((p) => br(p.pontos)).join(" + ")}) ÷ 5 ÷ 100 = 30 + ${br(0.7 * media, 1)} = ${br(estimada, 1)}${Math.abs(estimada - Math.round(estimada)) > 0.001 ? `, arredondado para ${Math.round(estimada)}` : ""}. Cada ponto perdido numa parte vale ${br(PESO_PONTO_FERRAMENTA, 2)} ponto na nota de alinhamento. A regra de cada alerta e a teoria de origem estão no Manual do Aluno, Apêndice E.4.`,
    );
  }

  // =================== 9 Nota ===================
  if (r.nota) {
    secao("9 Nota da rodada");
    paragrafo("Cada indicador vira uma pontuação de 0 a 100 dentro da turma: a melhor equipe da rodada recebe 100, a pior recebe 0 e as demais ficam proporcionalmente entre elas. O alinhamento entra pelo próprio valor.");
    tabela(
      `Composição da nota da ${r.empresa} na Rodada ${r.rodada}`,
      [
        { titulo: "Indicador", largura: 104, alinhar: "left" },
        { titulo: r.empresa, largura: 58 },
        { titulo: "Menor da turma", largura: 56 },
        { titulo: "Maior da turma", largura: 56 },
        { titulo: "Pontos (0 a 100)", largura: 50 },
        { titulo: "Peso", largura: 34 },
        { titulo: "Contribuição", largura: 64 },
      ],
      [
        ...r.nota.itens.map((i) => [i.indicador, num(i.valor, i.casas), num(i.menor, i.casas), num(i.maior, i.casas), num(i.pontos, 1), `${br(i.peso * 100)}%`, num(i.contribuicao, 1)]),
        { destaque: ["Nota da rodada", "", "", "", "", "100%", num(r.nota.total, 1)] },
      ],
      `Fonte: Simula+, resultados da Rodada ${r.rodada} (${ano}). Pontos = (valor da equipe - menor da turma) ÷ (maior - menor) × 100.`,
    );
  }

  // =================== 10 Fórmulas ===================
  secao(`${r.nota ? 10 : 9} Como cada número foi calculado`, 200);
  if (r.formulas.length) {
    nQuadro++;
    espaco(120);
    tituloIlustracao(`Quadro ${nQuadro} – Fórmulas dos indicadores, com os números ${r.dre[0] ? `do ${r.dre[0].produto} ` : ""}na Rodada ${r.rodada}`);
    // quadro: bordas fechadas (ABNT)
    const cols = [{ w: 95 }, { w: W - 95 - 110 }, { w: 110 }];
    const pad = 4;
    const desenhaLinha = (cel: string[], negrito: boolean) => {
      doc.font(negrito ? "Helvetica-Bold" : "Helvetica").fontSize(10);
      const h = Math.max(...cel.map((c, i) => doc.heightOfString(t(c), { width: cols[i].w - 2 * pad }))) + 2 * pad;
      if (doc.y + h > yMax()) doc.addPage();
      const y0 = doc.y;
      let x = M.left;
      cel.forEach((c, i) => {
        doc.rect(x, y0, cols[i].w, h).lineWidth(0.5).strokeColor(COR.texto).stroke();
        doc.fillColor(COR.texto).text(t(c), x + pad, y0 + pad, { width: cols[i].w - 2 * pad });
        x += cols[i].w;
      });
      doc.y = y0 + h;
    };
    desenhaLinha(["Indicador", "Fórmula e conta", "Manual / fonte"], true);
    for (const f of r.formulas) desenhaLinha([f.indicador, f.conta, f.fonte], false);
    fonte(`Fonte: Manual do Aluno do Simula+, Apêndice A; Simula+, resultados da Rodada ${r.rodada} (${ano}).`);
  }

  // =================== Referências ===================
  espaco(140);
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(COR.texto).text("Referências", M.left, doc.y, { width: W, align: "center" });
  doc.moveDown(0.8);
  const refs: [string, string, string][] = [
    ["FARRIS, P. W.; BENDLE, N. T.; PFEIFER, P. E.; REIBSTEIN, D. J. ", "Marketing metrics", ": the manager's guide to measuring marketing performance. 3. ed. Upper Saddle River: Pearson, 2016."],
    ["KAPLAN, R. S.; NORTON, D. P. ", "The balanced scorecard", ": translating strategy into action. Boston: Harvard Business School Press, 1996."],
    ["KOTLER, P.; KELLER, K. L. ", "Administração de marketing", ". 15. ed. São Paulo: Pearson Education do Brasil, 2019."],
    ["REICHHELD, F. F. ", "A pergunta definitiva", ". Rio de Janeiro: Elsevier, 2006."],
  ];
  for (const [a, b, c] of refs) {
    doc.fontSize(12).fillColor(COR.texto);
    doc.font("Helvetica").text(t(a), M.left, doc.y, { width: W, continued: true, align: "left" });
    doc.font("Helvetica-Bold").text(t(b), { continued: true });
    doc.font("Helvetica").text(t(c), { width: W, align: "left" });
    doc.moveDown(1);
  }

  // =================== numeração (a partir da folha 2) ===================
  const faixa = doc.bufferedPageRange();
  for (let i = faixa.start; i < faixa.start + faixa.count; i++) {
    if (i === 0) continue;
    doc.switchToPage(i);
    const topo = doc.page.margins.top;
    doc.page.margins.top = 0;
    doc.font("Helvetica").fontSize(10).fillColor(COR.texto).text(String(i + 1), M.left, 2 * CM - 10, { width: W, align: "right", lineBreak: false });
    doc.page.margins.top = topo;
  }
  doc.end();
  return doc;
}
