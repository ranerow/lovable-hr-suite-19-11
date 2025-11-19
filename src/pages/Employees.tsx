import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OnboardingInvitationDialog } from "@/components/OnboardingInvitationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Employees() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          role:roles(name),
          department:departments(name),
          unit:units(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Buscar funcionários recém-onboardados (últimos 7 dias)
  const { data: recentOnboarding } = useQuery({
    queryKey: ["recent-onboarding"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("onboarding_invitations")
        .select("employee_id, completed_at")
        .eq("status", "concluido")
        .gte("completed_at", sevenDaysAgo.toISOString());

      if (error) throw error;
      return data?.map(inv => inv.employee_id) || [];
    },
  });

  const isRecentlyOnboarded = (employeeId: string) => {
    return recentOnboarding?.includes(employeeId) || false;
  };

  const filteredEmployees = employees?.filter((emp) => {
    const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cpf.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchesContract = contractFilter === "all" || emp.contract_type === contractFilter;
    return matchesSearch && matchesStatus && matchesContract;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Ativo: "bg-success text-success-foreground",
      Férias: "bg-info text-info-foreground",
      Afastado: "bg-warning text-warning-foreground",
      Demitido: "bg-destructive text-destructive-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie sua equipe</p>
        </div>
        <Button onClick={() => navigate("/employees/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Férias">Férias</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                  <SelectItem value="Demitido">Demitido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={contractFilter} onValueChange={setContractFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tipo de Contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setContractFilter("all");
              }}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredEmployees && filteredEmployees.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow 
                      key={employee.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/employees/${employee.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {employee.full_name}
                          {isRecentlyOnboarded(employee.id) && (
                            <Badge variant="default" className="text-xs">
                              Novo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                      <TableCell>{employee.role?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.contract_type}</Badge>
                      </TableCell>
                      <TableCell>{employee.unit?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(employee.status)}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <OnboardingInvitationDialog
                            employee={{
                              id: employee.id,
                              full_name: employee.full_name,
                              email: employee.email,
                              contract_type: employee.contract_type,
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employees/${employee.id}`);
                            }}
                          >
                            Ver
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employees/${employee.id}/edit`);
                            }}
                          >
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum funcionário encontrado</p>
              <Button onClick={() => navigate("/employees/new")}>
                Cadastrar primeiro funcionário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
