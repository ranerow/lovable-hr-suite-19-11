import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Calendar, Clock, Gift, FileCheck, AlertTriangle, Download } from "lucide-react";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: employeesCount } = useQuery({
    queryKey: ["employees_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "Ativo");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: cltCount } = useQuery({
    queryKey: ["clt_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("contract_type", "CLT")
        .eq("status", "Ativo");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: pjCount } = useQuery({
    queryKey: ["pj_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("contract_type", "PJ")
        .eq("status", "Ativo");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: vacationsCount } = useQuery({
    queryKey: ["vacations_pending"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vacations")
        .select("*", { count: "exact", head: true })
        .in("status", ["pendente", "aprovado_gestor", "aprovado_rh"]);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: contractsExpiring } = useQuery({
    queryKey: ["contracts_expiring"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pj_contracts")
        .select("*", { count: "exact", head: true })
        .in("status", ["ativo", "a_vencer"]);
      if (error) throw error;
      return count || 0;
    },
  });

  const summaryCards = [
    {
      title: "Total de Colaboradores",
      value: employeesCount || 0,
      icon: Users,
      description: "Ativos no sistema",
    },
    {
      title: "CLT Ativos",
      value: cltCount || 0,
      icon: Users,
      description: "Regime CLT",
    },
    {
      title: "PJ Ativos",
      value: pjCount || 0,
      icon: FileCheck,
      description: "Prestadores de serviço",
    },
    {
      title: "Férias Pendentes",
      value: vacationsCount || 0,
      icon: Calendar,
      description: "Aguardando aprovação",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análises e indicadores do RH</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clt">Relatórios CLT</TabsTrigger>
          <TabsTrigger value="pj">Relatórios PJ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Headcount por Unidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Distribuição de colaboradores por unidade
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Custos Mensais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Análise de custos CLT x PJ
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clt" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Relatório de Ponto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Horas trabalhadas e horas extras
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Relatório de Férias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Férias programadas e vencidas
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Relatório de Benefícios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Custos com benefícios por tipo
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Advertências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Processos disciplinares por período
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pj" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Contratos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Status dos contratos PJ vigentes
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Certidões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Certidões vencidas e a vencer
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas Fiscais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Histórico de NFs e pagamentos
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Custos Mensais PJ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Consolidado de custos com prestadores
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
