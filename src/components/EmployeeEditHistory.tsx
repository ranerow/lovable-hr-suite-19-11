import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmployeeEditHistoryProps {
  employeeId: string;
}

export const EmployeeEditHistory = ({ employeeId }: EmployeeEditHistoryProps) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ["employee-edit-history", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_edit_history")
        .select("*")
        .eq("employee_id", employeeId)
        .order("edited_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando histórico...</div>;
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Nenhuma alteração registrada ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const isCriticalChange = (fields: any) => {
    return fields.status || fields.salary || fields.monthly_value || fields.role_id;
  };

  return (
    <div className="space-y-4">
      {history.map((entry) => {
        const fields = entry.changed_fields as Record<string, { old: any; new: any }>;
        const critical = isCriticalChange(fields);

        return (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">
                    {formatDistanceToNow(new Date(entry.edited_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </CardTitle>
                </div>
                {critical && (
                  <Badge variant="destructive" className="text-xs">
                    Alteração Crítica
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(fields).map(([fieldName, values]) => (
                  <div key={fieldName} className="flex items-center gap-2 text-sm">
                    <span className="font-medium capitalize">{fieldName.replace(/_/g, " ")}:</span>
                    <Badge variant="outline" className="text-xs">
                      {String(values.old) || "—"}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="default" className="text-xs">
                      {String(values.new) || "—"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
