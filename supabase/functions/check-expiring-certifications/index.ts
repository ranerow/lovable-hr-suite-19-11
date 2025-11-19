import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Verificando certidões PJ vencendo...');

    const today = new Date().toISOString().split('T')[0];

    // Buscar certidões vencidas
    const { data: expiredCerts, error: expiredError } = await supabaseClient
      .from('pj_certifications')
      .select(`
        *,
        employee:employees(full_name, email, company_name)
      `)
      .lt('expiry_date', today)
      .neq('status', 'vencida');

    if (expiredError) {
      console.error('Erro ao buscar certidões vencidas:', expiredError);
      throw expiredError;
    }

    // Atualizar certidões vencidas
    if (expiredCerts && expiredCerts.length > 0) {
      const expiredIds = expiredCerts.map(c => c.id);
      
      const { error: updateExpiredError } = await supabaseClient
        .from('pj_certifications')
        .update({ status: 'vencida' })
        .in('id', expiredIds);

      if (updateExpiredError) {
        console.error('Erro ao atualizar certidões vencidas:', updateExpiredError);
        throw updateExpiredError;
      }

      console.log(`${expiredIds.length} certidões marcadas como vencidas`);
    }

    // Buscar certidões vencendo (dentro do período de alerta)
    const { data: expiringCerts, error: expiringError } = await supabaseClient
      .from('pj_certifications')
      .select(`
        *,
        employee:employees(full_name, email, company_name)
      `)
      .gte('expiry_date', today)
      .eq('status', 'valida');

    if (expiringError) {
      console.error('Erro ao buscar certidões vencendo:', expiringError);
      throw expiringError;
    }

    // Verificar quais estão dentro do período de alerta
    const certsToUpdate = expiringCerts?.filter(cert => {
      const expiryDate = new Date(cert.expiry_date);
      const alertDate = new Date();
      alertDate.setDate(alertDate.getDate() + (cert.alert_days_before || 30));
      return expiryDate <= alertDate;
    }) || [];

    // Atualizar certidões para status "vencendo"
    if (certsToUpdate.length > 0) {
      const vencendoIds = certsToUpdate.map(c => c.id);
      
      const { error: updateVencendoError } = await supabaseClient
        .from('pj_certifications')
        .update({ status: 'vencendo' })
        .in('id', vencendoIds);

      if (updateVencendoError) {
        console.error('Erro ao atualizar certidões vencendo:', updateVencendoError);
        throw updateVencendoError;
      }

      console.log(`${vencendoIds.length} certidões marcadas como vencendo`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired: expiredCerts?.length || 0,
        expiring: certsToUpdate.length,
        message: 'Verificação de certidões concluída'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});