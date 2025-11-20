import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Sem autorização');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Check if user has diretoria role
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'diretoria') {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas diretoria pode gerenciar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const userId = pathParts[pathParts.length - 1];

    // GET - List all users
    if (req.method === 'GET') {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) throw error;

      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create new user
    if (req.method === 'POST') {
      const { email, password, fullName } = await req.json();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Email inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate password strength
      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Senha deve ter no mínimo 8 caracteres' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || email.split('@')[0]
        }
      });

      if (createError) throw createError;

      // Log audit
      await supabaseAdmin.from('user_management_logs').insert({
        admin_user_id: user.id,
        action: 'create',
        target_user_email: email,
        changes: { email, full_name: fullName }
      });

      console.log(`[ADMIN] User created: ${email} by ${user.email}`);

      return new Response(
        JSON.stringify({ user: newUser }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update user
    if (req.method === 'PUT' && userId) {
      const { email, password, active } = await req.json();

      // Prevent modifying master admin
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (targetUser?.user?.email === 'ti@isssl.com.br' && user.email !== 'ti@isssl.com.br') {
        return new Response(
          JSON.stringify({ error: 'Não é possível modificar o administrador master' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: any = {};
      if (email) updates.email = email;
      if (password) updates.password = password;
      if (active !== undefined) {
        updates.ban_duration = active ? 'none' : '876000h'; // Ban for 100 years if inactive
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        updates
      );

      if (updateError) throw updateError;

      // Log audit
      await supabaseAdmin.from('user_management_logs').insert({
        admin_user_id: user.id,
        action: 'update',
        target_user_email: targetUser?.user?.email || email,
        changes: updates
      });

      console.log(`[ADMIN] User updated: ${userId} by ${user.email}`);

      return new Response(
        JSON.stringify({ user: updatedUser }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete user
    if (req.method === 'DELETE' && userId) {
      // Get user details before deletion
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      // Prevent deleting master admin
      if (targetUser?.user?.email === 'ti@isssl.com.br') {
        return new Response(
          JSON.stringify({ error: 'Não é possível excluir o administrador master' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent self-deletion
      if (userId === user.id) {
        return new Response(
          JSON.stringify({ error: 'Não é possível excluir sua própria conta' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      // Log audit
      await supabaseAdmin.from('user_management_logs').insert({
        admin_user_id: user.id,
        action: 'delete',
        target_user_email: targetUser?.user?.email || 'unknown'
      });

      console.log(`[ADMIN] User deleted: ${userId} by ${user.email}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ADMIN] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
