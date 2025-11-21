import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, CheckCircle, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";
import {
  validateFileFormat,
  validateFileSize,
  validateFileIntegrity,
  formatFileSize,
  ERROR_MESSAGES,
} from "@/utils/documentValidator";

interface DocumentUpload {
  type: string;
  label: string;
  file?: File;
  url?: string;
  required: boolean;
}

interface DocumentUploadStepProps {
  contractType: "CLT" | "PJ";
  token: string;
  onNext: (documents: DocumentUpload[]) => void;
  onBack: () => void;
}

const CLT_DOCUMENTS = [
  { type: "rg", label: "RG (frente e verso)", required: true },
  { type: "cpf", label: "CPF", required: true },
  { type: "comprovante_residencia", label: "Comprovante de Residência", required: true },
  { type: "ctps", label: "CTPS (página de identificação)", required: true },
  { type: "foto_3x4", label: "Foto 3x4", required: true },
];

const PJ_DOCUMENTS = [
  { type: "contrato_social", label: "Contrato Social ou MEI", required: true },
  { type: "cnpj", label: "CNPJ", required: true },
  { type: "comprovante_endereco_empresa", label: "Comprovante de Endereço da Empresa", required: true },
  { type: "rg_responsavel", label: "RG do Responsável Legal", required: true },
  { type: "cpf_responsavel", label: "CPF do Responsável Legal", required: true },
  { type: "cnd_federal", label: "CND Federal", required: true },
  { type: "cnd_fgts", label: "CND FGTS", required: true },
];

export function DocumentUploadStep({ contractType, token, onNext, onBack }: DocumentUploadStepProps) {
  const documentTypes = contractType === "CLT" ? CLT_DOCUMENTS : PJ_DOCUMENTS;
  const [documents, setDocuments] = useState<DocumentUpload[]>(
    documentTypes.map(doc => ({ ...doc, file: undefined, url: undefined }))
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const sanitizeFileName = (fileName: string): string => {
    // Remove extensão
    const lastDotIndex = fileName.lastIndexOf('.');
    const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    
    // Remove acentos e caracteres especiais
    const sanitized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Substitui caracteres especiais por _
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, ''); // Remove underscores no início e fim
    
    return sanitized + extension.toLowerCase();
  };

  const handleFileSelect = async (index: number, file: File) => {
    if (!file) return;

    // 1️⃣ Validar formato
    if (!validateFileFormat(file)) {
      toast.error("❌ Formato inválido! Aceito apenas: JPG, PNG, WEBP ou PDF");
      return;
    }

    // 2️⃣ Validar tamanho ANTES de processar
    if (!validateFileSize(file, 10)) {
      toast.error(`❌ Arquivo muito grande (${formatFileSize(file.size)}). Máximo: 10MB`);
      return;
    }

    // 3️⃣ Validar integridade
    try {
      await validateFileIntegrity(file);
    } catch (error) {
      toast.error("❌ Arquivo corrompido ou inválido");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      let processedFile: File = file;
      const originalSize = file.size;

      // Comprimir apenas imagens
      if (file.type.startsWith('image/')) {
        setUploadProgress(20);
        toast.info("Comprimindo imagem...");
        
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: file.type,
        };

        try {
          processedFile = await imageCompression(file, options);
          const compressionPercent = Math.round((1 - processedFile.size / originalSize) * 100);
          
          if (compressionPercent > 0) {
            toast.success(
              `Imagem comprimida em ${compressionPercent}% (${formatFileSize(originalSize)} → ${formatFileSize(processedFile.size)})`
            );
          }
          setUploadProgress(50);
        } catch (compressionError) {
          console.warn("Erro na compressão, usando arquivo original:", compressionError);
        }
      } else {
        setUploadProgress(30);
      }

      // Sanitizar nome do arquivo
      const sanitizedFileName = sanitizeFileName(processedFile.name);
      const fileName = `${documents[index].type}_${Date.now()}_${sanitizedFileName}`;
      const filePath = `onboarding/${token}/${fileName}`;

      setUploadProgress(70);
      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;
      
      setUploadProgress(90);

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("employee-documents")
        .getPublicUrl(filePath);

      const newDocuments = [...documents];
      newDocuments[index] = {
        ...newDocuments[index],
        file: processedFile,
        url: publicUrl,
      };
      setDocuments(newDocuments);

      setUploadProgress(100);
      toast.success("Documento enviado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage = ERROR_MESSAGES[error.code] || 
        `Erro ao enviar: ${error.message || 'Erro desconhecido'}`;
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };


  const handleRemoveFile = (index: number) => {
    const newDocuments = [...documents];
    newDocuments[index] = {
      ...newDocuments[index],
      file: undefined,
      url: undefined,
    };
    setDocuments(newDocuments);
  };

  const canProceed = documents
    .filter(doc => doc.required)
    .every(doc => doc.url);

  const handleNext = () => {
    if (!canProceed) {
      toast.error("Por favor, envie todos os documentos obrigatórios");
      return;
    }
    onNext(documents);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <Card key={doc.type} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{doc.label}</span>
                  {doc.required && (
                    <span className="text-xs text-destructive">*</span>
                  )}
                </div>
                {doc.file && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.file.name} ({formatFileSize(doc.file.size)})
                  </p>
                )}
                {doc.url && (
                  <div className="mt-2">
                    {doc.file?.type.startsWith('image/') ? (
                      <img 
                        src={doc.url} 
                        alt={doc.label}
                        className="h-20 w-20 object-cover rounded border"
                      />
                    ) : (
                      <a 
                        href={doc.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-3 w-3" />
                        Ver documento
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {doc.url ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? "Processando..." : "Enviar"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(index, file);
                    }}
                  />
                </label>
                )}
                {uploading && uploadProgress > 0 && (
                  <Progress value={uploadProgress} className="w-32 h-2" />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Voltar
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || uploading}
        >
          Próximo →
        </Button>
      </div>
    </div>
  );
}
