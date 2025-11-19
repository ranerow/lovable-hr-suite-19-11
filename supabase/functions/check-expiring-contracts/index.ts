import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Verificando contratos PJ vencendo...');

    // Calcular data de 30 dias no futuro
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

    // Buscar contratos que vencem em até 30 dias
    const { data: expiringContracts, error: contractsError } = await supabaseClient
      .from('pj_contracts')
      .select(`
        *,
        employee:employees(full_name, email, company_name)
      `)
      .eq('status', 'ativo')
      .lte('end_date', thirtyDaysStr);

    if (contractsError) {
      console.error('Erro ao buscar contratos:', contractsError);
      throw contractsError;
    }

    console.log(`Encontrados ${expiringContracts?.length || 0} contratos vencendo`);

    // Atualizar status dos contratos para "a_vencer"
    if (expiringContracts && expiringContracts.length > 0) {
      const contractIds = expiringContracts.map(c => c.id);
      
      const { error: updateError } = await supabaseClient
        .from('pj_contracts')
        .update({ status: 'a_vencer' })
        .in('id', contractIds);

      if (updateError) {
        console.error('Erro ao atualizar status:', updateError);
        throw updateError;
      }

      console.log(`${contractIds.length} contratos atualizados para status "a_vencer"`);
    }

    // Aqui você poderia enviar notificações por email
    // const notifications = expiringContracts.map(contract => ({
    //   to: contract.employee.email,
    //   subject: 'Contrato PJ Vencendo',
    //   body: `Seu contrato vence em ${contract.end_date}`
    // }));

    return new Response(
      JSON.stringify({
        success: true,
        contractsFound: expiringContracts?.length || 0,
        message: 'Verificação de contratos concluída'
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