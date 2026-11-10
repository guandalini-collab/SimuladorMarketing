/**
 * Marcas reais por categoria (nov/2026, correções da Rodada 3) — só exibição.
 *
 * REGRA OBRIGATÓRIA DO PROFESSOR (09/11/2026): sobre marcas reais, não
 * inventar, não alucinar, não agradar. Cada número tem fonte, data e
 * critério. O que não tem fonte aberta fica como lacuna (null), sem
 * estimativa. Pesquisa feita em 10/11/2026; revisar antes de cada semestre.
 *
 * Tipos de dado:
 * - vendasBrasil: participação nas remessas/vendas no Brasil (fonte de mercado).
 * - usoBrasil: participação nos ACESSOS À INTERNET feitos por aparelhos da
 *   marca no Brasil (StatCounter). Mede aparelhos em uso, não vendas.
 * - mundial: participação no mercado mundial (remessas).
 * Estes números NÃO entram no cálculo do jogo (o motor é o mesmo de antes).
 */

export interface DadoComFonte {
  valor: number;
  fonte: string;
  periodo: string;
  criterio: string;
}

export interface MarcaReal {
  nome: string;
  vendasBrasil: DadoComFonte | null;
  usoBrasil: DadoComFonte | null;
  mundial: DadoComFonte | null;
  /** Fatos com fonte sobre a presença da marca no Brasil. */
  observacao?: string;
}

export interface ConcorrenciaDaCategoria {
  marcas: MarcaReal[];
  /** Concorrentes indiretos: produtos substitutos. */
  substitutos: string[];
  /** Novos entrantes no Brasil, com fonte; vazio quando não há registro em fonte aberta. */
  novosEntrantes: { nome: string; fonte: string }[];
  /** Avisos sobre lacunas de dados. */
  lacunas: string[];
  /** Fontes usadas (para a lista de referências da tela). */
  fontes: string[];
}

const OMDIA_BR_2025 = (valor: number): DadoComFonte => ({ valor, fonte: "Omdia (via MacMagazine, 17/02/2026)", periodo: "ano de 2025", criterio: "remessas de smartphones no Brasil" });
const STATCOUNTER_CEL = (valor: number): DadoComFonte => ({ valor, fonte: "StatCounter Global Stats", periodo: "outubro de 2026", criterio: "acessos à internet por celulares no Brasil (aparelhos em uso, não vendas)" });
const STATCOUNTER_TAB = (valor: number): DadoComFonte => ({ valor, fonte: "StatCounter Global Stats", periodo: "setembro de 2026", criterio: "acessos à internet por tablets no Brasil (aparelhos em uso, não vendas)" });
const OMDIA_TAB_MUNDO = (valor: number): DadoComFonte => ({ valor, fonte: "Omdia (via Mobile Time, 04/02/2026)", periodo: "ano de 2025", criterio: "remessas mundiais de tablets" });
const COUNTERPOINT_WATCH = (valor: number): DadoComFonte => ({ valor, fonte: "Counterpoint Research (via 9to5Mac, 26/02/2026)", periodo: "ano de 2025", criterio: "remessas mundiais de smartwatches" });

const LACUNA_BR = "A participação de cada marca nas vendas no Brasil é publicada apenas em relatórios pagos (IDC, Counterpoint, Omdia, GfK/NielsenIQ, Statista); onde não há fonte aberta, a tela mostra \"não divulgado\".";

