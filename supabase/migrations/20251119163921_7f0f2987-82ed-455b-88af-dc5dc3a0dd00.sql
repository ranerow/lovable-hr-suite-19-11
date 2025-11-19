-- ============================================
-- SPRINT 1: SISTEMA DE PERMISSÕES E EXPANSÃO
-- ============================================

-- 1. Criar ENUM para roles/permissões
CREATE TYPE app_role AS ENUM (
  'diretoria',       -- Acesso total
  'rh_matriz',       -- Todas as filiais
  'rh_filial',       -- Apenas sua filial
  'gestor',          -- Seu departamento
  'colaborador_clt', -- Apenas seus dados
  'prestador_pj'     -- Apenas seus dados
);

-- 2. Criar tabela de permissões de usuário
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  unit_id UUID REFERENCES units(id), -- NULL = todas unidades
  department_id UUID REFERENCES departments(id), -- NULL = todos departamentos
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role, unit_id, department_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Criar funções de segurança (SECURITY DEFINER para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_unit(_user_id UUID, _unit_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND (
      role IN ('diretoria', 'rh_matriz')
      OR (role = 'rh_filial' AND unit_id = _unit_id)
    )
  )
$$;

-- 4. RLS Policies para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Diretoria e RH Matriz podem ver todas as roles"
ON user_roles FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

CREATE POLICY "Diretoria pode gerenciar roles"
ON user_roles FOR ALL
USING (public.has_role(auth.uid(), 'diretoria'))
WITH CHECK (public.has_role(auth.uid(), 'diretoria'));

-- 5. Expandir tabela employees com campos CLT
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_number VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_series VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_state VARCHAR(2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis_pasep VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_type TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS technical_responsibility TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS thirteenth_salary_provision NUMERIC(10,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacation_provision NUMERIC(10,2) DEFAULT 0;

-- Constraint para shift_type
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_shift_type_check;
ALTER TABLE employees ADD CONSTRAINT employees_shift_type_check 
CHECK (shift_type IS NULL OR shift_type IN ('diurno', 'noturno', 'misto'));

-- 6. Expandir tabela employees com campos PJ
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS municipal_registration VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS legal_representative TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_end_date_pj DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS monthly_value NUMERIC(10,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS service_scope TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pj_type TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false;

-- Constraint para pj_type
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_pj_type_check;
ALTER TABLE employees ADD CONSTRAINT employees_pj_type_check 
CHECK (pj_type IS NULL OR pj_type IN ('empresa', 'autonomo'));

-- 7. Atualizar RLS policies de employees
DROP POLICY IF EXISTS "Usuários autenticados podem ler funcionários" ON employees;
DROP POLICY IF EXISTS "Usuários autenticados podem criar funcionários" ON employees;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar funcionários" ON employees;

CREATE POLICY "Diretoria pode ver todos os funcionários"
ON employees FOR SELECT
USING (public.has_role(auth.uid(), 'diretoria'));

CREATE POLICY "RH Matriz pode ver todos os funcionários"
ON employees FOR SELECT
USING (public.has_role(auth.uid(), 'rh_matriz'));

CREATE POLICY "RH Filial pode ver funcionários da sua unidade"
ON employees FOR SELECT
USING (
  public.has_role(auth.uid(), 'rh_filial') AND
  public.can_access_unit(auth.uid(), unit_id)
);

CREATE POLICY "Gestores podem ver funcionários do seu departamento"
ON employees FOR SELECT
USING (
  public.has_role(auth.uid(), 'gestor') AND
  department_id IN (
    SELECT department_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Colaboradores podem ver apenas seus dados"
ON employees FOR SELECT
USING (
  (public.has_role(auth.uid(), 'colaborador_clt') OR public.has_role(auth.uid(), 'prestador_pj'))
  AND user_id = auth.uid()
);

CREATE POLICY "Diretoria e RH podem criar funcionários"
ON employees FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

CREATE POLICY "Diretoria e RH podem atualizar funcionários"
ON employees FOR UPDATE
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  (public.has_role(auth.uid(), 'rh_filial') AND public.can_access_unit(auth.uid(), unit_id))
);

-- 8. Atualizar RLS policies de departments
DROP POLICY IF EXISTS "Usuários autenticados podem ler departamentos" ON departments;
DROP POLICY IF EXISTS "Usuários autenticados podem criar departamentos" ON departments;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar departamentos" ON departments;

CREATE POLICY "Usuários autenticados podem ler departamentos"
ON departments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Diretoria e RH podem criar departamentos"
ON departments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

CREATE POLICY "Diretoria e RH podem atualizar departamentos"
ON departments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

-- 9. Atualizar RLS policies de roles
DROP POLICY IF EXISTS "Usuários autenticados podem ler cargos" ON roles;
DROP POLICY IF EXISTS "Usuários autenticados podem criar cargos" ON roles;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar cargos" ON roles;

CREATE POLICY "Usuários autenticados podem ler cargos"
ON roles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Diretoria e RH podem criar cargos"
ON roles FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

CREATE POLICY "Diretoria e RH podem atualizar cargos"
ON roles FOR UPDATE
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

-- 10. Atualizar RLS policies de units
DROP POLICY IF EXISTS "Usuários autenticados podem ler unidades" ON units;
DROP POLICY IF EXISTS "Usuários autenticados podem criar unidades" ON units;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar unidades" ON units;

CREATE POLICY "Usuários autenticados podem ler unidades"
ON units FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Diretoria e RH Matriz podem criar unidades"
ON units FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

CREATE POLICY "Diretoria e RH Matriz podem atualizar unidades"
ON units FOR UPDATE
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

-- 11. Atualizar RLS policies de timesheets
DROP POLICY IF EXISTS "Usuários autenticados podem ler timesheets" ON timesheets;
DROP POLICY IF EXISTS "Usuários autenticados podem criar timesheets" ON timesheets;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar timesheets" ON timesheets;

CREATE POLICY "Diretoria pode ver todos os timesheets"
ON timesheets FOR SELECT
USING (public.has_role(auth.uid(), 'diretoria'));

CREATE POLICY "RH pode ver todos os timesheets"
ON timesheets FOR SELECT
USING (
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

CREATE POLICY "Colaboradores podem ver seus próprios timesheets"
ON timesheets FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "RH e Gestores podem criar timesheets"
ON timesheets FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor')
);

CREATE POLICY "RH e Gestores podem atualizar timesheets"
ON timesheets FOR UPDATE
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor')
);

-- 12. Atualizar RLS policies de employee_documents
DROP POLICY IF EXISTS "Usuários autenticados podem ler documentos" ON employee_documents;
DROP POLICY IF EXISTS "Usuários autenticados podem criar documentos" ON employee_documents;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar documentos" ON employee_documents;

CREATE POLICY "Diretoria pode ver todos os documentos"
ON employee_documents FOR SELECT
USING (public.has_role(auth.uid(), 'diretoria'));

CREATE POLICY "RH pode ver todos os documentos"
ON employee_documents FOR SELECT
USING (
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

CREATE POLICY "Colaboradores podem ver seus próprios documentos"
ON employee_documents FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "RH pode criar documentos"
ON employee_documents FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

CREATE POLICY "RH pode atualizar documentos"
ON employee_documents FOR UPDATE
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

-- 13. Criar storage buckets com policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pj-certifications', 'pj-certifications', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pj-invoices', 'pj-invoices', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate-documents', 'candidate-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: employee-documents
CREATE POLICY "Diretoria pode acessar todos os documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-documents' AND public.has_role(auth.uid(), 'diretoria'));

CREATE POLICY "RH pode acessar todos os documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-documents' AND (
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
));

CREATE POLICY "RH pode fazer upload de documentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'employee-documents' AND (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
));

-- Storage policies: employee-photos (public)
CREATE POLICY "Todos podem ver fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-photos');

CREATE POLICY "RH pode fazer upload de fotos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'employee-photos' AND (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
));

