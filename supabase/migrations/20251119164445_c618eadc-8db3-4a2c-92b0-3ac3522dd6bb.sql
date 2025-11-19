-- ============================================
-- SPRINTS 2, 3 e 4: MÓDULOS CORE, CLT e PJ
-- ============================================

-- SPRINT 2: MÓDULOS CORE

-- A. Tabela de Benefícios
CREATE TABLE benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  benefit_type TEXT NOT NULL,
  applies_to TEXT NOT NULL,
  default_value NUMERIC(10,2),
  is_mandatory BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT benefits_type_check CHECK (benefit_type IN ('vt', 'vr', 'va', 'health_plan', 'gympass', 'outros')),
  CONSTRAINT benefits_applies_check CHECK (applies_to IN ('clt', 'pj', 'ambos'))
);

ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;

CREATE TABLE employee_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES benefits(id) ON DELETE CASCADE NOT NULL,
  monthly_value NUMERIC(10,2),
  discount_from_payroll BOOLEAN DEFAULT false,
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, benefit_id, start_date)
);

ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_benefits_updated_at
BEFORE UPDATE ON benefits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_benefits_updated_at
BEFORE UPDATE ON employee_benefits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- B. Tabela de Férias (CLT apenas)
CREATE TABLE vacations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  acquisition_period_start DATE NOT NULL,
  acquisition_period_end DATE NOT NULL,
  vacation_days INTEGER NOT NULL DEFAULT 30,
  days_used INTEGER DEFAULT 0,
  days_remaining INTEGER DEFAULT 30,
  request_date TIMESTAMPTZ,
  start_date DATE,
  end_date DATE,
  return_date DATE,
  vacation_type TEXT,
  status TEXT DEFAULT 'aquisitivo',
  approved_by_manager UUID REFERENCES auth.users(id),
  approved_by_hr UUID REFERENCES auth.users(id),
  approved_by_director UUID REFERENCES auth.users(id),
  manager_approval_date TIMESTAMPTZ,
  hr_approval_date TIMESTAMPTZ,
  director_approval_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT vacation_type_check CHECK (vacation_type IN ('integral', 'fracionada', 'abono_pecuniario')),
  CONSTRAINT vacation_status_check CHECK (status IN ('aquisitivo', 'pendente', 'aprovado_gestor', 'aprovado_rh', 'aprovado_diretoria', 'agendado', 'em_ferias', 'concluido', 'vencido'))
);

ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_vacations_updated_at
BEFORE UPDATE ON vacations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar status do employee quando entra em férias
CREATE OR REPLACE FUNCTION update_employee_vacation_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'em_ferias' AND OLD.status != 'em_ferias' THEN
    UPDATE employees SET status = 'Férias' WHERE id = NEW.employee_id;
  ELSIF NEW.status = 'concluido' AND OLD.status = 'em_ferias' THEN
    UPDATE employees SET status = 'Ativo' WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER vacation_status_trigger
AFTER UPDATE ON vacations
FOR EACH ROW
EXECUTE FUNCTION update_employee_vacation_status();

-- C. Tabela de Treinamentos
CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  training_type TEXT,
  duration_hours INTEGER,
  validity_months INTEGER,
  instructor TEXT,
  location TEXT,
  applies_to TEXT DEFAULT 'ambos',
  required_for_roles UUID[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT training_type_check CHECK (training_type IN ('obrigatorio', 'desenvolvimento', 'tecnico', 'compliance')),
  CONSTRAINT training_applies_check CHECK (applies_to IN ('clt', 'pj', 'ambos'))
);

ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

CREATE TABLE employee_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  training_id UUID REFERENCES trainings(id) ON DELETE CASCADE NOT NULL,
  scheduled_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  certificate_url TEXT,
  expiry_date DATE,
  score NUMERIC(5,2),
  attendance_status TEXT DEFAULT 'agendado',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT attendance_status_check CHECK (attendance_status IN ('agendado', 'presente', 'ausente', 'concluido'))
);

ALTER TABLE employee_trainings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_trainings_updated_at
BEFORE UPDATE ON trainings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_trainings_updated_at
BEFORE UPDATE ON employee_trainings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- D. Tabela de Advertências e Processos Disciplinares
CREATE TABLE disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'leve',
  action_date DATE NOT NULL,
  suspension_days INTEGER DEFAULT 0,
  applied_by UUID REFERENCES auth.users(id),
  witness_1 TEXT,
  witness_2 TEXT,
  document_url TEXT,
  employee_acknowledgment BOOLEAN DEFAULT false,
  acknowledgment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT action_type_check CHECK (action_type IN ('advertencia_verbal', 'advertencia_escrita', 'suspensao', 'notificacao_contratual')),
  CONSTRAINT severity_check CHECK (severity IN ('leve', 'media', 'grave', 'gravissima'))
);

ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_disciplinary_actions_updated_at
BEFORE UPDATE ON disciplinary_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- SPRINT 4: MÓDULOS PJ

