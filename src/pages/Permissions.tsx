import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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

const formSchema = z.object({
  user_id: z.string().min(1, "Selecione um usuário"),
  role: z.enum(["diretoria", "rh_matriz", "rh_filial", "gestor", "colaborador_clt", "prestador_pj"]),
  unit_id: z.string().optional(),
  department_id: z.string().optional(),
});

export default function Permissions() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees_for_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, email, user_id")
        .eq("status", "Ativo")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: units } = useQuery({
    queryKey: ["units_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

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

  const createRole = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert([values as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Permissão atribuída com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao atribuir permissão");
      console.error(error);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createRole.mutate(values);
  };

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
