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
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  aquisitivo: "secondary",
  pendente: "default",
  aprovado_gestor: "default",
  aprovado_rh: "default",
  aprovado_diretoria: "default",
  agendado: "default",
  em_ferias: "default",
  concluido: "secondary",
  vencido: "destructive",
} as const;

const statusLabels = {
  aquisitivo: "Aquisitivo",
  pendente: "Pendente",
  aprovado_gestor: "Aprovado Gestor",
  aprovado_rh: "Aprovado RH",
  aprovado_diretoria: "Aprovado Diretoria",
  agendado: "Agendado",
  em_ferias: "Em Férias",
  concluido: "Concluído",
  vencido: "Vencido",
};

export default function Vacations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [acquisitionStart, setAcquisitionStart] = useState("");
  const [acquisitionEnd, setAcquisitionEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vacationType, setVacationType] = useState("integral");
  const [vacationDays, setVacationDays] = useState(30);

  const { data: vacations, isLoading } = useQuery({
    queryKey: ["vacations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vacations")
        .select(`
          *,
          employee:employees(full_name, contract_type)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees-clt"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name")
        .eq("contract_type", "CLT")
        .eq("status", "Ativo")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vacations").insert([{
        employee_id: employeeId,
        acquisition_period_start: acquisitionStart,
        acquisition_period_end: acquisitionEnd,
        start_date: startDate,
        end_date: endDate,
        vacation_type: vacationType,
        vacation_days: vacationDays,
        days_remaining: vacationDays,
        status: "pendente",
        request_date: new Date().toISOString(),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacations"] });
      toast({ title: "Férias solicitadas com sucesso" });
      setOpen(false);
      setEmployeeId("");
      setAcquisitionStart("");
      setAcquisitionEnd("");
      setStartDate("");
      setEndDate("");
      setVacationType("integral");
      setVacationDays(30);
    },
    onError: (error) => {
      toast({
        title: "Erro ao solicitar férias",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Férias</h1>
          <p className="text-muted-foreground mt-1">Gestão de férias dos colaboradores CLT</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Solicitar Férias
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Solicitar Férias</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Funcionário *</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Férias</Label>
                  <Select value={vacationType} onValueChange={setVacationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="integral">Integral (30 dias)</SelectItem>
                      <SelectItem value="fracionada">Fracionada</SelectItem>
                      <SelectItem value="abono">Abono Pecuniário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período Aquisitivo - Início *</Label>
                  <Input
                    type="date"
                    value={acquisitionStart}
                    onChange={(e) => setAcquisitionStart(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Período Aquisitivo - Fim *</Label>
                  <Input
                    type="date"
                    value={acquisitionEnd}
                    onChange={(e) => setAcquisitionEnd(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Início das Férias *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Fim das Férias *</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dias de Férias</Label>
                  <Input
                    type="number"
                    value={vacationDays}
                    onChange={(e) => setVacationDays(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Solicitar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Períodos de Férias
          </CardTitle>
          <CardDescription>
            {vacations?.length || 0} período(s) de férias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : vacations && vacations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Período Aquisitivo</TableHead>
                  <TableHead>Dias Disponíveis</TableHead>
                  <TableHead>Período de Férias</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vacations.map((vacation: any) => (
                  <TableRow key={vacation.id}>
                    <TableCell className="font-medium">
                      {vacation.employee?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      {vacation.acquisition_period_start && vacation.acquisition_period_end
                        ? `${format(new Date(vacation.acquisition_period_start), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(vacation.acquisition_period_end), "dd/MM/yyyy", { locale: ptBR })}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {vacation.days_remaining || 0} de {vacation.vacation_days || 30} dias
                    </TableCell>
                    <TableCell>
                      {vacation.start_date && vacation.end_date
                        ? `${format(new Date(vacation.start_date), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(vacation.end_date), "dd/MM/yyyy", { locale: ptBR })}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[vacation.status as keyof typeof statusColors] || "secondary"}>
                        {statusLabels[vacation.status as keyof typeof statusLabels] || vacation.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum período de férias cadastrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
