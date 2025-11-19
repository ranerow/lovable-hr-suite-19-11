import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  name: string;
  link: string;
  validityDays: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name, link, validityDays }: EmailRequest = await req.json();

    console.log("Enviando email de onboarding para:", to);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    // TODO: Implementar envio de email via Resend
    // Por enquanto, apenas retorna sucesso
    const emailResponse = {
      success: true,
      message: "Email will be sent (integration pending)"
    };
    
    /* Para implementar com Resend:
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "ISSSL RH <onboarding@resend.dev>",
        to: [to],
      subject: "Bem-vindo ao ISSSL - Complete seu cadastro",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .message {
              margin-bottom: 30px;
              color: #666;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
            }
            .info-box {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .divider {
              height: 1px;
              background: #e0e0e0;
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao ISSSL!</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Olá, ${name}!</div>
              
              <div class="message">
                <p>Estamos muito felizes em tê-lo(a) em nossa equipe! 🎊</p>
                
                <p>Para finalizar seu processo de admissão, precisamos que você complete seu cadastro e envie os documentos necessários através do nosso portal de onboarding.</p>
                
                <p>É rápido, fácil e pode ser feito do seu celular ou computador!</p>
              </div>

              <div style="text-align: center;">
                <a href="${link}" class="cta-button">
                  Completar Cadastro Agora
                </a>
              </div>

              <div class="info-box">
                <strong>⏰ Importante:</strong>
                <p style="margin: 10px 0 0 0;">
                  Este link é válido até ${expiryDate.toLocaleDateString('pt-BR')}.
                  Não compartilhe este link com outras pessoas.
                </p>
              </div>

              <div class="divider"></div>

              <p style="color: #666; font-size: 14px;">
                <strong>O que você precisará:</strong><br>
                • Seus documentos pessoais (RG, CPF, comprovante de residência)<br>
                • Informações bancárias<br>
                • Cerca de 15 minutos do seu tempo
              </p>
            </div>

            <div class="footer">
              <p><strong>Precisa de ajuda?</strong></p>
              <p>Entre em contato com o RH: rh@isssl.com.br</p>
              <p style="margin-top: 20px; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} ISSSL. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `})
    });
    */

    console.log("Email preparado para envio:", { to, name });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
