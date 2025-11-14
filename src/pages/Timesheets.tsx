import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
              <Button className="gap-2">
                <Clock className="h-4 w-4" />
                Registrar Ponto
              </Button>
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
