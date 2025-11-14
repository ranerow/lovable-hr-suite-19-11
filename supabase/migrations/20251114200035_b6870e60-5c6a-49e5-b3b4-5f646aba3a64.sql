-- Criação das tabelas principais do Módulo RH - Fase 1

-- Tabela de unidades/filiais
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de departamentos
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de cargos
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  level INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cpf TEXT UNIQUE NOT NULL,
  birth_date DATE,
  hire_date DATE NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('CLT', 'PJ', 'Temporário', 'Estágio', 'Terceirizado')),
  salary DECIMAL(10,2),
  workload INTEGER NOT NULL DEFAULT 40,
  role_id UUID REFERENCES public.roles(id),
  department_id UUID REFERENCES public.departments(id),
  unit_id UUID REFERENCES public.units(id),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Férias', 'Afastado', 'Demitido')),
  photo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de ponto/frequência
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  lunch_start TIME,
  lunch_end TIME,
  hours_worked DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'Presente' CHECK (status IN ('Presente', 'Falta', 'Atestado', 'Férias', 'Feriado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Tabela de documentos
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT now(),
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_employees_unit ON public.employees(unit_id);
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_role ON public.employees(role_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_timesheets_employee ON public.timesheets(employee_id);
CREATE INDEX idx_timesheets_date ON public.timesheets(date);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir leitura autenticada por enquanto)
-- Unidades
CREATE POLICY "Usuários autenticados podem ler unidades"
  ON public.units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar unidades"
  ON public.units FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar unidades"
  ON public.units FOR UPDATE
  TO authenticated
  USING (true);

-- Departamentos
CREATE POLICY "Usuários autenticados podem ler departamentos"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar departamentos"
  ON public.departments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar departamentos"
  ON public.departments FOR UPDATE
  TO authenticated
  USING (true);

-- Cargos
CREATE POLICY "Usuários autenticados podem ler cargos"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar cargos"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar cargos"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (true);

-- Funcionários
CREATE POLICY "Usuários autenticados podem ler funcionários"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar funcionários"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar funcionários"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (true);

-- Timesheets
CREATE POLICY "Usuários autenticados podem ler timesheets"
  ON public.timesheets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar timesheets"
  ON public.timesheets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar timesheets"
  ON public.timesheets FOR UPDATE
  TO authenticated
  USING (true);

-- Documentos
CREATE POLICY "Usuários autenticados podem ler documentos"
  ON public.employee_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar documentos"
  ON public.employee_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar documentos"
  ON public.employee_documents FOR UPDATE
  TO authenticated
  USING (true);