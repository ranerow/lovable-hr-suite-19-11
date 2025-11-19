import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, ArrowRight } from "lucide-react";

interface StatusHistoryProps {
  employeeId: string;
}

interface HistoryItem {
  id: string;
  employee_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  reason: string | null;
  notes: string | null;
  created_at: string | null;
}

export default function StatusHistory({ employeeId }: StatusHistoryProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["status-history", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_status_history")
        .select("*")
        .eq("employee_id", employeeId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data as HistoryItem[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Inativo":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Aguardando Ativação":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Férias":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Afastado":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Demitido":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum histórico de mudança de status registrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.previous_status && (
                    <>
                      <Badge variant="outline" className={getStatusColor(item.previous_status)}>
                        {item.previous_status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                  <Badge className={getStatusColor(item.new_status)}>
                    {item.new_status}
                  </Badge>
                </div>

                {item.reason && (
                  <p className="text-sm font-medium text-foreground">{item.reason}</p>
                )}

                {item.notes && (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(item.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {item.changed_by && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Alterado por usuário do sistema
                    </div>
                  )}
                  {!item.changed_by && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Sistema automático
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
