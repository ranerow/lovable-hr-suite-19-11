-- Drop da policy antiga que estava bloqueando a finalização
DROP POLICY IF EXISTS "Atualização via token válido" ON onboarding_invitations;

-- Criar nova policy que permite transição para 'concluido'
CREATE POLICY "Atualização via token válido"
ON onboarding_invitations
FOR UPDATE
USING (
  -- Permite atualizar se estiver pendente ou em_andamento e não expirado
  ((status = 'pendente'::text OR status = 'em_andamento'::text) AND expires_at > now())
)
WITH CHECK (
  -- Permite qualquer um dos três status durante a atualização
  (status = ANY(ARRAY['pendente'::text, 'em_andamento'::text, 'concluido'::text]))
  AND expires_at > now()
);