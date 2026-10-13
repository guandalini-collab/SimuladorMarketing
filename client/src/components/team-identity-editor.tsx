import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// A identidade da empresa fica travada para a equipe depois de criada
// (regra do professor, out/2026). Este botão permite ao professor corrigi-la.
export function TeamIdentityEditor({ team }: { team: { id: string; name: string; companyName?: string | null; slogan?: string | null; logoUrl?: string | null } }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState(team.companyName ?? "");
  const [slogan, setSlogan] = useState(team.slogan ?? "");
  const [clearLogo, setClearLogo] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/professor/teams/${team.id}/identity`, { companyName, slogan, clearLogo });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Identidade atualizada", description: `A identidade de ${team.name} foi corrigida.` });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
    },
  });

  const abrir = () => {
    setCompanyName(team.companyName ?? "");
    setSlogan(team.slogan ?? "");
    setClearLogo(false);
    setOpen(true);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={abrir} data-testid={`button-edit-identity-${team.id}`} aria-label="Corrigir identidade da empresa">
            <Building2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Corrigir identidade da empresa</p>
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Identidade da empresa — {team.name}</DialogTitle>
            <DialogDescription>
              A equipe não pode mais alterar a identidade depois de criada. Use esta tela só para corrigir erros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`prof-company-${team.id}`}>Nome da empresa</Label>
              <Input id={`prof-company-${team.id}`} value={companyName} maxLength={100} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`prof-slogan-${team.id}`}>Slogan</Label>
              <Textarea id={`prof-slogan-${team.id}`} value={slogan} maxLength={200} rows={3} onChange={(e) => setSlogan(e.target.value)} />
            </div>
            {team.logoUrl && (
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={clearLogo} onCheckedChange={(v) => setClearLogo(v === true)} />
                <span>Remover a logomarca atual e permitir que a equipe envie outra</span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid={`button-save-identity-${team.id}`}>
              {save.isPending ? "Salvando..." : "Salvar correção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
