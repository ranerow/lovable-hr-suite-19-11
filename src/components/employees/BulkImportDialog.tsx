import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadTemplate } from "@/utils/excelTemplateGenerator";
import { parseExcelFile, validateExcelData, ValidationResult } from "@/utils/excelValidator";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BulkImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error("Por favor, envie um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setFile(selectedFile);
    setValidationResult(null);
    
    // Validar automaticamente
    await validateFile(selectedFile);
  };

  const validateFile = async (file: File) => {
    setIsValidating(true);
    try {
      toast.info("Validando dados...");
      const rows = await parseExcelFile(file);
      
      if (rows.length === 0) {
        toast.error("Nenhum dado encontrado no arquivo");
        setValidationResult(null);
        return;
      }

      const result = await validateExcelData(rows);
      setValidationResult(result);
      
      if (result.errors.length === 0) {
        toast.success(`✅ ${result.valid.length} registros válidos prontos para importação`);
      } else {
        toast.error(`❌ ${result.errors.length} erros encontrados. Corrija-os antes de importar.`);
      }
    } catch (error: any) {
      toast.error(`Erro ao processar arquivo: ${error.message}`);
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) {
      toast.error("Nenhum registro válido para importar");
      return;
    }

    setIsImporting(true);
    try {
      // Inserir em lotes de 50
      const batchSize = 50;
      let imported = 0;
      
      for (let i = 0; i < validationResult.valid.length; i += batchSize) {
        const batch = validationResult.valid.slice(i, i + batchSize);
        const dataToInsert = batch.map(item => item.data);
        
        const { error } = await supabase
          .from('employees')
          .insert(dataToInsert);
        
        if (error) throw error;
        
        imported += batch.length;
        toast.info(`Importados ${imported} de ${validationResult.valid.length}...`);
      }
      
      toast.success(`✅ ${imported} funcionários importados com sucesso!`);
      setOpen(false);
      setFile(null);
      setValidationResult(null);
      
      // Recarregar página
      window.location.reload();
    } catch (error: any) {
      toast.error(`Erro ao importar: ${error.message}`);
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Importar em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📊 Importação em Massa de Funcionários</DialogTitle>
          <DialogDescription>
            Importe múltiplos funcionários de uma vez usando uma planilha Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Download Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                Baixar Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Baixe o template Excel com todos os campos necessários e instruções de preenchimento.
              </p>
              <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download Template.xlsx
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Upload File */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                Fazer Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Após preencher o template, faça o upload do arquivo aqui.
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isValidating || isImporting}
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Validation Results */}
          {isValidating && (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Validando dados...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {validationResult && !isValidating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                  Resultados da Validação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-sm font-medium">
                      {validationResult.valid.length} registros válidos
                    </span>
                  </div>
                  {validationResult.errors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        {validationResult.errors.length} erros encontrados
                      </span>
                    </div>
                  )}
                </div>

                {validationResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Corrija os erros abaixo antes de prosseguir com a importação.
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.errors.length > 0 && (
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Linha</TableHead>
                          <TableHead>Campo</TableHead>
                          <TableHead>Erro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.errors.map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{error.row}</TableCell>
                            <TableCell className="font-medium">{error.field}</TableCell>
                            <TableCell className="text-destructive text-sm">{error.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {validationResult.valid.length > 0 && validationResult.errors.length === 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Todos os registros foram validados com sucesso! Clique em "Importar" para adicionar os funcionários ao sistema.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Import Button */}
          {validationResult && validationResult.valid.length > 0 && validationResult.errors.length === 0 && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setValidationResult(null);
                }}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar {validationResult.valid.length} Funcionários
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
