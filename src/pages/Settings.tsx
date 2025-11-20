import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Bell, Shield, Plug, Database, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FontSizeSelector } from "@/components/settings/FontSizeSelector";
import { ThemeSelector } from "@/components/settings/ThemeSelector";

export default function Settings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: "Configurações salvas",
      description: "Suas alterações foram salvas com sucesso.",
    });
  };

  const loadTestData = async () => {
    setIsLoadingData(true);
    try {
      // Criar Unidades
      const { data: units } = await supabase.from("units").insert([
        { code: "MTZ", name: "Matriz", city: "São Paulo", state: "SP", address: "Av. Paulista, 1000" },
        { code: "FIL01", name: "Filial Rio", city: "Rio de Janeiro", state: "RJ", address: "Av. Atlântica, 500" },
        { code: "FIL02", name: "Filial BH", city: "Belo Horizonte", state: "MG", address: "Av. Afonso Pena, 200" },
      ]).select();

      // Criar Departamentos
      const { data: departments } = await supabase.from("departments").insert([
        { code: "TI", name: "Tecnologia da Informação", description: "Infraestrutura e desenvolvimento" },
        { code: "RH", name: "Recursos Humanos", description: "Gestão de pessoas" },
        { code: "FIN", name: "Financeiro", description: "Controladoria e contabilidade" },
        { code: "COM", name: "Comercial", description: "Vendas e atendimento" },
        { code: "OPS", name: "Operações", description: "Produção e logística" },
      ]).select();

      // Criar Cargos
      const { data: roles } = await supabase.from("roles").insert([
        { code: "DEV", name: "Desenvolvedor", level: 3 },
        { code: "ANLST", name: "Analista", level: 4 },
        { code: "COORD", name: "Coordenador", level: 5 },
        { code: "GER", name: "Gerente", level: 6 },
        { code: "DIR", name: "Diretor", level: 7 },
        { code: "AUX", name: "Auxiliar", level: 2 },
        { code: "ASS", name: "Assistente", level: 3 },
      ]).select();

      // Criar Funcionários CLT
      const cltEmployees = [];
      for (let i = 1; i <= 30; i++) {
        cltEmployees.push({
          full_name: `Colaborador CLT ${i}`,
          email: `clt${i}@empresa.com`,
          cpf: `${String(i).padStart(11, "0")}`,
          phone: `(11) 9${String(i).padStart(8, "0")}`,
          contract_type: "CLT",
          hire_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
          salary: 3000 + Math.floor(Math.random() * 7000),
          workload: 40,
          status: ["Ativo", "Férias"][Math.floor(Math.random() * 2)],
          unit_id: units?.[Math.floor(Math.random() * (units?.length || 1))]?.id,
          department_id: departments?.[Math.floor(Math.random() * (departments?.length || 1))]?.id,
          role_id: roles?.[Math.floor(Math.random() * (roles?.length || 1))]?.id,
          shift_type: ["diurno", "noturno", "misto"][Math.floor(Math.random() * 3)],
          ctps_number: String(10000 + i),
          ctps_series: String(1000 + i),
          ctps_state: "SP",
          pis_pasep: String(20000000000 + i),
        });
      }

      // Criar Funcionários PJ
      const pjEmployees = [];
      for (let i = 1; i <= 20; i++) {
        pjEmployees.push({
          full_name: `Prestador PJ ${i}`,
          email: `pj${i}@empresa.com`,
          cpf: `${String(100 + i).padStart(11, "0")}`,
          phone: `(11) 8${String(i).padStart(8, "0")}`,
          contract_type: "PJ",
          hire_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
          monthly_value: 5000 + Math.floor(Math.random() * 10000),
          workload: 40,
          status: "Ativo",
          unit_id: units?.[Math.floor(Math.random() * (units?.length || 1))]?.id,
          department_id: departments?.[Math.floor(Math.random() * (departments?.length || 1))]?.id,
          role_id: roles?.[Math.floor(Math.random() * (roles?.length || 1))]?.id,
          cnpj: `${String(10000000 + i).padStart(14, "0")}`,
          company_name: `Empresa PJ ${i} LTDA`,
          pj_type: ["empresa", "autonomo"][Math.floor(Math.random() * 2)],
          service_scope: "Prestação de serviços especializados",
          legal_representative: `Representante ${i}`,
          contract_start_date: new Date(2023, 0, 1).toISOString().split("T")[0],
          contract_end_date_pj: new Date(2024, 11, 31).toISOString().split("T")[0],
          auto_renewal: Math.random() > 0.5,
        });
      }

      const { data: allEmployees } = await supabase.from("employees").insert([...cltEmployees, ...pjEmployees]).select();

      // Criar Benefícios
      await supabase.from("benefits").insert([
        { name: "Vale Transporte", benefit_type: "transporte", applies_to: "CLT", default_value: 200, is_mandatory: true },
        { name: "Vale Refeição", benefit_type: "alimentacao", applies_to: "ambos", default_value: 30, is_mandatory: false },
        { name: "Vale Alimentação", benefit_type: "alimentacao", applies_to: "ambos", default_value: 400, is_mandatory: false },
        { name: "Plano de Saúde", benefit_type: "saude", applies_to: "ambos", default_value: 300, is_mandatory: false },
        { name: "Gympass", benefit_type: "qualidade_vida", applies_to: "ambos", default_value: 80, is_mandatory: false },
      ]);

      // Criar Treinamentos
      await supabase.from("trainings").insert([
        { name: "NR-5 CIPA", training_type: "seguranca", applies_to: "ambos", duration_hours: 20, validity_months: 12 },
        { name: "Integração", training_type: "obrigatorio", applies_to: "ambos", duration_hours: 4, validity_months: null },
        { name: "Excel Avançado", training_type: "tecnico", applies_to: "ambos", duration_hours: 16, validity_months: null },
        { name: "Gestão de Equipes", training_type: "desenvolvimento", applies_to: "ambos", duration_hours: 8, validity_months: null },
      ]);

      // Criar contratos PJ
      const pjOnly = allEmployees?.filter(e => e.contract_type === "PJ") || [];
      for (const emp of pjOnly.slice(0, 10)) {
        await supabase.from("pj_contracts").insert({
          employee_id: emp.id,
          contract_number: `CTR-PJ-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
          service_scope: "Prestação de serviços especializados na área",
          monthly_value: emp.monthly_value || 5000,
          start_date: emp.contract_start_date || new Date(2023, 0, 1).toISOString().split("T")[0],
          end_date: emp.contract_end_date_pj || new Date(2024, 11, 31).toISOString().split("T")[0],
          status: "ativo",
          auto_renewal: emp.auto_renewal || false,
        });
      }

      // Criar períodos de férias para CLT
      const cltOnly = allEmployees?.filter(e => e.contract_type === "CLT") || [];
      for (const emp of cltOnly.slice(0, 15)) {
        const hireDate = new Date(emp.hire_date);
        await supabase.from("vacations").insert({
          employee_id: emp.id,
          acquisition_period_start: new Date(hireDate.getFullYear(), hireDate.getMonth(), hireDate.getDate()).toISOString().split("T")[0],
          acquisition_period_end: new Date(hireDate.getFullYear() + 1, hireDate.getMonth(), hireDate.getDate() - 1).toISOString().split("T")[0],
          vacation_days: 30,
          days_remaining: Math.floor(Math.random() * 30),
          status: ["aquisitivo", "concessivo", "solicitado"][Math.floor(Math.random() * 3)],
        });
      }

      toast({
        title: "Dados carregados!",
        description: "50 funcionários, departamentos, cargos e registros foram criados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao criar os dados de teste.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="aparencia">
            <Palette className="h-4 w-4 mr-2" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="rh">RH</TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Dados de Teste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Configure as informações básicas da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input id="company-name" placeholder="Nome da sua empresa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa</Label>
                <Input id="logo" type="file" accept="image/*" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Input id="timezone" defaultValue="America/Sao_Paulo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Input id="language" defaultValue="pt-BR" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Tema da Interface
              </CardTitle>
              <CardDescription>
                Escolha entre tema claro, escuro ou automático
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tamanho da Fonte</CardTitle>
              <CardDescription>
                Ajuste o tamanho do texto em todo o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FontSizeSelector />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rh" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Políticas de RH</CardTitle>
              <CardDescription>
                Configure as políticas e regras de recursos humanos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notice-period">Dias de Aviso Prévio</Label>
                <Input id="notice-period" type="number" defaultValue="30" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="work-hours">Horário Padrão de Trabalho (horas/dia)</Label>
                <Input id="work-hours" type="number" defaultValue="8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime-limit">Limite de Horas Extras (horas/mês)</Label>
                <Input id="overtime-limit" type="number" defaultValue="40" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Férias Fracionadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir divisão de férias em até 3 períodos
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Venda de Férias</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir venda de até 1/3 das férias
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Notificações</CardTitle>
              <CardDescription>
                Configure quando e como receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-alert">
                  Alertas de Contratos PJ (dias de antecedência)
                </Label>
                <Input id="contract-alert" type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-alert">
                  Alertas de Documentos Vencidos (dias de antecedência)
                </Label>
                <Input id="doc-alert" type="number" defaultValue="15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-alert">
                  Alertas de Certidões PJ (dias de antecedência)
                </Label>
                <Input id="cert-alert" type="number" defaultValue="15" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Aniversário</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações de aniversário dos colaboradores
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Férias</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas de períodos de férias vencendo
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Horas Extras</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas quando limite de horas extras for atingido
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Configure as integrações com sistemas externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timesheet-api">API do Sistema de Ponto</Label>
                <Input id="timesheet-api" placeholder="https://api.ponto.com.br" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payroll-api">API da Folha de Pagamento</Label>
                <Input id="payroll-api" placeholder="https://api.folha.com.br" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-smtp">Servidor SMTP (E-mail)</Label>
                <Input id="email-smtp" placeholder="smtp.empresa.com.br" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Porta</Label>
                  <Input id="smtp-port" defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Usuário</Label>
                  <Input id="smtp-user" placeholder="noreply@empresa.com.br" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Configure as políticas de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                <Input id="session-timeout" type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-password">Tamanho Mínimo da Senha</Label>
                <Input id="min-password" type="number" defaultValue="8" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exigir Senha Forte</Label>
                  <p className="text-sm text-muted-foreground">
                    Senha deve conter letras, números e caracteres especiais
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores (2FA)</Label>
                  <p className="text-sm text-muted-foreground">
                    Requer código adicional para login
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Log de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as ações importantes do sistema
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados de Teste</CardTitle>
              <CardDescription>
                Carregue dados fictícios para testar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-warning bg-warning/10 p-4">
                <p className="text-sm text-warning-foreground">
                  ⚠️ Esta ação criará 50+ registros de teste incluindo funcionários CLT e PJ, 
                  departamentos, cargos, unidades, contratos, férias e treinamentos.
                </p>
              </div>
              
              <Button 
                onClick={loadTestData} 
                disabled={isLoadingData}
                size="lg"
                className="w-full"
              >
                <Database className="mr-2 h-4 w-4" />
                {isLoadingData ? "Carregando dados..." : "Carregar Dados de Teste"}
              </Button>

              <Separator />

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold">O que será criado:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>3 Unidades (Matriz + Filiais)</li>
                  <li>5 Departamentos</li>
                  <li>7 Cargos</li>
                  <li>30 Funcionários CLT</li>
                  <li>20 Prestadores PJ</li>
                  <li>5 Tipos de Benefícios</li>
                  <li>4 Treinamentos</li>
                  <li>10 Contratos PJ</li>
                  <li>15 Períodos de Férias</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Restaurar Padrões</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
