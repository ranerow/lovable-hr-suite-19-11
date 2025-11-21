import * as XLSX from 'xlsx';

export interface TemplateColumn {
  name: string;
  description: string;
  required: boolean;
  example: string;
}

const COMMON_COLUMNS: TemplateColumn[] = [
  { name: 'full_name', description: 'Nome Completo', required: true, example: 'João da Silva' },
  { name: 'email', description: 'Email', required: true, example: 'joao.silva@empresa.com' },
  { name: 'cpf', description: 'CPF (apenas números)', required: true, example: '12345678900' },
  { name: 'phone', description: 'Telefone', required: false, example: '11999999999' },
  { name: 'birth_date', description: 'Data de Nascimento (DD/MM/YYYY)', required: false, example: '15/03/1990' },
  { name: 'contract_type', description: 'Tipo de Contrato (CLT ou PJ)', required: true, example: 'CLT' },
  { name: 'hire_date', description: 'Data de Admissão (DD/MM/YYYY)', required: true, example: '01/01/2024' },
  { name: 'unit_id', description: 'ID da Unidade', required: true, example: 'abc123...' },
  { name: 'department_id', description: 'ID do Departamento', required: true, example: 'def456...' },
  { name: 'role_id', description: 'ID do Cargo', required: true, example: 'ghi789...' },
  { name: 'workload', description: 'Carga Horária Semanal', required: false, example: '40' },
];

const CLT_COLUMNS: TemplateColumn[] = [
  { name: 'salary', description: 'Salário (CLT)', required: false, example: '5000.00' },
  { name: 'ctps_number', description: 'Número CTPS (CLT)', required: false, example: '123456' },
  { name: 'ctps_series', description: 'Série CTPS (CLT)', required: false, example: '001' },
  { name: 'ctps_state', description: 'UF CTPS (CLT)', required: false, example: 'SP' },
  { name: 'pis_pasep', description: 'PIS/PASEP (CLT)', required: false, example: '12345678900' },
  { name: 'shift_type', description: 'Turno (diurno/noturno/misto)', required: false, example: 'diurno' },
];

const PJ_COLUMNS: TemplateColumn[] = [
  { name: 'cnpj', description: 'CNPJ (PJ)', required: false, example: '12345678000190' },
  { name: 'company_name', description: 'Razão Social (PJ)', required: false, example: 'Empresa LTDA' },
  { name: 'municipal_registration', description: 'Inscrição Municipal (PJ)', required: false, example: '123456' },
  { name: 'monthly_value', description: 'Valor Mensal (PJ)', required: false, example: '10000.00' },
  { name: 'service_scope', description: 'Escopo do Serviço (PJ)', required: false, example: 'Consultoria' },
  { name: 'pj_type', description: 'Tipo PJ (empresa/autonomo)', required: false, example: 'empresa' },
];

export const generateExcelTemplate = () => {
  const allColumns = [...COMMON_COLUMNS, ...CLT_COLUMNS, ...PJ_COLUMNS];
  
  // Criar worksheet com headers
  const headers = allColumns.map(col => 
    `${col.name}${col.required ? ' *' : ''}`
  );
  
  const descriptions = allColumns.map(col => col.description);
  const examples = allColumns.map(col => col.example);
  
  const data = [
    headers,
    descriptions,
    examples,
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Estilizar headers (primeira linha em negrito)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "CCCCCC" } }
    };
  }
  
  // Ajustar largura das colunas
  ws['!cols'] = allColumns.map(() => ({ wch: 20 }));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Funcionários");
  
  // Adicionar sheet de instruções
  const instructionsData = [
    ['INSTRUÇÕES DE PREENCHIMENTO'],
    [''],
    ['1. Preencha os dados a partir da linha 4 (após os exemplos)'],
    ['2. Campos marcados com * são obrigatórios'],
    ['3. Para obter os IDs de Unidade, Departamento e Cargo, acesse o sistema'],
    ['4. Formato de datas: DD/MM/YYYY'],
    ['5. CPF e CNPJ: apenas números, sem pontuação'],
    ['6. Valores monetários: use ponto como separador decimal (ex: 5000.00)'],
    [''],
    ['TIPOS DE CONTRATO:'],
    ['- CLT: Preencher campos específicos de CLT (salary, ctps_number, etc)'],
    ['- PJ: Preencher campos específicos de PJ (cnpj, company_name, etc)'],
    [''],
    ['IMPORTANTE:'],
    ['- Não altere os nomes das colunas'],
    ['- Não deixe linhas em branco entre os registros'],
    ['- Emails devem ser únicos no sistema'],
  ];
  
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instruções");
  
  return wb;
};

export const downloadTemplate = () => {
  const wb = generateExcelTemplate();
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `template_importacao_funcionarios_${timestamp}.xlsx`);
};