-- F. Tabela de Contratos PJ
CREATE TABLE pj_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  contract_number TEXT NOT NULL,
  contract_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_value NUMERIC(10,2) NOT NULL,
  service_scope TEXT NOT NULL,
  payment_day INTEGER DEFAULT 5,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 30,
  status TEXT DEFAULT 'ativo',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT contract_status_check CHECK (status IN ('ativo', 'a_vencer', 'vencido', 'renovado', 'encerrado'))
);

ALTER TABLE pj_contracts ENABLE ROW LEVEL SECURITY;

CREATE TABLE pj_contract_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES pj_contracts(id) ON DELETE CASCADE NOT NULL,
  previous_end_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  previous_value NUMERIC(10,2),
  new_value NUMERIC(10,2),
  adjustment_percentage NUMERIC(5,2),
  renewal_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

ALTER TABLE pj_contract_renewals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pj_contracts_updated_at
BEFORE UPDATE ON pj_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- G. Tabela de Certidões PJ
CREATE TABLE pj_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  certification_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'valida',
  alert_days_before INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT cert_type_check CHECK (certification_type IN ('cnd_federal', 'cnd_fgts', 'cnd_municipal', 'cndt', 'seguro_profissional')),
  CONSTRAINT cert_status_check CHECK (status IN ('valida', 'vencendo', 'vencida'))
);

ALTER TABLE pj_certifications ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pj_certifications_updated_at
BEFORE UPDATE ON pj_certifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar status de certidões
CREATE OR REPLACE FUNCTION update_certification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status = 'vencida';
  ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * NEW.alert_days_before THEN
    NEW.status = 'vencendo';
  ELSE
    NEW.status = 'valida';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER certification_status_trigger
BEFORE INSERT OR UPDATE ON pj_certifications
FOR EACH ROW
EXECUTE FUNCTION update_certification_status();

-- H. Tabela de Notas Fiscais PJ
CREATE TABLE pj_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  contract_id UUID REFERENCES pj_contracts(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  reference_month DATE NOT NULL,
  issue_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  invoice_url TEXT,
  payment_status TEXT DEFAULT 'pendente',
  payment_date DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT invoice_payment_status_check CHECK (payment_status IN ('pendente', 'agendado', 'pago', 'atrasado'))
);

ALTER TABLE pj_invoices ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pj_invoices_updated_at
BEFORE UPDATE ON pj_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS POLICIES

-- Benefits
CREATE POLICY "Usuários autenticados podem ver benefícios"
ON benefits FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Diretoria e RH podem gerenciar benefícios"
ON benefits FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

-- Employee Benefits
CREATE POLICY "Usuários podem ver benefícios de funcionários"
ON employee_benefits FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "RH pode gerenciar benefícios de funcionários"
ON employee_benefits FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

-- Vacations
CREATE POLICY "Usuários podem ver férias"
ON vacations FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "Colaboradores podem solicitar férias"
ON vacations FOR INSERT
WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "RH e Gestores podem gerenciar férias"
ON vacations FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor')
);

-- Trainings
CREATE POLICY "Usuários autenticados podem ver treinamentos"
ON trainings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Diretoria e RH podem gerenciar treinamentos"
ON trainings FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz')
);

-- Employee Trainings
CREATE POLICY "Usuários podem ver treinamentos de funcionários"
ON employee_trainings FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "RH pode gerenciar treinamentos de funcionários"
ON employee_trainings FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

-- Disciplinary Actions
CREATE POLICY "Gestores podem ver advertências"
ON disciplinary_actions FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "RH pode gerenciar advertências"
ON disciplinary_actions FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

-- PJ Contracts
CREATE POLICY "Usuários podem ver contratos PJ"
ON pj_contracts FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "RH pode gerenciar contratos PJ"
ON pj_contracts FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

-- PJ Contract Renewals
CREATE POLICY "Usuários podem ver renovações de contratos"
ON pj_contract_renewals FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

-- PJ Certifications
CREATE POLICY "Usuários podem ver certidões PJ"
ON pj_certifications FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "RH e PJ podem gerenciar certidões"
ON pj_certifications FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- PJ Invoices
CREATE POLICY "Usuários podem ver NFs PJ"
ON pj_invoices FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "RH e PJ podem gerenciar NFs"
ON pj_invoices FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- Índices para performance
CREATE INDEX idx_employee_benefits_employee_id ON employee_benefits(employee_id);
CREATE INDEX idx_vacations_employee_id ON vacations(employee_id);
CREATE INDEX idx_vacations_status ON vacations(status);
CREATE INDEX idx_employee_trainings_employee_id ON employee_trainings(employee_id);
CREATE INDEX idx_disciplinary_actions_employee_id ON disciplinary_actions(employee_id);
CREATE INDEX idx_pj_contracts_employee_id ON pj_contracts(employee_id);
CREATE INDEX idx_pj_contracts_status ON pj_contracts(status);
CREATE INDEX idx_pj_certifications_employee_id ON pj_certifications(employee_id);
CREATE INDEX idx_pj_certifications_expiry ON pj_certifications(expiry_date);
CREATE INDEX idx_pj_invoices_employee_id ON pj_invoices(employee_id);
CREATE INDEX idx_pj_invoices_payment_status ON pj_invoices(payment_status);