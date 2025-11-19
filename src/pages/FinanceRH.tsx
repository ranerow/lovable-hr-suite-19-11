import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Briefcase,
  Calendar,
  PiggyBank,
  CreditCard,
  BarChart3
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinanceRH() {
  // Buscar todos os funcionários CLT ativos
  const { data: cltEmployees } = useQuery({
    queryKey: ["clt-employees-finance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          role:roles(name),
          department:departments(name),
          unit:units(name)
        `)
        .eq("contract_type", "CLT")
        .eq("status", "Ativo");
      if (error) throw error;
      return data;
    },
  });

  // Buscar todos os funcionários PJ ativos
  const { data: pjEmployees } = useQuery({
    queryKey: ["pj-employees-finance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          role:roles(name),
          department:departments(name),
          unit:units(name)
        `)
        .eq("contract_type", "PJ")
        .eq("status", "Ativo");
      if (error) throw error;
      return data;
    },
  });

  // Buscar contratos PJ ativos
  const { data: pjContracts } = useQuery({
    queryKey: ["pj-contracts-finance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pj_contracts")
        .select(`
          *,
          employee:employees(full_name, department:departments(name))
        `)
        .eq("status", "ativo");
      if (error) throw error;
      return data;
    },
  });

  // Buscar benefícios ativos
  const { data: activeBenefits } = useQuery({
    queryKey: ["active-benefits-finance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_benefits")
        .select(`
          *,
          benefit:benefits(name, benefit_type),
          employee:employees(full_name, contract_type)
        `)
        .eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  // Calcular custos CLT
  const totalCltSalaries = cltEmployees?.reduce((sum, emp) => sum + (emp.salary || 0), 0) || 0;
  const totalCltProvisions = cltEmployees?.reduce((sum, emp) => 
    sum + (emp.vacation_provision || 0) + (emp.thirteenth_salary_provision || 0), 0
  ) || 0;
  const vacationProvision = cltEmployees?.reduce((sum, emp) => sum + (emp.vacation_provision || 0), 0) || 0;
  const thirteenthProvision = cltEmployees?.reduce((sum, emp) => sum + (emp.thirteenth_salary_provision || 0), 0) || 0;

  // Calcular custos PJ
  const totalPjContracts = pjContracts?.reduce((sum, contract) => sum + (contract.monthly_value || 0), 0) || 0;

  // Calcular benefícios
  const totalBenefitsClt = activeBenefits
    ?.filter(b => b.employee?.contract_type === "CLT")
    .reduce((sum, b) => sum + (b.monthly_value || 0), 0) || 0;
  
  const totalBenefitsPj = activeBenefits
    ?.filter(b => b.employee?.contract_type === "PJ")
    .reduce((sum, b) => sum + (b.monthly_value || 0), 0) || 0;

  // Custos totais
  const totalCltCost = totalCltSalaries + totalBenefitsClt;
  const totalPjCost = totalPjContracts + totalBenefitsPj;
  const totalMonthlyCost = totalCltCost + totalPjCost;

  // Agrupar por departamento
  const costsByDepartment = [...(cltEmployees || []), ...(pjEmployees || [])]
    .reduce((acc: any, emp) => {
      const dept = emp.department?.name || "Sem departamento";
      if (!acc[dept]) {
        acc[dept] = { clt: 0, pj: 0, total: 0 };
      }
      const cost = emp.contract_type === "CLT" ? (emp.salary || 0) : (emp.monthly_value || 0);
      if (emp.contract_type === "CLT") {
        acc[dept].clt += cost;
      } else {
        acc[dept].pj += cost;
      }
      acc[dept].total += cost;
      return acc;
    }, {});

  const departmentData = Object.entries(costsByDepartment).map(([name, data]: [string, any]) => ({
    name,
    ...data,
  }));

  const stats = [
    {
      title: "Custo Total Mensal",
      value: `R$ ${totalMonthlyCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Folha completa (CLT + PJ)",
      color: "text-primary",
    },
    {
      title: "Folha CLT",
      value: `R$ ${totalCltCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: Users,
      description: `${cltEmployees?.length || 0} colaboradores`,
      color: "text-success",
    },
    {
      title: "Contratos PJ",
      value: `R$ ${totalPjCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: Briefcase,
      description: `${pjEmployees?.length || 0} prestadores`,
      color: "text-info",
    },
    {
      title: "Provisões Totais",
      value: `R$ ${totalCltProvisions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: PiggyBank,
      description: "13º + Férias",
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financeiro RH</h1>
        <p className="text-muted-foreground">
          Acompanhamento de custos e provisões do departamento de RH
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs de Detalhamento */}
      <Tabs defaultValue="clt" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clt">CLT</TabsTrigger>
          <TabsTrigger value="pj">PJ</TabsTrigger>
          <TabsTrigger value="provisions">Provisões</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="departments">Por Departamento</TabsTrigger>
        </TabsList>

        {/* Aba CLT */}
        <TabsContent value="clt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Folha de Pagamento CLT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Salários Base</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {totalCltSalaries.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Benefícios CLT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {totalBenefitsClt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total CLT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      R$ {totalCltCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-right">Salário</TableHead>
                    <TableHead className="text-right">Provisão Férias</TableHead>
                    <TableHead className="text-right">Provisão 13º</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cltEmployees?.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>{employee.role?.name || "N/A"}</TableCell>
                      <TableCell>{employee.department?.name || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        R$ {(employee.salary || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(employee.vacation_provision || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(employee.thirteenth_salary_provision || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba PJ */}
        <TabsContent value="pj" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contratos PJ Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pjContracts?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Benefícios PJ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {totalBenefitsPj.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total PJ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-info">
                      R$ {totalPjCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Número do Contrato</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="text-right">Valor Mensal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pjContracts?.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.employee?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>{contract.contract_number}</TableCell>
                      <TableCell>{contract.employee?.department?.name || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(contract.start_date).toLocaleDateString("pt-BR")} - {" "}
                        {new Date(contract.end_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {contract.monthly_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Provisões */}
        <TabsContent value="provisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provisões CLT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Provisão de Férias</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      R$ {vacationProvision.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Férias + 1/3 constitucional
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Provisão de 13º Salário</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      R$ {thirteenthProvision.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Décimo terceiro proporcional
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Salário Base</TableHead>
                    <TableHead className="text-right">Provisão Férias</TableHead>
                    <TableHead className="text-right">Provisão 13º</TableHead>
                    <TableHead className="text-right">Total Provisões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cltEmployees?.map((employee) => {
                    const totalProvision = (employee.vacation_provision || 0) + (employee.thirteenth_salary_provision || 0);
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.full_name}</TableCell>
                        <TableCell>{employee.role?.name || "N/A"}</TableCell>
                        <TableCell>
                          R$ {(employee.salary || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(employee.vacation_provision || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(employee.thirteenth_salary_provision || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          R$ {totalProvision.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Benefícios */}
        <TabsContent value="benefits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custos com Benefícios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Benefícios CLT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      R$ {totalBenefitsClt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeBenefits?.filter(b => b.employee?.contract_type === "CLT").length || 0} benefícios ativos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Benefícios PJ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-info">
                      R$ {totalBenefitsPj.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeBenefits?.filter(b => b.employee?.contract_type === "PJ").length || 0} benefícios ativos
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Benefício</TableHead>
                    <TableHead>Tipo de Benefício</TableHead>
                    <TableHead className="text-right">Valor Mensal</TableHead>
                    <TableHead>Desconto em Folha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeBenefits?.map((benefit) => (
                    <TableRow key={benefit.id}>
                      <TableCell className="font-medium">
                        {benefit.employee?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={benefit.employee?.contract_type === "CLT" ? "default" : "secondary"}>
                          {benefit.employee?.contract_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{benefit.benefit?.name || "N/A"}</TableCell>
                      <TableCell>{benefit.benefit?.benefit_type || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        R$ {(benefit.monthly_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={benefit.discount_from_payroll ? "destructive" : "outline"}>
                          {benefit.discount_from_payroll ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Por Departamento */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custos por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-right">CLT</TableHead>
                    <TableHead className="text-right">PJ</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentData
                    .sort((a, b) => b.total - a.total)
                    .map((dept) => {
                      const percentage = ((dept.total / totalMonthlyCost) * 100).toFixed(1);
                      return (
                        <TableRow key={dept.name}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell className="text-right">
                            R$ {dept.clt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {dept.pj.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            R$ {dept.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{percentage}%</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">TOTAL GERAL</TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {totalCltSalaries.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {totalPjContracts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      R$ {totalMonthlyCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge>100%</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
