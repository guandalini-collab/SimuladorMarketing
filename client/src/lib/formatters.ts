/**
 * Utilitários para formatação de números no padrão brasileiro
 */

export type FormatType = 'moeda' | 'quantidade' | 'porcentagem';

/**
 * Formata um número no padrão brasileiro
 * @param valor - Número a ser formatado
 * @param tipo - Tipo de formatação (moeda, quantidade, porcentagem)
 * @returns String formatada no padrão brasileiro
 * 
 * @example
 * formatarNumeroBR(1000000, 'moeda') // "R$ 1.000.000"
 * formatarNumeroBR(1000000.50, 'moeda') // "R$ 1.000.000,50"
 * formatarNumeroBR("1.234,56", 'moeda') // "R$ 1.234,56" (normaliza string PT-BR)
 * formatarNumeroBR(1500, 'quantidade') // "1.500"
 * formatarNumeroBR(15.5, 'porcentagem') // "15,5%"
 */
export function formatarNumeroBR(valor: number | string | null | undefined, tipo: FormatType = 'quantidade'): string {
  if (valor === null || valor === undefined || valor === '') {
    return '';
  }

  // Normaliza strings antes de converter para número
  let numero: number;
  if (typeof valor === 'string') {
    numero = capturarNumeroPuro(valor);
  } else {
    numero = valor;
  }
  
  if (isNaN(numero)) {
    return '';
  }

  // Determina se deve mostrar centavos
  const temCentavos = numero % 1 !== 0;

  switch (tipo) {
    case 'moeda':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: temCentavos ? 2 : 0,
        maximumFractionDigits: temCentavos ? 2 : 0,
      }).format(numero);

    case 'porcentagem':
      return new Intl.NumberFormat('pt-BR', {
        style: 'decimal',
        minimumFractionDigits: temCentavos ? 1 : 0,
        maximumFractionDigits: temCentavos ? 2 : 0,
      }).format(numero) + '%';

    case 'quantidade':
    default:
      return new Intl.NumberFormat('pt-BR', {
        style: 'decimal',
        minimumFractionDigits: temCentavos ? 1 : 0,
        maximumFractionDigits: temCentavos ? 2 : 0,
      }).format(numero);
  }
}

/**
 * Captura o número puro de uma string formatada
 * Remove pontos, vírgulas e símbolos monetários
 * @param valorFormatado - String formatada no padrão brasileiro
 * @returns Número puro
 * 
 * @example
 * capturarNumeroPuro("R$ 1.000.000") // 1000000
 * capturarNumeroPuro("1.000.000,50") // 1000000.50
 * capturarNumeroPuro("15,5%") // 15.5
 */
export function capturarNumeroPuro(valorFormatado: string): number {
  if (!valorFormatado || typeof valorFormatado !== 'string') {
    return 0;
  }

  // Remove símbolos monetários, %, espaços
  let limpo = valorFormatado
    .replace(/R\$/g, '')
    .replace(/%/g, '')
    .trim();

  // Remove pontos de milhar
  limpo = limpo.replace(/\./g, '');

  // Substitui vírgula decimal por ponto
  limpo = limpo.replace(/,/g, '.');

  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : numero;
}

/**
 * Valida e sanitiza input numérico enquanto o usuário digita
 * Permite apenas números e um único separador decimal (vírgula ou ponto)
 * Trata corretamente valores PT-BR formatados (ex: 1.234,56)
 * @param valor - String digitada pelo usuário
 * @returns String sanitizada no padrão brasileiro
 * 
 * @example
 * sanitizarInputNumerico("1234") // "1234"
 * sanitizarInputNumerico("12.5") // "12,5" (decimal - 1 dígito após ponto)
 * sanitizarInputNumerico("12.50") // "12,50" (decimal - 2 dígitos após ponto)
 * sanitizarInputNumerico("12,5") // "12,5"
 * sanitizarInputNumerico("1.234,56") // "1234,56" (remove pontos de milhar)
 * sanitizarInputNumerico("12.500") // "12500" (milhar - 3 dígitos após ponto)
 * sanitizarInputNumerico("1.234.567") // "1234567" (múltiplos pontos = milhares)
 * sanitizarInputNumerico("abc123") // "123" (remove letras)
 */
