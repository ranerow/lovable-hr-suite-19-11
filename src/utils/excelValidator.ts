import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { validateCPF, validateCNPJ } from './documentValidator';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidatedRow {
  data: any;
  row: number;
}

export interface ValidationResult {
  valid: ValidatedRow[];
  errors: ValidationError[];
}

const REQUIRED_FIELDS = [
  'full_name',
  'email',
  'cpf',
  'contract_type',
  'hire_date',
  'unit_id',
  'department_id',
  'role_id',
];

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const parseExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON (pulando as 3 primeiras linhas: header, description, example)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          range: 3, // Começar da linha 4 (índice 3)
          raw: false,
          defval: null,
        });
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsBinaryString(file);
  });
};

const parseDate = (dateStr: string): string | null => {
  if (!dateStr || !DATE_REGEX.test(dateStr)) return null;
  
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

const validateRequiredFields = (row: any, rowNumber: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  REQUIRED_FIELDS.forEach(field => {
    const cleanField = field.replace(' *', '');
    const value = row[field] || row[field + ' *'];
    
    if (!value || String(value).trim() === '') {
      errors.push({
        row: rowNumber,
        field: cleanField,
        message: `Campo obrigatório "${cleanField}" não preenchido`,
      });
    }
  });
  
  return errors;
};

const validateEmail = async (email: string, rowNumber: number): Promise<ValidationError | null> => {
  if (!EMAIL_REGEX.test(email)) {
    return {
      row: rowNumber,
      field: 'email',
      message: 'Email inválido',
    };
  }
  
  // Verificar se email já existe
  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  
  if (data) {
    return {
      row: rowNumber,
      field: 'email',
      message: 'Email já cadastrado no sistema',
    };
  }
  
  return null;
};

const validateContractType = (contractType: string, rowNumber: number): ValidationError | null => {
  if (!['CLT', 'PJ'].includes(contractType?.toUpperCase())) {
    return {
      row: rowNumber,
      field: 'contract_type',
      message: 'Tipo de contrato deve ser CLT ou PJ',
    };
  }
  return null;
};

const validateReferences = async (row: any, rowNumber: number): Promise<ValidationError[]> => {
  const errors: ValidationError[] = [];
  
  // Validar unit_id
  const unitId = row.unit_id || row['unit_id *'];
  if (unitId) {
    const { data: unit } = await supabase
      .from('units')
      .select('id')
      .eq('id', unitId)
      .maybeSingle();
    
    if (!unit) {
      errors.push({
        row: rowNumber,
        field: 'unit_id',
        message: `Unidade não encontrada: ${unitId}`,
      });
    }
  }
  
  // Validar department_id
  const deptId = row.department_id || row['department_id *'];
  if (deptId) {
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('id', deptId)
      .maybeSingle();
    
    if (!dept) {
      errors.push({
        row: rowNumber,
        field: 'department_id',
        message: `Departamento não encontrado: ${deptId}`,
      });
    }
  }
  
  // Validar role_id
  const roleId = row.role_id || row['role_id *'];
  if (roleId) {
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('id', roleId)
      .maybeSingle();
    
    if (!role) {
      errors.push({
        row: rowNumber,
        field: 'role_id',
        message: `Cargo não encontrado: ${roleId}`,
      });
    }
  }
  
  return errors;
};

export const validateExcelData = async (rows: any[]): Promise<ValidationResult> => {
  const valid: ValidatedRow[] = [];
  const errors: ValidationError[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 4; // +4 porque pulamos 3 linhas iniciais
    
    // Validar campos obrigatórios
    const requiredErrors = validateRequiredFields(row, rowNumber);
    if (requiredErrors.length > 0) {
      errors.push(...requiredErrors);
      continue;
    }
    
    // Validar email
    const emailError = await validateEmail(
      row.email || row['email *'],
      rowNumber
    );
    if (emailError) {
      errors.push(emailError);
      continue;
    }
    
    // Validar CPF
    const cpf = (row.cpf || row['cpf *'])?.replace(/\D/g, '');
    if (cpf && !validateCPF(cpf)) {
      errors.push({
        row: rowNumber,
        field: 'cpf',
        message: 'CPF inválido',
      });
      continue;
    }
    
    // Validar tipo de contrato
    const contractType = (row.contract_type || row['contract_type *'])?.toUpperCase();
    const contractError = validateContractType(contractType, rowNumber);
    if (contractError) {
      errors.push(contractError);
      continue;
    }
    
    // Validar CNPJ se for PJ
    if (contractType === 'PJ' && row.cnpj) {
      const cnpj = row.cnpj.replace(/\D/g, '');
      if (!validateCNPJ(cnpj)) {
        errors.push({
          row: rowNumber,
          field: 'cnpj',
          message: 'CNPJ inválido',
        });
        continue;
      }
    }
    
    // Validar datas
    const hireDate = parseDate(row.hire_date || row['hire_date *']);
    if (!hireDate) {
      errors.push({
        row: rowNumber,
        field: 'hire_date',
        message: 'Data de admissão inválida (use DD/MM/YYYY)',
      });
      continue;
    }
    
    // Validar referências
    const refErrors = await validateReferences(row, rowNumber);
    if (refErrors.length > 0) {
      errors.push(...refErrors);
      continue;
    }
    
    // Preparar dados limpos para inserção
    const cleanData: any = {
      full_name: row.full_name || row['full_name *'],
      email: row.email || row['email *'],
      cpf,
      phone: row.phone,
      birth_date: row.birth_date ? parseDate(row.birth_date) : null,
      contract_type: contractType,
      hire_date: hireDate,
      unit_id: row.unit_id || row['unit_id *'],
      department_id: row.department_id || row['department_id *'],
      role_id: row.role_id || row['role_id *'],
      workload: row.workload ? parseInt(row.workload) : 40,
      status: 'Ativo',
    };
    
    // Adicionar campos específicos de CLT
    if (contractType === 'CLT') {
      cleanData.salary = row.salary ? parseFloat(row.salary) : null;
      cleanData.ctps_number = row.ctps_number;
      cleanData.ctps_series = row.ctps_series;
      cleanData.ctps_state = row.ctps_state;
      cleanData.pis_pasep = row.pis_pasep;
      cleanData.shift_type = row.shift_type;
    }
    
    // Adicionar campos específicos de PJ
    if (contractType === 'PJ') {
      cleanData.cnpj = row.cnpj?.replace(/\D/g, '');
      cleanData.company_name = row.company_name;
      cleanData.municipal_registration = row.municipal_registration;
      cleanData.monthly_value = row.monthly_value ? parseFloat(row.monthly_value) : null;
      cleanData.service_scope = row.service_scope;
      cleanData.pj_type = row.pj_type;
    }
    
    valid.push({
      data: cleanData,
      row: rowNumber,
    });
  }
  
  return { valid, errors };
};
