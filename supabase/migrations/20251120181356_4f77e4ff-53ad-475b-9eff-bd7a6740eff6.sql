-- Criar tabela de histórico de edições de funcionários
CREATE TABLE public.employee_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL,
  changed_fields JSONB NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_edit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Diretoria e RH Matriz podem ver histórico de edições"
ON public.employee_edit_history
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'diretoria'::app_role) OR 
  has_role(auth.uid(), 'rh_matriz'::app_role)
);

CREATE POLICY "Sistema pode inserir histórico de edições"
ON public.employee_edit_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_employee_edit_history_employee_id ON public.employee_edit_history(employee_id);
CREATE INDEX idx_employee_edit_history_edited_at ON public.employee_edit_history(edited_at DESC);