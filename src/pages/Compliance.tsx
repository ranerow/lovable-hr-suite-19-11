import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionTypeLabels = {
  advertencia_verbal: "Advertência Verbal",
  advertencia_escrita: "Advertência Escrita",
  suspensao: "Suspensão",
  notificacao_contratual: "Notificação Contratual",
};

const severityColors = {
  leve: "secondary",
  media: "default",
  grave: "default",
  gravissima: "destructive",
} as const;

const severityLabels = {
  leve: "Leve",
  media: "Média",
  grave: "Grave",
  gravissima: "Gravíssima",
};

export default function Compliance() {
  const { data: actions, isLoading } = useQuery({
    queryKey: ["disciplinary_actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disciplinary_actions")
        .select(`
          *,
          employee:employees(full_name, contract_type)
        `)
        .order("action_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Advertências & Compliance</h1>
        <p className="text-muted-foreground mt-1">Gestão de processos disciplinares</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Processos Disciplinares
          </CardTitle>
          <CardDescription>
            {actions?.length || 0} registro(s) de ações disciplinares
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : actions && actions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Reconhecimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action: any) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium">
                      {action.employee?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {actionTypeLabels[action.action_type as keyof typeof actionTypeLabels] || action.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {action.action_date
                        ? format(new Date(action.action_date), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {action.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityColors[action.severity as keyof typeof severityColors] || "secondary"}>
                        {severityLabels[action.severity as keyof typeof severityLabels] || action.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={action.employee_acknowledgment ? "default" : "secondary"}>
                        {action.employee_acknowledgment ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum processo disciplinar registrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
