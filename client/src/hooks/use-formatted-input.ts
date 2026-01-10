import { useState, useCallback, useEffect } from 'react';
import { formatarNumeroBR, capturarNumeroPuro, sanitizarInputNumerico, FormatType } from '@/lib/formatters';

interface UseFormattedInputProps {
  initialValue?: number;
  tipo?: FormatType;
  onChange?: (value: number) => void;
}

interface UseFormattedInputReturn {
  displayValue: string;
  numericValue: number;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  setValue: (value: number) => void;
}

/**
 * Hook customizado para gerenciar inputs formatados no padrão brasileiro
 * 
 * @example
 * const { displayValue, numericValue, handleChange, handleBlur } = useFormattedInput({
 *   initialValue: 1000,
 *   tipo: 'moeda',
 *   onChange: (value) => console.log('Novo valor:', value)
 * });
 * 
 * <Input
 *   value={displayValue}
 *   onChange={handleChange}
 *   onBlur={handleBlur}
 * />
 */
export function useFormattedInput({
  initialValue = 0,
  tipo = 'quantidade',
  onChange,
}: UseFormattedInputProps): UseFormattedInputReturn {
  const [numericValue, setNumericValue] = useState<number>(initialValue);
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Atualiza display quando valor inicial mudar
  useEffect(() => {
    if (!isEditing) {
      setNumericValue(initialValue);
      setDisplayValue(formatarNumeroBR(initialValue, tipo));
    }
  }, [initialValue, tipo, isEditing]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    const input = e.target.value;
    
    // Sanitiza o input (remove caracteres inválidos)
    const sanitizado = sanitizarInputNumerico(input);
    
    // Atualiza o display com o valor sanitizado
    setDisplayValue(sanitizado);
    
    // Captura o número puro
    const numero = capturarNumeroPuro(sanitizado);
    setNumericValue(numero);
    
    // Chama callback se fornecido
    if (onChange) {
      onChange(numero);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Ao perder o foco, formata completamente o valor
    const formatado = formatarNumeroBR(numericValue, tipo);
    setDisplayValue(formatado);
  }, [numericValue, tipo]);

  const setValue = useCallback((value: number) => {
    setNumericValue(value);
    setDisplayValue(formatarNumeroBR(value, tipo));
  }, [tipo]);

  return {
    displayValue,
    numericValue,
    handleChange,
    handleBlur,
    setValue,
  };
}
