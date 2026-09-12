import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Eye, Pencil, Play, Pause } from "lucide-react";

interface CampaignCardProps {
  id: string;
  name: string;
  status: string;
  channel: string;
  budget: number;
  reach: number;
  engagement: number;
  roi: number;
  onView?: () => void;
  onEdit?: () => void;
  onToggleStatus?: () => void;
}

const statusConfig = {
  planejando: { label: "Planejando", className: "bg-[#eef2ff] text-[#1447e6] dark:bg-blue-900/20" },
  ativa: { label: "Ativa", className: "bg-[#e6f7ee] text-[#0f7a44] dark:bg-green-900/20" },
  concluida: { label: "Concluída", className: "bg-[#f3ecfd] text-[#6425c4] dark:bg-violet-900/20" },
  pausada: { label: "Pausada", className: "bg-[#fff3d6] text-[#7a5300] dark:bg-yellow-900/20" },
};

const channelConfig: Record<string, { icon: string; color: string }> = {
  "redes-sociais": { icon: "📱", color: "#1447e6" },
  "email": { icon: "📧", color: "#7c3aed" },
  "outdoor": { icon: "🎯", color: "#ff8c1a" },
  "tv": { icon: "📺", color: "#1aa15c" },
  "radio": { icon: "📻", color: "#2f2a8f" },
};

export function CampaignCard({
  id,
  name,
  status,
  channel,
  budget,
  reach,
  engagement,
  roi,
  onView,
  onEdit,
  onToggleStatus,
}: CampaignCardProps) {
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.planejando;
  const channelInfo = channelConfig[channel] || { icon: "📢", color: "#2f2a8f" };

  return (
    <Card className="hover-elevate" data-testid={`card-campaign-${id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: channelInfo.color }}
          >
            {channelInfo.icon}
          </div>
          <div>
            <h3 className="font-semibold" data-testid={`text-campaign-name-${id}`}>
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">{channel}</p>
          </div>
        </div>
        <Badge className={`border-transparent ${statusInfo.className}`}>{statusInfo.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Orçamento</p>
            <p className="font-semibold">R$ {budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Alcance</p>
            <p className="font-semibold">{reach.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Engajamento</p>
            <p className="font-semibold">{engagement.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">ROI</p>
            <p className={`font-semibold ${roi >= 0 ? "text-[#1aa15c]" : "text-[#a3241c]"}`}>
              {roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onView}
          data-testid={`button-view-${id}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onEdit}
          data-testid={`button-edit-${id}`}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
        {status === "ativa" ? (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleStatus}
            data-testid={`button-pause-${id}`}
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleStatus}
            data-testid={`button-play-${id}`}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
