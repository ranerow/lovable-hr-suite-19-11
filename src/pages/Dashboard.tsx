import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, Clock, AlertCircle, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { data: employees } = useQuery({
    queryKey: ["employees-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: activeEmployees } = useQuery({
    queryKey: ["active-employees"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "Ativo");
      return count || 0;
    },
  });

  const stats = [
    {
      title: "Total de Funcionários",
      value: employees || 0,
      icon: Users,
      change: "+12%",
      positive: true,
    },
    {
      title: "Funcionários Ativos",
      value: activeEmployees || 0,
      icon: Briefcase,
      change: "+5%",
      positive: true,
    },
    {
      title: "Custo Mensal Folha",
      value: "R$ 0,00",
      icon: DollarSign,
      change: "+3%",
      positive: false,
    },
    {
      title: "Horas Extras (mês)",
      value: "0h",
      icon: Clock,
      change: "-8%",
      positive: true,
    },
  ];

  const alerts = [
    { type: "warning", message: "3 contratos vencem em 30 dias", icon: AlertCircle },
    { type: "info", message: "5 funcionários com férias vencidas", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard RH</h1>
        <p className="text-muted-foreground">Visão geral do departamento de recursos humanos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.positive ? 'text-success' : 'text-destructive'}`}>
                {stat.change} desde o mês passado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas e Pendências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <alert.icon className={`h-5 w-5 ${alert.type === 'warning' ? 'text-warning' : 'text-info'}`} />
              <span className="text-sm">{alert.message}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
          <CardHeader>
            <CardTitle className="text-base">Registrar Ponto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Registre entradas e saídas rapidamente</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
          <CardHeader>
            <CardTitle className="text-base">Novo Funcionário</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Cadastre um novo colaborador</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
          <CardHeader>
            <CardTitle className="text-base">Gerar Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Exporte dados e estatísticas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
