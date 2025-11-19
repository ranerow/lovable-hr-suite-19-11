import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  employeeId: string;
  bucketName: "employee-documents" | "contracts" | "pj-certifications" | "pj-invoices" | "employee-photos";
  onUploadSuccess?: () => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

export default function DocumentUpload({
  employeeId,
  bucketName,
  onUploadSuccess,
  allowedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
  maxSizeMB = 10,
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes: Record<string, string[]> = {
    "employee-documents": [
      "ASO Admissional",
      "ASO Periódico",
      "ASO Demissional",
      "Contrato de Trabalho",
      "Termo de Sigilo",
      "Termo de EPI",
      "Holerite",
      "Comprovante de Residência",
      "RG",
      "CPF",
      "CTPS",
      "Título de Eleitor",
      "Certificado de Reservista",
      "Outro",
    ],
    "contracts": [
      "Contrato CLT",
      "Contrato Determinado",
      "Termo Aditivo",
      "Rescisão",
      "Acordo Coletivo",
      "Outro",
    ],
    "pj-certifications": [
      "CND Federal",
      "CND FGTS",
      "CND Municipal",
      "CNDT",
      "Certidão Estadual",
      "Outro",
    ],
    "pj-invoices": [
      "Nota Fiscal",
      "Recibo",
      "Outro",
    ],
    "employee-photos": ["Foto 3x4", "Foto Perfil"],
  };

  const handleFileSelect = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande! Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(", ")}`);
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error("Selecione um arquivo e o tipo de documento");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Criar nome único para o arquivo
      const fileExtension = selectedFile.name.split(".").pop();
      const fileName = `${employeeId}/${documentType.replace(/\s/g, "_")}_${Date.now()}.${fileExtension}`;

      setUploadProgress(30);

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      setUploadProgress(80);

      // Salvar referência no banco de dados
      if (bucketName === "employee-documents") {
        const { error: dbError } = await supabase.from("employee_documents").insert({
          employee_id: employeeId,
          document_type: documentType,
          file_name: selectedFile.name,
          file_url: urlData.publicUrl,
        });

        if (dbError) throw dbError;
      } else if (bucketName === "pj-certifications") {
        // Para certidões PJ, você pode adicionar lógica específica aqui
        toast.info("Certidão enviada! Complete os dados de validade na tela de Certidões.");
      } else if (bucketName === "pj-invoices") {
        // Para notas fiscais PJ
        toast.info("Nota fiscal enviada! Complete os dados na tela de Contratos PJ.");
      }

      setUploadProgress(100);

      toast.success("Documento enviado com sucesso!");
      setSelectedFile(null);
      setDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(`Erro ao enviar documento: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Documento */}
        <div className="space-y-2">
          <Label htmlFor="document-type">Tipo de Documento *</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger id="document-type">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes[bucketName]?.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Área de Drag & Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(",")}
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!selectedFile ? (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste e solte o arquivo aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Tipos aceitos: {allowedTypes.join(", ")} (Máx. {maxSizeMB}MB)
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-center text-muted-foreground">
                    Enviando... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão de Upload */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-pulse" />
              Enviando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Enviar Documento
            </>
          )}
        </Button>

        {/* Informações */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Os documentos são armazenados de forma segura e apenas usuários autorizados têm
            acesso. Certifique-se de que os documentos não contenham informações sensíveis
            desnecessárias.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