-- Storage policies: contracts
CREATE POLICY "Diretoria pode acessar contratos"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'diretoria'));

CREATE POLICY "RH pode acessar contratos"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts' AND (
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
));

CREATE POLICY "RH pode fazer upload de contratos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contracts' AND (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
));

-- Storage policies: pj-certifications
CREATE POLICY "Diretoria pode acessar certidões PJ"
ON storage.objects FOR SELECT
USING (bucket_id = 'pj-certifications' AND public.has_role(auth.uid(), 'diretoria'));

CREATE POLICY "RH pode acessar certidões PJ"
ON storage.objects FOR SELECT
USING (bucket_id = 'pj-certifications' AND (
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
));

CREATE POLICY "Prestadores PJ podem ver suas certidões"
ON storage.objects FOR SELECT
USING (bucket_id = 'pj-certifications' AND public.has_role(auth.uid(), 'prestador_pj'));

CREATE POLICY "RH e PJ podem fazer upload de certidões"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pj-certifications' AND (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'prestador_pj')
));

-- Storage policies: pj-invoices
CREATE POLICY "Diretoria pode acessar NFs PJ"
ON storage.objects FOR SELECT
USING (bucket_id = 'pj-invoices' AND public.has_role(auth.uid(), 'diretoria'));

CREATE POLICY "RH pode acessar NFs PJ"
ON storage.objects FOR SELECT
USING (bucket_id = 'pj-invoices' AND (
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
));

CREATE POLICY "Prestadores PJ podem ver suas NFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pj-invoices' AND public.has_role(auth.uid(), 'prestador_pj'));

CREATE POLICY "RH e PJ podem fazer upload de NFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pj-invoices' AND (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'prestador_pj')
));

-- Storage policies: candidate-documents
CREATE POLICY "RH pode acessar documentos de candidatos"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-documents' AND (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor')
));

CREATE POLICY "RH pode fazer upload de documentos de candidatos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'candidate-documents' AND (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
));