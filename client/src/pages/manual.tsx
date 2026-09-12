import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign,
  Map,
  Megaphone,
  Shield,
  Zap,
  BarChart3,
  Grid3x3,
  AlertCircle,
  Download
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Manual() {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    toast({
      title: "Gerando PDF Profissional...",
      description: "Aguarde enquanto o Manual do Aluno completo é gerado em formato PDF.",
    });

    try {
      // Chama o endpoint backend que gera o PDF profissional
      const response = await fetch('/api/manual/aluno/pdf');
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      // Obtém o blob do PDF
      const blob = await response.blob();
      
      // Cria URL temporária e faz download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Manual_Aluno_Simula_v1.0.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF gerado com sucesso!",
        description: "O Manual do Aluno v1.0 foi baixado em formato profissional.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF profissional. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#2f2a8f] flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Manual do Aluno - Simula+</h1>
          </div>
          <Button
            onClick={downloadPDF}
            disabled={isGeneratingPDF}
            data-testid="button-download-pdf"
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? "Gerando..." : "Baixar PDF"}
          </Button>
        </div>
        <p className="text-muted-foreground">
          Guia completo para dominar o simulador de marketing e tomar as melhores decisões estratégicas
        </p>
      </div>

      <Tabs defaultValue="sistema" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
          <TabsTrigger value="sistema" data-testid="tab-sistema">
            <BookOpen className="h-4 w-4 mr-2" />
            Como Usar
          </TabsTrigger>
          <TabsTrigger value="conceitos" data-testid="tab-conceitos">
            <Lightbulb className="h-4 w-4 mr-2" />
            Conceitos
          </TabsTrigger>
          <TabsTrigger value="estrategias" data-testid="tab-estrategias">
            <Target className="h-4 w-4 mr-2" />
            Estratégias
          </TabsTrigger>
          <TabsTrigger value="glossario" data-testid="tab-glossario">
            <BarChart3 className="h-4 w-4 mr-2" />
            Glossário
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: COMO USAR O SISTEMA */}
        <TabsContent value="sistema" className="space-y-6">
          <Card data-testid="card-como-usar">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#1447e6] flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                Como Usar o Simula+
              </CardTitle>
              <CardDescription>
                Guia passo a passo para navegar e utilizar todas as funcionalidades do simulador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="inicio">
                  <AccordionTrigger>1. Primeiros Passos</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p><strong>Cadastro:</strong> Use seu email institucional (@iffarroupilha.edu.br) para se cadastrar no sistema. Crie uma senha segura.</p>
                    
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Código de Recuperação de Senha
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                        Após o cadastro, você receberá um <strong>código de recuperação</strong> no formato <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">XXXX-XXXX-XXXX</code>.
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                        <li><strong>Anote ou fotografe</strong> este código imediatamente</li>
                        <li>Ele <strong>não será mostrado novamente</strong></li>
                        <li>Use-o para recuperar sua senha caso esqueça</li>
                        <li>Na tela de login, clique em "Esqueci minha senha" e escolha a aba "Código"</li>
                      </ul>
                    </div>
                    
                    <p><strong>Login:</strong> Use o email e senha cadastrados para acessar o sistema.</p>
                    <p><strong>Aprovação:</strong> Após o primeiro login, aguarde a aprovação do professor. Você receberá um email quando for aprovado.</p>
                    <p><strong>Equipe:</strong> Você faz parte de uma equipe com até 5 membros. Apenas o líder pode enviar decisões finais.</p>
                    <p><strong>Rodadas:</strong> O jogo acontece em rodadas (períodos). Cada rodada representa um mês de vendas no mercado.</p>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md mt-2">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Esqueceu sua senha?</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Você tem duas opções de recuperação:
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800 dark:text-blue-200 mt-1">
                        <li><strong>Por Código:</strong> Use o código de recuperação que recebeu no cadastro</li>
                        <li><strong>Por Email:</strong> Receba um link de recuperação no seu email</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="turmas-equipes">
                  <AccordionTrigger>2. Como Entrar em uma Turma e Equipe</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div>
                      <p className="font-semibold mb-2">Para Alunos:</p>
                      <p className="text-sm mb-2">Quando você faz login pela primeira vez (após ser aprovado), o sistema mostrará as turmas disponíveis:</p>
                      <ol className="list-decimal pl-6 space-y-2 text-sm">
                        <li><strong>Escolha uma turma:</strong> Veja as turmas criadas pelo professor e selecione aquela na qual você está matriculado</li>
                        <li><strong>Visualize as equipes:</strong> Após selecionar a turma, você verá as equipes já criadas</li>
                        <li><strong>Duas opções:</strong>
                          <ul className="list-disc pl-6 mt-1 space-y-1">
                            <li><strong>Criar nova equipe:</strong> Clique em "Criar Nova Equipe" e escolha um nome criativo</li>
                            <li><strong>Entrar em equipe existente:</strong> Clique em "Entrar" em uma das equipes listadas</li>
                          </ul>
                        </li>
                        <li><strong>Aguarde confirmação:</strong> Você receberá uma mensagem de confirmação e será automaticamente vinculado à equipe</li>
                      </ol>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="font-semibold mb-2">Para Professores:</p>
                      <p className="text-sm mb-2">Os professores também podem adicionar alunos diretamente às equipes:</p>
                      <ol className="list-decimal pl-6 space-y-2 text-sm">
                        <li>Acesse a página <strong>Professor</strong> no menu lateral</li>
                        <li>Selecione a turma desejada</li>
                        <li>Clique na equipe para expandir e visualizar os membros</li>
                        <li>Clique no botão <strong>"Adicionar membro"</strong> (ícone de usuário com +)</li>
                        <li>Digite o email institucional do aluno que deseja adicionar</li>
                        <li>Clique em "Adicionar Membro" para confirmar</li>
                      </ol>
                      <p className="text-xs text-muted-foreground mt-2">
                        <em>Nota: O aluno deve estar aprovado e não pode estar em outra equipe da mesma turma.</em>
                      </p>
                    </div>

                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm"><strong>Importante:</strong></p>
                      <ul className="list-disc pl-6 space-y-1 text-sm mt-1">
                        <li>Você só pode estar em <strong>uma equipe por turma</strong></li>
                        <li>Apenas alunos <strong>aprovados</strong> podem entrar em equipes</li>
                        <li>O primeiro membro da equipe se torna automaticamente o <strong>líder</strong></li>
                        <li>O líder pode alterar posteriormente na aba "Equipe" do dashboard</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="identidade">
                  <AccordionTrigger>3. Identidade da Empresa e Logomarca</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Na aba <strong>"Empresa"</strong>, configure:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Nome da empresa:</strong> Escolha um nome criativo e memorável</li>
                      <li><strong>Slogan:</strong> Crie uma frase que transmita sua proposta de valor</li>
                      <li><strong>Logomarca:</strong> Faça upload de uma imagem que represente sua marca</li>
                      <li><strong>Categoria de produto:</strong> Escolha o tipo de produto que vai vender</li>
                      <li><strong>Público-alvo:</strong> Defina classe social, faixa etária e perfil comportamental</li>
                    </ul>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 rounded-md">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📸 Como fazer upload da logomarca:</p>
                      <p className="text-sm mb-3">Você tem duas opções para adicionar a logo da sua empresa:</p>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Opção 1: Enviar Arquivo (do computador)</p>
                          <ol className="list-decimal pl-6 text-sm space-y-1 mt-1">
                            <li>Clique no botão <strong>"Enviar Arquivo"</strong> (fundo roxo quando selecionado)</li>
                            <li>Clique em "Escolher arquivo" e selecione uma imagem do seu computador</li>
                            <li>Formatos aceitos: JPG, PNG, GIF, WEBP, SVG (máximo 5MB)</li>
                            <li>Clique em <strong>"Salvar Logo"</strong> para confirmar</li>
                          </ol>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Opção 2: URL Externa (link da internet)</p>
                          <ol className="list-decimal pl-6 text-sm space-y-1 mt-1">
                            <li>Clique no botão <strong>"URL Externa"</strong></li>
                            <li>Cole o link da imagem (ex: https://exemplo.com/logo.png)</li>
                            <li>Clique em <strong>"Salvar Logo"</strong> para confirmar</li>
                          </ol>
                        </div>
                      </div>

                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-3">
                        <strong>Onde sua logo aparece:</strong> Preview na página Empresa, Card "Resumo da Identidade" e Dashboard principal (hero section)
                      </p>
                    </div>

                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">💾 Preservação de Dados:</p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Todas as informações que você salvar são preservadas automaticamente</strong> enquanto a rodada estiver aberta. 
                        Você pode salvar quantas vezes quiser sem medo de perder dados! O sistema mantém todas as suas decisões seguras até o fechamento da rodada.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="produtos-publico">
                  <AccordionTrigger>3.1 Configuração de Produtos e Público-Alvo</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="bg-[#1aa15c]/10 dark:bg-[#1aa15c]/15 border-l-4 border-[#1aa15c] p-4 rounded-md">
                      <p className="font-semibold text-green-900 dark:text-green-100 mb-2">📦 Sistema de 4 Produtos Independentes</p>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        No Simula+, sua empresa gerencia um <strong>portfólio de 4 produtos distintos</strong>. Cada produto pode ter configurações completamente diferentes de público-alvo, permitindo estratégias de segmentação diversificadas dentro da mesma empresa.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold mb-2">Onde configurar:</p>
                      <p className="text-sm mb-2">Acesse a página <strong>"Empresa"</strong> e role até a seção <strong>"Produtos e Público-Alvo"</strong>. Você verá 4 abas, uma para cada produto.</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <p className="font-semibold mb-3">Para cada produto, você pode configurar:</p>
                      
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-400 pl-3">
                          <p className="font-medium text-blue-700 dark:text-blue-300">1. Nome do Produto</p>
                          <p className="text-sm text-muted-foreground">Personalize o nome do produto para refletir sua estratégia (ex: "Linha Premium", "Edição Jovem", "Básico Econômico")</p>
                        </div>

                        <div className="border-l-4 border-purple-400 pl-3">
                          <p className="font-medium text-purple-700 dark:text-purple-300">2. Descrição do Produto</p>
                          <p className="text-sm text-muted-foreground">Descreva as características, benefícios e diferenciais específicos deste produto</p>
                        </div>

                        <div className="border-l-4 border-orange-400 pl-3">
                          <p className="font-medium text-orange-700 dark:text-orange-300">3. Classe Social do Público-Alvo</p>
                          <p className="text-sm text-muted-foreground mb-2">Escolha entre as opções disponíveis:</p>
                          <ul className="list-disc pl-6 text-xs space-y-1">
                            <li><strong>Classe A:</strong> Alta renda, busca exclusividade e qualidade premium</li>
                            <li><strong>Classe B:</strong> Média-alta renda, valoriza custo-benefício e status</li>
                            <li><strong>Classe C:</strong> Média renda, foco em funcionalidade e preço acessível</li>
                            <li><strong>Classe D/E:</strong> Baixa renda, prioriza preço e necessidades básicas</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-green-400 pl-3">
                          <p className="font-medium text-green-700 dark:text-green-300">4. Faixa Etária do Público-Alvo</p>
                          <p className="text-sm text-muted-foreground mb-2">Selecione a faixa etária principal:</p>
                          <ul className="list-disc pl-6 text-xs space-y-1">
                            <li><strong>Geração Z (13-25):</strong> Nativos digitais, valorizam autenticidade e causas sociais</li>
                            <li><strong>Millennials (26-41):</strong> Conectados, valorizam experiências mais que posses, conscientes</li>
                            <li><strong>Geração X (42-57):</strong> Pragmáticos, leais a marcas, valorizam qualidade</li>
                            <li><strong>Baby Boomers (58-76):</strong> Tradicionais, valorizam confiança e atendimento</li>
                            <li><strong>Idosos (77+):</strong> Conservadores, fidelidade extrema, simplicidade</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-pink-400 pl-3">
                          <p className="font-medium text-pink-700 dark:text-pink-300">5. Perfil Comportamental</p>
                          <p className="text-sm text-muted-foreground mb-2">Defina o perfil psicográfico do consumidor:</p>
                          <ul className="list-disc pl-6 text-xs space-y-1">
                            <li><strong>Inovadores:</strong> Primeiros a adotar novidades, influenciadores</li>
                            <li><strong>Realizadores:</strong> Orientados por sucesso e status</li>
                            <li><strong>Experienciadores:</strong> Buscam emoção e variedade</li>
                            <li><strong>Crentes:</strong> Tradicionais, valorizam família e comunidade</li>
                            <li><strong>Esforçados:</strong> Buscam aprovação social, sensíveis a preço</li>
                            <li><strong>Práticos:</strong> Funcionais, valorizam durabilidade</li>
                            <li><strong>Sobreviventes:</strong> Focados em necessidades básicas</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🔄 Workflow de Configuração:</p>
                      <ol className="list-decimal pl-6 text-sm space-y-2">
                        <li><strong>Salvar Rascunho:</strong> Você pode salvar configurações parciais a qualquer momento clicando em "Salvar Rascunho". Isso permite revisar e ajustar antes de finalizar.</li>
                        <li><strong>Finalizar Produto:</strong> Quando estiver satisfeito com a configuração, clique em "Finalizar Produto". Um ícone verde (✓) aparecerá na aba do produto indicando que está pronto.</li>
                        <li><strong>Repetir para todos:</strong> Configure cada um dos 4 produtos individualmente. Você pode usar estratégias diferentes para cada um!</li>
                      </ol>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">⚠️ Regras Importantes:</p>
                      <ul className="list-disc pl-6 text-sm space-y-1">
                        <li>A configuração de produtos só pode ser <strong>finalizada durante rodadas ativas</strong></li>
                        <li>Você pode salvar rascunhos mesmo sem rodada ativa</li>
                        <li>Uma vez finalizado, o produto fica <strong>bloqueado para edição</strong> naquela rodada</li>
                        <li>Se precisar alterar um produto finalizado, solicite ao professor o reset das decisões</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-2">💡 Dica Estratégica:</p>
                      <p className="text-sm text-muted-foreground">
                        Use a diferenciação de público-alvo para criar um portfólio balanceado! Por exemplo: 
                        Produto 1 para Classe A/Inovadores (premium), 
                        Produto 2 para Classe B/Realizadores (aspiracional), 
                        Produto 3 para Classe C/Práticos (custo-benefício), 
                        Produto 4 para Classe D/Sobreviventes (econômico). 
                        Isso maximiza a cobertura de mercado e reduz riscos.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="decisoes">
                  <AccordionTrigger>4. Tomada de Decisões (Marketing Mix - 4 Ps)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="bg-[#7c3aed]/10 dark:bg-[#7c3aed]/15 border-l-4 border-[#7c3aed] p-4 rounded-md">
                      <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🎯 Sistema Multi-Produto: Decisões Independentes</p>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        No Simula+, você toma decisões de Marketing Mix (4 Ps) <strong>separadamente para cada um dos 4 produtos</strong>. 
                        Isso permite estratégias completamente diferentes por produto — um pode ter preço premium enquanto outro compete por volume!
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold mb-2">Acesso e Navegação:</p>
                      <ol className="list-decimal pl-6 text-sm space-y-1">
                        <li>Acesse a página <strong>"Decisões"</strong> no menu lateral</li>
                        <li>No topo da página, você verá <strong>4 abas</strong> — uma para cada produto</li>
                        <li>Clique em cada aba para configurar as decisões daquele produto específico</li>
                        <li>Um ícone de check (✓) verde aparece quando o produto foi submetido</li>
                      </ol>
                    </div>

                    <div className="border rounded-lg p-4">
                      <p className="font-semibold mb-3">Para CADA produto, configure os 4 Ps:</p>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="border-l-4 border-green-500 pl-3">
                          <p className="font-medium flex items-center gap-2">
                            <span className="text-green-600">●</span> Produto
                          </p>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• <strong>Qualidade:</strong> Baixa, Média, Alta ou Premium</li>
                            <li>• <strong>Características:</strong> Básico, Padrão, Avançado ou Inovador</li>
                            <li>• <strong>Posicionamento:</strong> Econômico, Custo-benefício, Premium ou Luxo</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-yellow-500 pl-3">
                          <p className="font-medium flex items-center gap-2">
                            <span className="text-yellow-600">●</span> Preço
                          </p>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• <strong>Estratégia:</strong> Penetração, Skimming, Valor, Competitivo ou Custo-plus</li>
                            <li>• <strong>Valor:</strong> Defina o preço em R$ para este produto</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-3">
                          <p className="font-medium flex items-center gap-2">
                            <span className="text-blue-600">●</span> Praça (Distribuição)
                          </p>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• <strong>Canais:</strong> Varejo físico, E-commerce, Atacado, Direto, etc.</li>
                            <li>• <strong>Cobertura:</strong> Local, Regional, Nacional ou Internacional</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-orange-500 pl-3">
                          <p className="font-medium flex items-center gap-2">
                            <span className="text-orange-600">●</span> Promoção
                          </p>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• <strong>Mídias:</strong> Selecione entre 27 formatos disponíveis</li>
                            <li>• <strong>Investimento:</strong> Defina quanto investir em cada mídia</li>
                            <li>• <strong>Intensidade:</strong> Baixa, Média, Alta ou Intensiva</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-md">
                      <p className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Workflow de Submissão:</p>
                      <ol className="list-decimal pl-6 text-sm space-y-2">
                        <li><strong>Configure cada produto:</strong> Preencha os 4 Ps para cada um dos 4 produtos navegando pelas abas</li>
                        <li><strong>Salve rascunhos:</strong> Clique em "Salvar Rascunho" para guardar progresso parcial (pode editar depois)</li>
                        <li><strong>Revise tudo:</strong> Verifique se as decisões estão coerentes com suas análises estratégicas</li>
                        <li><strong>Submeta tudo de uma vez:</strong> O botão "Submeter Decisão Final" envia TODOS os 4 produtos simultaneamente</li>
                      </ol>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-md">
                      <p className="font-semibold text-red-900 dark:text-red-100 mb-2">🔒 Pré-requisito Obrigatório:</p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Você só poderá submeter as decisões de Marketing Mix após completar <strong>TODAS as 4 ferramentas estratégicas</strong>: 
                        SWOT, Porter, BCG e PESTEL. Se alguma estiver incompleta, o botão de submissão ficará desabilitado e uma mensagem indicará o que falta.
                      </p>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">⚠️ Atenção - Submissão Final:</p>
                      <ul className="list-disc pl-6 text-sm space-y-1">
                        <li>Uma vez submetidas, as decisões ficam <strong>bloqueadas para edição</strong></li>
                        <li>Todos os 4 produtos são submetidos <strong>juntos</strong> (não é possível submeter individualmente)</li>
                        <li>O sistema exibe um diálogo de confirmação antes da submissão final</li>
                        <li>Se precisar alterar após submissão, solicite ao professor o reset das decisões</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-2">💡 Dica Estratégica:</p>
                      <p className="text-sm text-muted-foreground">
                        Aproveite o sistema multi-produto para testar estratégias diferentes! Por exemplo:
                        <br />• <strong>Produto 1:</strong> Premium (alta qualidade + preço alto + distribuição seletiva)
                        <br />• <strong>Produto 2:</strong> Valor (média qualidade + preço competitivo + ampla distribuição)
                        <br />• <strong>Produto 3:</strong> Inovador (características avançadas + skimming + e-commerce)
                        <br />• <strong>Produto 4:</strong> Econômico (qualidade básica + penetração + varejo massivo)
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="analises">
                  <AccordionTrigger>5. Ferramentas de Análise Estratégica</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Na aba <strong>"Análises"</strong>, acesse:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>SWOT:</strong> Avalie forças, fraquezas, oportunidades e ameaças</li>
                      <li><strong>5 Forças de Porter:</strong> Analise a competitividade do setor</li>
                      <li><strong>Matriz BCG:</strong> Posicione seus produtos estrategicamente</li>
                      <li><strong>PESTEL:</strong> Identifique fatores externos que afetam seu negócio</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      <em><strong>Importante:</strong> Todas as 4 ferramentas são obrigatórias antes de enviar decisões!</em>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ia-analises">
                  <AccordionTrigger>5.1 Análises Automáticas via IA</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="bg-[#1447e6]/10 dark:bg-[#1447e6]/15 border-l-4 border-[#1447e6] p-4 rounded-md mb-4">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">✨ Geração Automática nas Rodadas 1, 2 e 3</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        O sistema gera automaticamente análises estratégicas (SWOT, Porter, BCG, PESTEL) quando as 3 primeiras rodadas são liberadas. 
                        Você receberá análises prontas que servem como ponto de partida - personalize e aprimore conforme necessário!
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        <strong>A partir da Rodada 4:</strong> As análises ficam em branco para você preencher do zero, demonstrando autonomia estratégica.
                      </p>
                    </div>

                    <p><strong>Como funciona:</strong></p>
                    <p className="text-sm">As análises estratégicas automáticas (SWOT, Porter, BCG, PESTEL) são personalizadas considerando:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li>Setor de mercado da turma</li>
                      <li>Contexto econômico atual (câmbio, inflação, PIB)</li>
                      <li>Eventos de mercado ativos na rodada</li>
                      <li>Configurações da turma (tipo de negócio, concorrência, tamanho do mercado)</li>
                      <li>Identidade e posicionamento da sua empresa</li>
                    </ul>
                    
                    <p className="text-sm mt-2"><strong>Recomendações dos 4 Ps:</strong></p>
                    <p className="text-sm">Além das análises estratégicas, o sistema gera recomendações específicas para cada P do Marketing Mix:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li><strong>Produto:</strong> Sugestões sobre qualidade, características e posicionamento</li>
                      <li><strong>Preço:</strong> Orientações sobre estratégia de precificação e margens</li>
                      <li><strong>Praça:</strong> Dicas sobre canais de distribuição e cobertura</li>
                      <li><strong>Promoção:</strong> Conselhos sobre mix de comunicação e investimentos</li>
                    </ul>
                    
                    <p className="text-sm mt-2"><strong>Visualização:</strong></p>
                    <p className="text-sm">As recomendações aparecem em cards destacados no topo de cada aba dos 4 Ps na página de Decisões. Use essas recomendações como guia estratégico!</p>
                    
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded-md mt-3">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">💡 Dica Importante:</p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Todas as informações que você salvar nas Análises Estratégicas são <strong>preservadas automaticamente</strong> enquanto a rodada estiver aberta. 
                        Não se preocupe em perder dados - salve quantas vezes quiser!
                      </p>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      <em>Nota: O professor também pode gerar análises manualmente através do botão "Gerar Análises IA" na página de Controle de Rodadas, se necessário.</em>
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="alinhamento">
                  <AccordionTrigger>5.2 Sistema de Alinhamento Estratégico</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">O que é alinhamento estratégico?</p>
                      <p className="text-sm">O alinhamento estratégico mede o quanto suas decisões do Mix de Marketing (4 Ps) estão conectadas e coerentes com suas análises estratégicas (SWOT, Porter, BCG, PESTEL). Um alto alinhamento significa que você está tomando decisões baseadas em análise, não em "achismo".</p>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="font-semibold mb-2">Como o score é calculado (0-100 pontos):</p>
                      <p className="text-sm mb-2">O sistema analisa automaticamente a coerência entre suas ferramentas estratégicas e decisões práticas:</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[120px]">SWOT × Mix:</span>
                          <span>Decisões exploram suas forças? Minimizam fraquezas? Aproveitam oportunidades? Mitigam ameaças?</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[120px]">Porter × Mix:</span>
                          <span>Estratégia de preço considera rivalidade? Produto se diferencia de substitutos? Promoção responde à pressão competitiva?</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[120px]">BCG × Mix:</span>
                          <span>Investimento promocional reflete o quadrante do produto? Preço e qualidade condizem com a estratégia de portfólio?</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[120px]">PESTEL × Mix:</span>
                          <span>Decisões consideram fatores econômicos? Respondem a mudanças tecnológicas? Adaptam-se ao contexto político/social?</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="font-semibold mb-2">Níveis de alinhamento:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md font-semibold min-w-[100px] text-center">90-100</div>
                          <span>Excelente - Estratégia e execução totalmente alinhadas</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md font-semibold min-w-[100px] text-center">70-89</div>
                          <span>Bom - Decisões bem fundamentadas com pequenas inconsistências</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-md font-semibold min-w-[100px] text-center">50-69</div>
                          <span>Médio - Alinhamento parcial, precisa de melhorias</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-md font-semibold min-w-[100px] text-center">30-49</div>
                          <span>Fraco - Desconexão significativa entre análise e ação</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md font-semibold min-w-[100px] text-center">&lt; 30</div>
                          <span>Crítico - Estratégia e execução completamente desalinhadas</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="font-semibold mb-2 text-destructive">Impactos financeiros do alinhamento:</p>
                      <p className="text-sm mb-2">O score de alinhamento afeta diretamente seus resultados financeiros na rodada:</p>
                      <ul className="list-disc pl-6 text-sm space-y-1">
                        <li><strong>Receita:</strong> Varia de -25% (crítico) a +15% (excelente) dependendo do alinhamento</li>
                        <li><strong>Lucro:</strong> Varia de -35% (crítico) a +20% (excelente) - impacto amplificado</li>
                        <li><strong>Market Share:</strong> Varia de -15% (crítico) a +10% (excelente)</li>
                        <li><strong>Percepção de Marca:</strong> Análise SWOT bem feita aumenta até +8%; mal feita diminui até -8%</li>
                      </ul>
                      <p className="text-sm text-destructive mt-2">
                        <strong>Importante:</strong> Decisões sem fundamento estratégico custam caro! Use as ferramentas de análise como base para suas escolhas.
                      </p>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="font-semibold mb-2">Onde ver seu score de alinhamento:</p>
                      <ul className="list-disc pl-6 text-sm space-y-1">
                        <li><strong>Dashboard:</strong> Card de "Alinhamento Estratégico" aparece após o encerramento da rodada, mostrando seu score e problemas detectados</li>
                        <li><strong>Página do Professor:</strong> O professor vê uma tabela comparativa com os scores de alinhamento de todas as equipes</li>
                      </ul>
                    </div>

                    <div className="mt-4 p-4 bg-primary/10 rounded-md border border-primary/20">
                      <p className="font-semibold text-primary mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Dica para maximizar seu alinhamento:
                      </p>
                      <ol className="list-decimal pl-6 text-sm space-y-1">
                        <li>Sempre complete as 4 análises estratégicas ANTES de definir o Mix de Marketing</li>
                        <li>Revise suas análises durante a definição dos 4 Ps e faça conexões explícitas</li>
                        <li>Personalize as análises estratégicas com insights específicos da sua equipe</li>
                        <li>Verifique se cada decisão tem um "porquê" baseado nas análises</li>
                        <li>Após submeter, leia o feedback de alinhamento e ajuste na próxima rodada</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ciclo-decisao">
                  <AccordionTrigger>6. Ciclo de Decisão Estratégica</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-md mb-4">
                      <p className="font-semibold text-primary mb-2">📊 Fluxo Obrigatório de Cada Rodada</p>
                      <p className="text-sm">
                        O Simula+ exige um processo sequencial de decisão baseado em metodologia científica de planejamento estratégico. 
                        Este fluxo garante que suas decisões sejam fundamentadas em análise, não em intuição.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-blue-900 dark:text-blue-100">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                          Diagnóstico Estratégico (Análises)
                        </h4>
                        <p className="text-sm mb-2">
                          <strong>O que fazer:</strong> Preencher as 4 ferramentas estratégicas (SWOT, Porter, BCG, PESTEL)
                        </p>
                        <p className="text-sm mb-2">
                          <strong>Objetivo:</strong> Compreender profundamente o ambiente interno, externo, competitivo e macro-ambiental antes de tomar qualquer decisão
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li><strong>SWOT:</strong> Autoconhecimento - identifique suas vantagens competitivas e vulnerabilidades</li>
                          <li><strong>Porter:</strong> Entenda as forças competitivas que moldam sua indústria</li>
                          <li><strong>BCG:</strong> Avalie o posicionamento estratégico dos seus 4 produtos no portfólio</li>
                          <li><strong>PESTEL:</strong> Identifique tendências macro-ambientais (políticas, econômicas, sociais, tecnológicas, ambientais, legais)</li>
                        </ul>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 italic">
                          💡 Dica: Nas rodadas 1-3, você recebe análises automáticas geradas por IA. Personalize-as com insights da sua equipe!
                        </p>
                      </div>

                      <div className="border-l-4 border-green-500 pl-4 bg-green-50 dark:bg-green-950 p-3 rounded-md">
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-green-900 dark:text-green-100">
                          <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                          Definição do Marketing Mix (4 Ps)
                        </h4>
                        <p className="text-sm mb-2">
                          <strong>O que fazer:</strong> Tomar decisões táticas sobre Produto, Preço, Praça e Promoção
                        </p>
                        <p className="text-sm mb-2">
                          <strong>Objetivo:</strong> Traduzir as análises estratégicas em ações concretas de marketing
                        </p>
                        <div className="space-y-2 mt-2">
                          <div className="text-sm">
                            <strong className="text-green-700 dark:text-green-300">Produto:</strong> Baseie-se no SWOT (suas forças/fraquezas) e BCG (posicionamento do produto)
                          </div>
                          <div className="text-sm">
                            <strong className="text-green-700 dark:text-green-300">Preço:</strong> Considere Porter (poder dos compradores) e PESTEL (fatores econômicos)
                          </div>
                          <div className="text-sm">
                            <strong className="text-green-700 dark:text-green-300">Praça:</strong> Alinhe com BCG (cobertura por produto) e Porter (poder dos fornecedores)
                          </div>
                          <div className="text-sm">
                            <strong className="text-green-700 dark:text-green-300">Promoção:</strong> Reflita SWOT (comunicação de forças) e PESTEL (tendências sociais/tecnológicas)
                          </div>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2 italic">
                          ⚠️ Importante: Cada decisão dos 4 Ps deve ter conexão lógica com pelo menos uma análise estratégica!
                        </p>
                      </div>

                      <div className="border-l-4 border-purple-500 pl-4 bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-purple-900 dark:text-purple-100">
                          <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                          Submissão e Validação
                        </h4>
                        <p className="text-sm mb-2">
                          <strong>O que fazer:</strong> Revisar alinhamento estratégico e enviar decisões finais
                        </p>
                        <p className="text-sm mb-2">
                          <strong>Checklist pré-submissão:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li>✅ As 4 ferramentas estratégicas estão completas e personalizadas?</li>
                          <li>✅ Os 4 Ps foram decididos para todos os produtos?</li>
                          <li>✅ Orçamento não foi excedido?</li>
                          <li>✅ Decisões fazem sentido em conjunto (coerência estratégica)?</li>
                          <li>✅ Líder da equipe confirmou aprovação?</li>
                        </ul>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-2 italic">
                          🎯 Após submissão: O sistema calcula automaticamente seu score de alinhamento estratégico (0-100)
                        </p>
                      </div>

                      <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 dark:bg-orange-950 p-3 rounded-md">
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-orange-900 dark:text-orange-100">
                          <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                          Análise de Resultados e Aprendizado
                        </h4>
                        <p className="text-sm mb-2">
                          <strong>O que fazer:</strong> Estudar KPIs, ranking, feedback de IA e preparar próxima rodada
                        </p>
                        <p className="text-sm mb-2">
                          <strong>Onde encontrar insights:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li><strong>Dashboard:</strong> KPIs, gráficos de evolução, alinhamento estratégico</li>
                          <li><strong>Resultados:</strong> DRE completo, Balanço Patrimonial, análise financeira detalhada</li>
                          <li><strong>Feedback de IA:</strong> Análise Socrática das suas decisões (perguntas reflexivas)</li>
                          <li><strong>Insights de Mercado:</strong> Análise competitiva, badges de desempenho, comparação com líderes</li>
                        </ul>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-2 italic">
                          📈 Use os resultados para ajustar estratégia na próxima rodada - aprendizado contínuo!
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-md">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">⏱️ Gestão de Tempo na Rodada</p>
                      <p className="text-sm mb-2">O professor define datas de início e fim para cada rodada. Organize-se para:</p>
                      <ul className="list-disc pl-6 text-sm space-y-1">
                        <li><strong>Primeiros 40% do prazo:</strong> Completar análises estratégicas com profundidade</li>
                        <li><strong>Próximos 40% do prazo:</strong> Definir Marketing Mix alinhado às análises</li>
                        <li><strong>Últimos 20% do prazo:</strong> Revisão, discussão em equipe e submissão</li>
                      </ul>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                        <strong>Lembre-se:</strong> Salve frequentemente! Todas as informações são preservadas automaticamente durante a rodada.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="resultados">
                  <AccordionTrigger>7. Acompanhamento de Resultados</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>No <strong>Dashboard</strong>, monitore:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>KPIs:</strong> Receita, Lucro, Market Share, ROI, Satisfação do Cliente</li>
                      <li><strong>Gráficos:</strong> Evolução dos indicadores ao longo das rodadas</li>
                      <li><strong>Ranking:</strong> Compare seu desempenho com outras equipes</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="orcamento">
                  <AccordionTrigger>7. Gestão de Orçamento</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>Na aba <strong>"Orçamento"</strong>:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Veja seu orçamento disponível (definido pelo professor)</li>
                      <li>Acompanhe gastos com produção, distribuição e promoção</li>
                      <li>Planeje investimentos para as próximas rodadas</li>
                    </ul>
                    <p className="text-sm text-destructive mt-2">
                      <strong>Atenção:</strong> Não gaste mais do que tem disponível!
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: CONCEITOS DE MARKETING */}
        <TabsContent value="conceitos" className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#ffcc00] flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-[#0a1830]" />
                </div>
                Fundamentos de Marketing
              </CardTitle>
              <CardDescription>
                Conceitos essenciais baseados em Kotler & Armstrong
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="4ps">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#1447e6] flex items-center justify-center shrink-0">
                        <Grid3x3 className="h-4 w-4 text-white" />
                      </div>
                      Mix de Marketing (4 Ps)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg border-l-4 border-primary mb-4">
                      <p className="text-sm italic mb-2">
                        <strong>Fundamento Teórico:</strong> O conceito de Mix de Marketing, originalmente proposto como os 4 Ps (Product, Price, Place, Promotion), representa o conjunto de ferramentas táticas controláveis que a empresa combina para produzir a resposta desejada no mercado-alvo. Kotler e Armstrong destacam que o sucesso da estratégia de marketing depende da integração harmônica entre esses quatro elementos, criando uma proposta de valor coerente. Pride e Ferrell reforçam que cada decisão dentro do mix deve considerar não apenas fatores internos da organização, mas também as forças competitivas e as expectativas do consumidor contemporâneo.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4" />
                          Produto
                        </h4>
                        <p className="text-sm mb-2">
                          Conforme Kotler e Armstrong, produto é qualquer coisa que possa ser oferecida ao mercado para apreciação, aquisição, uso ou consumo, e que possa satisfazer um desejo ou necessidade. Engloba objetos físicos, serviços, pessoas, lugares, organizações e ideias. Pride e Ferrell complementam que o produto deve ser visto em três níveis: benefício central (o que o cliente realmente está comprando), produto real (qualidade, características, design, marca, embalagem) e produto ampliado (serviços adicionais e benefícios).
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li><strong>Qualidade:</strong> Nível de excelência e desempenho do produto</li>
                          <li><strong>Características:</strong> Atributos que diferenciam seu produto</li>
                          <li><strong>Design:</strong> Aparência e funcionalidade</li>
                          <li><strong>Marca:</strong> Nome, logo e identidade visual</li>
                          <li><strong>Embalagem:</strong> Proteção e comunicação visual</li>
                          <li><strong>Serviços:</strong> Pós-venda, garantia, suporte</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2">
                          <em><strong>Exemplo:</strong> iPhone (alta qualidade + design premium + marca forte)</em>
                        </p>
                      </div>

                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4" />
                          Preço
                        </h4>
                        <p className="text-sm mb-2">
                          Segundo Kotler e Armstrong, preço é o único elemento do mix de marketing que gera receita; todos os outros representam custos. Al Ries e Jack Trout argumentam que o preço não deve ser estabelecido isoladamente, mas sim como parte integral do posicionamento estratégico da marca na mente do consumidor. Um preço premium comunica qualidade superior, enquanto preço baixo pode indicar acessibilidade ou valor. Piercy, Hooley e Nicoulaud destacam que decisões de precificação devem considerar objetivos estratégicos de longo prazo, não apenas maximização de lucro imediato.
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li><strong>Penetração:</strong> Preço baixo para ganhar mercado rapidamente (Ries & Trout: útil para marcas que competem por volume)</li>
                          <li><strong>Skimming:</strong> Preço alto inicial, reduzindo ao longo do tempo (estratégia de desnatação para inovações)</li>
                          <li><strong>Valor percebido:</strong> Preço baseado no quanto o cliente valoriza (Kotler: foco no benefício, não no custo)</li>
                          <li><strong>Competitivo:</strong> Preço similar aos concorrentes (Piercy/Hooley: comum em mercados maduros)</li>
                          <li><strong>Custo-plus:</strong> Custo + margem de lucro desejada (abordagem tradicional, mas limitada estrategicamente)</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2">
                          <em><strong>Exemplo:</strong> Tesla usa skimming (preços altos iniciais para early adopters) + posicionamento premium (Ries & Trout: "primeira marca de carros elétricos de luxo")</em>
                        </p>
                      </div>

                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                          <Map className="h-4 w-4" />
                          Praça (Distribuição)
                        </h4>
                        <p className="text-sm mb-2">
                          Pride e Ferrell definem distribuição como o conjunto de atividades que tornam os produtos disponíveis aos consumidores quando e onde eles desejam comprá-los. Kotler e Armstrong enfatizam que decisões de canal são críticas porque afetam diretamente todas as outras decisões de marketing. A escolha entre distribuição intensiva, seletiva ou exclusiva deve alinhar-se ao posicionamento do produto. Piercy, Hooley e Nicoulaud destacam que canais múltiplos (omnichannel) tornaram-se essenciais na era digital, mas exigem coordenação cuidadosa para evitar conflitos de canal.
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li><strong>Canal direto:</strong> Fabricante → Cliente (e-commerce próprio)</li>
                          <li><strong>Canal indireto:</strong> Fabricante → Varejista → Cliente</li>
                          <li><strong>Multicanal:</strong> Combinação de vários canais</li>
                          <li><strong>Intensiva:</strong> Distribuição massiva (Coca-Cola)</li>
                          <li><strong>Seletiva:</strong> Poucos pontos estratégicos (Apple Store)</li>
                          <li><strong>Exclusiva:</strong> Distribuidor único por região (Ferrari)</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2">
                          <em><strong>Exemplo:</strong> Amazon combina canal direto (próprio) + marketplace (terceiros)</em>
                        </p>
                      </div>

                      <div className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                          <Megaphone className="h-4 w-4" />
                          Promoção (Comunicação)
                        </h4>
                        <p className="text-sm mb-2">
                          Kotler e Armstrong definem promoção como as atividades que comunicam os méritos do produto e persuadem clientes-alvo a comprá-lo. Pride e Ferrell explicam que o mix promocional integra propaganda, vendas pessoais, promoção de vendas, relações públicas e marketing direto. Al Ries e Jack Trout advertem que comunicação eficaz não é sobre "dizer tudo", mas sobre posicionar a marca de forma clara e memorável na mente do consumidor — menos é mais quando se trata de foco estratégico. Piercy, Hooley e Nicoulaud ressaltam a importância da consistência da mensagem across all touchpoints para construir brand equity duradouro.
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li><strong>Propaganda:</strong> TV, rádio, digital, outdoor (construção de awareness em massa)</li>
                          <li><strong>Promoção de vendas:</strong> Descontos, cupons, brindes (estímulo imediato à compra)</li>
                          <li><strong>Relações públicas:</strong> Eventos, assessoria de imprensa (credibilidade e confiança)</li>
                          <li><strong>Vendas pessoais:</strong> Equipe comercial, demonstrações (relacionamento B2B e high-ticket)</li>
                          <li><strong>Marketing digital:</strong> Redes sociais, SEO, email marketing (precisão e mensuração)</li>
                          <li><strong>Marketing de conteúdo:</strong> Blogs, vídeos, podcasts (educação e engajamento)</li>
                        </ul>
                        
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <p className="text-sm font-semibold mb-2">📊 Frequência Efetiva de Mídia: Fundamentos Científicos</p>
                          <p className="text-xs mb-3">
                            A pesquisa em comunicação de marketing estabelece que a <strong>frequência efetiva</strong> — o número de exposições necessárias para gerar resposta do consumidor — varia significativamente por tipo de mídia e objetivo de campanha. Herbert Krugman (1972) propôs a teoria das "três exposições": a primeira cria reconhecimento, a segunda gera compreensão, e a terceira funciona como lembrete para ação. Estudos posteriores de Naples (1979) e McDonald (1971) refinaram esse conceito, demonstrando que a frequência ótima depende da complexidade da mensagem e familiaridade com a marca.
                          </p>
                          <div className="space-y-2 text-xs">
                            <p><strong>Recomendações baseadas em pesquisa acadêmica:</strong></p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li><strong>Mídia de massa (TV, rádio):</strong> 3-10 exposições/semana (Tellis, 1997; Ephron, 1995)</li>
                              <li><strong>Mídia digital:</strong> 5-9 impressões para reconhecimento; 10-20 para conversão (Drèze & Hussherr, 2003)</li>
                              <li><strong>Outdoor/OOH:</strong> Mínimo 50 GRPs/semana para impacto (OAAA Research)</li>
                              <li><strong>Email marketing:</strong> 2-4 envios/mês para engajamento sem saturação (HubSpot Research, 2020)</li>
                              <li><strong>Influenciadores:</strong> 3-5 publicações/campanha para credibilidade (Influencer Marketing Hub, 2023)</li>
                              <li><strong>Eventos/feiras:</strong> Presença em 2-4 eventos/ano por mercado-alvo (CEIR Report)</li>
                              <li><strong>Material impresso:</strong> 1.000-5.000 unidades para cobertura local efetiva (DMA Response Rate Report)</li>
                            </ul>
                            <p className="mt-2 text-muted-foreground italic">
                              <strong>Nota metodológica:</strong> O Simula+ calcula automaticamente a quantidade estimada de unidades com base no seu investimento e preço unitário. As recomendações acima servem como parâmetros de referência para planejamento estratégico, não como regras fixas — a frequência ideal deve considerar objetivos específicos, ciclo de compra do produto e intensidade competitiva do mercado.
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                            <strong>Referências:</strong> Krugman, H.E. (1972). "Why Three Exposures May Be Enough", <em>Journal of Advertising Research</em>. Naples, M.J. (1979). <em>Effective Frequency</em>, ANA. Tellis, G.J. (1997). "Effective Frequency", <em>Journal of Advertising Research</em>. Drèze, X. & Hussherr, F.X. (2003). "Internet Advertising", <em>Journal of Interactive Marketing</em>.
                          </p>
                        </div>

                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-semibold mb-2">📺 27 Mídias Disponíveis no Simula+</p>
                          <p className="text-xs text-muted-foreground mb-2">Você pode escolher livremente entre todas essas opções:</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div>
                              <p className="font-semibold text-primary mt-1">Digital/Online:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Marketing Digital</li>
                                <li>Email Marketing</li>
                                <li>SMS Marketing</li>
                                <li>Podcasts</li>
                                <li>Marketing de Conteúdo</li>
                              </ul>
                              
                              <p className="font-semibold text-primary mt-2">Mass Media:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>TV Aberta/Fechada</li>
                                <li>Rádio</li>
                                <li>Cinema</li>
                                <li>Jornal e Revista</li>
                              </ul>
                              
                              <p className="font-semibold text-primary mt-2">Outdoor/Rua:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Outdoor e Mídia OOH</li>
                                <li>Carro de Som</li>
                              </ul>
                              
                              <p className="font-semibold text-primary mt-2">Material Impresso:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Panfletos e Flyers</li>
                                <li>Catálogos de Produtos</li>
                              </ul>
                            </div>
                            
                            <div>
                              <p className="font-semibold text-primary mt-1">Marketing Direto:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Telemarketing</li>
                                <li>Mala Direta</li>
                                <li>Venda Direta</li>
                              </ul>
                              
                              <p className="font-semibold text-primary mt-2">Eventos & Patrocínio:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Eventos e Feiras</li>
                                <li>Patrocínio</li>
                              </ul>
                              
                              <p className="font-semibold text-primary mt-2">Influência & PR:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Influenciadores</li>
                                <li>Relações Públicas</li>
                              </ul>
                              
                              <p className="font-semibold text-primary mt-2">Promoções & PDV:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Cupons de Desconto</li>
                                <li>Promoções Sazonais (Black Friday, etc)</li>
                                <li>Promoções de Vendas</li>
                                <li>Merchandising no PDV</li>
                              </ul>
                              
                              <p className="font-semibold text-primary mt-2">Estratégico:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Product Placement</li>
                                <li>Marketing de Guerrilha</li>
                                <li>Parcerias Estratégicas</li>
                              </ul>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            💡 Todas as mídias são opcionais. Escolha as que fazem sentido para sua estratégia!
                          </p>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-3">
                          <em><strong>Exemplo:</strong> Red Bull investe pesado em eventos esportivos (experiencial)</em>
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="swot">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#1aa15c] flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      Análise SWOT (FOFA)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm mb-3">
                      <strong>Fundamento Teórico:</strong> A matriz SWOT (Strengths, Weaknesses, Opportunities, Threats), desenvolvida por Albert Humphrey na década de 1960, é uma ferramenta fundamental de planejamento estratégico. Hoskisson, Hitt, Ireland e Harrison destacam que a análise SWOT permite às organizações identificarem competências distintivas (forças) e vulnerabilidades (fraquezas) internas, enquanto simultaneamente avaliam oportunidades emergentes e ameaças ambientais externas. Kotler e Armstrong enfatizam que o poder da SWOT reside em sua capacidade de combinar análise interna (recursos e capacidades) com análise externa (ambiente de mercado), formando a base para decisões estratégicas fundamentadas.
                    </p>
                    <p className="text-sm">
                      Pride e Ferrell ressaltam que a eficácia da SWOT depende de honestidade na autoavaliação e profundidade na análise ambiental — superficialidade compromete decisões estratégicas subsequentes.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                        <h4 className="font-bold mb-2 text-green-700 dark:text-green-300">Forças (Strengths)</h4>
                        <p className="text-sm mb-2">Vantagens internas da empresa</p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li>Marca forte</li>
                          <li>Tecnologia avançada</li>
                          <li>Equipe qualificada</li>
                          <li>Recursos financeiros</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                        <h4 className="font-bold mb-2 text-red-700 dark:text-red-300">Fraquezas (Weaknesses)</h4>
                        <p className="text-sm mb-2">Limitações internas</p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li>Falta de recursos</li>
                          <li>Processos ineficientes</li>
                          <li>Marca desconhecida</li>
                          <li>Dependência de fornecedor</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                        <h4 className="font-bold mb-2 text-blue-700 dark:text-blue-300">Oportunidades (Opportunities)</h4>
                        <p className="text-sm mb-2">Fatores externos favoráveis</p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li>Mercado em crescimento</li>
                          <li>Novas tecnologias</li>
                          <li>Mudanças regulatórias</li>
                          <li>Tendências de consumo</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950">
                        <h4 className="font-bold mb-2 text-orange-700 dark:text-orange-300">Ameaças (Threats)</h4>
                        <p className="text-sm mb-2">Fatores externos desfavoráveis</p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li>Novos concorrentes</li>
                          <li>Crise econômica</li>
                          <li>Mudança de preferências</li>
                          <li>Produtos substitutos</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-primary/10 border-l-4 border-primary rounded-md">
                      <p className="font-semibold text-primary mb-2">📝 Como usar SWOT no Simula+</p>
                      <p className="text-sm mb-3">Siga este passo a passo para preencher sua análise SWOT no sistema:</p>
                      <ol className="list-decimal pl-6 text-sm space-y-2">
                        <li><strong>Forças:</strong> Identifique 3-5 vantagens competitivas da sua equipe. Ex: "Equipe domina marketing digital", "Posicionamento premium bem definido", "Logo memorável e diferenciada"</li>
                        <li><strong>Fraquezas:</strong> Liste 3-5 limitações honestas. Ex: "Orçamento menor que concorrentes", "Pouca experiência em eventos presenciais", "Marca ainda desconhecida no mercado"</li>
                        <li><strong>Oportunidades:</strong> Analise eventos da rodada e tendências do setor. Ex: "Crescimento de 8% no setor de bebidas saudáveis", "Novo segmento de jovens 18-25 em expansão", "Tecnologia 5G facilitando marketing digital"</li>
                        <li><strong>Ameaças:</strong> Identifique riscos externos. Ex: "Concorrente lançou produto similar", "Alta do dólar aumentando custos", "Mudança regulatória em embalagens"</li>
                      </ol>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 rounded-md">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">❓ Perguntas Norteadoras (SWOT)</p>
                      <p className="text-sm mb-2">Use estas perguntas para guiar sua análise:</p>
                      <div className="space-y-2 text-sm">
                        <div><strong className="text-green-700 dark:text-green-300">Forças:</strong> O que fazemos melhor que os concorrentes? Quais recursos únicos temos? Nossa marca tem reconhecimento?</div>
                        <div><strong className="text-red-700 dark:text-red-300">Fraquezas:</strong> Onde perdemos para concorrentes? Que recursos nos faltam? Onde nossa execução é fraca?</div>
                        <div><strong className="text-blue-700 dark:text-blue-300">Oportunidades:</strong> Que tendências favorecem nosso negócio? Existem nichos mal atendidos? Tecnologias emergentes podem nos ajudar?</div>
                        <div><strong className="text-orange-700 dark:text-orange-300">Ameaças:</strong> Quem são nossos principais concorrentes? Mudanças econômicas nos prejudicam? Regulação pode afetar nosso produto?</div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 rounded-md">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">💡 Exemplo Prático - Equipe "EcoVida" (Bebidas Saudáveis)</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong className="text-green-700 dark:text-green-300">Forças:</strong> "Equipe tem expertise em nutrição", "Posicionamento sustentável autêntico", "Forte presença em redes sociais (10k seguidores)"
                        </div>
                        <div>
                          <strong className="text-red-700 dark:text-red-300">Fraquezas:</strong> "Orçamento 30% menor que líder de mercado", "Capacidade produtiva limitada", "Marca nova sem reconhecimento"
                        </div>
                        <div>
                          <strong className="text-blue-700 dark:text-blue-300">Oportunidades:</strong> "Crescimento de 12% em produtos orgânicos", "Geração Z busca marcas sustentáveis", "Influenciadores de saúde em alta"
                        </div>
                        <div>
                          <strong className="text-orange-700 dark:text-orange-300">Ameaças:</strong> "Concorrente gigante lançou linha orgânica", "Inflação reduzindo poder de compra", "Regulação mais rígida em rotulagem"
                        </div>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 italic">
                        ➡️ <strong>Conexão com Marketing Mix:</strong> Forças justificam preço premium e promoção digital; Fraquezas exigem distribuição seletiva; Oportunidades indicam foco em Geração Z; Ameaças demandam diferenciação pela sustentabilidade.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="porter">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#ff8c1a] flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      5 Forças de Porter
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm mb-3">
                      <strong>Fundamento Teórico:</strong> Desenvolvido por Michael Porter em 1979, o modelo das Cinco Forças revolucionou a análise da estratégia competitiva ao demonstrar que a rentabilidade de um setor não depende apenas da competição direta, mas de cinco forças estruturais. Hoskisson, Hitt, Ireland e Harrison afirmam que este framework permite às empresas identificarem as fontes de pressão competitiva e desenvolverem estratégias defensivas ou ofensivas apropriadas. Porter argumenta que a intensidade coletiva dessas forças determina o potencial de lucro final de um setor — setores com forças intensas (ex: aéreas, varejo) tendem a ter margens menores, enquanto setores com forças fracas (ex: software, farmacêutico) podem sustentar retornos superiores.
                    </p>
                    <p className="text-sm">
                      Piercy, Hooley e Nicoulaud complementam que a análise das cinco forças deve ser dinâmica, reconhecendo que mudanças tecnológicas, regulatórias e sociais podem rapidamente alterar o equilíbrio de poder em qualquer setor.
                    </p>
                    <div className="space-y-3">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">1. Rivalidade entre Concorrentes</h4>
                        <p className="text-sm">Intensidade da competição no setor. Alta rivalidade reduz lucratividade.</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">2. Ameaça de Novos Entrantes</h4>
                        <p className="text-sm">Facilidade de novas empresas entrarem no mercado. Barreiras altas protegem empresas estabelecidas.</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">3. Poder de Barganha dos Fornecedores</h4>
                        <p className="text-sm">Capacidade dos fornecedores imporem condições. Poucos fornecedores = maior poder.</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">4. Poder de Barganha dos Clientes</h4>
                        <p className="text-sm">Capacidade dos clientes negociarem preços. Clientes concentrados = maior poder.</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">5. Ameaça de Produtos Substitutos</h4>
                        <p className="text-sm">Disponibilidade de alternativas. Ex: Uber substituiu táxis tradicionais.</p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-primary/10 border-l-4 border-primary rounded-md">
                      <p className="font-semibold text-primary mb-2">📝 Como usar Porter no Simula+</p>
                      <p className="text-sm mb-3">Analise cada uma das 5 forças para entender a intensidade competitiva do seu setor:</p>
                      <ol className="list-decimal pl-6 text-sm space-y-2">
                        <li><strong>Rivalidade:</strong> Quantas equipes competem diretamente? Quão agressiva é a concorrência? Ex: "4 equipes vendem bebidas, competição intensa em preço"</li>
                        <li><strong>Novos Entrantes:</strong> É fácil novos concorrentes entrarem? Existem barreiras? Ex: "Professor pode adicionar novas equipes, barreiras baixas"</li>
                        <li><strong>Fornecedores:</strong> Temos poder de negociação com fornecedores? Ex: "Fornecedores padronizados, baixo poder de barganha"</li>
                        <li><strong>Clientes:</strong> Consumidores têm poder de escolha? São sensíveis a preço? Ex: "Classe C é sensível a preço, alto poder de barganha"</li>
                        <li><strong>Substitutos:</strong> Existem alternativas ao nosso produto? Ex: "Água mineral substitui bebidas saudáveis, ameaça moderada"</li>
                      </ol>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 rounded-md">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">❓ Perguntas Norteadoras (Porter)</p>
                      <p className="text-sm mb-2">Use estas perguntas para avaliar cada força:</p>
                      <div className="space-y-2 text-sm">
                        <div><strong>Rivalidade:</strong> Quantos concorrentes diretos? Eles competem em preço ou diferenciação? Mercado está saturado?</div>
                        <div><strong>Novos Entrantes:</strong> É fácil entrar neste mercado? Quais barreiras existem (capital, tecnologia, marca)? Professor permite novas equipes?</div>
                        <div><strong>Fornecedores:</strong> Dependemos de poucos fornecedores? Eles podem aumentar preços facilmente? Existem alternativas?</div>
                        <div><strong>Clientes:</strong> Nosso público-alvo é sensível a preço? Têm muitas opções? São fiéis a marcas?</div>
                        <div><strong>Substitutos:</strong> Existem produtos que atendem a mesma necessidade de forma diferente? São mais baratos? Mais convenientes?</div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 rounded-md">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">💡 Exemplo Prático - Setor de Tecnologia Educacional</p>
                      <div className="space-y-2 text-sm">
                        <div><strong>1. Rivalidade (ALTA):</strong> "5 equipes competem por mesmo mercado de apps educacionais, guerra de preços frequente"</div>
                        <div><strong>2. Novos Entrantes (MÉDIA):</strong> "Barreiras moderadas: exige desenvolvedores qualificados, mas capital inicial baixo"</div>
                        <div><strong>3. Fornecedores (BAIXA):</strong> "Muitas opções de cloud (AWS, Azure, Google), baixo poder de fornecedores"</div>
                        <div><strong>4. Clientes (ALTA):</strong> "Estudantes compararam preços facilmente, alta sensibilidade, baixa fidelidade"</div>
                        <div><strong>5. Substitutos (ALTA):</strong> "YouTube, Khan Academy (gratuitos) são substitutos fortes"</div>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 italic">
                        ➡️ <strong>Conclusão Estratégica:</strong> Setor com intensidade competitiva ALTA. Estratégia recomendada: diferenciação (não competir em preço), foco em nicho específico, construir fidelidade via qualidade excepcional.
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 italic">
                        ➡️ <strong>Conexão com Marketing Mix:</strong> Produto deve ter diferencial claro; Preço premium com proposta de valor forte; Praça seletiva (não tentar atingir todos); Promoção focada em demonstrar superioridade.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bcg">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#7c3aed] flex items-center justify-center shrink-0">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      Matriz BCG
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm mb-3">
                      <strong>Fundamento Teórico:</strong> Criada por Bruce Henderson, fundador do Boston Consulting Group (BCG), em 1970, esta matriz revolucionou a gestão de portfólio ao introduzir uma abordagem sistemática para alocação de recursos entre unidades de negócio. Hoskisson, Hitt, Ireland e Harrison explicam que a matriz cruza duas dimensões — taxa de crescimento do mercado (atratividade externa) e participação de mercado relativa (força competitiva interna) — para classificar produtos em quatro categorias estratégicas distintas, cada uma com recomendações específicas de investimento. Kotler e Armstrong destacam que o poder da BCG reside em sua simplicidade visual, permitindo que gestores identifiquem rapidamente onde investir (Stars), onde colher caixa (Cash Cows), onde apostar (Question Marks) ou onde desinvestir (Dogs).
                    </p>
                    <p className="text-sm">
                      Pride e Ferrell advertem que a matriz, embora poderosa, não deve ser usada isoladamente — mercados dinâmicos exigem análise complementar de fatores qualitativos como sinergias, competências core e alinhamento estratégico.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950">
                        <h4 className="font-bold mb-2">Estrelas (Stars)</h4>
                        <p className="text-sm mb-2"><strong>Alto crescimento + Alta participação</strong></p>
                        <p className="text-sm">Produtos líderes em mercados crescentes. Requerem investimento para manter posição.</p>
                      </div>
                      <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                        <h4 className="font-bold mb-2">Vacas Leiteiras (Cash Cows)</h4>
                        <p className="text-sm mb-2"><strong>Baixo crescimento + Alta participação</strong></p>
                        <p className="text-sm">Produtos maduros que geram caixa. Investimento mínimo, lucro máximo.</p>
                      </div>
                      <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                        <h4 className="font-bold mb-2">Interrogações (Question Marks)</h4>
                        <p className="text-sm mb-2"><strong>Alto crescimento + Baixa participação</strong></p>
                        <p className="text-sm">Produtos com potencial, mas incertos. Decisão: investir ou abandonar?</p>
                      </div>
                      <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                        <h4 className="font-bold mb-2">Abacaxis (Dogs)</h4>
                        <p className="text-sm mb-2"><strong>Baixo crescimento + Baixa participação</strong></p>
                        <p className="text-sm">Produtos com baixo retorno. Considerar desinvestimento.</p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-primary/10 border-l-4 border-primary rounded-md">
                      <p className="font-semibold text-primary mb-2">📝 Como usar BCG no Simula+</p>
                      <p className="text-sm mb-3">Classifique cada um dos 4 produtos do seu portfólio em um quadrante:</p>
                      <ol className="list-decimal pl-6 text-sm space-y-2">
                        <li><strong>Identifique crescimento do mercado:</strong> Produtos em segmentos com crescimento {'>'}10% = alto; {'<'}10% = baixo</li>
                        <li><strong>Avalie participação de mercado:</strong> Compare suas vendas com líderes. Se vende {'>'}50% do líder = alta; {'<'}50% = baixa</li>
                        <li><strong>Classifique cada produto:</strong> Estrela (alto/alto), Vaca Leiteira (baixo/alto), Interrogação (alto/baixo), Abacaxi (baixo/baixo)</li>
                        <li><strong>Defina estratégia por quadrante:</strong> Estrelas (investir pesado), Vacas (colher lucro), Interrogações (apostar ou abandonar), Abacaxis (desinvestir)</li>
                      </ol>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 rounded-md">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">❓ Perguntas Norteadoras (BCG)</p>
                      <p className="text-sm mb-2">Perguntas para classificar seus produtos:</p>
                      <div className="space-y-2 text-sm">
                        <div><strong>Crescimento:</strong> O segmento deste produto está crescendo ou estagnado? Há novas tendências favorecendo-o?</div>
                        <div><strong>Participação:</strong> Somos líderes neste produto? Vendemos mais que os concorrentes? Quanto de market share temos?</div>
                        <div><strong>Investimento:</strong> Qual produto merece mais recursos de marketing? Qual está gerando mais caixa?</div>
                        <div><strong>Portfólio equilibrado:</strong> Temos produtos em todos os quadrantes? Dependemos muito de um único produto?</div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 rounded-md">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">💡 Exemplo Prático - Portfólio "TechGadgets"</p>
                      <div className="space-y-2 text-sm">
                        <div><strong>Produto A - Smartwatch:</strong> ESTRELA (mercado crescendo 15%, líder com 35% share). Estratégia: Investir pesado em P&D e marketing para manter liderança</div>
                        <div><strong>Produto B - Fone Bluetooth:</strong> VACA LEITEIRA (mercado crescendo 3%, líder com 40% share). Estratégia: Colher lucro, investimento mínimo, usar caixa para financiar Estrelas</div>
                        <div><strong>Produto C - Óculos VR:</strong> INTERROGAÇÃO (mercado crescendo 20%, apenas 8% share). Estratégia: Decisão crítica - investir agressivamente ou abandonar?</div>
                        <div><strong>Produto D - MP3 Player:</strong> ABACAXI (mercado crescendo -5%, apenas 6% share). Estratégia: Desinvestir gradualmente, realocar recursos</div>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 italic">
                        ➡️ <strong>Estratégia de Portfólio:</strong> Usar caixa do Fone (Vaca) para investir no Smartwatch (Estrela) e apostar nos Óculos VR (Interrogação). Descontinuar MP3 Player (Abacaxi).
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 italic">
                        ➡️ <strong>Conexão com Marketing Mix:</strong> Estrela recebe 50% do orçamento promocional; Vaca usa distribuição intens iva e preço competitivo; Interrogação precisa de inovação em Produto; Abacaxi reduz qualidade e preço para liquidar estoque.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pestel">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#ffcc00] flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4 text-[#0a1830]" />
                      </div>
                      Análise PESTEL
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm mb-3">
                      <strong>Fundamento Teórico:</strong> A análise PESTEL (Political, Economic, Social, Technological, Environmental, Legal) é uma extensão do modelo PEST original, incorporando fatores ambientais e legais que ganharam relevância estratégica nas últimas décadas. Hoskisson, Hitt, Ireland e Harrison enfatizam que esta ferramenta permite às organizações mapearem sistematicamente forças macroambientais que estão além do controle individual da empresa, mas que podem criar oportunidades significativas ou ameaças disruptivas. Kotler e Armstrong destacam que empresas proativas usam PESTEL não apenas para antecipação de riscos, mas principalmente para identificação precoce de tendências emergentes que podem ser convertidas em vantagens competitivas.
                    </p>
                    <p className="text-sm">
                      Piercy, Hooley e Nicoulaud ressaltam que em mercados globalizados e voláteis, a análise PESTEL deve ser contínua e adaptativa, não um exercício anual estático — mudanças regulatórias, tecnológicas ou sociais podem rapidamente redefinir as regras do jogo competitivo.
                    </p>
                    <div className="space-y-2">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">P - Político</h4>
                        <p className="text-sm">Estabilidade política, políticas governamentais, regulamentações</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">E - Econômico</h4>
                        <p className="text-sm">Inflação, taxa de juros, câmbio, crescimento do PIB, emprego</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">S - Social</h4>
                        <p className="text-sm">Demografia, cultura, educação, tendências de consumo</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">T - Tecnológico</h4>
                        <p className="text-sm">Inovações, automação, digitalização, P&D</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">E - Ecológico/Ambiental</h4>
                        <p className="text-sm">Sustentabilidade, mudanças climáticas, regulações ambientais</p>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold">L - Legal</h4>
                        <p className="text-sm">Leis trabalhistas, proteção ao consumidor, propriedade intelectual</p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-primary/10 border-l-4 border-primary rounded-md">
                      <p className="font-semibold text-primary mb-2">📝 Como usar PESTEL no Simula+</p>
                      <p className="text-sm mb-3">Analise cada dimensão macro-ambiental e identifique impactos no seu negócio:</p>
                      <ol className="list-decimal pl-6 text-sm space-y-2">
                        <li><strong>Político:</strong> Verifique eventos políticos na rodada. Ex: "Governo anunciou programa de incentivo a startups (oportunidade)"</li>
                        <li><strong>Econômico:</strong> Analise dados econômicos fornecidos pelo sistema (câmbio, inflação, PIB). Ex: "Dólar subiu 15%, aumentando custos de importação"</li>
                        <li><strong>Social:</strong> Identifique tendências sociais do setor. Ex: "Geração Z valoriza sustentabilidade", "Aumento do trabalho remoto"</li>
                        <li><strong>Tecnológico:</strong> Liste inovações tecnológicas relevantes. Ex: "IA facilita automação de marketing", "5G permite experiências imersivas"</li>
                        <li><strong>Ambiental:</strong> Considere pressões ecológicas. Ex: "Consumidores exigem embalagens recicláveis", "Mudança climática afeta logística"</li>
                        <li><strong>Legal:</strong> Identifique mudanças regulatórias. Ex: "LGPD exige proteção de dados", "Nova lei de rotulagem nutricional"</li>
                      </ol>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 rounded-md">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">❓ Perguntas Norteadoras (PESTEL)</p>
                      <p className="text-sm mb-2">Perguntas-chave para cada dimensão:</p>
                      <div className="space-y-2 text-sm">
                        <div><strong>Político:</strong> Há eleições próximas? Mudanças de governo podem afetar nosso setor? Programas de incentivo disponíveis?</div>
                        <div><strong>Econômico:</strong> A economia está crescendo ou em recessão? Como inflação e câmbio afetam custos e preços?</div>
                        <div><strong>Social:</strong> Que mudanças demográficas estão ocorrendo? Novos valores culturais emergindo? Comportamento do consumidor mudando?</div>
                        <div><strong>Tecnológico:</strong> Que tecnologias disruptivas ameaçam ou favorecem nosso negócio? IA, IoT, blockchain são relevantes?</div>
                        <div><strong>Ambiental:</strong> Pressões ambientais afetam produção? Consumidores valorizam sustentabilidade? Regulações ambientais mais rígidas?</div>
                        <div><strong>Legal:</strong> Novas leis impactam operação? Proteção ao consumidor mudou? Restrições regulatórias no horizonte?</div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 rounded-md">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">💡 Exemplo Prático - Empresa "GreenPack" (Embalagens Sustentáveis)</p>
                      <div className="space-y-2 text-sm">
                        <div><strong>Político:</strong> "Governo lançou subsídios para empresas verdes (OPORTUNIDADE: reduz custos em 20%)"</div>
                        <div><strong>Econômico:</strong> "Inflação de 8% aumenta custos de matéria-prima (AMEAÇA: precisa repassar ao preço)"</div>
                        <div><strong>Social:</strong> "70% dos jovens preferem marcas sustentáveis (OPORTUNIDADE: público-alvo em expansão)"</div>
                        <div><strong>Tecnológico:</strong> "Nova tecnologia de bioplástico reduz custos em 30% (OPORTUNIDADE: vantagem competitiva)"</div>
                        <div><strong>Ambiental:</strong> "Lei proíbe plástico descartável em 2025 (OPORTUNIDADE GIGANTE: demanda obrigatória por alternativas)"</div>
                        <div><strong>Legal:</strong> "LGPD exige consentimento para coleta de dados de clientes (AMEAÇA: custo de compliance)"</div>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 italic">
                        ➡️ <strong>Conclusão Estratégica:</strong> Ambiente macro FAVORÁVEL para GreenPack. Tendências políticas, sociais, tecnológicas e ambientais convergem para crescimento acelerado. Única ameaça significativa é econômica (inflação).
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 italic">
                        ➡️ <strong>Conexão com Marketing Mix:</strong> Produto enfatiza sustentabilidade e conformidade legal; Preço justifica-se por tendência social pró-verde; Praça foca varejo consciente; Promoção comunica benefícios ambientais e aproveitamento de subsídios governamentais.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="concorrencia">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#2f2a8f] flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      Análise de Concorrência
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm">
                      Estudo sistemático dos competidores para identificar vantagens competitivas e oportunidades de diferenciação.
                    </p>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-4 bg-muted">
                        <h4 className="font-bold mb-2">Etapas da Análise Competitiva</h4>
                        <ol className="list-decimal pl-6 text-sm space-y-2">
                          <li><strong>Identificação:</strong> Quem são seus concorrentes diretos e indiretos?</li>
                          <li><strong>Benchmarking:</strong> Compare produtos, preços, canais e estratégias de comunicação</li>
                          <li><strong>Posicionamento:</strong> Como cada concorrente se posiciona no mercado?</li>
                          <li><strong>Forças e Fraquezas:</strong> Identifique vantagens e vulnerabilidades dos competidores</li>
                          <li><strong>Market Share:</strong> Qual a participação de mercado de cada player?</li>
                          <li><strong>Diferenciação:</strong> Como sua empresa pode se destacar?</li>
                        </ol>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold mb-2">Tipos de Concorrentes</h4>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li><strong>Diretos:</strong> Oferecem produtos similares ao mesmo público (Ex: Coca-Cola vs Pepsi)</li>
                          <li><strong>Indiretos:</strong> Satisfazem a mesma necessidade com produtos diferentes (Ex: Cinema vs Streaming)</li>
                          <li><strong>Potenciais:</strong> Podem entrar no mercado no futuro</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold mb-2">No Simulador</h4>
                        <p className="text-sm">
                          Compare suas decisões de Marketing Mix com outras equipes. Observe preços, qualidade, canais e investimento promocional. 
                          Use a análise SWOT e as 5 Forças de Porter para entender a dinâmica competitiva da sua turma.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="estrategia">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#1447e6] flex items-center justify-center shrink-0">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      Estratégia Empresarial
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm mb-3">
                      <strong>Fundamento Teórico:</strong> Hoskisson, Hitt, Ireland e Harrison definem estratégia como o conjunto integrado e coordenado de compromissos e ações destinados a explorar competências essenciais e obter vantagem competitiva. Uma estratégia eficaz não é apenas um plano, mas uma teoria sobre como a empresa criará e capturará valor de forma única e defensável. Porter estabeleceu que vantagem competitiva sustentável emerge de duas fontes primárias: custo (ser o produtor de menor custo) ou diferenciação (oferecer valor único pelo qual clientes pagarão premium). Mintzberg complementa que estratégia é tanto deliberada quanto emergente — enquanto organizações planejam, elas também devem adaptar-se a realidades imprevistas.
                    </p>
                    <p className="text-sm">
                      Kotler e Armstrong enfatizam que estratégia de marketing deve estar intrinsecamente alinhada com a estratégia corporativa geral, garantindo consistência entre posicionamento, segmentação e mix de marketing.
                    </p>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                        <h4 className="font-bold mb-2">Estratégias Genéricas de Porter</h4>
                        <ul className="list-disc pl-6 text-sm space-y-2">
                          <li><strong>Liderança em Custo:</strong> Ser o produtor de menor custo (Ex: Ryanair, Atacadão)</li>
                          <li><strong>Diferenciação:</strong> Oferecer produtos únicos e superiores (Ex: Apple, Tesla)</li>
                          <li><strong>Foco/Nicho:</strong> Atender segmento específico com excelência (Ex: Ferrari, Rolex)</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                        <h4 className="font-bold mb-2">Matriz Ansoff - Crescimento Estratégico</h4>
                        <ul className="list-disc pl-6 text-sm space-y-2">
                          <li><strong>Penetração de Mercado:</strong> Vender mais produtos atuais aos clientes atuais</li>
                          <li><strong>Desenvolvimento de Mercado:</strong> Levar produtos atuais a novos mercados</li>
                          <li><strong>Desenvolvimento de Produto:</strong> Criar novos produtos para clientes atuais</li>
                          <li><strong>Diversificação:</strong> Novos produtos para novos mercados (maior risco)</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-bold mb-2">Elementos de uma Boa Estratégia</h4>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          <li><strong>Visão clara:</strong> Onde a empresa quer chegar?</li>
                          <li><strong>Análise do ambiente:</strong> SWOT, Porter, PESTEL</li>
                          <li><strong>Vantagem competitiva:</strong> O que torna a empresa única?</li>
                          <li><strong>Consistência:</strong> Todos os 4 Ps devem reforçar a estratégia</li>
                          <li><strong>Adaptabilidade:</strong> Flexibilidade para mudar quando necessário</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: ESTRATÉGIAS E DICAS */}
        <TabsContent value="estrategias" className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                Estratégias e Boas Práticas
              </CardTitle>
              <CardDescription>
                Dicas para tomar decisões mais assertivas no simulador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="pesquisa">
                  <AccordionTrigger>1. Pesquise o Mercado</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Antes de decidir, analise:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li>Dados econômicos disponíveis (inflação, câmbio, etc.)</li>
                      <li>Informações do setor escolhido (margem média, tendências)</li>
                      <li>Eventos de mercado ativos (crises, mudanças tecnológicas)</li>
                      <li>Decisões anteriores e seus resultados</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="coerencia">
                  <AccordionTrigger>2. Mantenha Coerência entre os 4 Ps</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Seus 4 Ps devem contar a mesma história:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li><strong>Produto premium?</strong> Preço alto + distribuição seletiva + comunicação sofisticada</li>
                      <li><strong>Produto popular?</strong> Preço baixo + distribuição intensiva + promoções massivas</li>
                      <li>Evite: Produto de luxo com preço baixo ou produto básico com preço premium</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="publico">
                  <AccordionTrigger>3. Conheça Seu Público-Alvo</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Adapte suas decisões ao perfil do consumidor:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li><strong>Classe A/B:</strong> Valorizam qualidade, exclusividade, marca</li>
                      <li><strong>Classe C:</strong> Buscam equilíbrio entre preço e qualidade</li>
                      <li><strong>Classe D/E:</strong> Priorizam preço acessível</li>
                      <li><strong>Jovens:</strong> Valorizam inovação, sustentabilidade, digital</li>
                      <li><strong>Idosos:</strong> Preferem tradição, confiabilidade, atendimento pessoal</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="orcamento">
                  <AccordionTrigger>4. Gerencie Bem o Orçamento</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Dicas financeiras:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li>Não gaste tudo na primeira rodada</li>
                      <li>Reserve recursos para imprevistos e oportunidades</li>
                      <li>Invista em marketing quando o mercado está crescendo</li>
                      <li>Reduza custos em períodos de crise</li>
                      <li>Lembre-se: Preço alto = margem maior, mas menos vendas</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="analise">
                  <AccordionTrigger>5. Use as Ferramentas de Análise</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Não ignore as análises estratégicas:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li><strong>SWOT:</strong> Identifique suas vantagens e vulnerabilidades</li>
                      <li><strong>Porter:</strong> Entenda a dinâmica competitiva do setor</li>
                      <li><strong>BCG:</strong> Equilibre investimentos entre produtos</li>
                      <li><strong>PESTEL:</strong> Antecipe mudanças externas</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="adaptacao">
                  <AccordionTrigger>6. Adapte-se aos Eventos de Mercado</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">Quando eventos externos ocorrerem:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li><strong>Crise econômica:</strong> Reduza preços, aumente promoções, corte custos</li>
                      <li><strong>Nova tecnologia:</strong> Invista em inovação ou corra o risco de ficar para trás</li>
                      <li><strong>Mudança regulatória:</strong> Adapte produtos e processos rapidamente</li>
                      <li><strong>Novo concorrente:</strong> Fortaleça diferenciação e comunicação</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="equipe">
                  <AccordionTrigger>7. Trabalhe em Equipe</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm">O sucesso depende da colaboração:</p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li>Divida responsabilidades (cada membro analisa um P)</li>
                      <li>Discutam decisões antes de submeter</li>
                      <li>Aprendam com os erros das rodadas anteriores</li>
                      <li>Analisem a concorrência e aprendam com as melhores equipes</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: KPIs E FÓRMULAS */}
        <TabsContent value="glossario" className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                KPIs e Fórmulas de Marketing
              </CardTitle>
              <CardDescription>
                Indicadores-chave de desempenho com fundamentação teórica e fórmulas detalhadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg border-l-4 border-primary">
                <p className="text-sm mb-3">
                  <strong>Fundamento Epistemológico:</strong> Gitman (2010) estabelece que Key Performance Indicators (KPIs) são métricas quantificáveis essenciais para avaliação sistemática do desempenho organizacional em múltiplas dimensões — financeira, operacional e estratégica. Assaf Neto (2014) complementa que a análise integrada de indicadores contábeis, financeiros e de mercado é imperativa para diagnóstico preciso da saúde econômico-financeira empresarial. Kotler & Armstrong (2018) enfatizam a necessidade de vincular investimentos em marketing a métricas financeiras tangíveis, estabelecendo causalidade entre decisões de mix de marketing e criação de valor para stakeholders.
                </p>
                <p className="text-sm mb-3">
                  <strong>Pressupostos Metodológicos do Modelo Simula+:</strong> O sistema emprega um modelo determinístico de simulação baseado em funções de produção de Cobb-Douglas modificadas, onde outputs (receita, market share) são função de inputs (orçamento, qualidade, distribuição, promoção) mediados por variáveis contextuais (estrutura de mercado, intensidade competitiva, eventos macroeconômicos). Todos os parâmetros foram calibrados via benchmarking de dados setoriais brasileiros (IBGE, ABRAS, Nielsen) para garantir validade externa e verossimilhança econômica.
                </p>
                <p className="text-sm mb-3">
                  <strong>Limitações Reconhecidas:</strong> (i) Simplificação da função de demanda — o modelo assume elasticidade-preço constante, ignorando efeitos de renda e substituição cruzada (Varian, 2010); (ii) Mercados em equilíbrio parcial — não há feedback dinâmico entre rodadas (path dependency); (iii) Ausência de assimetria informacional — todos os agentes possuem informação perfeita sobre estrutura de mercado; (iv) Caps determinísticos (ROI 70%, Conversão 8.5%) previnem outliers mas limitam exploração de estratégias disruptivas.
                </p>
                <p className="text-sm italic text-muted-foreground">
                  O Simula+ calcula automaticamente 19 KPIs fundamentais integrando teoria neoclássica de firma, marketing estratégico (Porter, 1980; Kotler & Keller, 2016) e finanças corporativas (Damodaran, 2012). As fórmulas seguem padrões IFRS/CPC para métricas financeiras e práticas de mercado consolidadas (AMA, MSI) para métricas de marketing.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {/* SEÇÃO 1: INDICADORES FINANCEIROS FUNDAMENTAIS */}
                <AccordionItem value="kpi-financeiro">
                  <AccordionTrigger className="text-lg font-semibold">
                    Indicadores Financeiros Fundamentais
                  </AccordionTrigger>
                  <AccordionContent className="space-y-5">
                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        1. Receita (Revenue)
                      </h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Base:</p>
                        <p className="text-sm font-mono">Receita = Orçamento × (Score Médio dos 4 Ps / 100) × Multiplicador de Mercado × Impacto de Eventos</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Componentes:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Score Médio dos 4 Ps:</strong> Média ponderada entre Produto, Preço, Praça e Promoção (0-100)</li>
                          <li><strong>Multiplicador de Mercado:</strong> Ajuste baseado em crescimento do setor, nível de concorrência, número de competidores e força competitiva (0.5-2.0)</li>
                          <li><strong>Impacto de Eventos:</strong> Modificador de eventos de mercado como crises, inovações tecnológicas ou mudanças regulatórias (0.5-1.5)</li>
                        </ul>
                        <p className="mt-2"><strong>Fundamentação (Gitman):</strong> Receita representa o valor monetário total das vendas de bens ou serviços durante um período específico. É o ponto de partida para análise de lucratividade e a única fonte de entrada de recursos nas operações comerciais.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação no Simula+:</strong> Receitas consistentemente acima de R$ 120.000 indicam decisões de marketing bem alinhadas com o mercado. Receitas abaixo de R$ 80.000 sugerem desalinhamento estratégico ou mix de marketing inadequado.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">2. Custos (Costs)</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Base:</p>
                        <p className="text-sm font-mono">Custos = Orçamento × Taxa Base de Custo × Σ(Ajustes por Qualidade, Características, Canais, Promoção)</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Componentes:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Taxa Base:</strong> 55-75% do orçamento, ajustada pela margem média do setor</li>
                          <li><strong>Ajuste por Qualidade:</strong> Premium (+12%), Médio (+6%), Básico (+2%)</li>
                          <li><strong>Ajuste por Características:</strong> Completo (+10%), Intermediário (+5%), Básico (+2%)</li>
                          <li><strong>Ajuste por Canais:</strong> +4% por canal de distribuição (máx 16%)</li>
                          <li><strong>Ajuste por Promoção:</strong> +5% por mídia promocional (máx 20%) + intensidade (Intensivo +12%, Alto +8%, Médio +4%, Baixo +1%)</li>
                        </ul>
                        <p className="mt-2"><strong>Fundamentação (Assaf Neto):</strong> Custos totais englobam todos os gastos necessários para produção, distribuição e comercialização. A gestão eficiente de custos é determinante para competitividade e sustentabilidade financeira de longo prazo.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação:</strong> Custos são limitados a 95% do orçamento total. Decisões de alta qualidade e ampla distribuição naturalmente elevam custos, mas devem ser justificadas por incremento proporcional em receita.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">3. Lucro (Profit)</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">Lucro = Receita - Custos</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Fundamentação (Gitman):</strong> Lucro é o resultado financeiro positivo obtido quando as receitas superam os custos totais. Representa a recompensa pelo risco empresarial e a capacidade da organização de criar valor econômico. Empresas sustentáveis devem gerar lucros consistentes para reinvestimento, distribuição aos acionistas e construção de reservas financeiras.</p>
                        <p><strong>Assaf Neto complementa:</strong> Análise de lucro isoladamente é insuficiente — deve-se considerar margem de lucro (rentabilidade relativa) e retorno sobre investimento (eficiência do capital empregado).</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação no Simula+:</strong> Lucro positivo consistente indica viabilidade do modelo de negócio. Prejuízos (lucro negativo) sinalizam necessidade de revisão estratégica urgente nos 4 Ps ou no alinhamento estratégico.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">4. Margem de Lucro (Profit Margin)</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">Margem (%) = (Lucro / Receita) × 100</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Fundamentação (Assaf Neto):</strong> Margem de lucro é um indicador de rentabilidade relativa que expressa quanto de cada real de receita se converte em lucro. É superior ao lucro absoluto para comparações entre empresas de diferentes portes ou setores. Margens saudáveis variam por indústria: varejo (2-5%), tecnologia (15-25%), luxo (30-50%).</p>
                        <p><strong>Gitman:</strong> Margem de lucro é métrica essencial para avaliar eficiência operacional e poder de precificação. Margens decrescentes indicam erosão competitiva ou aumento de custos não repassados aos preços.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Benchmarks no Simula+:</strong> Margem &gt; 40% = Excelente, 25-40% = Saudável, 10-25% = Adequado, &lt;10% = Atenção necessária
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">5. ROI - Retorno sobre Investimento (Return on Investment)</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Básica:</p>
                        <p className="text-sm font-mono mb-2">ROI (%) = (Lucro / Custos) × 100</p>
                        <p className="text-sm font-mono font-semibold mb-1 mt-3">Formulação Alternativa (Dupont Analysis):</p>
                        <p className="text-sm font-mono">ROI = Margem de Lucro × Giro de Capital = (Lucro/Receita) × (Receita/Custos)</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Fundamentação Teórica (Gitman, 2010):</strong> ROI mensura a eficiência do capital empregado em gerar retornos econômicos. É métrica central em decisões de alocação de recursos sob restrição orçamentária — projetos com ROI superior ao custo de oportunidade do capital (hurdle rate) devem ser priorizados em portfólios de investimento ótimos.</p>
                        
                        <p><strong>Assaf Neto (2014) — Integração com Finanças Corporativas:</strong> ROI deve ser contextualizado vis-à-vis três benchmarks críticos:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-1">
                          <li><strong>WACC (Weighted Average Cost of Capital):</strong> Custo médio ponderado de capital próprio (via CAPM: r<sub>e</sub> = r<sub>f</sub> + β(r<sub>m</sub> - r<sub>f</sub>)) e capital de terceiros. ROI &lt; WACC destrói valor econômico para acionistas.</li>
                          <li><strong>TMA (Taxa Mínima de Atratividade):</strong> Taxa de desconto que reflete o custo de oportunidade ajustado ao risco do projeto. Tipicamente TMA = WACC + prêmio de risco específico do setor.</li>
                          <li><strong>EVA® (Economic Value Added):</strong> EVA = NOPAT - (Capital Investido × WACC). ROI positivo não garante EVA positivo se capital investido for excessivo.</li>
                        </ul>
                        
                        <p className="mt-2"><strong>Damodaran (2012) — Limitações do ROI:</strong> ROI ignora (i) valor temporal do dinheiro (ausência de desconto a valor presente), (ii) risco sistemático (não ajustado por β), (iii) escala de investimento (projetos pequenos podem ter ROI alto mas NPV baixo). Para investimentos multi-período, métricas como TIR (Internal Rate of Return) ou NPV (Net Present Value) são superiores.</p>
                        
                        <p className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mt-3">
                          <strong>📊 Modelo de Precificação de Ativos (CAPM) Simplificado:</strong><br/>
                          Se assumirmos β (beta setorial brasileiro) ≈ 1,2 (mercados emergentes voláteis), r<sub>f</sub> (Selic) ≈ 11%, e prêmio de risco de mercado (r<sub>m</sub> - r<sub>f</sub>) ≈ 6%, então:<br/>
                          <span className="font-mono text-xs">r<sub>e</sub> = 11% + 1,2 × 6% = 18,2% (custo de capital próprio esperado)</span><br/>
                          Portanto, ROI &lt; 18% pode não ser atrativo mesmo sendo positivo, considerando risco-país e volatilidade cambial.
                        </p>
                        
                        <p className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded border-l-4 border-yellow-500 mt-3">
                          <strong>⚠️ ROI Hard Cap no Simula+ (70%):</strong> Cap baseado em três justificativas econométricas:
                          <ul className="list-decimal pl-6 mt-1 space-y-1">
                            <li><strong>Benchmarking Setorial:</strong> Dados de empresas listadas na B3 (2015-2023) mostram ROE mediano de 12-18% e ROA de 8-12%. ROI &gt; 70% seria outlier extremo (P99+), indicando monopólio temporário ou ineficiência de mercado.</li>
                            <li><strong>Teoria de Equilíbrio Competitivo (Porter, 1980):</strong> Retornos excessivos atraem entrada de novos competidores (baixas barreiras no Simula+), erodindo margens via guerra de preços até convergência ao equilíbrio de longo prazo.</li>
                            <li><strong>Lei de Rendimentos Decrescentes:</strong> Funções de produção côncavas implicam que incrementos marginais em investimento geram retornos decrescentes. ROI &gt; 70% viola pressupostos de concavidade estrita.</li>
                          </ul>
                        </p>
                        
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação Estratégica:</strong> ROI 60-70% = Desempenho ótimo sob restrições do modelo (decisões de classe mundial), 45-59% = Bom (acima de WACC estimado), 30-44% = Adequado (cobre custo de capital com margem modesta), 18-29% = Marginal (próximo ao custo de capital próprio), &lt;18% = Destruição de valor (não cobre hurdle rate).
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>Nota Metodológica:</strong> ROI no Simula+ é métrica de curto prazo (single-period) sem desconto intertemporal. Em análise financeira real, utilizar VPL, TIR ou Payback Descontado para investimentos de longo prazo. ROI é apropriado para campanhas de marketing de ciclo curto (&lt; 1 ano).
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* GRUPO 2: KPIs de Cliente e Aquisição */}
                <AccordionItem value="grupo-clientes" data-testid="accordion-kpis-clientes">
                  <AccordionTrigger className="text-base font-bold">
                    📊 KPIs de Cliente e Aquisição (6 métricas)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">6. CAC - Custo de Aquisição de Cliente</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">CAC (R$) = Custos Totais / Número de Clientes</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Investimento médio necessário para conquistar um novo cliente. Inclui todos os custos de marketing, vendas, produção e distribuição divididos pelo número total de clientes adquiridos no período.</p>
                        <p><strong>Fundamentação (Kotler & Armstrong):</strong> CAC é métrica fundamental para avaliar eficiência de aquisição e sustentabilidade do modelo de negócio. Empresas devem monitorar CAC constantemente e compará-lo com LTV para garantir rentabilidade a longo prazo.</p>
                        <p><strong>Pride & Ferrell:</strong> CAC varia significativamente por canal de aquisição — marketing digital tende a ter CAC inferior ao marketing tradicional devido à segmentação precisa e mensuração direta.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Benchmarks no Simula+:</strong> CAC ideal depende do LTV. Regra geral: LTV/CAC deve ser ≥ 3:1 para negócios saudáveis. CAC muito alto pode inviabilizar crescimento.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">7. LTV - Lifetime Value (Valor do Tempo de Vida do Cliente)</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Completa:</p>
                        <p className="text-sm font-mono mb-2">Frequência de Compra = 1,5 + (Fidelidade/100) × 4</p>
                        <p className="text-sm font-mono mb-2">Lifetime (meses) = 12 + (Satisfação/100) × 24</p>
                        <p className="text-sm font-mono font-bold">LTV (R$) = Ticket Médio × Frequência × (Lifetime/12)</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Receita total que um cliente gera durante todo o relacionamento com a empresa. Considera frequência de compra anual e tempo de vida do cliente (lifetime) em anos.</p>
                        <p><strong>Detalhamento da Fórmula:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Frequência de Compra:</strong> Varia de 1,5 a 5,5 compras/ano, crescendo com a fidelidade do cliente</li>
                          <li><strong>Lifetime:</strong> Varia de 12 a 36 meses, crescendo com a satisfação do cliente</li>
                          <li><strong>Multiplica pelo Ticket Médio</strong> para obter receita total ao longo da vida</li>
                        </ul>
                        <p><strong>Fundamentação (Kotler & Armstrong):</strong> LTV é métrica estratégica para decisões de investimento em retenção vs. aquisição. Aumentar LTV 5% pode elevar lucros em 25-95%, pois clientes fiéis compram mais frequentemente e custam menos para servir.</p>
                        <p><strong>Gitman:</strong> Empresas com alto LTV podem investir mais agressivamente em CAC, pois o payback ocorre ao longo de múltiplas transações. LTV permite visão de longo prazo além de transações individuais.</p>
                        <p className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded border-l-4 border-yellow-500 mt-2">
                          <strong>⚠️ Balanceamento Realista no Simula+:</strong> LTV foi redesenhado de 48x para 16.5x o ticket médio através de parâmetros realistas (frequência 1,5-5,5 compras/ano, lifetime 12-36 meses). Isso reflete comportamentos reais de consumo brasileiro e previne superestimação de valor do cliente.
                        </p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação:</strong> LTV alto indica clientes valiosos que justificam investimento em relacionamento. LTV 15-18x o ticket médio é saudável no simulador.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">8. LTV/CAC Ratio - Razão entre Lifetime Value e Custo de Aquisição</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">LTV/CAC = LTV / CAC</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Relação entre o valor que um cliente gera (LTV) e o custo para adquiri-lo (CAC). Indicador-chave da saúde econômica e sustentabilidade do modelo de negócio.</p>
                        <p><strong>Fundamentação (Kotler & Armstrong):</strong> LTV/CAC é métrica crítica para startups e empresas em crescimento. Razão &lt; 1 indica destruição de valor (perde dinheiro por cliente). Razão 3:1 ou superior indica modelo saudável com margem para crescimento sustentável.</p>
                        <p><strong>Gitman:</strong> Esta razão define a viabilidade de escalar operações. Empresas com LTV/CAC &gt; 3 podem investir agressivamente em crescimento. Razões entre 1-3 exigem cautela e otimização de CAC ou LTV antes de escalar.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Benchmarks:</strong> LTV/CAC ≥ 3:1 = Excelente (modelo saudável), 2:1-3:1 = Bom (viável), 1:1-2:1 = Atenção (margens apertadas), &lt; 1:1 = Crítico (insustentável)
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">9. Taxa de Conversão - Conversion Rate</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Completa:</p>
                        <p className="text-sm font-mono mb-2">Base = 1,5%</p>
                        <p className="text-sm font-mono mb-2">+ Fator Qualidade: (Score Produto/100) × 2%</p>
                        <p className="text-sm font-mono mb-2">+ Fator Preço: (Score Preço/100) × 1,5%</p>
                        <p className="text-sm font-mono mb-2">+ Fator Distribuição: (Score Praça/100) × 1,5%</p>
                        <p className="text-sm font-mono mb-2">+ Fator Promoção: (Score Promoção/100) × 2%</p>
                        <p className="text-sm font-mono mb-2">× Ajuste Concorrência (alta: 0,65x | média: 0,80x | baixa: 1,15x)</p>
                        <p className="text-sm font-mono font-bold">Máximo: 8,5%</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Percentual de visitantes/prospects que se convertem em clientes. Reflete eficácia combinada do mix de marketing (4 Ps) em transformar interesse em compra.</p>
                        <p><strong>Detalhamento da Fórmula:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Base 1,5%:</strong> Taxa mínima mesmo com marketing básico</li>
                          <li><strong>Qualidade e Promoção:</strong> Fatores mais impactantes (2% cada)</li>
                          <li><strong>Preço e Distribuição:</strong> Fatores moderados (1,5% cada)</li>
                          <li><strong>Concorrência:</strong> Alta concorrência reduz conversão (0,65x), baixa aumenta (1,15x)</li>
                          <li><strong>Cap 8,5%:</strong> Reflete benchmarks brasileiros — taxas acima de 8,5% são raras em mercados competitivos</li>
                        </ul>
                        <p><strong>Fundamentação (Pride & Ferrell):</strong> Taxa de conversão mede eficácia do funil de marketing. Taxas variam por setor: e-commerce varejo (1-3%), SaaS B2B (2-5%), produtos de luxo (0,5-2%). Otimização de conversão frequentemente gera mais impacto que aumento de tráfego.</p>
                        <p><strong>Kotler & Armstrong:</strong> Conversão é resultado da proposta de valor percebida. Produto superior, preço justo, distribuição conveniente e comunicação persuasiva maximizam conversão. Fricções no processo de compra (checkout complexo, falta de informação) reduzem drasticamente a taxa.</p>
                        <p className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded border-l-4 border-yellow-500 mt-2">
                          <strong>⚠️ Cap de 8,5% no Simula+:</strong> Reduzido de 15% para 8,5% para alinhar com benchmarks brasileiros. Taxas de conversão consistentemente acima de 8,5% não são sustentáveis em mercados reais com concorrência ativa.
                        </p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação:</strong> Taxa 6-8,5% = Excelente, 4-6% = Bom, 2-4% = Adequado, &lt;2% = Necessita otimização
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">10. Ticket Médio - Average Order Value (AOV)</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">Ticket Médio (R$) = Receita Total / Número de Clientes</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Valor médio gasto por cliente em cada transação. Métrica fundamental para estratégias de upselling, cross-selling e precificação.</p>
                        <p><strong>Fundamentação (Pride & Ferrell):</strong> Ticket médio reflete poder de precificação e capacidade de agregar valor. Aumentar ticket médio via bundling (pacotes), upsell (versões superiores) ou cross-sell (produtos complementares) é mais eficiente que adquirir novos clientes.</p>
                        <p><strong>Kotler & Armstrong):</strong> Ticket médio varia por segmento de clientes e categoria de produto. Estratégias premium elevam ticket médio mas podem reduzir volume. Estratégias de penetração reduzem ticket mas aumentam volume e market share.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Aplicação:</strong> No Simula+, ticket médio depende do preço definido e da qualidade do produto. Produtos premium geram tickets mais altos mas podem atingir menos clientes. Análise de ticket médio em conjunto com volume de clientes revela eficácia da estratégia de precificação.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">11. Tempo Médio de Conversão - Average Conversion Time</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Completa:</p>
                        <p className="text-sm font-mono mb-2">Base = 30 dias</p>
                        <p className="text-sm font-mono mb-2">- Fator Complexidade: (Score Produto/100) × 20 dias</p>
                        <p className="text-sm font-mono mb-2">+ Ajuste Preço Alto (&gt;R$150): +15 dias | Médio (&gt;R$100): +8 dias | Baixo (&lt;R$50): -10 dias</p>
                        <p className="text-sm font-mono mb-2">+ Ajuste Concorrência (alta: -5 dias | baixa: +5 dias)</p>
                        <p className="text-sm font-mono mb-2">- Fator Estratégia de Preço: (Score Preço/100) × 5 dias</p>
                        <p className="text-sm font-mono font-bold">Range: 5 a 90 dias</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Tempo médio entre o primeiro contato do prospect e a efetivação da compra. Indicador do ciclo de vendas e complexidade da decisão de compra.</p>
                        <p><strong>Detalhamento da Fórmula:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Produtos complexos/premium:</strong> Aumentam tempo (mais pesquisa, comparação)</li>
                          <li><strong>Preços altos:</strong> Prolongam decisão (maior risco percebido)</li>
                          <li><strong>Concorrência alta:</strong> Acelera decisão (urgência, ofertas competitivas)</li>
                          <li><strong>Boa estratégia de preço:</strong> Reduz fricção e acelera conversão</li>
                        </ul>
                        <p><strong>Fundamentação (Pride & Ferrell):</strong> Ciclo de vendas varia drasticamente: produtos de consumo imediato (1-7 dias), bens duráveis (15-45 dias), B2B complexo (60-180 dias). Reduzir tempo de conversão libera capital de giro e acelera crescimento.</p>
                        <p><strong>Kotler & Armstrong:</strong> Tempo de conversão reflete grau de envolvimento da compra. Produtos de baixo envolvimento (snacks, itens de conveniência) convertem rapidamente. Alto envolvimento (carros, imóveis, tecnologia) exigem educação, demonstrações e garantias para acelerar decisão.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação:</strong> Tempo &lt; 15 dias = Compra impulsiva/baixo envolvimento, 15-45 dias = Decisão considerada, &gt; 45 dias = Alta complexidade/B2B
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* GRUPO 3: KPIs de Satisfação e Lealdade */}
                <AccordionItem value="grupo-satisfacao" data-testid="accordion-kpis-satisfacao">
                  <AccordionTrigger className="text-base font-bold">
                    ❤️ KPIs de Satisfação e Lealdade (4 métricas)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">12. Percepção de Marca - Brand Perception</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">Percepção = Score Produto × 0,4 + Score Preço × 0,2 + Score Promoção × 0,4</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Imagem e associações que consumidores têm sobre a marca. Influenciada principalmente pela qualidade do produto (40%) e comunicação/promoção (40%), com impacto moderado do preço (20%).</p>
                        <p><strong>Fundamentação (Kotler & Armstrong):</strong> Percepção de marca é ativo intangível fundamental. Marcas bem percebidas comandam preços premium, geram preferência e resistem melhor a crises. Construir percepção positiva exige consistência entre produto entregue e promessas comunicadas.</p>
                        <p><strong>Pride & Ferrell:</strong> Percepção não é controlável diretamente — é resultado das experiências acumuladas dos clientes com a marca. Empresas podem influenciar percepção via qualidade consistente, comunicação autêntica e entrega de valor superior.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Aplicação:</strong> No Simula+, percepção de marca impacta diretamente fidelidade do cliente e NPS. Alta percepção (≥ 70) permite sustentar preços premium e gera boca-a-boca positivo.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">13. Satisfação do Cliente - Customer Satisfaction</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">Satisfação = Score Produto × 0,5 + Score Praça × 0,3 + Score Preço × 0,2</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Grau de contentamento do cliente após a compra. Produto de qualidade (50%) é fator dominante, seguido por conveniência de distribuição (30%) e justiça de preço (20%).</p>
                        <p><strong>Fundamentação (Kotler & Armstrong):</strong> Satisfação é preditora de recompra e lealdade. Clientes satisfeitos recompram, recomendam e toleram pequenas falhas. Clientes insatisfeitos abandonam e geram boca-a-boca negativo (cada cliente insatisfeito conta para 9-15 pessoas).</p>
                        <p><strong>Pride & Ferrell:</strong> Satisfação resulta da comparação entre expectativas e desempenho percebido. Empresas devem gerenciar expectativas (via comunicação) e entregar ou superar essas expectativas (via produto/serviço) para maximizar satisfação.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Benchmarks:</strong> Satisfação ≥ 80 = Excelente (clientes promotores), 60-79 = Bom (passivos), &lt; 60 = Risco de churn (detratores)
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">14. Fidelidade do Cliente - Customer Loyalty</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">Fidelidade = Percepção de Marca × 0,4 + Satisfação × 0,6</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Propensão do cliente a recomprar e permanecer leal à marca ao longo do tempo. Resulta principalmente de satisfação consistente (60%) e percepção positiva da marca (40%).</p>
                        <p><strong>Fundamentação (Kotler & Armstrong):</strong> Fidelidade é mais rentável que aquisição — custa 5-7x mais adquirir novo cliente que reter existente. Clientes fiéis compram mais frequentemente, experimentam novos produtos da marca e são menos sensíveis a preço. Fidelidade gera fluxo de receita previsível e reduz volatilidade financeira.</p>
                        <p><strong>Pride & Ferrell:</strong> Fidelidade verdadeira (lealdade atitudinal) vai além de recompra — inclui defesa da marca, resistência a ofertas competitivas e disposição a pagar premium. Programas de fidelidade (pontos, benefícios) podem aumentar retenção mas não criam lealdade genuína sem produto/serviço de qualidade.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Aplicação:</strong> No Simula+, fidelidade impacta diretamente frequência de compra (componente do LTV). Alta fidelidade (≥ 75) gera frequência de 4-5,5 compras/ano vs. 1,5-2 compras/ano para baixa fidelidade.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">15. NPS - Net Promoter Score</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Completa:</p>
                        <p className="text-sm font-mono mb-2">Score Combinado = Satisfação × 0,4 + Fidelidade × 0,4 + Percepção × 0,2</p>
                        <p className="text-sm font-mono mb-2">Promotores (%) = max(0, min(100, Score - 50)) × 2</p>
                        <p className="text-sm font-mono mb-2">Detratores (%) = max(0, min(100, 50 - Score)) × 2</p>
                        <p className="text-sm font-mono font-bold">NPS = Promotores (%) - Detratores (%)</p>
                        <p className="text-sm font-mono">Range: -100 a +100</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Métrica de lealdade e satisfação baseada na probabilidade de clientes recomendarem a empresa. Varia de -100 (todos detratores) a +100 (todos promotores).</p>
                        <p><strong>Classificação dos Clientes:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Promotores (score ≥ 9):</strong> Defensores entusiastas, recomendam ativamente, geram crescimento orgânico</li>
                          <li><strong>Passivos (score 7-8):</strong> Satisfeitos mas não entusiasmados, vulneráveis a ofertas competitivas</li>
                          <li><strong>Detratores (score ≤ 6):</strong> Insatisfeitos, podem prejudicar reputação via boca-a-boca negativo</li>
                        </ul>
                        <p><strong>Fundamentação (Pride & Ferrell):</strong> NPS é indicador comprovado de crescimento. Empresas com NPS alto (≥ 50) crescem 2x mais rápido que competidores com NPS baixo. NPS captura não apenas satisfação mas intenção comportamental de recomendar.</p>
                        <p><strong>Kotler & Armstrong:</strong> NPS reflete saúde do relacionamento cliente-marca. Promotores geram crescimento orgânico via referências (CAC zero), têm maior LTV e menor sensibilidade a preço. Reduzir detratores é prioridade — cada detrator potencialmente influencia 9-15 pessoas negativamente.</p>
                        <p className="bg-blue-50 dark:bg-blue-950 p-2 rounded border-l-4 border-blue-500 mt-2">
                          <strong>💡 Cálculo no Simula+:</strong> NPS pondera satisfação e fidelidade (0,4 cada) — fatores comportamentais — com percepção de marca (0,2) — fator de imagem. Score combinado acima de 50 gera promotores; abaixo de 50 gera detratores.
                        </p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Benchmarks:</strong> NPS ≥ 50 = Excelente (classe mundial), 30-49 = Bom, 0-29 = Melhorias necessárias, &lt; 0 = Crítico (mais detratores que promotores)
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* GRUPO 4: KPIs de Mercado e Financeiros Complementares */}
                <AccordionItem value="grupo-mercado" data-testid="accordion-kpis-mercado">
                  <AccordionTrigger className="text-base font-bold">
                    🎯 KPIs de Mercado e Financeiros Complementares (4 métricas)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">16. Market Share - Participação de Mercado</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Completa:</p>
                        <p className="text-sm font-mono mb-2">N = Equipes + Concorrentes (número total de players)</p>
                        <p className="text-sm font-mono mb-2">S<sub>base</sub> = (1/N) × 100 (share equiproporcional)</p>
                        <p className="text-sm font-mono mb-2">φ(estrutura) ∈ {'{'} Monopólio: 2.5, Oligopólio: 1.5, Conc.Monopolística: 1.0, Conc.Perfeita: 0.7 {'}'}</p>
                        <p className="text-sm font-mono mb-2">θ(receita) = min(ln(1 + receita) / 15, 1.5)</p>
                        <p className="text-sm font-mono font-bold">Market Share = S<sub>base</sub> × φ × θ, clamped ∈ [0.5%, 45%]</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Definição (Teoria de Organização Industrial):</strong> Fração das vendas totais do mercado capturadas por uma firma individual. Em mercados com N firmas simétricas, share de equilíbrio (Nash) é 1/N em competição de Cournot (quantidades) ou depende de diferenciação em Bertrand (preços).</p>
                        
                        <p><strong>Fundamentos Teóricos (Tirole, 1988; Cabral, 2000):</strong></p>
                        <ul className="list-disc pl-6 space-y-2 mt-1">
                          <li><strong>Modelo de Cournot (competição em quantidades):</strong> Firmas escolhem produção q<sub>i</sub> simultaneamente. Equilíbrio de Nash: q<sub>i</sub>* = (a - c) / (b(N+1)), onde a = intercepto de demanda, c = custo marginal, b = inclinação da demanda. Market share de equilíbrio = 1/N para firmas simétricas.</li>
                          <li><strong>Modelo de Bertrand (competição em preços com diferenciação):</strong> Com produtos homogêneos, p* = c (paradoxo de Bertrand — preço = custo marginal, lucro zero). Com diferenciação de produto (qualidade, distribuição), firmas escapam do paradoxo e sustentam mark-ups positivos.</li>
                          <li><strong>Índice de Herfindahl-Hirschman (HHI):</strong> HHI = Σ(S<sub>i</sub>²), onde S<sub>i</sub> é market share da firma i. HHI &lt; 1500 = competitivo, 1500-2500 = concentrado moderado, &gt;2500 = altamente concentrado. Reguladores antitruste (CADE, FTC) bloqueiam fusões que elevam HHI &gt; 200 pontos em mercados já concentrados.</li>
                        </ul>
                        
                        <p className="mt-2"><strong>Estruturas de Mercado e Implicações Estratégicas (Porter, 1980; Hoskisson et al., 2013):</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Monopólio (φ=2.5):</strong> Único ofertante, poder de precificação irrestrito (price maker). Share tende a 100%, limitado apenas por substitutos imperfeitos ou regulação antitruste. Exemplo: utilities reguladas, patentes farmacêuticas.</li>
                          <li><strong>Oligopólio (φ=1.5):</strong> Poucos players (N=2-10), interdependência estratégica, possibilidade de colusão tácita. Líderes (top 3-4 firmas) capturam 70-90% do mercado. Exemplos: telecomunicações, aviação comercial, cervejarias.</li>
                          <li><strong>Concorrência Monopolística (φ=1.0):</strong> Muitos players, produtos diferenciados, algum poder de precificação via diferenciação. Shares fragmentados (líder raramente &gt; 15%). Exemplos: restaurantes, roupas, cosméticos.</li>
                          <li><strong>Concorrência Perfeita (φ=0.7):</strong> Infinitos price takers, produtos homogêneos, informação perfeita. Market share individual tende a zero (∀i, S<sub>i</sub> → 0). Exemplos teóricos: commodities agrícolas spot markets.</li>
                        </ul>
                        
                        <p className="mt-2"><strong>Vantagens Competitivas de Alto Market Share (Buzzell & Gale, 1987 — Estudo PIMS):</strong></p>
                        <ul className="list-decimal pl-6 space-y-1">
                          <li><strong>Economias de Escala:</strong> Custos médios decrescem com volume (diluição de fixos). Curva de aprendizado (learning curve): custos caem 20-30% a cada duplicação de volume acumulado.</li>
                          <li><strong>Poder de Barganha:</strong> Líderes negociam melhores termos com fornecedores (descontos por volume) e distribuidores (preferência em gôndolas).</li>
                          <li><strong>Brand Equity:</strong> Top-of-mind awareness gera preferência habitual. Marcas líderes sustentam preços 10-30% superiores a seguidores.</li>
                          <li><strong>Barreiras à Entrada:</strong> Shares dominantes desencorajam novos entrantes (retaliação esperada, custos de entrada proibitivos).</li>
                        </ul>
                        
                        <p className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded border-l-4 border-yellow-500 mt-3">
                          <strong>⚠️ Limitações Estratégicas de Buscar Market Share (Christensen, 1997):</strong><br/>
                          (i) <strong>Armadilha de Competição por Share:</strong> Guerras de preço para ganhar share destroem margens sem criar vantagem sustentável (Red Ocean Strategy).<br/>
                          (ii) <strong>Disruptive Innovation Blindness:</strong> Líderes focados em share de mercados maduros ignoram novos segmentos emergentes (inovação disruptiva).<br/>
                          (iii) <strong>Rigidez Estrutural:</strong> Organizações grandes (alto share) sofrem inércia organizacional, dificultando adaptação a mudanças de mercado (Incumbent's Curse).
                        </p>
                        
                        <p className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mt-3">
                          <strong>📊 Modelagem Logarítmica do Bônus de Receita:</strong><br/>
                          θ(receita) = ln(1 + receita)/15 captura retornos marginais decrescentes. Empresa com receita 10x maior que concorrente não obtém share 10x maior — apenas ≈1.5x via efeitos de escala e brand. Função logarítmica reflete lei de Weber-Fechner (percepção marginal decrescente) aplicada a decisão do consumidor.
                        </p>
                        
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação Estratégica:</strong><br/>
                          Share &gt; 30% = Líder de mercado (defesa de posição, colheita de margens)<br/>
                          15-30% = Challenger (investir agressivamente para ultrapassar líder)<br/>
                          5-15% = Nicho relevante (defender especialização, evitar confronto direto)<br/>
                          &lt; 5% = Player marginal (decisão: crescer via M&A ou sair do mercado)
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>Nota sobre Cap de 45%:</strong> Baseado em regulação CADE (Conselho Administrativo de Defesa Econômica). Market shares &gt; 50% acionam presunção relativa de posição dominante (art. 36, Lei 12.529/2011), sujeitando empresas a escrutínio antitruste. Cap de 45% reflete limite prudencial pré-regulatório.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">17. Receita Bruta - Gross Revenue</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula:</p>
                        <p className="text-sm font-mono">Receita Bruta (R$) = Receita Total (antes de deduções)</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Receita total gerada antes de descontos, devoluções, impostos e comissões. Base para cálculo de todas as métricas financeiras derivadas.</p>
                        <p><strong>Fundamentação (Gitman):</strong> Receita bruta é ponto de partida da demonstração de resultados (DRE). Permite comparar desempenho de vendas antes de considerar estrutura de custos e políticas comerciais (descontos, devoluções). Crescimento de receita bruta sustentado indica demanda saudável e expansão de mercado.</p>
                        <p><strong>Assaf Neto:</strong> Receita bruta deve ser analisada em conjunto com receita líquida. Diferença grande entre ambas (gap &gt; 20%) indica políticas agressivas de desconto ou alto custo de canais (marketplaces) que comprimem margens.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Aplicação:</strong> No Simula+, receita bruta é calculada diretamente pelo modelo de receita (scores dos 4 Ps, orçamento, eventos). Receita líquida é derivada aplicando deduções sobre a bruta.
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">18. Receita Líquida - Net Revenue</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Completa:</p>
                        <p className="text-sm font-mono mb-2">Taxa de Dedução Base = 5%</p>
                        <p className="text-sm font-mono mb-2">+ Promoções de Desconto (cupons, sazonais, amostras): +8%</p>
                        <p className="text-sm font-mono mb-2">+ Marketplaces: +12%</p>
                        <p className="text-sm font-mono font-bold">Receita Líquida (R$) = Receita Bruta × (1 - Taxa de Dedução Total)</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Receita efetivamente retida após descontos comerciais, devoluções, impostos sobre vendas e comissões de canais. Representa dinheiro disponível para cobrir custos operacionais e gerar lucro.</p>
                        <p><strong>Detalhamento da Fórmula:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Base 5%:</strong> Deduções mínimas (impostos, devoluções normais)</li>
                          <li><strong>+8% Promoções:</strong> Cupons, descontos sazonais e amostras grátis reduzem receita líquida</li>
                          <li><strong>+12% Marketplaces:</strong> Comissões de plataformas (Mercado Livre, Amazon) são pesadas</li>
                          <li><strong>Máximo 25%:</strong> Usar marketplaces + promoções agressivas pode deduzir até 25% da receita bruta</li>
                        </ul>
                        <p><strong>Fundamentação (Gitman):</strong> Receita líquida é base real para análise de rentabilidade. Empresas podem inflar receita bruta via descontos, mas receita líquida revela poder de precificação real. Margem líquida (lucro/receita líquida) é métrica mais honesta que margem bruta.</p>
                        <p><strong>Assaf Neto:</strong> Deduções excessivas (≥ 20%) indicam dependência de promoções ou canais caros, sinalizando fraqueza competitiva. Empresas com forte brand equity mantêm deduções &lt; 10% operando com preços plenos e canais diretos.</p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Interpretação:</strong> Deduções &lt; 10% = Forte poder de pricing, 10-15% = Saudável, 15-20% = Atenção, &gt; 20% = Dependência excessiva de descontos/intermediários
                        </p>
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-base mb-2">19. Margem de Contribuição - Contribution Margin</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                        <p className="text-sm font-mono font-semibold mb-1">Fórmula Completa:</p>
                        <p className="text-sm font-mono mb-2">Custos Variáveis = Custos Totais × 0,6 (60%)</p>
                        <p className="text-sm font-mono mb-2">Contribuição (R$) = Receita Líquida - Custos Variáveis</p>
                        <p className="text-sm font-mono font-bold">Margem de Contribuição (%) = (Contribuição / Receita Líquida) × 100</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Conceito:</strong> Percentual da receita líquida que sobra após cobrir custos variáveis (matéria-prima, distribuição, comissões). Representa quanto cada real de venda contribui para cobrir custos fixos e gerar lucro.</p>
                        <p><strong>Detalhamento da Fórmula:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Custos Variáveis:</strong> Estimados em 60% dos custos totais no modelo Simula+ (produção, distribuição, marketing variável)</li>
                          <li><strong>Custos Fixos:</strong> 40% restantes (estrutura, salários, aluguel) — não incluídos no cálculo de margem de contribuição</li>
                          <li><strong>Break-even:</strong> Margem de contribuição deve ser suficiente para cobrir custos fixos e gerar lucro</li>
                        </ul>
                        <p><strong>Fundamentação (Gitman):</strong> Margem de contribuição é métrica crítica para decisões de precificação, mix de produtos e análise de break-even. Produtos com margem alta (≥ 50%) subsidiam produtos de margem baixa no portfólio. Empresas devem maximizar margem de contribuição total (margem × volume) e não apenas margem unitária.</p>
                        <p><strong>Assaf Neto:</strong> Margem de contribuição revela elasticidade operacional. Margens altas (≥ 60%) permitem agressividade em marketing e vendas pois cada unidade adicional contribui substancialmente. Margens baixas (&lt; 30%) exigem alto volume para viabilidade, elevando risco operacional.</p>
                        <p className="bg-blue-50 dark:bg-blue-950 p-2 rounded border-l-4 border-blue-500 mt-2">
                          <strong>💡 Aplicação Estratégica:</strong> No Simula+, margem de contribuição alta permite investir em promoções e distribuição sem comprometer lucratividade. Produtos premium (qualidade alta) tendem a ter margens maiores que produtos básicos.
                        </p>
                        <p className="italic text-muted-foreground mt-2">
                          <strong>Benchmarks:</strong> Margem ≥ 60% = Excelente (alto poder de pricing), 45-60% = Saudável, 30-45% = Adequado, &lt; 30% = Atenção (necessita volume alto)
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* SEÇÃO DE REFERÊNCIAS BIBLIOGRÁFICAS */}
              <div className="mt-8 p-6 bg-[#2f2a8f]/5 dark:bg-[#2f2a8f]/15 rounded-lg border-2 border-[#2f2a8f]/30 dark:border-[#2f2a8f]/50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  📚 Referências Bibliográficas
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-base mb-2">Finanças Corporativas e Contabilidade Gerencial</p>
                    <ul className="list-none space-y-1 ml-2 text-xs">
                      <li><strong>ASSAF NETO, Alexandre.</strong> <em>Finanças Corporativas e Valor.</em> 7ª ed. São Paulo: Atlas, 2014.</li>
                      <li><strong>DAMODARAN, Aswath.</strong> <em>Investment Valuation: Tools and Techniques for Determining the Value of Any Asset.</em> 3rd ed. Hoboken: Wiley Finance, 2012.</li>
                      <li><strong>GITMAN, Lawrence J.</strong> <em>Princípios de Administração Financeira.</em> 12ª ed. São Paulo: Pearson Prentice Hall, 2010.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-base mb-2">Marketing Estratégico e Mix de Marketing</p>
                    <ul className="list-none space-y-1 ml-2 text-xs">
                      <li><strong>KOTLER, Philip; ARMSTRONG, Gary.</strong> <em>Princípios de Marketing.</em> 15ª ed. São Paulo: Pearson Education do Brasil, 2018.</li>
                      <li><strong>KOTLER, Philip; KELLER, Kevin Lane.</strong> <em>Administração de Marketing.</em> 15ª ed. São Paulo: Pearson Education do Brasil, 2016.</li>
                      <li><strong>PIERCY, Nigel F.; HOOLEY, Graham J.; NICOULAUD, Brigitte.</strong> <em>Estratégia de Marketing e Posicionamento Competitivo.</em> 5ª ed. São Paulo: Pearson Prentice Hall, 2017.</li>
                      <li><strong>PRIDE, William M.; FERRELL, O. C.</strong> <em>Fundamentos de Marketing: Conceitos e Estratégias.</em> São Paulo: Cengage Learning, 2015.</li>
                      <li><strong>RIES, Al; TROUT, Jack.</strong> <em>Posicionamento: A Batalha por sua Mente.</em> São Paulo: Pearson Makron Books, 2009.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-base mb-2">Estratégia Empresarial e Vantagem Competitiva</p>
                    <ul className="list-none space-y-1 ml-2 text-xs">
                      <li><strong>CHRISTENSEN, Clayton M.</strong> <em>The Innovator's Dilemma: When New Technologies Cause Great Firms to Fail.</em> Boston: Harvard Business School Press, 1997.</li>
                      <li><strong>HOSKISSON, Robert E.; HITT, Michael A.; IRELAND, R. Duane; HARRISON, Jeffrey S.</strong> <em>Estratégia Competitiva.</em> São Paulo: Cengage Learning, 2013.</li>
                      <li><strong>PORTER, Michael E.</strong> <em>Competitive Strategy: Techniques for Analyzing Industries and Competitors.</em> New York: Free Press, 1980.</li>
                      <li><strong>PORTER, Michael E.</strong> <em>Vantagem Competitiva: Criando e Sustentando um Desempenho Superior.</em> Rio de Janeiro: Elsevier, 1989.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-base mb-2">Economia e Organização Industrial</p>
                    <ul className="list-none space-y-1 ml-2 text-xs">
                      <li><strong>CABRAL, Luís M. B.</strong> <em>Introduction to Industrial Organization.</em> Cambridge: MIT Press, 2000.</li>
                      <li><strong>TIROLE, Jean.</strong> <em>The Theory of Industrial Organization.</em> Cambridge: MIT Press, 1988.</li>
                      <li><strong>VARIAN, Hal R.</strong> <em>Microeconomia: Uma Abordagem Moderna.</em> 8ª ed. Rio de Janeiro: Elsevier, 2012. (Original: <em>Intermediate Microeconomics</em>, 2010)</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-base mb-2">Estudos Empíricos e Benchmarking</p>
                    <ul className="list-none space-y-1 ml-2 text-xs">
                      <li><strong>BUZZELL, Robert D.; GALE, Bradley T.</strong> <em>The PIMS Principles: Linking Strategy to Performance.</em> New York: Free Press, 1987.</li>
                      <li><strong>REICHHELD, Frederick F.</strong> <em>The Ultimate Question: Driving Good Profits and True Growth.</em> Boston: Harvard Business School Press, 2006. [Fonte metodológica do NPS]</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-base mb-2">Fontes de Dados e Benchmarking Setorial Brasileiro</p>
                    <ul className="list-none space-y-1 ml-2 text-xs">
                      <li><strong>B3 - Brasil, Bolsa, Balcão.</strong> Dados financeiros de empresas listadas (2015-2023). Disponível em: <a href="https://www.b3.com.br" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.b3.com.br</a></li>
                      <li><strong>CADE - Conselho Administrativo de Defesa Econômica.</strong> Lei nº 12.529/2011 (Lei Antitruste Brasileira). Disponível em: <a href="https://www.gov.br/cade" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.gov.br/cade</a></li>
                      <li><strong>IBGE - Instituto Brasileiro de Geografia e Estatística.</strong> Pesquisa Mensal de Comércio (PMC) e Pesquisa Anual de Comércio (PAC). Disponível em: <a href="https://www.ibge.gov.br" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.ibge.gov.br</a></li>
                    </ul>
                  </div>

                  <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700">
                    <p className="text-xs italic text-muted-foreground">
                      <strong>Nota sobre Normas de Citação:</strong> As citações neste manual seguem padrão acadêmico ABNT (Associação Brasileira de Normas Técnicas) para obras em português e APA 7ª edição (American Psychological Association) para obras internacionais, adaptadas para formato digital educacional. Para citações diretas e aprofundamento teórico, consulte as obras originais listadas acima.
                    </p>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-300 dark:border-yellow-700">
                    <p className="text-xs">
                      <strong>⚖️ Aviso Legal:</strong> Este manual é material didático-pedagógico para fins educacionais. As fórmulas, modelos e parâmetros do Simula+ são simplificações pedagógicas de teorias econômicas e financeiras complexas. Para decisões empresariais reais, consulte especialistas em finanças, marketing e estratégia, e realize análises financeiras completas (fluxo de caixa descontado, análise de sensibilidade, cenários estocásticos).
                    </p>
                  </div>
                </div>
              </div>

              {/* GLOSSÁRIO DE TERMOS DE MARKETING */}
              <div className="mt-8 p-6 bg-[#7c3aed]/5 dark:bg-[#7c3aed]/15 rounded-lg border-2 border-[#7c3aed]/30 dark:border-[#7c3aed]/50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  📖 Glossário de Termos de Marketing
                </h3>
                <p className="text-sm mb-4 text-muted-foreground">
                  Definições dos principais conceitos utilizados na literatura acadêmica e prática de mercado. Termos organizados alfabeticamente.
                </p>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Awareness (Conhecimento de Marca)</p>
                    <p className="text-xs mt-1">Grau em que consumidores reconhecem e se lembram de uma marca. Divide-se em: (i) <strong>Brand Recognition</strong> — capacidade de identificar a marca quando exposta; (ii) <strong>Brand Recall</strong> — capacidade de lembrar espontaneamente da marca em uma categoria; (iii) <strong>Top of Mind</strong> — primeira marca citada espontaneamente. Métrica crítica no funil de marketing (Kotler & Keller, 2016).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Benchmarking</p>
                    <p className="text-xs mt-1">Processo sistemático de comparação de práticas, processos e métricas de desempenho com líderes de mercado ou best-in-class competitors. Tipos: (i) <strong>Competitivo</strong> — comparação direta com concorrentes; (ii) <strong>Funcional</strong> — comparação de funções similares em indústrias diferentes; (iii) <strong>Interno</strong> — comparação entre unidades/equipes da mesma organização (Pride & Ferrell, 2015).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Brand Equity (Valor da Marca)</p>
                    <p className="text-xs mt-1">Valor adicional que uma marca confere a um produto além de seus atributos funcionais. Componentes: (i) Reconhecimento, (ii) Percepção de qualidade, (iii) Associações de marca, (iv) Lealdade. Marcas com alto equity permitem preços premium e reduzem elasticidade-preço da demanda (Aaker, 1991; Keller, 2013).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Brand Positioning (Posicionamento de Marca)</p>
                    <p className="text-xs mt-1">Processo de criar uma imagem distintiva da marca na mente do consumidor-alvo, diferenciando-a de concorrentes. Baseia-se em atributos tangíveis (qualidade, preço, features) ou intangíveis (status, valores, estilo de vida). Framework clássico: "Para [target], [marca] é o [frame of reference] que [point of difference] porque [reason to believe]" (Ries & Trout, 2009).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Buyer Persona</p>
                    <p className="text-xs mt-1">Representação semifictícia do cliente ideal baseada em dados demográficos, comportamentais, psicográficos e motivacionais reais. Inclui: idade, renda, educação, objetivos, desafios (pain points), canais preferidos, processo de decisão de compra. Ferramenta essencial para segmentação e comunicação direcionada (Kotler & Armstrong, 2018).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">CAC (Customer Acquisition Cost)</p>
                    <p className="text-xs mt-1">Custo total para adquirir um novo cliente, incluindo investimentos em marketing, vendas, tecnologia e overhead alocado. Fórmula: CAC = (Custos de Marketing + Custos de Vendas) / Número de Novos Clientes. Regra de ouro: CAC deve ser &lt; 1/3 do LTV para sustentabilidade financeira (SaaS metrics).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Churn Rate (Taxa de Cancelamento)</p>
                    <p className="text-xs mt-1">Percentual de clientes que deixam de comprar ou cancelam assinatura em período específico. Fórmula: Churn (%) = (Clientes Perdidos / Total Clientes Início) × 100. Churn alto (&gt;10% ao mês em SaaS) indica problemas de produto, atendimento ou fit mercado-solução. Oposto de <strong>Retention Rate</strong>.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">CLV (Customer Lifetime Value)</p>
                    <p className="text-xs mt-1">Valor presente líquido de todos os fluxos de caixa futuros gerados por um cliente durante seu relacionamento com a empresa. Veja KPI #7 para fórmula detalhada. Métrica estratégica que justifica investimentos em aquisição e retenção (Kotler & Keller, 2016).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Conversion Funnel (Funil de Conversão)</p>
                    <p className="text-xs mt-1">Modelo que representa jornada do cliente desde awareness até compra. Etapas típicas: (1) <strong>Topo</strong> — Awareness/Descoberta, (2) <strong>Meio</strong> — Consideração/Interesse, (3) <strong>Fundo</strong> — Decisão/Ação, (4) <strong>Pós-venda</strong> — Retenção/Advocacy. Taxa de conversão mede eficiência de cada etapa.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Cross-selling / Up-selling</p>
                    <p className="text-xs mt-1"><strong>Cross-selling:</strong> Venda de produtos complementares (ex: bateria com câmera). <strong>Up-selling:</strong> Upgrade para versão superior/premium (ex: smartphone 128GB → 256GB). Ambas estratégias aumentam ticket médio e LTV com CAC marginal próximo de zero.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Demographics vs. Psychographics</p>
                    <p className="text-xs mt-1"><strong>Demographics:</strong> Variáveis quantificáveis objetivas — idade, gênero, renda, educação, ocupação, localização. <strong>Psychographics:</strong> Variáveis qualitativas subjetivas — valores, atitudes, interesses, estilo de vida (modelo VALS — Values and Lifestyles). Psychographics explicam o "porquê" das decisões de compra.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Engagement (Engajamento)</p>
                    <p className="text-xs mt-1">Grau de interação e envolvimento emocional do consumidor com a marca. Métricas digitais: likes, comments, shares, tempo de sessão, taxa de cliques. Engajamento alto correlaciona com lealdade, advocacy e menor sensibilidade a preço (Kotler et al., 2017).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Market Penetration (Penetração de Mercado)</p>
                    <p className="text-xs mt-1">Estratégia de crescimento focada em aumentar vendas de produtos existentes em mercados existentes via: (i) aumento de uso por clientes atuais, (ii) captura de clientes de concorrentes, (iii) conversão de não-usuários. Matriz Ansoff: menor risco entre as quatro estratégias (Ansoff, 1957).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Market Segmentation (Segmentação de Mercado)</p>
                    <p className="text-xs mt-1">Divisão de mercado heterogêneo em subgrupos homogêneos com necessidades, comportamentos ou características similares. Bases: (i) Geográfica, (ii) Demográfica, (iii) Psicográfica, (iv) Comportamental. Segmentos devem ser mensuráveis, acessíveis, substanciais e diferenciáveis (Kotler & Keller, 2016).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Market Share (Participação de Mercado)</p>
                    <p className="text-xs mt-1">Percentual das vendas totais do mercado capturadas pela empresa. Veja KPI #16 para fórmula completa e análise econômica (modelos de Cournot/Bertrand, HHI, implicações estratégicas).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Niche Market (Mercado de Nicho)</p>
                    <p className="text-xs mt-1">Segmento pequeno mas bem-definido de mercado com necessidades específicas não atendidas por mass market. Estratégia de nicho permite: (i) especialização profunda, (ii) preços premium, (iii) barreira à entrada de grandes players, (iv) lealdade alta. Risco: limitação de escala (Porter, 1980 — estratégia de foco).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Pain Points (Pontos de Dor)</p>
                    <p className="text-xs mt-1">Problemas, frustrações ou necessidades não atendidas que motivam consumidor a buscar soluções. Tipos: (i) <strong>Financeiros</strong> — custo excessivo; (ii) <strong>Produtividade</strong> — ineficiência/desperdício de tempo; (iii) <strong>Processo</strong> — dificuldade de uso; (iv) <strong>Suporte</strong> — atendimento inadequado. Value proposition deve endereçar pain points específicos.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Pricing Strategies (Estratégias de Precificação)</p>
                    <p className="text-xs mt-1"><strong>Premium Pricing:</strong> Preços altos sustentados por diferenciação/qualidade superior. <strong>Penetration Pricing:</strong> Preços baixos iniciais para ganhar market share rapidamente. <strong>Price Skimming:</strong> Preços altos no lançamento, reduzidos gradualmente (produtos inovadores). <strong>Competitive Pricing:</strong> Paridade com concorrentes. <strong>Value-Based:</strong> Baseado em valor percebido pelo cliente.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Product Life Cycle (Ciclo de Vida do Produto)</p>
                    <p className="text-xs mt-1">Modelo de evolução de vendas/lucro em quatro fases: (1) <strong>Introdução</strong> — crescimento lento, lucro negativo; (2) <strong>Crescimento</strong> — vendas acelerando, lucro aumentando; (3) <strong>Maturidade</strong> — vendas plateau, lucro máximo; (4) <strong>Declínio</strong> — queda de vendas/lucro. Estratégias de marketing devem adaptar-se à fase (Kotler & Armstrong, 2018).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Retention Rate (Taxa de Retenção)</p>
                    <p className="text-xs mt-1">Percentual de clientes que continuam comprando em período específico. Fórmula: Retention (%) = [(Clientes Fim - Clientes Novos) / Clientes Início] × 100. Aumentar retention em 5% pode aumentar lucros em 25-95% (Reichheld, 2006). Oposto de Churn Rate.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">ROI (Return on Investment)</p>
                    <p className="text-xs mt-1">Retorno sobre investimento. Veja KPI #5 para análise completa incluindo WACC, EVA, TMA, CAPM, Análise Dupont e contextualização com finanças corporativas.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Share of Mind (Lembrança de Marca)</p>
                    <p className="text-xs mt-1">Percentual de consumidores que citam determinada marca quando perguntados sobre uma categoria de produto. <strong>Top of Mind</strong> é a primeira marca citada (mais alto share of mind). Correlaciona fortemente com preferência de compra e market share (Aaker, 1991).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Share of Heart (Preferência de Marca)</p>
                    <p className="text-xs mt-1">Percentual de consumidores que declaram determinada marca como sua preferida em uma categoria, independentemente de compra efetiva. Métrica emocional que precede intenção de compra. Combinação de Share of Mind + Share of Heart prediz Share of Market (Kotler & Keller, 2016).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Share of Wallet (Participação na Carteira)</p>
                    <p className="text-xs mt-1">Percentual dos gastos totais do cliente em uma categoria que é capturado pela empresa. Exemplo: cliente gasta R$ 1.000/mês em supermercado, sendo R$ 300 na empresa X → Share of Wallet = 30%. Aumentar SoW de clientes existentes tem CAC zero (Reichheld, 2006).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">STP (Segmentation, Targeting, Positioning)</p>
                    <p className="text-xs mt-1">Framework estratégico de marketing em três etapas: (1) <strong>Segmentation</strong> — dividir mercado em grupos homogêneos; (2) <strong>Targeting</strong> — selecionar segmento(s)-alvo com maior atratividade/fit; (3) <strong>Positioning</strong> — criar proposta de valor distintiva para o target. Base do marketing estratégico moderno (Kotler & Keller, 2016).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Target Audience (Público-Alvo)</p>
                    <p className="text-xs mt-1">Grupo específico de consumidores para quem a oferta é direcionada, definido por características demográficas, psicográficas, comportamentais e geográficas. Deve ser: (i) específico o suficiente para permitir comunicação relevante, (ii) amplo o suficiente para viabilidade econômica.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">USP (Unique Selling Proposition)</p>
                    <p className="text-xs mt-1">Benefício ou característica distintiva que diferencia produto de concorrentes e justifica escolha. Critérios: (i) <strong>Relevante</strong> — importante para target, (ii) <strong>Único</strong> — não oferecido por concorrentes, (iii) <strong>Defensável</strong> — difícil de copiar, (iv) <strong>Comunicável</strong> — fácil de entender. Conceito criado por Rosser Reeves (1961).</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded border border-purple-200 dark:border-purple-800">
                    <p className="font-bold">Value Proposition (Proposta de Valor)</p>
                    <p className="text-xs mt-1">Combinação única de benefícios que a empresa promete entregar ao cliente-alvo, respondendo: "Por que o cliente deve escolher você vs. concorrentes?" Componentes: (i) <strong>Gains</strong> — benefícios gerados, (ii) <strong>Pain Relievers</strong> — problemas resolvidos, (iii) <strong>Products/Services</strong> — oferta concreta. Framework: Value Proposition Canvas (Osterwalder, 2014).</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900 rounded border border-purple-300 dark:border-purple-700">
                  <p className="text-xs">
                    <strong>💡 Nota:</strong> Todos os termos acima são fundamentados em literatura acadêmica reconhecida (Kotler, Porter, Aaker, Ries & Trout) e amplamente utilizados na prática de mercado global. Para aprofundamento, consulte as Referências Bibliográficas listadas anteriormente.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold mb-2">📖 Leituras Complementares Recomendadas</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Para aprofundamento em tópicos específicos não cobertos extensivamente neste manual:
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  <li><strong>Elasticidade-Preço da Demanda:</strong> Varian (2012), Cap. 15 — Demanda de Mercado</li>
                  <li><strong>Teoria dos Jogos Aplicada:</strong> Tirole (1988), Cap. 6 — Dynamic Games and First-Mover Advantage</li>
                  <li><strong>Análise de Investimentos:</strong> Damodaran (2012), Cap. 5 — NPV, IRR, and Payback Analysis</li>
                  <li><strong>Customer Lifetime Value (CLV):</strong> Kotler & Keller (2016), Cap. 5 — Creating Customer Value and Engagement</li>
                  <li><strong>Posicionamento Estratégico:</strong> Ries & Trout (2009) — obra completa sobre positioning strategy</li>
                  <li><strong>Inovação Disruptiva:</strong> Christensen (1997) — The Innovator's Dilemma (obra seminal)</li>
                  <li><strong>Brand Equity:</strong> Aaker, David A. (1991) — Managing Brand Equity</li>
                  <li><strong>Value Proposition Design:</strong> Osterwalder et al. (2014) — Value Proposition Design</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
