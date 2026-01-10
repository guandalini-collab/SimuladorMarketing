import { MarketEventCard } from '../market-event-card';

export default function MarketEventCardExample() {
  return (
    <div className="p-8 max-w-md">
      <MarketEventCard
        type="economia"
        title="Taxa de Juros em Alta"
        description="O Banco Central aumentou a taxa básica de juros em 0,5%. Isso pode reduzir o consumo."
        impact="Redução de 10-15% na demanda por produtos de luxo."
        severity="alto"
      />
    </div>
  );
}
