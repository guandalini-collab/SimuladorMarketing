interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string = "noreply@simulamarketing.com.br";

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    if (!this.apiKey) {
      console.warn("⚠️  RESEND_API_KEY não configurado. Emails não serão enviados.");
    }
  }

  async sendEmail(payload: EmailPayload): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`📧 [MODO DESENVOLVIMENTO] Email não enviado para: ${payload.to.join(", ")}`);
      console.log(`📧 Assunto: ${payload.subject}`);
      return false;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Erro ao enviar email:", error);
        return false;
      }

      const data = await response.json();
      console.log(`✅ Email enviado com sucesso para: ${payload.to.join(", ")}`);
      return true;
    } catch (error) {
      console.error("❌ Erro ao enviar email:", error);
      return false;
    }
  }

  async sendUserApprovedEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: [userEmail],
      subject: "✅ Cadastro Aprovado - Simula+",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Cadastro Aprovado!</h2>
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Seu cadastro no <strong>Simula+</strong> foi aprovado pelo professor!</p>
          <p>Agora você já pode fazer login e começar a participar da simulação de marketing.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}" 
               style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Acessar Simula+
            </a>
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">
            Este é um email automático do sistema Simula+
          </p>
        </div>
      `,
    });
  }

  async sendUserPendingEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: [userEmail],
      subject: "⏳ Aguardando Aprovação - Simula+",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">Aguardando Aprovação</h2>
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Seu cadastro no <strong>Simula+</strong> está aguardando aprovação do professor.</p>
          <p>Como você utilizou um email que não é institucional, precisamos da validação do professor antes de liberar seu acesso.</p>
          <p style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <strong>📌 O que fazer agora?</strong><br />
            Aguarde a confirmação por email. Assim que o professor aprovar seu cadastro, você receberá uma notificação.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">
            Este é um email automático do sistema Simula+
          </p>
        </div>
      `,
    });
  }

  async sendDecisionSubmittedEmail(
    teamName: string,
    roundNumber: number,
    leaderEmail: string,
    productQuality: string,
    priceValue: number,
    distributionChannels: string[],
    promotionMix: string[],
    estimatedCost: number
  ): Promise<boolean> {
    const professorEmails = ["alexandre.bossa@iffarroupilha.edu.br", "guandalini@gmail.com"];
    const allRecipients = [...professorEmails, leaderEmail];

    return this.sendEmail({
      to: allRecipients,
      subject: `🎯 Nova Decisão Enviada - ${teamName} (Rodada ${roundNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Decisão de Marketing Enviada</h2>
          <p><strong>Equipe:</strong> ${teamName}</p>
          <p><strong>Rodada:</strong> ${roundNumber}</p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #1f2937;">📊 Resumo da Decisão:</h3>
            
            <p><strong>🎁 Produto:</strong> Qualidade ${productQuality}</p>
            <p><strong>💰 Preço:</strong> R$ ${priceValue.toFixed(2)}</p>
            <p><strong>📍 Distribuição:</strong> ${distributionChannels.join(", ")}</p>
            <p><strong>📢 Promoção:</strong> ${promotionMix.join(", ")}</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #d1d5db;" />
            
            <p><strong>💵 Custo Estimado:</strong> 
              <span style="color: #dc2626; font-size: 18px; font-weight: bold;">
                R$ ${estimatedCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            ⚠️ Esta decisão foi confirmada e não pode mais ser alterada.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">
            Este é um email automático do sistema Simula+
          </p>
        </div>
      `,
    });
  }

  async sendProfessorNewPendingUserEmail(userName: string, userEmail: string): Promise<boolean> {
    const professorEmails = ["alexandre.bossa@iffarroupilha.edu.br", "guandalini@gmail.com"];

    return this.sendEmail({
      to: professorEmails,
      subject: "⚠️ Novo usuário pendente de aprovação - Simula+",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">Novo Usuário Aguardando Aprovação</h2>
          <p>Um novo usuário se cadastrou com email não-institucional e precisa de sua aprovação:</p>
          
          <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
            <p><strong>Nome:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Acessar Painel de Aprovações
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">
            Este é um email automático do sistema Simula+
          </p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: [userEmail],
      subject: "🔑 Recuperação de Senha - Simula+",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Recuperação de Senha</h2>
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Você solicitou a recuperação de senha para sua conta no <strong>Simula+</strong>.</p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0;"><strong>⚠️ Atenção:</strong> Este link expira em <strong>1 hora</strong>.</p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Redefinir Minha Senha
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">
            Este é um email automático do sistema Simula+
          </p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
