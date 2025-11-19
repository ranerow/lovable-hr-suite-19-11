-- Função para dar role 'diretoria' ao primeiro usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se for o primeiro usuário (email ti@isssl.com.br), dar role diretoria
  IF NEW.email = 'ti@isssl.com.br' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'diretoria');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para executar após criar novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();