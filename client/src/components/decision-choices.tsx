import { useEffect, useState } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SliderPrimitive from "@radix-ui/react-slider";
import type { LucideIcon } from "lucide-react";
import { Check, AlertCircle, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarNumeroBR } from "@/lib/formatters";
import { FormattedMoneyInput } from "@/components/formatted-input";

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

// ---------------------------------------------------------------------------
// Etapa 3 — Preço e Promoção
// ---------------------------------------------------------------------------

const moeda = (v: number) => formatarNumeroBR(v || 0, "moeda");

// Arredonda para cima até um número "redondo" (1, 2, 2,5 ou 5 × 10^n),
// para o fim da escala do slider não ficar num valor quebrado.
function niceCeil(v: number): number {
  if (v <= 0) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * mag >= v) return m * mag;
  }
  return 10 * mag;
}

function niceStep(max: number): number {
  const raw = max / 400;
  if (raw <= 0.01) return 0.01;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 5, 10]) {
    if (m * mag >= raw) return m * mag;
  }
  return 10 * mag;
}

// Faixas de posicionamento relativas ao preço médio da categoria do produto
// (mesma informação de referência que a tela já exibia). Só rótulo visual.
export function priceBand(price: number, reference?: number): { label: string; tone: string } {
  if (!reference || reference <= 0) {
    return price < 50
      ? { label: "econômica", tone: "text-[#0f7a44]" }
      : price < 100
        ? { label: "média", tone: "text-[#1447e6]" }
        : { label: "premium", tone: "text-[#7c3aed]" };
  }
  const r = price / reference;
  if (r < 0.85) return { label: "econômica", tone: "text-[#0f7a44]" };
  if (r <= 1.15) return { label: "de mercado", tone: "text-[#1447e6]" };
  return { label: "premium", tone: "text-[#7c3aed]" };
}

interface PriceSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  reference?: number;
  inputId?: string;
}

// Preço: slider para ajuste rápido + campo de digitação para o valor exato.
// O valor gravado é o mesmo número (priceValue) de antes; o slider só
// oferece outra forma de escolhê-lo e nunca limita o que pode ser digitado.
export function PriceSlider({ value, onChange, disabled, reference, inputId }: PriceSliderProps) {
  const base = Math.max((reference ?? 0) * 2.5, (value || 0) * 1.25, 100);
  const [max, setMax] = useState(() => niceCeil(base));

  // A escala só cresce quando um valor digitado passa do fim dela (ou a
  // referência muda); nunca durante o arraste, para o polegar não "fugir".
  useEffect(() => {
    if (value > max || (reference && reference * 2.5 > max)) {
      setMax(niceCeil(Math.max((reference ?? 0) * 2.5, value * 1.25, 100)));
    }
  }, [value, reference]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = niceStep(max);
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100));
  const band = priceBand(value, reference);
  const diff = reference ? ((value - reference) / reference) * 100 : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Preço unitário</p>
          <p className="text-3xl font-bold tabular-nums" data-testid="text-price-value">{moeda(value)}</p>
          <p className="mt-1 text-sm">
            Faixa <span className={cn("font-semibold", band.tone)}>{band.label}</span>
            {diff !== null && (
              <span className="text-muted-foreground">
                {" "}({diff >= 0 ? "+" : ""}{diff.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% em relação à média da categoria)
              </span>
            )}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium">Valor exato</label>
          <FormattedMoneyInput id={inputId} value={value} onChange={onChange} disabled={disabled} placeholder="50" testId="input-price" />
        </div>
      </div>

      <div className="pt-2">
        <div className="relative">
          {/* Faixas de referência sob o trilho (só quando há preço médio). */}
          {reference ? (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full" aria-hidden="true">
              <div className="absolute inset-y-0 bg-emerald-300/80 dark:bg-emerald-800/70" style={{ left: 0, width: `${pct(reference * 0.85)}%` }} />
              <div className="absolute inset-y-0 bg-blue-300/80 dark:bg-blue-800/70" style={{ left: `${pct(reference * 0.85)}%`, width: `${pct(reference * 1.15) - pct(reference * 0.85)}%` }} />
              <div className="absolute inset-y-0 bg-violet-300/80 dark:bg-violet-800/70" style={{ left: `${pct(reference * 1.15)}%`, right: 0 }} />
            </div>
          ) : null}
          <SliderPrimitive.Root
            value={[Math.min(value || 0, max)]}
            min={0}
            max={max}
            step={step}
            disabled={disabled}
            onValueChange={([v]) => onChange(Math.round(v * 100) / 100)}
            aria-label="Preço unitário"
            data-testid="slider-price"
            className="relative flex h-6 w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className={cn("relative h-2 w-full grow overflow-hidden rounded-full", reference ? "bg-transparent" : "bg-slate-200 dark:bg-slate-700")}>
              <SliderPrimitive.Range className={cn("absolute h-full", reference ? "bg-transparent" : "bg-[#1447e6]/30")} />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-[3px] border-[#1447e6] bg-white shadow-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1447e6] focus-visible:ring-offset-2 active:scale-110 disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
          {reference ? (
            <div className="pointer-events-none absolute top-0 -translate-x-1/2" style={{ left: `${pct(reference)}%` }} aria-hidden="true">
              <div className="mx-auto h-6 w-0.5 bg-slate-500 dark:bg-slate-400" />
              <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">Média {moeda(reference)}</p>
            </div>
          ) : null}
        </div>
        <div className={cn("flex justify-between text-xs text-muted-foreground", reference ? "mt-7" : "mt-1")} aria-hidden="true">
          <span>{moeda(0)}</span>
          <span>{moeda(max)}</span>
        </div>
        {reference ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-300 dark:bg-emerald-800" />Econômica: abaixo de 85% da média</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-300 dark:bg-blue-800" />De mercado: 85% a 115%</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet-300 dark:bg-violet-800" />Premium: acima de 115%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface MediaTileProps {
  id: string;
  name: string;
  description?: string | null;
  minCost: number;
  checked: boolean;
  onToggle: () => void;
  budget: number;
  onBudgetChange: (value: number) => void;
  disabled?: boolean;
}

// Mídia do catálogo: liga/desliga + investimento. Mesmos campos de antes
// (promotionMix / promotionBudgets) e mesma regra de valor mínimo, que já é
// validada pelo servidor; aqui ela só fica visível com antecedência.
export function MediaTile({ id, name, description, minCost, checked, onToggle, budget, onBudgetChange, disabled }: MediaTileProps) {
  const belowMin = budget > 0 && budget < minCost;
  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-colors",
        checked ? "border-[#1447e6] bg-[#1447e6]/[0.04] dark:border-blue-400 dark:bg-blue-500/10" : "border-slate-200 dark:border-slate-800",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        data-testid={`checkbox-${id}`}
        data-state={checked ? "checked" : "unchecked"}
        className="flex w-full items-start gap-3 rounded-xl p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1447e6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">{name}</span>
          {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
          <span className="mt-1.5 block text-xs text-[#7a5300] dark:text-amber-400">Mínimo {moeda(minCost)}</span>
        </span>
        <span className={cn("relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-[#1447e6] dark:bg-blue-500" : "bg-slate-300 dark:bg-slate-600")} aria-hidden="true">
          <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150", checked ? "translate-x-5" : "translate-x-1")} />
        </span>
      </button>
      {checked && (
        <div className="space-y-2 border-t border-[#1447e6]/20 px-3 pb-3 pt-3">
          <div className="flex items-center gap-2">
            <FormattedMoneyInput
              id={`budget-${id}`}
              value={budget || 0}
              onChange={onBudgetChange}
              disabled={disabled}
              placeholder="0"
              className="flex-1"
              testId={`input-budget-${id}`}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onBudgetChange(minCost)}
              className="shrink-0 rounded-md border px-2.5 py-2 text-xs font-medium hover:bg-muted disabled:opacity-60"
              data-testid={`button-min-${id}`}
            >
              Usar mínimo
            </button>
          </div>
          {belowMin ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> Abaixo do mínimo de {moeda(minCost)}
            </p>
          ) : budget >= minCost && budget > 0 ? (
            <p className="text-xs text-muted-foreground">
              Quantidade estimada: {Math.floor(budget / (minCost || 1)).toLocaleString("pt-BR")} unidades
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Defina quanto investir nesta mídia.</p>
          )}
        </div>
      )}
    </div>
  );
}