export function sanitizarInputNumerico(valor: string): string {
  if (!valor) return '';
  
  // Remove tudo exceto números, vírgula e ponto
  let limpo = valor.replace(/[^\d,.]/g, '');
  
  const temVirgula = limpo.includes(',');
  const temPonto = limpo.includes('.');
  const numVirgulas = (limpo.match(/,/g) || []).length;
  const numPontos = (limpo.match(/\./g) || []).length;
  
  // Caso 1: Tem AMBOS vírgula e ponto → Determinar se é PT-BR ou US
  if (temVirgula && temPonto) {
    // Encontra o último separador para determinar o formato
    const ultimoVirgulaIndex = limpo.lastIndexOf(',');
    const ultimoPontoIndex = limpo.lastIndexOf('.');
    
    if (ultimoVirgulaIndex > ultimoPontoIndex) {
      // PT-BR: vírgula vem depois (1.234,56)
      // Remove todos os pontos (milhares), mantém vírgula (decimal)
      limpo = limpo.replace(/\./g, '');
      const partes = limpo.split(',');
      if (partes.length > 2) {
        limpo = partes[0] + ',' + partes.slice(1).join('');
      }
    } else {
      // US: ponto vem depois (1,234.56)
      // Remove todas as vírgulas (milhares), mantém ponto e converte para vírgula
      limpo = limpo.replace(/,/g, '');
      limpo = limpo.replace(/\./g, ',');
    }
  }
  // Caso 2: Tem MÚLTIPLAS vírgulas → Formato US (1,234,567)
  else if (numVirgulas > 1) {
    // Remove todas as vírgulas (milhares)
    limpo = limpo.replace(/,/g, '');
  }
  // Caso 3: Tem UMA vírgula (sem pontos) → Decimal PT-BR (12,5)
  else if (temVirgula && !temPonto) {
    // Já está correto, apenas garante uma vírgula
    const partes = limpo.split(',');
    if (partes.length > 2) {
      limpo = partes[0] + ',' + partes.slice(1).join('');
    }
  }
  // Caso 4: Tem MÚLTIPLOS pontos (sem vírgulas) → Milhares (1.234.567)
  else if (numPontos > 1) {
    // Remove todos os pontos
    limpo = limpo.replace(/\./g, '');
  }
  // Caso 5: Tem UM ponto (sem vírgulas) → Aplicar heurística refinada
  else if (temPonto && !temVirgula) {
    const partesPonto = limpo.split('.');
    const digitosAntesPonto = partesPonto[0]?.length || 0;
    const digitosAposPonto = partesPonto[1]?.length || 0;
    
    // Heurística refinada para diferenciar decimal de milhar:
    // - Se tem 4+ dígitos ANTES do ponto → é separador de milhar (1234.567)
    // - Se tem ≤3 dígitos antes do ponto E 3 dígitos depois → pode ser ambíguo
    //   - Se todos os 3 dígitos após são zeros → milhar (12.000)
    //   - Caso contrário → decimal (12.345, 0.125)
    // - Se tem 1-2 dígitos depois → decimal (12.5, 12.50)
    
    if (digitosAntesPonto >= 4) {
      // 1234.567 → milhar
      limpo = limpo.replace(/\./g, '');
    } else if (digitosAposPonto === 3) {
      // Caso especial: 3 dígitos após o ponto
      // Contexto: Sistema de valores monetários brasileiros
      // Heurística: Se tem 2+ dígitos ANTES, trata como milhar
      //             Se tem 0-1 dígito ANTES, trata como decimal
      if (digitosAntesPonto >= 2) {
        // 12.500, 99.999 → milhar (valores monetários)
        limpo = limpo.replace(/\./g, '');
      } else {
        // 0.125, 1.234 → decimal (percentuais, taxas)
        limpo = limpo.replace(/\./g, ',');
      }
    } else {
      // 1-2 dígitos ou >3 dígitos → decimal
      limpo = limpo.replace(/\./g, ',');
    }
  }
  // Caso 6: Apenas números (sem separadores) → Mantém como está
  
  return limpo;
}
