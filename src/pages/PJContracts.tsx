import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  ativo: "default",
  a_vencer: "default",
  vencido: "destructive",
  renovado: "secondary",
  encerrado: "secondary",
} as const;

const statusLabels = {
  ativo: "Ativo",
  a_vencer: "A Vencer",
  vencido: "Vencido",
  renovado: "Renovado",
  encerrado: "Encerrado",
};

export default function PJContracts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [serviceScope, setServiceScope] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoRenewal, setAutoRenewal] = useState(false);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["pj_contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pj_contracts")
        .select(`
          *,
          employee:employees(full_name, cnpj, company_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: employeesPJ } = useQuery({
    queryKey: ["employees-pj"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, company_name")
        .eq("contract_type", "PJ")
        .eq("status", "Ativo")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pj_contracts").insert([{
        employee_id: employeeId,
        contract_number: contractNumber,
        service_scope: serviceScope,
        monthly_value: parseFloat(monthlyValue),
        start_date: startDate,
        end_date: endDate,
        auto_renewal: autoRenewal,
        status: "ativo",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pj_contracts"] });
      toast({ title: "Contrato criado com sucesso" });
      setOpen(false);
      setEmployeeId("");
      setContractNumber("");
      setServiceScope("");
      setMonthlyValue("");
      setStartDate("");
      setEndDate("");
      setAutoRenewal(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar contrato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contratos PJ</h1>
          <p className="text-muted-foreground mt-1">Gestão de contratos com prestadores de serviço</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Contrato PJ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prestador *</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeesPJ?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} - {emp.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número do Contrato *</Label>
                  <Input
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="Ex: PJ-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Mensal (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={monthlyValue}
                    onChange={(e) => setMonthlyValue(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Início *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Fim *</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Escopo do Serviço *</Label>
                  <Textarea
                    value={serviceScope}
                    onChange={(e) => setServiceScope(e.target.value)}
                    placeholder="Descreva as atividades e responsabilidades..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRenewal"
                    checked={autoRenewal}
                    onChange={(e) => setAutoRenewal(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="autoRenewal" className="cursor-pointer">
                    Renovação Automática
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Criar Contrato"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contratos Ativos
          </CardTitle>
          <CardDescription>
            {contracts?.length || 0} contrato(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : contracts && contracts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Nº Contrato</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{contract.employee?.full_name || "-"}</div>
                        <div className="text-sm text-muted-foreground">
                          {contract.employee?.company_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{contract.contract_number}</TableCell>
                    <TableCell>
                      {contract.start_date && contract.end_date
                        ? `${format(new Date(contract.start_date), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(contract.end_date), "dd/MM/yyyy", { locale: ptBR })}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      R$ {contract.monthly_value?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[contract.status as keyof typeof statusColors] || "secondary"}>
                        {statusLabels[contract.status as keyof typeof statusLabels] || contract.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum contrato PJ cadastrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