interface BudgetMeterProps {
  productTotal: number;
  allProductsTotal: number;
  available: number;
  productName?: string;
  mediaCount: number;
  showAllProducts: boolean;
}

// Painel de investimento em promoção. É apenas informativo: o orçamento não
// é um teto no envio (o servidor só valida o mínimo de cada mídia), então
// nada aqui bloqueia ou altera a decisão.
export function BudgetMeter({ productTotal, allProductsTotal, available, productName, mediaCount, showAllProducts }: BudgetMeterProps) {
  const share = available > 0 ? (allProductsTotal / available) * 100 : 0;
  const over = available > 0 && allProductsTotal > available;
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ffcc00] text-[#0a1830]">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Investimento em promoção{productName ? ` — ${productName}` : ""}</p>
          <p className="text-3xl font-bold tabular-nums text-[#1447e6] dark:text-blue-300" data-testid="text-total-promotion-budget">
            {moeda(productTotal)}
          </p>
          <p className="text-sm text-muted-foreground">{mediaCount} {mediaCount === 1 ? "mídia selecionada" : "mídias selecionadas"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium">{showAllProducts ? "Todos os produtos" : "Uso do orçamento"}</span>
          <span className="tabular-nums text-muted-foreground">
            {moeda(allProductsTotal)} de {moeda(available)}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="img" aria-label={`${share.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% do orçamento disponível`}>
          <div
            className={cn("h-full rounded-full transition-[width] duration-300", over ? "bg-[#ff8c1a]" : "bg-[#1447e6]")}
            style={{ width: `${Math.min(100, share)}%` }}
          />
        </div>
        <p className={cn("text-sm", over ? "font-medium text-[#8a4a00] dark:text-orange-300" : "text-muted-foreground")}>
          {over
            ? `O total planejado está ${moeda(allProductsTotal - available)} acima do orçamento disponível.`
            : `${share.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% do orçamento disponível. O que não for investido continua disponível nas próximas rodadas.`}
        </p>
      </div>
    </div>
  );
}
