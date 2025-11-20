import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, Clock, AlertCircle, Calendar, FileX, Award, TrendingUp, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [period, setPeriod] = useState<string>("month");

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: activeEmployees, isLoading: loadingActive } = useQuery({
    queryKey: ["active-employees"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "Ativo");
      return count || 0;
    },
  });

  const { data: cltCount, isLoading: loadingCLT } = useQuery({
    queryKey: ["clt-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("contract_type", "CLT")
        .eq("status", "Ativo");
      return count || 0;
    },
  });

  const { data: pjCount, isLoading: loadingPJ } = useQuery({
    queryKey: ["pj-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("contract_type", "PJ")
        .eq("status", "Ativo");
      return count || 0;
    },
  });

  // Novos dados importantes
  const { data: monthlyCosts, isLoading: loadingCosts } = useQuery({
    queryKey: ["monthly-costs"],
    queryFn: async () => {
      const { data: clt } = await supabase
        .from("employees")
        .select("salary")
        .eq("status", "Ativo")
        .eq("contract_type", "CLT");
      
      const { data: pj } = await supabase
        .from("employees")
        .select("monthly_value")
        .eq("status", "Ativo")
        .eq("contract_type", "PJ");
      
      const totalCLT = clt?.reduce((sum, e) => sum + (Number(e.salary) || 0), 0) || 0;
      const totalPJ = pj?.reduce((sum, e) => sum + (Number(e.monthly_value) || 0), 0) || 0;
      
      return totalCLT + totalPJ;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: overtimeHours } = useQuery({
    queryKey: ["overtime-hours"],
    queryFn: async () => {
      const { data } = await supabase
        .from("timesheets")
        .select("overtime_hours")
        .gt("overtime_hours", 0);
      
      return data?.reduce((sum, t) => sum + (Number(t.overtime_hours) || 0), 0) || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: expiredDocs } = useQuery({
    queryKey: ["expired-documents"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from("employee_documents")
        .select("*", { count: "exact", head: true })
        .not("expiry_date", "is", null)
        .lt("expiry_date", today);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: expiringCertifications } = useQuery({
    queryKey: ["expiring-certifications"],
    queryFn: async () => {
      const { count } = await supabase
        .from("pj_certifications")
        .select("*", { count: "exact", head: true })
        .eq("status", "vencendo");
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingTrainings } = useQuery({
    queryKey: ["pending-trainings"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employee_trainings")
        .select("*", { count: "exact", head: true })
        .eq("attendance_status", "agendado");
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: expiringContracts } = useQuery({
    queryKey: ["expiring-contracts"],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count } = await supabase
        .from("pj_contracts")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo")
        .lte("end_date", thirtyDaysFromNow.toISOString().split('T')[0]);
      return count || 0;
    },
  });

  const { data: expiringVacations, isLoading: loadingVacations } = useQuery({
    queryKey: ["expiring-vacations"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from("vacations")
        .select("*", { count: "exact", head: true })
        .eq("status", "aquisitivo")
        .lte("acquisition_period_end", today);
      return count || 0;
    },
  });

  // Dados para gráficos
  const { data: departmentData } = useQuery({
    queryKey: ["employees-by-department"],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("department_id, departments(name)")
        .eq("status", "Ativo");
      
      const counts = data?.reduce((acc: any, emp: any) => {
        const deptName = emp.departments?.name || "Sem Departamento";
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(counts || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentActivities } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("full_name, hire_date, contract_type")
        .order("hire_date", { ascending: false })
        .limit(5);
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data } = await supabase
        .from("units")
        .select("id, name")
        .eq("active", true);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const stats = [
    {
      title: "Total de Funcionários",
      value: employees || 0,
      icon: Users,
      description: "Todos os colaboradores",
      onClick: () => navigate("/employees"),
      isLoading: loadingEmployees,
    },
    {
      title: "Funcionários Ativos",
      value: activeEmployees || 0,
      icon: Briefcase,
      description: "Em atividade",
      onClick: () => navigate("/employees"),
      isLoading: loadingActive,
    },
    {
      title: "CLT Ativos",
      value: cltCount || 0,
      icon: Users,
      description: "Contrato CLT",
      onClick: () => navigate("/employees?filter=CLT"),
      isLoading: loadingCLT,
    },
    {
      title: "PJ Ativos",
      value: pjCount || 0,
      icon: Briefcase,
      description: "Prestadores de serviço",
      onClick: () => navigate("/employees?filter=PJ"),
      isLoading: loadingPJ,
    },
    {
      title: "Custos Mensais",
      value: monthlyCosts ? `R$ ${monthlyCosts.toLocaleString('pt-BR')}` : "R$ 0",
      icon: DollarSign,
      description: "CLT + PJ",
      onClick: () => navigate("/finance-rh"),
      isLoading: loadingCosts,
    },
    {
      title: "Horas Extras",
      value: overtimeHours || 0,
      icon: Clock,
      description: "Pendentes este mês",
      onClick: () => navigate("/timesheets"),
      isLoading: false,
    },
  ];

  const alerts = [
    { 
      type: "warning", 
      message: `${expiringContracts || 0} contratos PJ vencem em 30 dias`, 
      icon: AlertCircle,
      link: "/pj-contracts",
    },
    { 
      type: "info", 
      message: `${expiringVacations || 0} períodos de férias vencidos`, 
      icon: Calendar,
      link: "/vacations",
    },
    { 
      type: "error", 
      message: `${expiredDocs || 0} documentos vencidos`, 
      icon: FileX,
      link: "/documents",
    },
    { 
      type: "warning", 
      message: `${expiringCertifications || 0} certidões PJ vencendo`, 
      icon: AlertCircle,
      link: "/pj-contracts",
    },
    { 
      type: "info", 
      message: `${pendingTrainings || 0} treinamentos agendados`, 
      icon: Award,
      link: "/trainings",
    },
  ].filter(alert => parseInt(alert.message) > 0);

  const contractData = [
    { name: "CLT", value: cltCount || 0, fill: "hsl(var(--chart-1))" },
    { name: "PJ", value: pjCount || 0, fill: "hsl(var(--chart-2))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard RH</h1>
          <p className="text-muted-foreground">Visão geral do departamento de recursos humanos</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as unidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {units?.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          stat.isLoading ? (
            <Skeleton key={index} className="h-32" />
          ) : (
            <Card 
              key={index} 
              className="transition-all hover:shadow-lg cursor-pointer hover:border-primary"
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={contractData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80}
                  label
                >
                  {contractData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Departamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas e Pendências</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(alert.link)}
              >
                <alert.icon className={`h-5 w-5 ${
                  alert.type === 'warning' ? 'text-yellow-500' : 
                  alert.type === 'error' ? 'text-red-500' : 
                  'text-blue-500'
                }`} />
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Últimas Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Contratações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities?.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 py-2 border-b last:border-0">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-sm">{activity.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.contract_type} • Admitido em {new Date(activity.hire_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => navigate("/timesheets")}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Registrar Ponto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Registre entradas e saídas rapidamente</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => navigate("/employees/new")}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Novo Funcionário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Cadastre um novo colaborador</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => navigate("/reports")}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Gerar Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Exporte dados e estatísticas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
