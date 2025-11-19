import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contratos PJ</h1>
        <p className="text-muted-foreground mt-1">Gestão de contratos com prestadores de serviço</p>
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
