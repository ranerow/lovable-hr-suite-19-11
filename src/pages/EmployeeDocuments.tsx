import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format, parseISO, isAfter, isBefore, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type DocumentStatus = "all" | "valido" | "vencendo" | "vencido";

export default function EmployeeDocuments() {
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus>("all");
  const [uploadDateFrom, setUploadDateFrom] = useState<string>("");
  const [uploadDateTo, setUploadDateTo] = useState<string>("");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["all-employee-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_documents")
        .select(`
          *,
          employees:employee_id (
            full_name,
            contract_type,
            department_id,
            departments:department_id (name),
            unit_id,
            units:unit_id (name)
          )
        `)
        .order("upload_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Obter tipos de documentos únicos
  const documentTypes = Array.from(
    new Set(documents?.map((doc) => doc.document_type) || [])
  ).sort();

  // Função para determinar status do documento
  const getDocumentStatus = (expiryDate: string | null): DocumentStatus => {
    if (!expiryDate) return "valido";
    
    const expiry = parseISO(expiryDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (isBefore(expiry, today)) return "vencido";
    if (daysUntilExpiry <= 30) return "vencendo";
    return "valido";
  };

  // Filtrar documentos
  const filteredDocuments = documents?.filter((doc) => {
    // Filtro de tipo
    if (documentTypeFilter !== "all" && doc.document_type !== documentTypeFilter) {
      return false;
    }

    // Filtro de status
    if (statusFilter !== "all") {
      const docStatus = getDocumentStatus(doc.expiry_date);
      if (docStatus !== statusFilter) return false;
    }

    // Filtro de data de upload (de)
    if (uploadDateFrom && doc.upload_date) {
      if (isBefore(parseISO(doc.upload_date), parseISO(uploadDateFrom))) {
        return false;
      }
    }

    // Filtro de data de upload (até)
    if (uploadDateTo && doc.upload_date) {
      if (isAfter(parseISO(doc.upload_date), parseISO(uploadDateTo))) {
        return false;
      }
    }

    return true;
  });

  // Renderizar badge de status
  const renderStatusBadge = (expiryDate: string | null) => {
    if (!expiryDate) {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Sem validade
        </Badge>
      );
    }

    const status = getDocumentStatus(expiryDate);
    const expiry = parseISO(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, new Date());

    if (status === "vencido") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Vencido
        </Badge>
      );
    }

    if (status === "vencendo") {
      return (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-500">
          <Clock className="h-3 w-3" />
          Vence em {daysUntilExpiry} dias
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <CheckCircle className="h-3 w-3" />
        Válido
      </Badge>
    );
  };

  // Handlers de download e visualização
  const handleView = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
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
  };

  // Limpar filtros
  const clearFilters = () => {
    setDocumentTypeFilter("all");
    setStatusFilter("all");
    setUploadDateFrom("");
    setUploadDateTo("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Documentos dos Funcionários</h1>
        <p className="text-muted-foreground">
          Visualização consolidada de todos os documentos com filtros avançados
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtros</span>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Filtro de Tipo de Documento */}
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Status */}
            <div className="space-y-2">
              <Label>Status de Validade</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DocumentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="valido">Válidos</SelectItem>
                  <SelectItem value="vencendo">Vencendo (próximos 30 dias)</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data de Upload (De) */}
            <div className="space-y-2">
              <Label>Data Upload (De)</Label>
              <Input
                type="date"
                value={uploadDateFrom}
                onChange={(e) => setUploadDateFrom(e.target.value)}
              />
            </div>

            {/* Data de Upload (Até) */}
            <div className="space-y-2">
              <Label>Data Upload (Até)</Label>
              <Input
                type="date"
                value={uploadDateTo}
                onChange={(e) => setUploadDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos ({filteredDocuments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando documentos...
            </div>
          ) : !filteredDocuments || filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum documento encontrado com os filtros selecionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo de Documento</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Data Upload</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.employees?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>{doc.document_type}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {doc.file_name}
                      </TableCell>
                      <TableCell>
                        {doc.upload_date
                          ? format(parseISO(doc.upload_date), "dd/MM/yyyy", { locale: ptBR })
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {doc.expiry_date
                          ? format(parseISO(doc.expiry_date), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>{renderStatusBadge(doc.expiry_date)}</TableCell>
                      <TableCell>
                        {doc.employees?.departments?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {doc.employees?.units?.name || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
