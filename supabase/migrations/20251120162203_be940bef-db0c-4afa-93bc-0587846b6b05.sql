-- Remover política antiga de onboarding
DROP POLICY IF EXISTS "Onboarding pode inserir documentos" ON employee_documents;

-- Criar nova política que permite inserção anônima durante onboarding
-- Só permite para employees com status "Aguardando Ativação" (segurança mantida)
CREATE POLICY "Onboarding pode inserir documentos"
ON employee_documents
FOR INSERT
TO anon, authenticated
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees 
    WHERE status = 'Aguardando Ativação'
  )
);