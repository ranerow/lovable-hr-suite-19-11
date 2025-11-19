-- Criar política RLS que permite insert de documentos durante onboarding
-- Isso permite que usuários anônimos façam upload de documentos durante o processo de onboarding
CREATE POLICY "Onboarding pode inserir documentos"
ON employee_documents
FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees 
    WHERE status = 'Aguardando Ativação'
  )
);