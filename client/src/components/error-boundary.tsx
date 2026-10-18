import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Out/2026 (Grupo G): antes, um erro ao desenhar qualquer tela (por exemplo
 * um número ausente) deixava a página inteira em branco. Agora aparece uma
 * mensagem com a opção de recarregar; o menu e o cabeçalho continuam.
 * A chave (resetKey) muda com a rota, então trocar de tela limpa o erro.
 */
interface Props {
  children: ReactNode;
  resetKey?: string;
}
interface State {
  erro: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error) {
    console.error("[tela] Erro ao exibir a página:", erro);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.erro) {
      this.setState({ erro: null });
    }
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="mx-auto max-w-lg py-16 text-center" data-testid="tela-erro">
        <AlertTriangle className="mx-auto h-10 w-10 text-[#c9871a]" />
        <h2 className="mt-4 text-xl font-semibold">Não foi possível mostrar esta tela</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Algum dado não chegou como esperado. Recarregue a página; se o problema continuar, avise o professor.
        </p>
        <Button className="mt-6" onClick={() => window.location.reload()} data-testid="button-recarregar">
          Recarregar a página
        </Button>
      </div>
    );
  }
}
