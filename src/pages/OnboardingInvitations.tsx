import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Mail, Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function OnboardingInvitations() {
  const navigate = useNavigate();
  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ["onboarding_invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_invitations")
        .select(`
          *,
          employee:employees(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "expirado":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "em_andamento":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "expirado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "em_andamento":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/onboarding/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const resendEmail = async (invitation: any) => {
    try {
      const link = `${window.location.origin}/onboarding/${invitation.token}`;
      
      const { error } = await supabase.functions.invoke("send-onboarding-email", {
        body: {
          to: invitation.email,
          name: invitation.full_name,
          link,
          validityDays: Math.ceil(
            (new Date(invitation.expires_at).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        },
      });

      if (error) throw error;

      toast.success("Email reenviado!");
    } catch (error) {
      console.error("Erro ao reenviar email:", error);
      toast.error("Erro ao reenviar email");
    }
  };

  const extendExpiry = async (id: string) => {
    try {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 15);

      const { error } = await supabase
        .from("onboarding_invitations")
        .update({
          expires_at: newExpiry.toISOString(),
          status: "pendente",
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Prazo estendido por mais 15 dias!");
      refetch();
    } catch (error) {
      console.error("Erro ao estender prazo:", error);
      toast.error("Erro ao estender prazo");
    }
  };

  const cancelInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("onboarding_invitations")
        .update({ status: "expirado" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Convite cancelado!");
      refetch();
    } catch (error) {
      console.error("Erro ao cancelar convite:", error);
      toast.error("Erro ao cancelar convite");
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const stats = {
    total: invitations?.length || 0,
    pendente: invitations?.filter((i) => i.status === "pendente").length || 0,
    em_andamento: invitations?.filter((i) => i.status === "em_andamento").length || 0,
    concluido: invitations?.filter((i) => i.status === "concluido").length || 0,
    expirado: invitations?.filter((i) => i.status === "expirado").length || 0,
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Convites de Onboarding</h1>
        <p className="text-muted-foreground">
          Gerencie os convites enviados para novos colaboradores
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.em_andamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.concluido}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expirado}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Convites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations && invitations.length > 0 ? (
                  invitations.map((invitation) => {
                    const daysUntilExpiry = getDaysUntilExpiry(invitation.expires_at);
                    const isExpiringSoon = daysUntilExpiry <= 3 && daysUntilExpiry > 0;

                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          {invitation.full_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invitation.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{invitation.contract_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invitation.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(invitation.status)}
                              {invitation.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-20">
                            <Progress value={invitation.completion_percentage || 0} />
                            <span className="text-xs text-muted-foreground">
                              {invitation.completion_percentage || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {invitation.status === "expirado" ? (
                            <span className="text-destructive text-sm">Expirado</span>
                          ) : invitation.status === "concluido" ? (
                            <span className="text-muted-foreground text-sm">-</span>
                          ) : (
                            <span
                              className={`text-sm ${
                                isExpiringSoon ? "text-yellow-600 font-medium" : ""
                              }`}
                            >
                              {daysUntilExpiry > 0
                                ? `${daysUntilExpiry} dias`
                                : "Expirado"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(invitation.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {invitation.status === "concluido" && invitation.employee_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/employees/${invitation.employee_id}/review`)}
                                title="Revisar Documentos"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            {invitation.status !== "concluido" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyLink(invitation.token)}
                                  title="Copiar link"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resendEmail(invitation)}
                                  title="Reenviar email"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>

                                {invitation.status === "expirado" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => extendExpiry(invitation.id)}
                                    title="Estender prazo"
                                  >
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                )}

                                {invitation.status !== "expirado" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => cancelInvitation(invitation.id)}
                                    title="Cancelar"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum convite encontrado</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
