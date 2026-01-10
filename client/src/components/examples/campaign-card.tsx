import { CampaignCard } from '../campaign-card';

export default function CampaignCardExample() {
  return (
    <div className="p-8 max-w-md">
      <CampaignCard
        id="1"
        name="Lançamento Produto X"
        status="ativa"
        channel="redes-sociais"
        budget={15000}
        reach={12500}
        engagement={8.5}
        roi={145}
        onView={() => console.log('View')}
        onEdit={() => console.log('Edit')}
        onToggleStatus={() => console.log('Toggle')}
      />
    </div>
  );
}
