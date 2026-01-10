import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
  cc?: string[];
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to: options.to,
      cc: options.cc,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (result.error) {
      console.error("Erro ao enviar email:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendTeamEmail(
  teamEmails: string[],
  professorEmail: string,
  subject: string,
  message: string,
  teamName: string,
  className: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Simula+</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Simulador de Marketing no Mercado</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
        <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">
          Mensagem para: <strong>${teamName}</strong> | Turma: <strong>${className}</strong>
        </p>
      </div>
      
      <div style="padding: 30px; background: white; border: 1px solid #e9ecef; border-top: none;">
        <h2 style="color: #333; margin: 0 0 20px 0;">${subject}</h2>
        <div style="color: #555; line-height: 1.6;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px 20px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #6c757d; margin: 0; font-size: 12px; text-align: center;">
          Este email foi enviado através da plataforma Simula+.<br>
          Em caso de dúvidas, responda diretamente a este email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: teamEmails,
    cc: [professorEmail],
    subject: `[Simula+] ${subject}`,
    html,
    replyTo: professorEmail,
  });
}
