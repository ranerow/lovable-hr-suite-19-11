import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Download, Trash2, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocumentListProps {
  employeeId: string;
  bucketName: "employee-documents" | "contracts" | "pj-certifications" | "pj-invoices";
  title?: string;
}

export default function DocumentList({
  employeeId,
  bucketName,
  title = "Documentos",
}: DocumentListProps) {
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", employeeId, bucketName],
    queryFn: async () => {
      if (bucketName === "employee-documents") {
        const { data, error } = await supabase
          .from("employee_documents")
          .select("*")
          .eq("employee_id", employeeId)
          .order("upload_date", { ascending: false });

        if (error) throw error;
        return data;
      }
      // Para outros buckets, você pode adicionar lógica específica
      return [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (document: any) => {
      // Extrair o caminho do arquivo da URL
      const urlParts = document.file_url.split("/");
      const fileName = urlParts.slice(-2).join("/"); // employee_id/filename

      // Deletar do Storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (storageError) throw storageError;

      // Deletar do banco de dados
      if (bucketName === "employee-documents") {
        const { error: dbError } = await supabase
          .from("employee_documents")
          .delete()
          .eq("id", document.id);

        if (dbError) throw dbError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", employeeId, bucketName] });
      toast.success("Documento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir documento: ${error.message}`);
    },
  });

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro ao fazer download do documento");
      console.error("Download error:", error);
    }
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando documentos...</p>
        </CardContent>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum documento cadastrado</p>
            <p className="text-xs text-muted-foreground mt-2">
              Use o formulário acima para fazer upload de documentos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
          <Badge variant="outline" className="ml-auto">
            {documents.length} {documents.length === 1 ? "documento" : "documentos"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome do Arquivo</TableHead>
                <TableHead>Data de Upload</TableHead>
                {bucketName === "employee-documents" && <TableHead>Validade</TableHead>}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.document_type}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{doc.file_name}</TableCell>
                  <TableCell>
                    {doc.upload_date
                      ? format(new Date(doc.upload_date), "dd/MM/yyyy", { locale: ptBR })
                      : "N/A"}
                  </TableCell>
                  {bucketName === "employee-documents" && (
                    <TableCell>
                      {doc.expiry_date ? (
                        <div className="flex items-center gap-2">
                          {format(new Date(doc.expiry_date), "dd/MM/yyyy", { locale: ptBR })}
                          {isExpired(doc.expiry_date) && (
                            <Badge variant="destructive" className="text-xs">
                              Vencido
                            </Badge>
                          )}
                          {!isExpired(doc.expiry_date) && isExpiringSoon(doc.expiry_date) && (
                            <Badge variant="outline" className="text-xs border-warning text-warning">
                              Vencendo
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(doc.file_url)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc.file_url, doc.file_name)}
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o documento "{doc.file_name}"? Esta
                              ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(doc)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
