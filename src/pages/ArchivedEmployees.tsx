import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Archive, Search, RotateCcw, Eye, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

export default function ArchivedEmployees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArchive, setSelectedArchive] = useState<any>(null);
  const { isAdmin } = useUserRole();

  const { data: archivedEmployees, isLoading, refetch } = useQuery({
    queryKey: ["archived-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("archived_employees")
        .select("*")
        .order("archived_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredEmployees = archivedEmployees?.filter((archive) => {
    const employeeData = archive.employee_data as any;
    const searchLower = searchTerm.toLowerCase();
    return (
      employeeData.full_name?.toLowerCase().includes(searchLower) ||
      employeeData.email?.toLowerCase().includes(searchLower) ||
      employeeData.cpf?.includes(searchTerm)
    );
  });

  const handleRestore = async (archive: any) => {
    if (!isAdmin) {
      toast.error("Apenas diretoria pode restaurar funcionários");
      return;
    }

    if (!confirm("Tem certeza que deseja restaurar este funcionário?")) {
      return;
    }

    try {
      const employeeData = archive.employee_data;
      delete employeeData.id;

      // 1. Restaurar funcionário
      const { data: restoredEmployee, error: restoreError } = await supabase
        .from("employees")
        .insert({
          ...employeeData,
          status: "Ativo",
        })
        .select()
        .single();

      if (restoreError) throw restoreError;

      // 2. Restaurar documentos
      if (archive.documents?.length > 0) {
        const documents = archive.documents.map((doc: any) => ({
          ...doc,
          id: undefined,
          employee_id: restoredEmployee.id,
        }));
        await supabase.from("employee_documents").insert(documents);
      }

      // 3. Remover do arquivo
      await supabase.from("archived_employees").delete().eq("id", archive.id);

      toast.success("Funcionário restaurado com sucesso");
      setSelectedArchive(null);
      refetch();
    } catch (error: any) {
      console.error("Erro ao restaurar:", error);
      toast.error(error.message || "Erro ao restaurar funcionário");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando funcionários arquivados...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Archive className="h-8 w-8" />
              Funcionários Arquivados
            </h1>
            <p className="text-muted-foreground mt-1">
              Histórico completo de ex-funcionários com possibilidade de restauração
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                {filteredEmployees?.length || 0} arquivado(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!filteredEmployees || filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Nenhum funcionário arquivado encontrado"
                    : "Nenhum funcionário arquivado ainda"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo Contrato</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Data Arquivamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((archive) => {
                    const employeeData = archive.employee_data as any;
                    return (
                      <TableRow key={archive.id}>
                        <TableCell className="font-medium">
                          {employeeData.full_name}
                        </TableCell>
                        <TableCell>{employeeData.email}</TableCell>
                        <TableCell>
                          <Badge variant={employeeData.contract_type === "CLT" ? "default" : "secondary"}>
                            {employeeData.contract_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {archive.archive_reason}
                        </TableCell>
                        <TableCell>
                          {format(new Date(archive.archived_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedArchive(archive)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRestore(archive)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restaurar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedArchive} onOpenChange={() => setSelectedArchive(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Detalhes do Funcionário Arquivado
            </DialogTitle>
            <DialogDescription>
              Histórico completo e dados preservados
            </DialogDescription>
          </DialogHeader>

          {selectedArchive && (
            <ScrollArea className="max-h-[70vh]">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                  <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
                  <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informações Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(() => {
                        const data = selectedArchive.employee_data as any;
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Nome Completo</p>
                                <p className="font-medium">{data.full_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{data.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                                <p className="font-medium">{data.cpf || data.cnpj}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Tipo Contrato</p>
                                <Badge>{data.contract_type}</Badge>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Data Admissão</p>
                                <p className="font-medium">
                                  {format(new Date(data.hire_date), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                              {data.salary && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Salário</p>
                                  <p className="font-medium">
                                    R$ {Number(data.salary).toLocaleString("pt-BR")}
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Informações do Arquivamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Motivo</p>
                        <p className="font-medium">{selectedArchive.archive_reason}</p>
                      </div>
                      {selectedArchive.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Observações</p>
                          <p className="text-sm">{selectedArchive.notes}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Data do Arquivamento</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(selectedArchive.archived_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documentos" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Documentos Preservados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedArchive.documents?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedArchive.documents.map((doc: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{doc.document_type}</p>
                                <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                              </div>
                              <Badge variant="outline">Preservado</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum documento registrado
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="historico" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Histórico de Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedArchive.status_history?.length > 0 ? (
                        <div className="space-y-3">
                          {selectedArchive.status_history.map((history: any, idx: number) => (
                            <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">
                                    {history.previous_status} → {history.new_status}
                                  </p>
                                  {history.reason && (
                                    <p className="text-sm text-muted-foreground">{history.reason}</p>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(history.changed_at), "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum histórico de status
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="beneficios" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Benefícios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedArchive.benefits?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedArchive.benefits.map((benefit: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg">
                              <p className="font-medium">{benefit.benefits?.name || "Benefício"}</p>
                              {benefit.monthly_value && (
                                <p className="text-sm text-muted-foreground">
                                  R$ {Number(benefit.monthly_value).toLocaleString("pt-BR")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum benefício registrado
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="treinamentos" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Treinamentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedArchive.trainings?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedArchive.trainings.map((training: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg">
                              <p className="font-medium">{training.trainings?.name || "Treinamento"}</p>
                              {training.completion_date && (
                                <p className="text-sm text-muted-foreground">
                                  Concluído em:{" "}
                                  {format(new Date(training.completion_date), "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum treinamento registrado
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
