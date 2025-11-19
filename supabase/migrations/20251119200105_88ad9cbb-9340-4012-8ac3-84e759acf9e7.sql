-- Adicionar "Aguardando Ativação" como status válido
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_status_check;

ALTER TABLE employees 
ADD CONSTRAINT employees_status_check 
CHECK (status IN ('Ativo', 'Inativo', 'Férias', 'Afastado', 'Demitido', 'Aguardando Ativação'));

-- Corrigir dados: marcar funcionários criados via onboarding recentemente como "Aguardando Ativação"
UPDATE employees
SET status = 'Aguardando Ativação'
WHERE id IN (
  SELECT employee_id 
  FROM onboarding_invitations 
  WHERE status = 'concluido' 
  AND completed_at > NOW() - INTERVAL '7 days'
  AND employee_id IS NOT NULL
  AND employee_id IN (
    SELECT id FROM employees WHERE status = 'Ativo'
  )
);