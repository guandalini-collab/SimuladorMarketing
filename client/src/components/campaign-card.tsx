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
  planejando: { label: "Planejando", variant: "secondary" as const },
  ativa: { label: "Ativa", variant: "default" as const },
  concluida: { label: "Concluída", variant: "outline" as const },
  pausada: { label: "Pausada", variant: "secondary" as const },
};

const channelIcons: Record<string, string> = {
  "redes-sociais": "📱",
  "email": "📧",
  "outdoor": "🎯",
  "tv": "📺",
  "radio": "📻",
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

  return (
    <Card className="hover-elevate" data-testid={`card-campaign-${id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{channelIcons[channel] || "📢"}</span>
          <div>
            <h3 className="font-semibold" data-testid={`text-campaign-name-${id}`}>
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">{channel}</p>
          </div>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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
            <p className={`font-semibold ${roi >= 0 ? "text-chart-3" : "text-destructive"}`}>
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
