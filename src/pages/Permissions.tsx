import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

const roleLabels = {
  diretoria: "Diretoria",
  rh_matriz: "RH Matriz",
  rh_filial: "RH Filial",
  gestor: "Gestor",
  colaborador_clt: "Colaborador CLT",
  prestador_pj: "Prestador PJ",
};

const roleColors = {
  diretoria: "destructive",
  rh_matriz: "default",
  rh_filial: "default",
  gestor: "default",
  colaborador_clt: "secondary",
  prestador_pj: "secondary",
} as const;

export default function Permissions() {
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ["user_roles_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          *,
          unit:units(name),
          department:departments(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Permissões</h1>
        <p className="text-muted-foreground mt-1">Gerenciamento de perfis e acessos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Perfis de Usuário
          </CardTitle>
          <CardDescription>
            {userRoles?.length || 0} perfil(is) configurado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : userRoles && userRoles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário ID</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Departamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((userRole: any) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-mono text-sm">
                      {userRole.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleColors[userRole.role as keyof typeof roleColors] || "secondary"}>
                        {roleLabels[userRole.role as keyof typeof roleLabels] || userRole.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userRole.unit?.name || "Todas"}
                    </TableCell>
                    <TableCell>
                      {userRole.department?.name || "Todos"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum perfil configurado
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hierarquia de Perfis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="destructive">Diretoria</Badge>
              <span className="text-sm text-muted-foreground">Acesso total ao sistema</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="default">RH Matriz</Badge>
              <span className="text-sm text-muted-foreground">Acesso a todas as filiais</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="default">RH Filial</Badge>
              <span className="text-sm text-muted-foreground">Acesso restrito à sua filial</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="default">Gestor</Badge>
              <span className="text-sm text-muted-foreground">Acesso ao seu departamento</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="secondary">Colaborador CLT</Badge>
              <span className="text-sm text-muted-foreground">Acesso aos próprios dados</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="secondary">Prestador PJ</Badge>
              <span className="text-sm text-muted-foreground">Acesso aos próprios dados e contratos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
