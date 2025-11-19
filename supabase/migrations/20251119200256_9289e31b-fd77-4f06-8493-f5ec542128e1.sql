-- Criar tabela de histórico de mudanças de status de funcionários
CREATE TABLE IF NOT EXISTS public.employee_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_employee_status_history_employee_id ON public.employee_status_history(employee_id);
CREATE INDEX idx_employee_status_history_changed_at ON public.employee_status_history(changed_at DESC);

-- Habilitar RLS
ALTER TABLE public.employee_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "RH e Diretoria podem ver histórico"
ON public.employee_status_history
FOR SELECT
USING (
  has_role(auth.uid(), 'diretoria'::app_role) OR
  has_role(auth.uid(), 'rh_matriz'::app_role) OR
  has_role(auth.uid(), 'rh_filial'::app_role)
);

CREATE POLICY "Sistema pode inserir histórico"
ON public.employee_status_history
FOR INSERT
WITH CHECK (true);

-- Criar função trigger para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.log_employee_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só registra se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.employee_status_history (
      employee_id,
      previous_status,
      new_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'Ativo' AND OLD.status = 'Aguardando Ativação' THEN 'Funcionário ativado após revisão de onboarding'
        WHEN NEW.status = 'Inativo' AND OLD.status = 'Aguardando Ativação' THEN 'Funcionário reprovado na revisão de onboarding'
        WHEN NEW.status = 'Férias' THEN 'Funcionário entrou em férias'
        WHEN NEW.status = 'Afastado' THEN 'Funcionário afastado'
        WHEN NEW.status = 'Demitido' THEN 'Funcionário demitido'
        ELSE 'Mudança de status'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para employees
DROP TRIGGER IF EXISTS employee_status_change_trigger ON public.employees;
CREATE TRIGGER employee_status_change_trigger
  AFTER UPDATE OF status ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.log_employee_status_change();

-- Inserir histórico inicial para funcionários existentes com status "Aguardando Ativação"
INSERT INTO public.employee_status_history (employee_id, previous_status, new_status, reason, notes)
SELECT 
  id,
  NULL,
  'Aguardando Ativação',
  'Onboarding concluído - aguardando ativação pelo RH',
  'Histórico inicial criado automaticamente'
FROM employees
WHERE status = 'Aguardando Ativação'
ON CONFLICT DO NOTHING;