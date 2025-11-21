import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateCPF, validateCNPJ } from "@/utils/documentValidator";

interface ReviewStepProps {
  data: any;
  documents: any[];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({ data, documents, onBack, onSubmit, isSubmitting }: ReviewStepProps) {
  const [confirmed, setConfirmed] = useState(false);
  
  // Validar CPF/CNPJ
  const cpfValid = data.cpf ? validateCPF(data.cpf) : true;
  const cnpjValid = data.cnpj ? validateCNPJ(data.cnpj) : true;
  const documentsValid = cpfValid && cnpjValid;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Dados Pessoais</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium">{data.full_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium">{data.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Telefone:</span>
              <p className="font-medium">{data.phone}</p>
            </div>
            {data.cpf && (
              <div>
                <span className="text-muted-foreground">CPF:</span>
                <p className="font-medium">{data.cpf}</p>
              </div>
            )}
            {data.cnpj && (
              <div>
                <span className="text-muted-foreground">CNPJ:</span>
                <p className="font-medium">{data.cnpj}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Endereço</h3>
          <div className="text-sm space-y-1">
            <p>{data.address}</p>
            <p>{data.city} - {data.state}</p>
            <p>CEP: {data.zip_code}</p>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Documentos Enviados</h3>
          <div className="space-y-2">
            {documents
              .filter(doc => doc.url)
              .map(doc => (
                <div key={doc.type} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{doc.label}</span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {!documentsValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!cpfValid && <p>CPF inválido. Por favor, verifique o número informado.</p>}
            {!cnpjValid && <p>CNPJ inválido. Por favor, verifique o número informado.</p>}
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-4 border-primary">
        <div className="flex items-start gap-3">
          <Checkbox
            id="confirm"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked as boolean)}
          />
          <label
            htmlFor="confirm"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Declaro que todas as informações fornecidas são verdadeiras e estou
            ciente de que a prestação de informações falsas pode resultar em
            medidas legais.
          </label>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          ← Voltar
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!confirmed || !documentsValid || isSubmitting}
        >
          {isSubmitting ? "Finalizando..." : "Finalizar Cadastro"}
        </Button>
      </div>
    </div>
  );
}
