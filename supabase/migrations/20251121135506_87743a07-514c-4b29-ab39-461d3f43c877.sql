-- Criar tabela para funcionários arquivados
CREATE TABLE IF NOT EXISTS public.archived_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_employee_id uuid NOT NULL,
  employee_data jsonb NOT NULL,
  documents jsonb,
  edit_history jsonb,
  status_history jsonb,
  benefits jsonb,
  trainings jsonb,
  timesheets jsonb,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_by uuid REFERENCES auth.users(id),
  archive_reason text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.archived_employees ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Diretoria e RH podem ver arquivados"
ON public.archived_employees
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'diretoria'::app_role) OR 
  has_role(auth.uid(), 'rh_matriz'::app_role)
);

CREATE POLICY "Diretoria e RH podem arquivar"
ON public.archived_employees
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'diretoria'::app_role) OR 
  has_role(auth.uid(), 'rh_matriz'::app_role)
);

CREATE POLICY "Diretoria pode restaurar (deletar arquivo)"
ON public.archived_employees
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'diretoria'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_archived_employees_updated_at
BEFORE UPDATE ON public.archived_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_archived_employees_original_id ON public.archived_employees(original_employee_id);
CREATE INDEX idx_archived_employees_archived_at ON public.archived_employees(archived_at DESC);
CREATE INDEX idx_archived_employees_archived_by ON public.archived_employees(archived_by);