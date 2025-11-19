import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const handleFileSelect = async (index: number, file: File) => {
    if (!file) return;

    // Validar tipo e tamanho
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      // Upload para storage temporário
      const fileName = `${documents[index].type}_${Date.now()}_${file.name}`;
      const filePath = `onboarding/${token}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("employee-documents")
        .getPublicUrl(filePath);

      const newDocuments = [...documents];
      newDocuments[index] = {
        ...newDocuments[index],
        file,
        url: publicUrl,
      };
      setDocuments(newDocuments);

      toast.success("Documento enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
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
                    {doc.file.name}
                  </p>
                )}
              </div>

              {doc.url ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
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
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar
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
