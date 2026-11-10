// Nov/2026: modo "Ver como equipe" do professor (somente leitura).
// - BotaoVerComoEquipe: botão verde no painel do professor; escolhe a equipe
//   e ativa o modo (o servidor confere se a turma é do professor).
// - FaixaVerComoEquipe: faixa no topo das telas do aluno enquanto o modo está
//   ativo, com o botão para voltar ao painel do professor.
// No modo, o servidor recusa qualquer gravação; nada muda na turma.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function BotaoVerComoEquipe({ classId }: { classId: string }) {
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();
  const { data: equipes = [] } = useQuery<any[]>({
    queryKey: [`/api/classes/${classId}/teams`],
    enabled: aberto && !!classId,
  });

  const entrar = async (teamId: string) => {
    setEnviando(true);
    try {
      await apiRequest("POST", "/api/ver-como-equipe", { teamId });
      queryClient.clear();
      window.location.href = "/";
    } catch (e: any) {
      toast({ title: "Não foi possível abrir a visão da equipe", description: e?.message, variant: "destructive" });
      setEnviando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-[#1aa15c] text-white hover:bg-[#15874d]" data-testid="button-ver-como-equipe">
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Ver como equipe</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ver como equipe</DialogTitle>
          <DialogDescription>
            Abre as telas do aluno exatamente como a equipe escolhida vê. É só leitura: nada pode ser salvo ou enviado,
            você não aparece como membro e nenhuma conta é criada. Para voltar, use o botão na faixa verde do topo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {equipes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma equipe nesta turma.</p>}
          {equipes.map((t) => (
            <Button
              key={t.id}
              variant="outline"
              className="justify-start"
              disabled={enviando || (!t.leaderId && !(t.memberIds?.length))}
              onClick={() => entrar(t.id)}
              data-testid={`ver-como-${t.id}`}
            >
              {t.companyName || t.name}
              {!t.leaderId && !(t.memberIds?.length) && <span className="ml-2 text-xs text-muted-foreground">(sem membros)</span>}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FaixaVerComoEquipe() {
  const { data } = useQuery<{ ativo: boolean; equipe?: string | null }>({
    queryKey: ["/api/ver-como-equipe/status"],
  });
  if (!data?.ativo) return null;
  const sair = async () => {
    try {
      await apiRequest("POST", "/api/ver-como-equipe/sair");
    } finally {
      queryClient.clear();
      window.location.href = "/professor";
    }
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1aa15c] px-4 py-2 text-sm text-white" data-testid="faixa-ver-como-equipe">
      <span className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Você está vendo como a equipe <strong>{data.equipe ?? ""}</strong>. Somente leitura: nada é salvo.
      </span>
      <Button size="sm" variant="secondary" onClick={sair} data-testid="button-sair-ver-como-equipe">
        Voltar ao painel do professor
      </Button>
    </div>
  );
}
