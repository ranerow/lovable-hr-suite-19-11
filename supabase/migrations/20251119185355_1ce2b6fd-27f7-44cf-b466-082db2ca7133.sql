-- Criar tabela de convites de onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('CLT', 'PJ')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'expirado')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  completion_percentage INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX idx_onboarding_token ON public.onboarding_invitations(token);
CREATE INDEX idx_onboarding_status ON public.onboarding_invitations(status);
CREATE INDEX idx_onboarding_expires ON public.onboarding_invitations(expires_at);

-- Habilitar RLS
ALTER TABLE public.onboarding_invitations ENABLE ROW LEVEL SECURITY;

-- RH pode gerenciar convites
CREATE POLICY "RH pode gerenciar convites"
  ON public.onboarding_invitations
  FOR ALL
  USING (
    has_role(auth.uid(), 'diretoria'::app_role) OR 
    has_role(auth.uid(), 'rh_matriz'::app_role) OR 
    has_role(auth.uid(), 'rh_filial'::app_role)
  );

-- Acesso público via token válido para SELECT
CREATE POLICY "Acesso público via token válido"
  ON public.onboarding_invitations
  FOR SELECT
  USING (
    (status = 'pendente' OR status = 'em_andamento')
    AND expires_at > now()
  );

-- Atualização via token válido
CREATE POLICY "Atualização via token válido"
  ON public.onboarding_invitations
  FOR UPDATE
  USING (
    (status = 'pendente' OR status = 'em_andamento')
    AND expires_at > now()
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_onboarding_invitations_updated_at
  BEFORE UPDATE ON public.onboarding_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Policy para upload temporário de documentos via token
CREATE POLICY "Upload temporário via token onboarding"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'employee-documents' 
    AND (storage.foldername(name))[1] = 'onboarding'
    AND (storage.foldername(name))[2] IN (
      SELECT token FROM public.onboarding_invitations 
      WHERE status IN ('pendente', 'em_andamento')
      AND expires_at > now()
    )
  );

-- Policy para leitura de documentos temporários
CREATE POLICY "Leitura temporária via token onboarding"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'employee-documents' 
    AND (storage.foldername(name))[1] = 'onboarding'
    AND (storage.foldername(name))[2] IN (
      SELECT token FROM public.onboarding_invitations 
      WHERE status IN ('pendente', 'em_andamento')
      AND expires_at > now()
    )
  );