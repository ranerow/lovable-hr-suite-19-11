import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Férias</h1>
        <p className="text-muted-foreground mt-1">Gestão de férias dos colaboradores CLT</p>
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
