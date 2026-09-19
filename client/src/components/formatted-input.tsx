import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatarNumeroBR, capturarNumeroPuro, sanitizarInputNumerico, sanitizarDigitacaoMonetaria } from '@/lib/formatters';

/**
 * Depois de trocar o valor exibido (ex.: inserir um "." de milhar), devolve
 * o cursor para a posição "equivalente" no novo texto — contando quantos
 * dígitos/vírgula havia ANTES do cursor no texto antigo e posicionando o
 * cursor depois da mesma quantidade de dígitos/vírgula no texto novo.
 * Sem isso, o campo controlado joga o cursor para o final a cada tecla
 * assim que um "." de milhar passa a existir no meio do valor.
 */
function reposicionarCursorAposFormatacao(input: HTMLInputElement, textoAntigo: string, cursorAntigo: number, textoNovo: string) {
  const significativosAntes = (textoAntigo.slice(0, cursorAntigo).match(/[\d,]/g) || []).length;

  if (significativosAntes === 0) {
    // Cursor estava antes de qualquer dígito digitado — mantém logo antes
    // do primeiro dígito do novo texto (ex.: logo depois do prefixo "R$ ").
    const primeiroDigito = textoNovo.search(/[\d,]/);
    const posicao = primeiroDigito === -1 ? textoNovo.length : primeiroDigito;
    input.setSelectionRange(posicao, posicao);
    return;
  }

  let contagem = 0;
  let posicao = textoNovo.length;
  for (let i = 0; i < textoNovo.length; i++) {
    if (/[\d,]/.test(textoNovo[i])) {
      contagem++;
      if (contagem === significativosAntes) {
        posicao = i + 1;
        break;
      }
    }
  }
  input.setSelectionRange(posicao, posicao);
}

interface FormattedMoneyInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  testId?: string;
  className?: string;
}

/**
 * Input formatado para valores monetários no padrão brasileiro
 * Exibe R$ X.XXX,XX enquanto o usuário digita
 */
export function FormattedMoneyInput({
  id,
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = '0',
  testId,
  className = '',
}: FormattedMoneyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualiza display quando value prop mudar
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatarNumeroBR(value, 'moeda'));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const textoAntigo = inputEl.value;
    const cursorAntigo = inputEl.selectionStart ?? textoAntigo.length;

    // Remove 'R$' e espaços para permitir digitação limpa
    const semSimbolos = textoAntigo.replace(/R\$/g, '').trim();

    // Sanitiza o input (ponto digitado é ignorado — só a vírgula é decimal)
    const sanitizado = sanitizarDigitacaoMonetaria(semSimbolos);

    // Captura o número puro
    const numero = capturarNumeroPuro(sanitizado);

    // Auditoria (2026-09): antes, o valor digitado ficava sem separador de
    // milhar (e sem os centavos) até o campo perder o foco — para um
    // número grande, era difícil ler quantos zeros já tinha digitado (ex.:
    // "500" sem indicação nenhuma de que é R$ 500,00 e não R$ 5,00 ou R$
    // 50.000,00). Agora o valor é formatado como moeda completa (ponto de
    // milhar + vírgula de centavos) a cada tecla, igual ao que já aparecia
    // ao sair do campo — só o texto muda, o cursor é reposicionado para
    // continuar exatamente onde o professor estava digitando.
    //
    // Exceção: campo vazio (professor apagou tudo para digitar de novo) fica
    // só com "R$ " — se forçássemos "R$ 0,00" aqui, o próximo dígito digitado
    // se juntaria ao "0" já exibido (ex.: digitar "5" viraria "R$ 50,00" em
    // vez de "R$ 5,00").
    const textoNovo = sanitizado === '' ? 'R$ ' : formatarNumeroBR(numero, 'moeda');
    setDisplayValue(textoNovo);

    // Chama callback com número puro
    onChange(numero);

    // O React só aplica o novo value no input depois de re-renderizar —
    // reposiciona o cursor no próximo frame, já com o texto novo no DOM.
    requestAnimationFrame(() => {
      if (inputRef.current) {
        reposicionarCursorAposFormatacao(inputRef.current, textoAntigo, cursorAntigo, textoNovo);
      }
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Correção (2026-09): a versão anterior trocava o valor exibido ao
    // focar por uma versão SEM a vírgula de centavos (ex.: "R$ 100.000,00"
    // virava "R$ 100000"), fazendo o campo "esquecer" os centavos digitados
    // assim que o professor clicava nele de novo. Agora o valor completo
    // (com milhar E vírgula de centavos) permanece exibido ao focar — só
    // seleciona tudo, para digitar um valor novo já substituir o anterior
    // de uma vez (clicar para só posicionar o cursor continua funcionando).
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Ao perder o foco, formata completamente (com centavos)
    setDisplayValue(formatarNumeroBR(value, 'moeda'));
    onBlur?.();
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder ? `R$ ${placeholder}` : 'R$ 0'}
      className={`text-lg font-semibold ${className}`}
      data-testid={testId}
    />
  );
}

interface FormattedNumberInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
  testId?: string;
  className?: string;
  suffix?: string;
}

/**
 * Input formatado para quantidades no padrão brasileiro
 * Exibe X.XXX (com pontos de milhar)
 */
export function FormattedNumberInput({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = '0',
  testId,
  className = '',
  suffix = '',
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      const formatted = formatarNumeroBR(value, 'quantidade');
      setDisplayValue(suffix ? `${formatted}${suffix}` : formatted);
    }
  }, [value, isFocused, suffix]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Remove sufixo se existir
    const semSufixo = suffix ? input.replace(suffix, '') : input;
    
    // Sanitiza
    const sanitizado = sanitizarInputNumerico(semSufixo.trim());
    
    // Captura número puro
    const numero = capturarNumeroPuro(sanitizado);
    
    // Atualiza display
    setDisplayValue(suffix ? `${sanitizado}${suffix}` : sanitizado);
    
    // Callback
    onChange(numero);
  };

  const handleFocus = () => {
    setIsFocused(true);
    const numeroStr = value > 0 ? value.toString().replace('.', ',') : '';
    setDisplayValue(suffix ? `${numeroStr}${suffix}` : numeroStr);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const formatted = formatarNumeroBR(value, 'quantidade');
    setDisplayValue(suffix ? `${formatted}${suffix}` : formatted);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      data-testid={testId}
    />
  );
}
