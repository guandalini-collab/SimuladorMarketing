import { KPICard } from '../kpi-card';
import { DollarSign } from 'lucide-react';

export default function KPICardExample() {
  return (
    <div className="p-8">
      <KPICard
        title="Orçamento Disponível"
        value="R$ 75.000"
        trend={{ value: 12, isPositive: true }}
        icon={DollarSign}
      />
    </div>
  );
}
