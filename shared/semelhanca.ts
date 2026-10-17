/**
 * Semelhança entre textos (out/2026), usada no relatório de semelhança que
 * só o professor vê. Mede quanto das palavras de dois textos coincide
 * (coeficiente de Dice sobre os conjuntos de palavras significativas, de 0 a
 * 100). É um indício para o professor olhar mais de perto — não prova cópia
 * e não detecta textos produzidos com ferramentas externas.
 */
const PALAVRAS_VAZIAS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas", "um", "uma", "uns", "umas",
  "para", "por", "com", "sem", "que", "se", "ao", "aos", "ou", "como", "mais", "menos", "sua", "seu", "suas", "seus",
  "entre", "ate", "sobre", "pelo", "pela", "pelos", "pelas", "este", "esta", "esse", "essa", "isso", "isto", "ja", "nao",
]);

export function palavrasSignificativas(texto: string): Set<string> {
  const limpo = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  return new Set(limpo.split(/\s+/).filter((p) => p.length >= 3 && !PALAVRAS_VAZIAS.has(p)));
}

/** Semelhança de 0 a 100 entre dois textos. Textos vazios dão 0. */
export function semelhancaTextual(a: string, b: string): number {
  const A = palavrasSignificativas(a);
  const B = palavrasSignificativas(b);
  if (A.size === 0 || B.size === 0) return 0;
  let comuns = 0;
  A.forEach((p) => { if (B.has(p)) comuns++; });
  return Math.round(((2 * comuns) / (A.size + B.size)) * 100);
}

/** Faixas exibidas no relatório. */
export function faixaDeSemelhanca(valor: number): "alta" | "media" | "baixa" {
  if (valor >= 70) return "alta";
  if (valor >= 40) return "media";
  return "baixa";
}
