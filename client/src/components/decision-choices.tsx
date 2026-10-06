import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Controles visuais da tela de Decisões (redesign de UX, etapa 2).
//
// Apenas apresentação: cada componente recebe e devolve exatamente os
// mesmos valores (strings) que os RadioGroup/Checkbox anteriores, e os
// elementos clicáveis continuam sendo os mesmos primitivos do Radix
// (role="radio" / role="checkbox"), com os mesmos data-testid. Nada do que
// é enviado ao servidor muda.

export interface ChoiceOption {
  value: string;
  label: string;
  description: string;
  testId: string;
  icon?: LucideIcon;
  // Posição ordinal (1..levelMax) para opções que formam uma escala,
  // como básico → médio → premium. Mostrada como barras de nível.
  level?: number;
}

function LevelBars({ level, max, active }: { level: number; max: number; active: boolean }) {
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "w-2 rounded-sm transition-colors",
            i < level
              ? active
                ? "bg-[#1447e6] dark:bg-blue-400"
                : "bg-slate-500 dark:bg-slate-400"
              : "bg-slate-300 dark:bg-slate-600",
          )}
          style={{ height: `${8 + i * 6}px` }}
        />
      ))}
    </span>
  );
}

interface ChoiceCardsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ChoiceOption[];
  disabled?: boolean;
  columns?: 2 | 3 | 4;
  ariaLabel: string;
}

const columnClass: Record<NonNullable<ChoiceCardsProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
};

// Escolha única em cards. Setas do teclado navegam entre as opções
// (comportamento padrão do RadioGroup do Radix).
export function ChoiceCards({ value, onValueChange, options, disabled, columns = 3, ariaLabel }: ChoiceCardsProps) {
  const levelMax = Math.max(0, ...options.map((o) => o.level ?? 0));

  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn("grid grid-cols-1 gap-3", columnClass[columns])}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            data-testid={option.testId}
            className={cn(
              "group relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1447e6] focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-[#1447e6] bg-[#1447e6]/[0.06] shadow-sm dark:border-blue-400 dark:bg-blue-500/10"
                : "border-slate-200 bg-background hover:border-slate-300 hover:bg-muted/40 dark:border-slate-800 dark:hover:border-slate-700",
            )}
          >
            <span className="flex w-full items-center justify-between">
              {Icon ? (
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    selected ? "bg-[#1447e6] text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
              ) : option.level && levelMax > 0 ? (
                <LevelBars level={option.level} max={levelMax} active={selected} />
              ) : (
                <span />
              )}
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                  selected
                    ? "scale-100 border-[#1447e6] bg-[#1447e6] text-white dark:border-blue-400 dark:bg-blue-500"
                    : "scale-90 border-slate-300 text-transparent dark:border-slate-600",
                )}
                aria-hidden="true"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            </span>
            <span>
              <span className="block font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{option.description}</span>
            </span>
            {Icon && option.level && levelMax > 0 && (
              <LevelBars level={option.level} max={levelMax} active={selected} />
            )}
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}

interface ScaleSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ChoiceOption[];
  disabled?: boolean;
  ariaLabel: string;
}

// Escolha única numa escala ordenada (ex.: cobertura local → internacional),
// desenhada como uma trilha: as etapas até a escolhida ficam preenchidas.
export function ScaleSelector({ value, onValueChange, options, disabled, ariaLabel }: ScaleSelectorProps) {
  const selectedIndex = options.findIndex((o) => o.value === value);
  const fill = selectedIndex <= 0 ? 0 : (selectedIndex / (options.length - 1)) * 100;
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  return (
    <div className="space-y-4">
      <RadioGroupPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {/* Trilha: vai do centro da primeira etapa ao centro da última. */}
        <span
          className="pointer-events-none absolute top-5 sm:top-6 h-1 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700"
          style={{ left: `${50 / options.length}%`, right: `${50 / options.length}%` }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full bg-[#1447e6] transition-[width] duration-300 dark:bg-blue-400"
            style={{ width: `${fill}%` }}
          />
        </span>
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          const reached = selectedIndex >= 0 && index <= selectedIndex;
          const Icon = option.icon;
          return (
            <RadioGroupPrimitive.Item
              key={option.value}
              value={option.value}
              data-testid={option.testId}
              className={cn(
                "group relative z-10 flex flex-col items-center gap-2 rounded-lg px-1 pb-1 text-center",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1447e6] focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isSelected
                    ? "scale-110 border-[#1447e6] bg-[#1447e6] text-white shadow-md dark:border-blue-400 dark:bg-blue-500"
                    : reached
                      ? "border-[#1447e6] bg-background text-[#1447e6] dark:border-blue-400 dark:text-blue-300"
                      : "border-slate-300 bg-background text-muted-foreground group-hover:border-slate-400 dark:border-slate-600",
                )}
              >
                {Icon ? <Icon className="h-5 w-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
              </span>
              <span lang="pt-BR" className={cn("text-xs sm:text-sm leading-tight hyphens-auto", isSelected ? "font-semibold" : "text-muted-foreground")}>
                {option.label}
              </span>
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>
      {selected && (
        <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm" aria-live="polite">
          <span className="font-semibold">{selected.label}:</span> {selected.description}
        </p>
      )}
    </div>
  );
}

interface ToggleTilesProps {
  values: string[];
  onToggle: (value: string) => void;
  options: ChoiceOption[];
  disabled?: boolean;
  ariaLabel: string;
}

// Seleção múltipla em blocos de liga/desliga (substitui a lista de checkboxes).
export function ToggleTiles({ values, onToggle, options, disabled, ariaLabel }: ToggleTilesProps) {
  return (
    <div role="group" aria-label={ariaLabel} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const checked = values.includes(option.value);
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onToggle(option.value)}
            data-testid={option.testId}
            data-state={checked ? "checked" : "unchecked"}
            className={cn(
              "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1447e6] focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
              checked
                ? "border-[#1447e6] bg-[#1447e6]/[0.06] dark:border-blue-400 dark:bg-blue-500/10"
                : "border-slate-200 bg-background hover:border-slate-300 hover:bg-muted/40 dark:border-slate-800 dark:hover:border-slate-700",
            )}
          >
            {Icon && (
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  checked ? "bg-[#1447e6] text-white" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{option.label}</span>
              <span className="block text-sm text-muted-foreground">{option.description}</span>
            </span>
            <span
              className={cn(
                "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                checked ? "bg-[#1447e6] dark:bg-blue-500" : "bg-slate-300 dark:bg-slate-600",
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150",
                  checked ? "translate-x-5" : "translate-x-1",
                )}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
