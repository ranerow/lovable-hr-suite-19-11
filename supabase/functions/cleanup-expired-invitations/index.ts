import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Iniciando limpeza de convites expirados...");

    // Atualizar convites expirados
    const { data: expiredInvites, error: updateError } = await supabase
      .from("onboarding_invitations")
      .update({ status: "expirado" })
      .lt("expires_at", new Date().toISOString())
      .in("status", ["pendente", "em_andamento"])
      .select("token");

    if (updateError) {
      console.error("Erro ao atualizar convites:", updateError);
      throw updateError;
    }

    console.log(`${expiredInvites?.length || 0} convites marcados como expirados`);

    // Buscar convites expirados há mais de 30 dias para limpeza de arquivos
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: oldExpiredInvites, error: fetchError } = await supabase
      .from("onboarding_invitations")
      .select("token")
      .eq("status", "expirado")
      .lt("expires_at", thirtyDaysAgo.toISOString());

    if (fetchError) {
      console.error("Erro ao buscar convites antigos:", fetchError);
      throw fetchError;
    }

    console.log(`${oldExpiredInvites?.length || 0} convites antigos encontrados para limpeza`);

    // Remover arquivos temporários de convites antigos
    let filesDeleted = 0;
    for (const invite of oldExpiredInvites || []) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from("employee-documents")
          .list(`onboarding/${invite.token}`);

        if (listError || !files || files.length === 0) {
          continue;
        }

        const filePaths = files.map(file => `onboarding/${invite.token}/${file.name}`);
        
        const { error: deleteError } = await supabase.storage
          .from("employee-documents")
          .remove(filePaths);

        if (deleteError) {
          console.error(`Erro ao deletar arquivos do token ${invite.token}:`, deleteError);
        } else {
          filesDeleted += filePaths.length;
          console.log(`Arquivos deletados para token ${invite.token}`);
        }
      } catch (error) {
        console.error(`Erro ao processar token ${invite.token}:`, error);
      }
    }

    const result = {
      success: true,
      expiredInvites: expiredInvites?.length || 0,
      oldInvitesProcessed: oldExpiredInvites?.length || 0,
      filesDeleted,
      timestamp: new Date().toISOString(),
    };

    console.log("Limpeza concluída:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Erro na limpeza:", error);
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
