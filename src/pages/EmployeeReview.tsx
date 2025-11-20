import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DocumentList from "@/components/DocumentList";
import StatusHistory from "@/components/StatusHistory";
import { CheckCircle, XCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee-review", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          role:roles(name),
          department:departments(name),
          unit:units(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: documentValidation, isLoading: isLoadingValidation } = useQuery({
    queryKey: ["employee-documents-validation", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("validate_employee_documents", {
        employee_id_param: id,
      });

      if (error) throw error;
      return data?.[0] || { is_valid: false, missing_documents: [], contract_type: "" };
    },
    enabled: !!id,
  });

  const activateEmployee = useMutation({
    mutationFn: async () => {
      // Validar documentos antes de ativar
      if (!documentValidation?.is_valid) {
        throw new Error("Documentos obrigatórios não foram enviados");
      }

      const { error } = await supabase
        .from("employees")
        .update({ status: "Ativo" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Funcionário ativado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["employee-review", id] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/employees");
    },
    onError: (error) => {
      if (error.message.includes("Documentos obrigatórios")) {
        toast.error("Não é possível ativar: documentos obrigatórios faltando");
      } else {
        toast.error("Erro ao ativar funcionário");
      }
      console.error(error);
    },
  });

  const rejectEmployee = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("employees")
        .update({ status: "Inativo" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.info("Funcionário marcado como inativo");
      navigate("/onboarding-invitations");
    },
  });

  if (isLoading || isLoadingValidation) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Funcionário não encontrado</p>
      </div>
    );
  }

  const canActivate = documentValidation?.is_valid && employee.status === "Aguardando Ativação";
  const hasMissingDocs = documentValidation?.missing_documents && documentValidation.missing_documents.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/onboarding-invitations")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Convites
          </Button>
          <h1 className="text-3xl font-bold">Revisão de Onboarding</h1>
          <p className="text-muted-foreground">
            Revise os dados e documentos antes de ativar o funcionário
          </p>
        </div>
        <Badge
          variant={employee.status === "Aguardando Ativação" ? "secondary" : "default"}
        >
          {employee.status}
        </Badge>
      </div>

      {/* Alerta de Documentos Faltantes */}
      {hasMissingDocs && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Documentos Obrigatórios Faltando</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Os seguintes documentos são obrigatórios para funcionários {documentValidation.contract_type}:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {documentValidation.missing_documents.map((doc: string) => (
                <li key={doc} className="text-sm">{doc}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm font-medium">
              O funcionário não poderá ser ativado até que todos os documentos sejam enviados.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Confirmação de Documentos Completos */}
      {!hasMissingDocs && documentValidation?.is_valid && (
        <Alert className="border-success bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Documentação Completa</AlertTitle>
          <AlertDescription className="text-success/90">
            Todos os documentos obrigatórios para funcionários {documentValidation.contract_type} foram enviados.
            O funcionário está pronto para ser ativado.
          </AlertDescription>
        </Alert>
      )}

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nome Completo</p>
            <p className="font-medium">{employee.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{employee.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{employee.contract_type === "CLT" ? "CPF" : "CNPJ"}</p>
            <p className="font-medium">{employee.cpf || employee.cnpj || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telefone</p>
            <p className="font-medium">{employee.phone || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de Nascimento</p>
            <p className="font-medium">
              {employee.birth_date ? new Date(employee.birth_date).toLocaleDateString("pt-BR") : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
            <p className="font-medium">{employee.contract_type}</p>
          </div>
          {employee.contract_type === "CLT" && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">CTPS</p>
                <p className="font-medium">
                  {employee.ctps_number ? `${employee.ctps_number} - ${employee.ctps_series}/${employee.ctps_state}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PIS/PASEP</p>
                <p className="font-medium">{employee.pis_pasep || "-"}</p>
              </div>
            </>
          )}
          {employee.contract_type === "PJ" && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Razão Social</p>
                <p className="font-medium">{employee.company_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inscrição Municipal</p>
                <p className="font-medium">{employee.municipal_registration || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Representante Legal</p>
                <p className="font-medium">{employee.legal_representative || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de PJ</p>
                <p className="font-medium">{employee.pj_type || "-"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">Logradouro</p>
            <p className="font-medium">{employee.address || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cidade</p>
            <p className="font-medium">{employee.city || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className="font-medium">{employee.state || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CEP</p>
            <p className="font-medium">{employee.zip_code || "-"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Informações Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Profissionais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cargo</p>
            <p className="font-medium">{employee.role?.name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Departamento</p>
            <p className="font-medium">{employee.department?.name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unidade</p>
            <p className="font-medium">{employee.unit?.name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de Admissão</p>
            <p className="font-medium">
              {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString("pt-BR") : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Status */}
      <StatusHistory employeeId={id!} />

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList employeeId={id!} bucketName="employee-documents" />
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      {employee.status === "Aguardando Ativação" && (
        <div className="flex gap-4 justify-end sticky bottom-6 bg-background p-4 rounded-lg border shadow-lg">
          <Button
            variant="outline"
            onClick={() => rejectEmployee.mutate()}
            disabled={rejectEmployee.isPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reprovar
          </Button>
          <Button
            onClick={() => activateEmployee.mutate()}
            disabled={activateEmployee.isPending || !canActivate}
            title={!canActivate && hasMissingDocs ? "Documentos obrigatórios faltando" : ""}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Ativar Funcionário
          </Button>
        </div>
      )}
    </div>
  );
}
