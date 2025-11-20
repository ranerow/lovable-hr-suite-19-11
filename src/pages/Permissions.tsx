import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: "",
      role: undefined,
      unit_id: "",
      department_id: "",
    },
  });

  const selectedRole = form.watch("role");

  // Buscar usuários do sistema de autenticação
  const { data: authUsers } = useQuery({
    queryKey: ["auth_users"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      // Buscar usuário atual
      const currentUser = data.session?.user;
      if (currentUser) {
        setCurrentUserEmail(currentUser.email || "");
      }

      // Buscar todos os employees que têm user_id (estão vinculados a contas)
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("user_id, email, full_name")
        .not("user_id", "is", null)
        .order("full_name");
      
      if (empError) throw empError;
      return employees;
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
      
      // Enriquecer com dados dos usuários
      const enrichedRoles = await Promise.all(
        data.map(async (role) => {
          const { data: employee } = await supabase
            .from("employees")
            .select("email, full_name")
            .eq("user_id", role.user_id)
            .single();
          
          return {
            ...role,
            user_email: employee?.email || "Não encontrado",
            user_name: employee?.full_name || "Não encontrado",
          };
        })
      );
      
      return enrichedRoles;
    },
  });

  const createRole = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Validação: apenas ti@isssl.com.br pode atribuir role diretoria
      if (values.role === "diretoria" && currentUserEmail !== "ti@isssl.com.br") {
        throw new Error("Apenas o administrador do sistema pode atribuir a role Diretoria");
      }

      // Validação: não pode atribuir permissão a si mesmo
      const selectedUser = authUsers?.find(u => u.user_id === values.user_id);
      if (selectedUser?.email === currentUserEmail) {
        throw new Error("Você não pode atribuir permissões a si mesmo");
      }

      const { data, error } = await supabase
        .from("user_roles")
        .insert([values as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles_admin"] });
      toast.success("Permissão atribuída com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atribuir permissão");
      console.error(error);
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles_admin"] });
      toast.success("Permissão removida com sucesso!");
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    },
    onError: (error) => {
      toast.error("Erro ao remover permissão");
      console.error(error);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Validação extra para role diretoria
    if (values.role === "diretoria") {
      const selectedUser = authUsers?.find(u => u.user_id === values.user_id);
      if (selectedUser?.email !== "ti@isssl.com.br") {
        toast.error("A role Diretoria só pode ser atribuída a ti@isssl.com.br");
        return;
      }
    }

    createRole.mutate(values);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoleToDelete(roleId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      deleteRole.mutate(roleToDelete);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Permissões</h1>
        <p className="text-muted-foreground mt-1">Gerenciamento de perfis e acessos</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Perfis de Usuário
            </CardTitle>
            <CardDescription>
              {userRoles?.length || 0} perfil(is) configurado(s)
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Permissão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Atribuir Permissão</DialogTitle>
                <DialogDescription>
                  Selecione o usuário e a permissão que deseja atribuir
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um usuário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {authUsers?.map((user) => (
                              <SelectItem key={user.user_id} value={user.user_id || ""}>
                                {user.full_name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perfil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um perfil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="diretoria">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-xs">Diretoria</Badge>
                                <span className="text-xs text-muted-foreground">
                                  (Somente ti@isssl.com.br)
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rh_matriz">RH Matriz</SelectItem>
                            <SelectItem value="rh_filial">RH Filial</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="colaborador_clt">Colaborador CLT</SelectItem>
                            <SelectItem value="prestador_pj">Prestador PJ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(selectedRole === "rh_filial" || selectedRole === "gestor") && (
                    <FormField
                      control={form.control}
                      name="unit_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Unidade {selectedRole === "rh_filial" ? "(Obrigatório)" : "(Opcional)"}
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {units?.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedRole === "gestor" && (
                    <FormField
                      control={form.control}
                      name="department_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento (Opcional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um departamento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments?.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedRole === "diretoria" && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-destructive">Atenção!</p>
                        <p className="text-muted-foreground">
                          A role Diretoria concede acesso total ao sistema e só pode ser atribuída ao administrador (ti@isssl.com.br).
                        </p>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createRole.isPending}>
                      {createRole.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : userRoles && userRoles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((userRole: any) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-medium">
                      {userRole.user_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {userRole.user_email}
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
                    <TableCell>
                      {userRole.role !== "diretoria" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRole(userRole.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta permissão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
