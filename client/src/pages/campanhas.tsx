import { useState } from "react";
import { CampaignCard } from "@/components/campaign-card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import emptyStateImg from "@assets/generated_images/Empty_campaigns_state_illustration_e1a3e311.png";

const mockCampaigns = [
  {
    id: "1",
    name: "Lançamento Produto X",
    status: "ativa",
    channel: "redes-sociais",
    budget: 15000,
    reach: 12500,
    engagement: 8.5,
    roi: 145,
  },
  {
    id: "2",
    name: "Promoção de Verão",
    status: "ativa",
    channel: "email",
    budget: 8000,
    reach: 5200,
    engagement: 12.3,
    roi: 98,
  },
  {
    id: "3",
    name: "Campanha Outdoor",
    status: "planejando",
    channel: "outdoor",
    budget: 20000,
    reach: 0,
    engagement: 0,
    roi: 0,
  },
];

export default function Campanhas() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    channel: "",
    budget: "",
    duration: "",
    targetAudience: "",
  });

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCampaign = () => {
    console.log("Creating campaign:", newCampaign);
    setIsDialogOpen(false);
    setNewCampaign({ name: "", channel: "", budget: "", duration: "", targetAudience: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-accent font-bold">Campanhas</h1>
          <p className="text-muted-foreground">Gerencie suas campanhas de marketing</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-campaign">
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar campanhas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-campaigns"
        />
      </div>

      {filteredCampaigns.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              {...campaign}
              onView={() => console.log("View campaign:", campaign.id)}
              onEdit={() => console.log("Edit campaign:", campaign.id)}
              onToggleStatus={() => console.log("Toggle status:", campaign.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <img src={emptyStateImg} alt="Nenhuma campanha" className="w-48 h-48 mb-6 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma campanha encontrada</h3>
          <p className="text-muted-foreground mb-6">
            Comece criando sua primeira campanha de marketing
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Campanha
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-create-campaign">
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar uma nova campanha de marketing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input
                id="name"
                placeholder="Ex: Lançamento Produto X"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                data-testid="input-campaign-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">Canal</Label>
              <Select
                value={newCampaign.channel}
                onValueChange={(value) => setNewCampaign({ ...newCampaign, channel: value })}
              >
                <SelectTrigger data-testid="select-channel">
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="redes-sociais">Redes Sociais</SelectItem>
                  <SelectItem value="email">E-mail Marketing</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="tv">TV</SelectItem>
                  <SelectItem value="radio">Rádio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Orçamento (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="10000"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                  data-testid="input-budget"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (dias)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={newCampaign.duration}
                  onChange={(e) => setNewCampaign({ ...newCampaign, duration: e.target.value })}
                  data-testid="input-duration"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Público-Alvo</Label>
              <Input
                id="target"
                placeholder="Ex: Jovens de 18-25 anos"
                value={newCampaign.targetAudience}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, targetAudience: e.target.value })
                }
                data-testid="input-target-audience"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCampaign} data-testid="button-submit-campaign">
              Criar Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