export const CONCORRENCIA_ELETRONICOS: Record<string, ConcorrenciaDaCategoria> = {
  smartphone: {
    marcas: [
      { nome: "Samsung", vendasBrasil: OMDIA_BR_2025(40), usoBrasil: STATCOUNTER_CEL(31.68), mundial: null },
      { nome: "Motorola", vendasBrasil: OMDIA_BR_2025(24), usoBrasil: STATCOUNTER_CEL(16.18), mundial: null },
      { nome: "Xiaomi", vendasBrasil: OMDIA_BR_2025(16), usoBrasil: STATCOUNTER_CEL(15.88), mundial: null },
      { nome: "Apple", vendasBrasil: OMDIA_BR_2025(7), usoBrasil: STATCOUNTER_CEL(26.23), mundial: null },
      { nome: "Oppo", vendasBrasil: null, usoBrasil: STATCOUNTER_CEL(1.33), mundial: null, observacao: "Vendida oficialmente no Brasil (Canaltech, 05/07/2025)." },
      { nome: "realme", vendasBrasil: null, usoBrasil: null, mundial: null, observacao: "Vendida oficialmente no Brasil (Canaltech, 05/07/2025)." },
      { nome: "Honor", vendasBrasil: null, usoBrasil: null, mundial: null, observacao: "Chegou oficialmente ao Brasil em 2025 (Tecnoblog; Omdia)." },
      { nome: "Jovi (vivo)", vendasBrasil: null, usoBrasil: null, mundial: null, observacao: "Marca da vivo no Brasil, com produção local desde 2025 (Canaltech; Mobile Time)." },
      { nome: "Infinix", vendasBrasil: null, usoBrasil: null, mundial: null, observacao: "Produzida no Brasil em parceria com a Positivo (Tecnoblog); entre as cinco maiores no 1º semestre de 2026, segundo a Counterpoint citada pela Mobile Time (18/09/2026), sem percentual divulgado." },
      { nome: "Positivo", vendasBrasil: null, usoBrasil: null, mundial: null, observacao: "Linha Twist de celulares de entrada (Canaltech)." },
    ],
    substitutos: ["Tablet com chip de celular", "Celular básico (sem sistema de aplicativos)"],
    novosEntrantes: [
      { nome: "Honor", fonte: "Omdia, mercado de smartphones da América Latina em 2025 (via Mobility India, 25/02/2026)" },
      { nome: "Oppo", fonte: "Omdia, mercado de smartphones da América Latina em 2025 (via Mobility India, 25/02/2026)" },
      { nome: "Jovi (vivo)", fonte: "Omdia, mercado de smartphones da América Latina em 2025 (via Mobility India, 25/02/2026)" },
    ],
    lacunas: [LACUNA_BR, "Unidades vendidas por marca no Brasil não são divulgadas em fonte aberta."],
    fontes: [
      "MACMAGAZINE. Apple ficou com 7% do mercado de smartphones no Brasil em 2025. 17 fev. 2026. Disponível em: https://macmagazine.com.br/post/2026/02/17/apple-ficou-com-7-do-mercado-de-smartphones-no-brasil-em-2025/. Acesso em: 10 nov. 2026.",
      "STATCOUNTER. Mobile vendor market share Brazil. Disponível em: https://gs.statcounter.com/vendor-market-share/mobile/brazil. Acesso em: 10 nov. 2026.",
      "CANALTECH. Quais celulares chineses você pode comprar legalmente no Brasil com garantia. 5 jul. 2025. Acesso em: 10 nov. 2026.",
      "MOBILITY INDIA. Latin America's smartphone market hits record 140.5 million units in 2025 (Omdia). 25 fev. 2026. Acesso em: 10 nov. 2026.",
      "MOBILE TIME. Smartphones no Brasil no 1º semestre de 2026 (Counterpoint). 18 set. 2026. Acesso em: 10 nov. 2026.",
    ],
  },
  notebook: {
    marcas: ["Lenovo", "Dell", "HP", "Positivo", "Samsung", "Acer", "Asus", "Apple", "Vaio", "Multilaser", "Avell"].map((nome) => ({
      nome,
      vendasBrasil: null,
      usoBrasil: null,
      mundial: null,
      observacao: nome === "Lenovo" ? "Citada como líder em computadores no Brasil (Bloomberg Línea), sem percentual divulgado." : undefined,
    })),
    substitutos: ["Computador de mesa (desktop)", "Tablet com teclado", "Chromebook"],
    novosEntrantes: [],
    lacunas: [LACUNA_BR, "Não há dado aberto de uso por marca para notebooks.", "A LG saiu do mercado de notebooks no Brasil (Tecnoblog) e não aparece na lista."],
    fontes: [
      "QUE NOTEBOOK COMPRAR. Melhores marcas de notebook vendidas oficialmente no Brasil. Atualizado em 20 ago. 2026. Acesso em: 10 nov. 2026.",
      "BLOOMBERG LÍNEA. Para descolar do mercado, Lenovo aposta em IA, empresas e serviços no Brasil. Acesso em: 10 nov. 2026.",
      "TECNOBLOG. LG abandona de vez o mercado de notebooks no Brasil. Acesso em: 10 nov. 2026.",
    ],
  },
  tablet: {
    marcas: [
      { nome: "Samsung", vendasBrasil: null, usoBrasil: STATCOUNTER_TAB(67.64), mundial: OMDIA_TAB_MUNDO(15) },
      { nome: "Apple", vendasBrasil: null, usoBrasil: STATCOUNTER_TAB(18.11), mundial: null, observacao: "Líder mundial em 2025 (45% no 4º trimestre, Omdia); a participação do ano inteiro não foi informada na fonte." },
      { nome: "Xiaomi", vendasBrasil: null, usoBrasil: STATCOUNTER_TAB(4.26), mundial: OMDIA_TAB_MUNDO(6) },
      { nome: "Lenovo", vendasBrasil: null, usoBrasil: STATCOUNTER_TAB(3.22), mundial: OMDIA_TAB_MUNDO(9) },
      { nome: "Vaio", vendasBrasil: null, usoBrasil: STATCOUNTER_TAB(1.94), mundial: null, observacao: "Tablet lançado no Brasil em parceria com a Positivo (Olhar Digital, 06/08/2025)." },
      { nome: "Positivo", vendasBrasil: null, usoBrasil: null, mundial: null, observacao: "Linha de tablets Positivo Tab (Tecnoblog)." },
    ],
    substitutos: ["Notebook", "Smartphone de tela grande", "Leitor digital (e-reader)"],
    novosEntrantes: [],
    lacunas: [LACUNA_BR, "Huawei aparece no ranking mundial (7% em 2025, Omdia), mas não foi confirmada a venda oficial de tablets Huawei no Brasil."],
    fontes: [
      "STATCOUNTER. Tablet vendor market share Brazil. Disponível em: https://gs.statcounter.com/vendor-market-share/tablet/brazil. Acesso em: 10 nov. 2026.",
      "MOBILE TIME. Tablets têm alta nas vendas em 2025 com Apple na ponta (Omdia). 4 fev. 2026. Acesso em: 10 nov. 2026.",
      "OLHAR DIGITAL. VAIO lança tablet premium no Brasil em parceria com a Positivo. 6 ago. 2025. Acesso em: 10 nov. 2026.",
    ],
  },
  smartwatch: {
    marcas: [
      { nome: "Apple", vendasBrasil: null, usoBrasil: null, mundial: COUNTERPOINT_WATCH(23) },
      { nome: "Huawei", vendasBrasil: null, usoBrasil: null, mundial: COUNTERPOINT_WATCH(17), observacao: "Lançou o Watch GT 7 no Brasil (Tecnoblog)." },
      { nome: "Xiaomi", vendasBrasil: null, usoBrasil: null, mundial: COUNTERPOINT_WATCH(9) },
      { nome: "Samsung", vendasBrasil: null, usoBrasil: null, mundial: COUNTERPOINT_WATCH(7) },
      { nome: "Amazfit", vendasBrasil: null, usoBrasil: null, mundial: null, observacao: "Loja oficial no Brasil (Mercado Livre)." },
      { nome: "Garmin", vendasBrasil: null, usoBrasil: null, mundial: null, observacao: "Loja oficial no Brasil (Mercado Livre, segundo TecMundo)." },
    ],
    substitutos: ["Pulseira inteligente (smartband)", "Relógio tradicional"],
    novosEntrantes: [],
    lacunas: [LACUNA_BR, "Não há dado aberto de uso por marca para smartwatches.", "Imoo tem 7% do mercado mundial em 2025 (Counterpoint), mas não foi confirmada a venda oficial no Brasil."],
    fontes: [
      "9TO5MAC. Nearly one in four smartwatches shipped in 2025 was an Apple Watch (Counterpoint). 26 fev. 2026. Acesso em: 10 nov. 2026.",
      "TECNOBLOG. Huawei lança Watch GT 7 e mais aparelhos no Brasil. Acesso em: 10 nov. 2026.",
    ],
  },
};

export function concorrenciaDaCategoria(setorId: string | undefined, categoriaId: string | undefined): ConcorrenciaDaCategoria | null {
  if (setorId !== "eletronicos" || !categoriaId) return null;
  return CONCORRENCIA_ELETRONICOS[categoriaId] ?? null;
}
