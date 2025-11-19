import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";

export default function Timesheets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [lunchStart, setLunchStart] = useState("");
  const [lunchEnd, setLunchEnd] = useState("");
  const [status, setStatus] = useState("Presente");

  const { data: timesheets, isLoading } = useQuery({
    queryKey: ["timesheets", selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("timesheets")
        .select(`
          *,
          employee:employees(full_name, contract_type)
        `)
        .eq("date", dateStr)
        .order("check_in", { ascending: true });

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
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { error } = await supabase.from("timesheets").insert([{
        employee_id: employeeId,
        date: dateStr,
        check_in: checkIn,
        check_out: checkOut,
        lunch_start: lunchStart,
        lunch_end: lunchEnd,
        status: status,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast({ title: "Ponto registrado com sucesso" });
      setOpen(false);
      setEmployeeId("");
      setCheckIn("");
      setCheckOut("");
      setLunchStart("");
      setLunchEnd("");
      setStatus("Presente");
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar ponto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Presente: "bg-success text-success-foreground",
      Falta: "bg-destructive text-destructive-foreground",
      Atestado: "bg-warning text-warning-foreground",
      Férias: "bg-info text-info-foreground",
      Feriado: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ponto / Frequência</h1>
        <p className="text-muted-foreground">Gerencie o controle de ponto dos funcionários</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Selecione a Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Timesheets Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Registros de {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Clock className="h-4 w-4" />
                    Registrar Ponto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Ponto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
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

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Entrada *</Label>
                        <Input
                          type="time"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Saída</Label>
                        <Input
                          type="time"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Início Almoço</Label>
                        <Input
                          type="time"
                          value={lunchStart}
                          onChange={(e) => setLunchStart(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Fim Almoço</Label>
                        <Input
                          type="time"
                          value={lunchEnd}
                          onChange={(e) => setLunchEnd(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Presente">Presente</SelectItem>
                            <SelectItem value="Falta">Falta</SelectItem>
                            <SelectItem value="Atestado">Atestado</SelectItem>
                            <SelectItem value="Férias">Férias</SelectItem>
                            <SelectItem value="Feriado">Feriado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Salvando..." : "Registrar"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : timesheets && timesheets.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell className="font-medium">
                          {timesheet.employee?.full_name}
                        </TableCell>
                        <TableCell>{timesheet.check_in || "-"}</TableCell>
                        <TableCell>{timesheet.check_out || "-"}</TableCell>
                        <TableCell>
                          {timesheet.hours_worked ? `${timesheet.hours_worked}h` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(timesheet.status)}>
                            {timesheet.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum registro encontrado para esta data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
