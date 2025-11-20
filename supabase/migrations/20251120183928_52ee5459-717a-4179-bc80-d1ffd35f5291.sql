-- Criar tabela de auditoria para gerenciamento de usuários
CREATE TABLE IF NOT EXISTS public.user_management_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'reset_password')),
  target_user_email TEXT NOT NULL,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_management_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas diretoria pode ver logs
CREATE POLICY "Diretoria pode ver logs de auditoria"
ON public.user_management_logs
FOR SELECT
USING (has_role(auth.uid(), 'diretoria'::app_role));

-- Política: Sistema pode inserir logs
CREATE POLICY "Sistema pode inserir logs"
ON public.user_management_logs
FOR INSERT
WITH CHECK (true);

-- Índice para performance
CREATE INDEX idx_user_management_logs_admin ON public.user_management_logs(admin_user_id);
CREATE INDEX idx_user_management_logs_target ON public.user_management_logs(target_user_email);
CREATE INDEX idx_user_management_logs_created ON public.user_management_logs(created_at DESC);