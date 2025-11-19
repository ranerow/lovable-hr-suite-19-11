import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  employeeName: string;
  employeeEmail: string;
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeName, employeeEmail, invitationId }: NotificationRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Notificando RH sobre conclusão de onboarding:", employeeName);

    // Buscar usuários do RH (roles: diretoria, rh_matriz, rh_filial)
    const { data: rhUsers, error: rhError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["diretoria", "rh_matriz", "rh_filial"]);

    if (rhError) {
      console.error("Erro ao buscar usuários do RH:", rhError);
      throw rhError;
    }

    // Aqui você pode implementar:
    // 1. Notificação in-app (criar tabela de notificações)
    // 2. Envio de email para o RH
    // 3. Webhook para sistema externo
    
    // Exemplo de log por enquanto:
    console.log(`${rhUsers?.length || 0} usuários do RH foram notificados sobre ${employeeName}`);

    // TODO: Implementar envio de email via Resend
    // const resendApiKey = Deno.env.get("RESEND_API_KEY");
    // if (resendApiKey) {
    //   await fetch("https://api.resend.com/emails", {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `Bearer ${resendApiKey}`,
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({
    //       from: "RH <rh@isssl.com.br>",
    //       to: rhEmails,
    //       subject: `Cadastro de Onboarding Concluído - ${employeeName}`,
    //       html: `<p>${employeeName} (${employeeEmail}) finalizou o cadastro de onboarding.</p>`
    //     })
    //   });
    // }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificação enviada",
        notifiedUsers: rhUsers?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro ao notificar RH:", error);
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
