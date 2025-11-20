-- Criar função para validar documentos obrigatórios por tipo de contrato
CREATE OR REPLACE FUNCTION public.validate_employee_documents(employee_id_param UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  missing_documents TEXT[],
  contract_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp_contract_type TEXT;
  required_docs TEXT[];
  uploaded_docs TEXT[];
  missing TEXT[];
BEGIN
  -- Buscar tipo de contrato do funcionário
  SELECT contract_type INTO emp_contract_type
  FROM employees
  WHERE id = employee_id_param;

  -- Definir documentos obrigatórios por tipo de contrato
  IF emp_contract_type = 'CLT' THEN
    required_docs := ARRAY[
      'Contrato de Trabalho',
      'ASO Admissional',
      'CTPS',
      'CPF',
      'RG',
      'Comprovante de Residência'
    ];
  ELSIF emp_contract_type = 'PJ' THEN
    required_docs := ARRAY[
      'Contrato de Prestação de Serviços',
      'CNPJ',
      'Certidão Negativa Federal',
      'Certidão Negativa FGTS',
      'Certidão Negativa Municipal'
    ];
  ELSE
    required_docs := ARRAY[]::TEXT[];
  END IF;

  -- Buscar documentos já enviados
  SELECT ARRAY_AGG(DISTINCT document_type)
  INTO uploaded_docs
  FROM employee_documents
  WHERE employee_documents.employee_id = employee_id_param;

  -- Se não há documentos enviados, tratar como array vazio
  IF uploaded_docs IS NULL THEN
    uploaded_docs := ARRAY[]::TEXT[];
  END IF;

  -- Calcular documentos faltantes
  SELECT ARRAY_AGG(doc)
  INTO missing
  FROM UNNEST(required_docs) AS doc
  WHERE doc NOT IN (SELECT UNNEST(uploaded_docs));

  -- Se não há documentos faltantes, tratar como array vazio
  IF missing IS NULL THEN
    missing := ARRAY[]::TEXT[];
  END IF;

  -- Retornar resultado
  RETURN QUERY SELECT 
    (ARRAY_LENGTH(missing, 1) IS NULL OR ARRAY_LENGTH(missing, 1) = 0) AS is_valid,
    missing AS missing_documents,
    emp_contract_type AS contract_type;
END;
$$;