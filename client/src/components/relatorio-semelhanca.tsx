import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { faixaDeSemelhanca } from "@shared/semelhanca";

// Out/2026: relatório de semelhança — visível só ao professor, sem efeito na
// nota nem no resultado (substitui a penalidade automática por conteúdo da
// IA). Rota: GET /api/classes/:classId/relatorio-semelhanca?roundId=

interface LinhaSemelhanca {
  teamId: string;
  equipe: string;
  segmentacaoPreenchida: boolean;
  maiorSemelhancaOutraEquipe: number;
  equipeMaisSemelhante: string | null;
  semelhancaRodadaAnterior: number | null;
  ferramentas: { ferramenta: string; percentualSugestaoNaoEditada: number }[];
}

const COR_FAIXA: Record<string, string> = {
  alta: "border-[#e5352b] text-[#b42318]",
  media: "border-[#c9871a] text-[#8a4a00]",
  baixa: "",
};

function Valor({ v }: { v: number | null }) {
  if (v === null) return <span className="text-muted-foreground">—</span>;
  const faixa = faixaDeSemelhanca(v);
  return <Badge variant="outline" className={`tabular-nums ${COR_FAIXA[faixa]}`}>{v}%</Badge>;
}

export function RelatorioSemelhanca({ classId, rounds }: { classId: string; rounds: { id: string; roundNumber: number; status: string; isPractice?: boolean | null }[] }) {
  const disponiveis = rounds.filter((r) => r.status === "active" || r.status === "completed").sort((a, b) => b.roundNumber - a.roundNumber);
  const [roundId, setRoundId] = useState<string>("");
  // Out/2026 (Grupo E): ao trocar de turma, a rodada escolhida volta para a
  // mais recente da turma nova (antes ficava a rodada da turma anterior).
  const idsDisponiveis = disponiveis.map((r) => r.id).join(",");
  useEffect(() => {
    if (!disponiveis.length) { if (roundId) setRoundId(""); return; }
    if (!roundId || !disponiveis.some((r) => r.id === roundId)) setRoundId(disponiveis[0].id);
  }, [idsDisponiveis, roundId]);

  const { data, isLoading, isError } = useQuery<{ roundNumber: number; analisesProntas: boolean; linhas: LinhaSemelhanca[] }>({
    queryKey: [`/api/classes/${classId}/relatorio-semelhanca?roundId=${roundId}`],
    enabled: !!classId && !!roundId,
  });

  if (disponiveis.length === 0) return null;

  return (
    <Card data-testid="card-relatorio-semelhanca">
      <CardHeader className="bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0a1830] shadow-md">
              <Copy className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Relatório de semelhança</CardTitle>
              <CardDescription>Só você vê. Não altera nota nem resultado.</CardDescription>
            </div>
          </div>
          <Select value={roundId} onValueChange={setRoundId}>
            <SelectTrigger className="w-44" data-testid="select-rodada-semelhanca"><SelectValue placeholder="Rodada" /></SelectTrigger>
            <SelectContent>
              {disponiveis.map((r) => (
                <SelectItem key={r.id} value={r.id}>Rodada {r.roundNumber}{r.isPractice ? " (teste)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Mede quantas palavras da Segmentação de Mercado de cada equipe coincidem com as das outras equipes e com a da própria equipe na rodada anterior. Valores a partir de 70% merecem uma leitura atenta; são um indício, não uma prova de cópia, e o relatório não identifica textos produzidos com ferramentas externas.
        </p>
        {isError ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Não foi possível carregar o relatório. Recarregue a página.</p>
        ) : isLoading || !data ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : data.linhas.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma equipe nesta rodada.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipe</TableHead>
                  <TableHead className="text-right">Semelhança com outra equipe</TableHead>
                  <TableHead>Equipe mais semelhante</TableHead>
                  <TableHead className="text-right">Igual à rodada anterior</TableHead>
                  <TableHead>Texto sugerido pelo sistema sem edição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.linhas.map((l) => (
                  <TableRow key={l.teamId}>
                    <TableCell className="font-medium">{l.equipe}</TableCell>
                    {l.segmentacaoPreenchida ? (
                      <>
                        <TableCell className="text-right"><Valor v={l.maiorSemelhancaOutraEquipe} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.maiorSemelhancaOutraEquipe > 0 ? l.equipeMaisSemelhante : "—"}</TableCell>
                        <TableCell className="text-right"><Valor v={l.semelhancaRodadaAnterior} /></TableCell>
                      </>
                    ) : (
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">Segmentação ainda não preenchida</TableCell>
                    )}
                    <TableCell className="text-sm">
                      {l.ferramentas.length
                        ? l.ferramentas.map((f) => `${f.ferramenta}: ${f.percentualSugestaoNaoEditada}%`).join(" · ")
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
