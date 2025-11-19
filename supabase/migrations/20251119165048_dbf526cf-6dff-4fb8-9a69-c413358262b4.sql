-- ============================================
-- SPRINT 5: MÓDULO DE RECRUTAMENTO
-- ============================================

-- Tabela de Vagas
CREATE TABLE job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  role_id UUID REFERENCES roles(id),
  department_id UUID REFERENCES departments(id),
  unit_id UUID REFERENCES units(id),
  contract_type TEXT NOT NULL,
  salary_range_min NUMERIC(10,2),
  salary_range_max NUMERIC(10,2),
  monthly_value_pj NUMERIC(10,2),
  workload INTEGER,
  benefits TEXT[],
  service_scope TEXT,
  contract_duration TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'aberta',
  created_by UUID REFERENCES auth.users(id),
  approved_by_manager UUID REFERENCES auth.users(id),
  approved_by_director UUID REFERENCES auth.users(id),
  approved_by_legal UUID REFERENCES auth.users(id),
  opening_date DATE,
  closing_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT job_contract_type_check CHECK (contract_type IN ('CLT', 'PJ')),
  CONSTRAINT job_status_check CHECK (status IN ('aberta', 'aprovacao_gestor', 'aprovacao_diretoria', 'aprovacao_juridico', 'publicada', 'em_selecao', 'fechada', 'cancelada'))
);

ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_job_openings_updated_at
BEFORE UPDATE ON job_openings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Candidatos
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_opening_id UUID REFERENCES job_openings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf_cnpj TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  current_stage TEXT DEFAULT 'inscrito',
  overall_score NUMERIC(5,2),
  notes TEXT,
  status TEXT DEFAULT 'ativo',
  applied_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT candidate_stage_check CHECK (current_stage IN ('inscrito', 'triagem', 'teste', 'entrevista_rh', 'entrevista_gestor', 'entrevista_final', 'aprovado', 'reprovado')),
  CONSTRAINT candidate_status_check CHECK (status IN ('ativo', 'contratado', 'desistiu', 'reprovado'))
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Documentos de Candidatos
CREATE TABLE candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Job Openings
CREATE POLICY "Usuários autenticados podem ver vagas"
ON job_openings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "RH pode criar vagas"
ON job_openings FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

CREATE POLICY "RH e Gestores podem atualizar vagas"
ON job_openings FOR UPDATE
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor')
);

-- RLS Policies - Candidates
CREATE POLICY "RH e Gestores podem ver candidatos"
ON candidates FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor')
);

CREATE POLICY "RH pode gerenciar candidatos"
ON candidates FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

-- RLS Policies - Candidate Documents
CREATE POLICY "RH pode ver documentos de candidatos"
ON candidate_documents FOR SELECT
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial') OR
  public.has_role(auth.uid(), 'gestor')
);

CREATE POLICY "RH pode gerenciar documentos de candidatos"
ON candidate_documents FOR ALL
USING (
  public.has_role(auth.uid(), 'diretoria') OR
  public.has_role(auth.uid(), 'rh_matriz') OR
  public.has_role(auth.uid(), 'rh_filial')
);

-- Índices
CREATE INDEX idx_job_openings_status ON job_openings(status);
CREATE INDEX idx_job_openings_contract_type ON job_openings(contract_type);
CREATE INDEX idx_candidates_job_opening_id ON candidates(job_opening_id);
CREATE INDEX idx_candidates_current_stage ON candidates(current_stage);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidate_documents_candidate_id ON candidate_documents(candidate_id);