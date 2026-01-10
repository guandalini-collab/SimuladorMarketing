import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatarNumeroBR, capturarNumeroPuro, sanitizarInputNumerico } from '@/lib/formatters';

interface FormattedMoneyInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
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
  disabled = false,
  placeholder = '0',
  testId,
  className = '',
}: FormattedMoneyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Atualiza display quando value prop mudar
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatarNumeroBR(value, 'moeda'));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Remove 'R$' e espaços para permitir digitação limpa
    const semSimbolos = input.replace(/R\$/g, '').trim();
    
    // Sanitiza o input
    const sanitizado = sanitizarInputNumerico(semSimbolos);
    
    // Captura o número puro
    const numero = capturarNumeroPuro(sanitizado);
    
    // Atualiza o estado interno com formatação parcial
    setDisplayValue(`R$ ${sanitizado}`);
    
    // Chama callback com número puro
    onChange(numero);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // No foco, mostra apenas o número sem formatação completa
    const numeroStr = value > 0 ? value.toString().replace('.', ',') : '';
    setDisplayValue(`R$ ${numeroStr}`);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Ao perder o foco, formata completamente
    setDisplayValue(formatarNumeroBR(value, 'moeda'));
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
