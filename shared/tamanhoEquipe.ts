// Tamanho das equipes (out/2026, pedido do professor): cada equipe tem de 3
// a 5 alunos. O máximo é travado no servidor (ninguém entra numa equipe com
// 5); o mínimo trava a ABERTURA de qualquer rodada da turma: enquanto alguma
// equipe tiver menos de 3, a rodada não abre (nem pelo botão nem pelo
// agendamento) — o jogo fica parado para todas as equipes.
export const MIN_ALUNOS_POR_EQUIPE = 3;
export const MAX_ALUNOS_POR_EQUIPE = 5;

export interface EquipeForaDoTamanho {
  nome: string;
  alunos: number;
}

export function equipesForaDoTamanho(teams: { name: string; memberIds?: string[] | null }[]): EquipeForaDoTamanho[] {
  return teams
    .map((t) => ({ nome: t.name, alunos: t.memberIds?.length ?? 0 }))
    .filter((t) => t.alunos < MIN_ALUNOS_POR_EQUIPE || t.alunos > MAX_ALUNOS_POR_EQUIPE);
}

export function mensagemEquipesForaDoTamanho(lista: EquipeForaDoTamanho[]): string {
  const itens = lista.map((e) => `"${e.nome}" (${e.alunos} ${e.alunos === 1 ? "aluno" : "alunos"})`).join(", ");
  return `A rodada não pode abrir: toda equipe precisa ter de ${MIN_ALUNOS_POR_EQUIPE} a ${MAX_ALUNOS_POR_EQUIPE} alunos. Fora desse tamanho: ${itens}.`;
}
