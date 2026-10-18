import type { Request, Response, NextFunction } from "express";

/**
 * Limite de tentativas nas rotas de autenticação (out/2026, Grupo A da
 * auditoria). Em memória, sem dependência nova: o app roda em um único
 * processo no Railway; durante um deploy podem existir dois por alguns
 * segundos, o que só afrouxa o limite nesse intervalo.
 *
 * As chaves combinam IP e e-mail porque os alunos de um laboratório saem
 * pelo MESMO IP público: um limite só por IP bloquearia a turma inteira.
 * O limite só por IP existe apenas como teto alto contra robôs.
 */

interface Janela {
  contagem: number;
  expiraEm: number;
}

const janelas = new Map<string, Janela>();

// Limpeza periódica para o mapa não crescer sem limite.
setInterval(() => {
  const agora = Date.now();
  janelas.forEach((janela, chave) => {
    if (janela.expiraEm <= agora) janelas.delete(chave);
  });
}, 10 * 60 * 1000).unref();

function ipDe(req: Request): string {
  return String(req.ip || req.socket?.remoteAddress || "desconhecido");
}

function emailDe(req: Request): string {
  return String((req.body && req.body.email) || "").trim().toLowerCase();
}

/** Soma 1 à chave e diz se o limite foi ultrapassado. */
function registrar(chave: string, maximo: number, janelaMs: number): { bloqueado: boolean; segundosRestantes: number } {
  const agora = Date.now();
  let janela = janelas.get(chave);
  if (!janela || janela.expiraEm <= agora) {
    janela = { contagem: 0, expiraEm: agora + janelaMs };
    janelas.set(chave, janela);
  }
  janela.contagem += 1;
  return {
    bloqueado: janela.contagem > maximo,
    segundosRestantes: Math.max(1, Math.ceil((janela.expiraEm - agora) / 1000)),
  };
}

/** Zera a contagem (usado após login bem-sucedido). */
export function zerarTentativas(prefixo: string, req: Request): void {
  janelas.delete(`${prefixo}:ip-email:${ipDe(req)}:${emailDe(req)}`);
}

interface Regra {
  prefixo: string;
  /** Máximo por IP + e-mail na janela. */
  porEmail: number;
  /** Teto por IP na janela (laboratório inteiro). */
  porIp: number;
  janelaMs: number;
}

export function limitarTentativas(regra: Regra) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = ipDe(req);
    const email = emailDe(req);
    const porIp = registrar(`${regra.prefixo}:ip:${ip}`, regra.porIp, regra.janelaMs);
    const porEmail = email
      ? registrar(`${regra.prefixo}:ip-email:${ip}:${email}`, regra.porEmail, regra.janelaMs)
      : { bloqueado: false, segundosRestantes: 0 };
    if (porIp.bloqueado || porEmail.bloqueado) {
      const segundos = Math.max(porIp.bloqueado ? porIp.segundosRestantes : 0, porEmail.bloqueado ? porEmail.segundosRestantes : 0);
      const minutos = Math.ceil(segundos / 60);
      res.setHeader("Retry-After", String(segundos));
      return res.status(429).json({
        error: `Muitas tentativas seguidas. Aguarde ${minutos} minuto${minutos === 1 ? "" : "s"} e tente de novo.`,
      });
    }
    next();
  };
}

const QUINZE_MINUTOS = 15 * 60 * 1000;
const UMA_HORA = 60 * 60 * 1000;

export const limiteLogin = limitarTentativas({ prefixo: "login", porEmail: 10, porIp: 300, janelaMs: QUINZE_MINUTOS });
export const limiteCadastro = limitarTentativas({ prefixo: "cadastro", porEmail: 5, porIp: 120, janelaMs: UMA_HORA });
export const limiteEsqueciSenha = limitarTentativas({ prefixo: "esqueci", porEmail: 3, porIp: 60, janelaMs: UMA_HORA });
export const limiteRecuperacao = limitarTentativas({ prefixo: "recuperar", porEmail: 5, porIp: 60, janelaMs: QUINZE_MINUTOS });
export const limiteRedefinir = limitarTentativas({ prefixo: "redefinir", porEmail: 10, porIp: 60, janelaMs: QUINZE_MINUTOS });
