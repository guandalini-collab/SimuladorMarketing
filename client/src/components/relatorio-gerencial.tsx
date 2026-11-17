import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, LogOut, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/brand/simula-logo-compacta.svg";

/**
 * Nov/2026 (decisão do professor, 17/11): relatório gerencial da rodada em PDF.
 * Substitui o feedback da IA. Cada aluno baixa o relatório da última rodada
 * encerrada antes de entrar no simulador; depois, todos os relatórios ficam
 * na página "Relatórios gerenciais" para baixar de novo quando quiser.
 */

export interface RelatorioPendente { roundId: string; rodada: number }
export interface RelatorioDisponivel { roundId: string; rodada: number; encerradaEm: string | null }

export const CHAVE_PENDENTE = ["/api/team/relatorio-gerencial/pendente"];
export const CHAVE_LISTA = ["/api/team/relatorios-gerenciais"];

async function baixarRelatorio(roundId: string, rodada: number): Promise<void> {
  const res = await fetch(`/api/team/relatorio-gerencial/${roundId}`, { credentials: "include" });
  if (!res.ok) {
    let msg = "Não foi possível baixar o relatório.";
    try { msg = (await res.json()).error || msg; } catch { /* resposta sem JSON */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition") || "";
  const nome = /filename="([^"]+)"/.exec(disp)?.[1] || `Relatorio_gerencial_R${rodada}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function useBaixar() {
  const { toast } = useToast();
  const [baixando, setBaixando] = useState<string | null>(null);
  const baixar = async (roundId: string, rodada: number) => {
    setBaixando(roundId);
    try {
      await baixarRelatorio(roundId, rodada);
      await queryClient.invalidateQueries({ queryKey: CHAVE_PENDENTE });
    } catch (e: any) {
      toast({ title: "Erro ao baixar", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setBaixando(null);
    }
  };
  return { baixar, baixando };
}

/** Tela mostrada logo após o login enquanto o aluno não baixar o relatório da última rodada. */
export function TelaRelatorioPendente({ pendente, onLogout }: { pendente: RelatorioPendente; onLogout: () => void }) {
  const { baixar, baixando } = useBaixar();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg" data-testid="card-relatorio-pendente">
        <CardHeader className="text-center space-y-4">
          <img src={logoImage} alt="Simula+" className="h-12 mx-auto" />
          <CardTitle className="text-2xl">Relatório gerencial da Rodada {pendente.rodada}</CardTitle>
          <CardDescription className="text-base">
            A Rodada {pendente.rodada} foi encerrada. Para entrar no simulador, baixe o relatório gerencial da sua
            empresa nesta rodada. Ele traz os resultados comparados com as rodadas anteriores e com as outras
            equipes da turma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => baixar(pendente.roundId, pendente.rodada)}
            disabled={!!baixando}
            data-testid="button-baixar-relatorio-pendente"
          >
            {baixando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {baixando ? "Gerando o PDF..." : "Baixar relatório gerencial (PDF)"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Depois de baixar, o acesso é liberado. O relatório continua disponível em "Relatórios gerenciais", no menu.
          </p>
          <Button variant="ghost" className="w-full" onClick={onLogout} data-testid="button-sair-relatorio-pendente">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** Lista de todos os relatórios da equipe, para baixar de novo. */
export function ListaRelatoriosGerenciais() {
  const { baixar, baixando } = useBaixar();
  const { data: lista = [], isLoading } = useQuery<RelatorioDisponivel[]>({ queryKey: CHAVE_LISTA });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card data-testid="card-relatorios-gerenciais">
      <CardHeader>
        <CardTitle>Relatórios das rodadas encerradas</CardTitle>
        <CardDescription>
          Cada relatório mostra os resultados da empresa na rodada, comparados com as rodadas anteriores e com as
          outras equipes da turma, e explica como cada número foi calculado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há rodada encerrada com resultado da sua equipe.</p>
        ) : (
          <ul className="divide-y">
            {lista.map((r) => (
              <li key={r.roundId} className="flex items-center justify-between gap-4 py-3" data-testid={`relatorio-rodada-${r.rodada}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-[#1447e6] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">Rodada {r.rodada}</p>
                    {r.encerradaEm && (
                      <p className="text-xs text-muted-foreground">
                        Encerrada em {new Date(r.encerradaEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => baixar(r.roundId, r.rodada)} disabled={!!baixando} data-testid={`button-baixar-relatorio-${r.rodada}`}>
                  {baixando === r.roundId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Baixar PDF
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
