import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import StatusHistory from "@/components/StatusHistory";

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          role:roles(name, description),
          department:departments(name),
          unit:units(name, city, state)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["employee-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", id)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: timesheets } = useQuery({
    queryKey: ["employee-timesheets", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*")
        .eq("employee_id", id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Funcionário não encontrado</p>
        <Button onClick={() => navigate("/employees")}>
          Voltar para Funcionários
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/employees")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            Perfil do Funcionário
          </h1>
          <p className="text-muted-foreground">
            Informações detalhadas e histórico
          </p>
        </div>
        <Button variant="outline">Editar</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee.photo_url || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {employee.full_name}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {employee.role?.name || "Sem cargo"}
                  </p>
                </div>
                <Badge className={getStatusColor(employee.status)}>
                  {employee.status}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{employee.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm">
                    <Badge variant="outline">{employee.contract_type}</Badge>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Admissão:{" "}
                    {format(new Date(employee.hire_date), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="timesheet">Histórico de Ponto</TabsTrigger>
          <TabsTrigger value="additional">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    CPF
                  </label>
                  <p className="text-foreground">{employee.cpf}</p>
                </div>
                {employee.birth_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Data de Nascimento
                    </label>
                    <p className="text-foreground">
                      {format(new Date(employee.birth_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Endereço
                </h3>
                <div className="space-y-2">
                  {employee.address && (
                    <p className="text-muted-foreground">{employee.address}</p>
                  )}
                  {(employee.city || employee.state) && (
                    <p className="text-muted-foreground">
                      {employee.city}
                      {employee.city && employee.state && " - "}
                      {employee.state}
                    </p>
                  )}
                  {employee.zip_code && (
                    <p className="text-muted-foreground">
                      CEP: {employee.zip_code}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Informações Profissionais
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Departamento
                    </label>
                    <p className="text-foreground">
                      {employee.department?.name || "Não definido"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Unidade
                    </label>
                    <p className="text-foreground">
                      {employee.unit?.name || "Não definido"}
                    </p>
                  </div>
                  {employee.salary && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Salário
                      </label>
                      <p className="text-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(employee.salary))}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Carga Horária
                    </label>
                    <p className="text-foreground">{employee.workload}h/semana</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Pessoais</CardTitle>
                  <CardDescription>
                    Gerencie os documentos do colaborador
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DocumentUpload
                    employeeId={id!}
                    bucketName="employee-documents"
                  />
                  <Separator />
                  <DocumentList
                    employeeId={id!}
                    bucketName="employee-documents"
                    title="Documentos Cadastrados"
                  />
                </CardContent>
              </Card>

              {employee.contract_type === "CLT" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contratos CLT</CardTitle>
                    <CardDescription>
                      Documentos contratuais do vínculo CLT
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <DocumentUpload
                      employeeId={id!}
                      bucketName="contracts"
                    />
                    <Separator />
                    <DocumentList
                      employeeId={id!}
                      bucketName="contracts"
                      title="Contratos Cadastrados"
                    />
                  </CardContent>
                </Card>
              )}

              {employee.contract_type === "PJ" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Certidões PJ</CardTitle>
                      <CardDescription>
                        CND Federal, FGTS, Municipal, CNDT
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <DocumentUpload
                        employeeId={id!}
                        bucketName="pj-certifications"
                      />
                      <Separator />
                      <DocumentList
                        employeeId={id!}
                        bucketName="pj-certifications"
                        title="Certidões Cadastradas"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Notas Fiscais</CardTitle>
                      <CardDescription>
                        Notas fiscais mensais de prestação de serviços
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <DocumentUpload
                        employeeId={id!}
                        bucketName="pj-invoices"
                      />
                      <Separator />
                      <DocumentList
                        employeeId={id!}
                        bucketName="pj-invoices"
                        title="Notas Fiscais Cadastradas"
                      />
                    </CardContent>
                  </Card>
                </>
              )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <StatusHistory employeeId={id!} />
        </TabsContent>

        <TabsContent value="timesheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ponto - Últimos 30 dias</CardTitle>
            </CardHeader>
            <CardContent>
              {timesheets && timesheets.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Saída Almoço</TableHead>
                        <TableHead>Volta Almoço</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead>Horas Trabalhadas</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timesheets.map((timesheet) => (
                        <TableRow key={timesheet.id}>
                          <TableCell className="font-medium">
                            {format(new Date(timesheet.date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>{timesheet.check_in || "-"}</TableCell>
                          <TableCell>{timesheet.lunch_start || "-"}</TableCell>
                          <TableCell>{timesheet.lunch_end || "-"}</TableCell>
                          <TableCell>{timesheet.check_out || "-"}</TableCell>
                          <TableCell>
                            {timesheet.hours_worked
                              ? `${Number(timesheet.hours_worked).toFixed(2)}h`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{timesheet.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum registro de ponto encontrado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ID do Funcionário
                  </label>
                  <p className="text-foreground font-mono text-sm">
                    {employee.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Data de Cadastro
                  </label>
                  <p className="text-foreground">
                    {employee.created_at &&
                      format(
                        new Date(employee.created_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Última Atualização
                  </label>
                  <p className="text-foreground">
                    {employee.updated_at &&
                      format(
                        new Date(employee.updated_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Localização
                </h3>
                {employee.unit && (
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">
                      {employee.unit.name}
                    </p>
                    {(employee.unit.city || employee.unit.state) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {employee.unit.city}
                          {employee.unit.city && employee.unit.state && " - "}
                          {employee.unit.state}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <StatusHistory employeeId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
