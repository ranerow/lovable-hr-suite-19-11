-- Adicionar política RLS para permitir DELETE de funcionários apenas pela diretoria
CREATE POLICY "Diretoria pode excluir funcionários"
ON employees
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'diretoria'));