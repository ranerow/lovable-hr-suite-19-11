import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import { FileText, Users, Briefcase } from "lucide-react";

export default function Documents() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const { data: employees } = useQuery({
    queryKey: ["all-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, contract_type, status")
        .eq("status", "Ativo")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const selectedEmployeeData = employees?.find((emp) => emp.id === selectedEmployee);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão de Documentos</h1>
        <p className="text-muted-foreground">
          Upload e gerenciamento de documentos dos colaboradores e prestadores
        </p>
      </div>

      {/* Seleção de Funcionário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="employee-select">Funcionário *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee-select">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.contract_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Área de Upload e Listagem */}
      {selectedEmployee && (
        <Tabs defaultValue="employee-documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employee-documents">
              <FileText className="h-4 w-4 mr-2" />
              Documentos Pessoais
            </TabsTrigger>
            {selectedEmployeeData?.contract_type === "CLT" && (
              <TabsTrigger value="contracts">
                <FileText className="h-4 w-4 mr-2" />
                Contratos CLT
              </TabsTrigger>
            )}
            {selectedEmployeeData?.contract_type === "PJ" && (
              <>
                <TabsTrigger value="pj-certifications">
                  <FileText className="h-4 w-4 mr-2" />
                  Certidões PJ
                </TabsTrigger>
                <TabsTrigger value="pj-invoices">
                  <FileText className="h-4 w-4 mr-2" />
                  Notas Fiscais
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Documentos Pessoais */}
          <TabsContent value="employee-documents" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <DocumentUpload
                employeeId={selectedEmployee}
                bucketName="employee-documents"
                onUploadSuccess={() => {}}
              />
              <DocumentList
                employeeId={selectedEmployee}
                bucketName="employee-documents"
                title="Documentos Pessoais"
              />
            </div>
          </TabsContent>

          {/* Contratos CLT */}
          {selectedEmployeeData?.contract_type === "CLT" && (
            <TabsContent value="contracts" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
                <DocumentUpload
                  employeeId={selectedEmployee}
                  bucketName="contracts"
                  onUploadSuccess={() => {}}
                />
                <DocumentList
                  employeeId={selectedEmployee}
                  bucketName="contracts"
                  title="Contratos CLT"
                />
              </div>
            </TabsContent>
          )}

          {/* Certidões PJ */}
          {selectedEmployeeData?.contract_type === "PJ" && (
            <>
              <TabsContent value="pj-certifications" className="space-y-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  <DocumentUpload
                    employeeId={selectedEmployee}
                    bucketName="pj-certifications"
                    onUploadSuccess={() => {}}
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Certidões PJ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Após fazer o upload da certidão, complete os dados de emissão e validade
                        na tela de Contratos PJ.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="pj-invoices" className="space-y-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  <DocumentUpload
                    employeeId={selectedEmployee}
                    bucketName="pj-invoices"
                    onUploadSuccess={() => {}}
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Notas Fiscais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Após fazer o upload da nota fiscal, complete os dados de valor e período
                        na tela de Contratos PJ.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      )}

      {!selectedEmployee && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Selecione um funcionário para gerenciar seus documentos
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
