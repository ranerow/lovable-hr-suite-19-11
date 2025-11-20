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
import { Shield, Plus, Trash2, AlertTriangle, Search, Filter, Info, Crown, Users, Building, Briefcase, Edit, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);
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

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: "",
      role: undefined,
      unit_id: "",
      department_id: "",
    },
  });

  const selectedEditRole = editForm.watch("role");

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

  const updateRole = useMutation({
    mutationFn: async (values: { id: string; role: "diretoria" | "rh_matriz" | "rh_filial" | "gestor" | "colaborador_clt" | "prestador_pj"; unit_id?: string; department_id?: string }) => {
      const { id, ...updateData } = values;
      
      // Se mudou para rh_matriz, limpar unit_id
      if (updateData.role === "rh_matriz") {
        updateData.unit_id = undefined;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles_admin"] });
      toast.success("Nível de usuário atualizado com sucesso!");
      setEditDialogOpen(false);
      setConfirmDialogOpen(false);
      setEditingRole(null);
      setPendingUpdate(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar nível");
      console.error(error);
    },
  });

  const handleEditRole = (role: any) => {
    // Validação: não pode editar diretoria
    if (role.role === "diretoria") {
      toast.error("A role Diretoria não pode ser editada");
      return;
    }

    // Validação: não pode editar a si mesmo
    if (role.user_email === currentUserEmail) {
      toast.error("Você não pode editar suas próprias permissões");
      return;
    }

    setEditingRole(role);
    editForm.reset({
      user_id: role.user_id,
      role: role.role,
      unit_id: role.unit_id || "",
      department_id: role.department_id || "",
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = (values: z.infer<typeof formSchema>) => {
    // Validação: rh_filial deve ter unit_id
    if (values.role === "rh_filial" && !values.unit_id) {
      toast.error("RH Filial deve ter uma unidade vinculada");
      return;
    }

    // Preparar dados para confirmação
    setPendingUpdate({
      id: editingRole.id,
      role: values.role,
      unit_id: values.unit_id || undefined,
      department_id: values.department_id || undefined,
      previousRole: editingRole.role,
    });
    setConfirmDialogOpen(true);
  };

  const confirmUpdate = () => {
    if (pendingUpdate) {
      updateRole.mutate(pendingUpdate);
    }
  };

  // Filtrar usuários
  const filteredRoles = userRoles?.filter((role: any) => {
    const matchesSearch = 
      role.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || role.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Estatísticas
  const stats = {
    total: userRoles?.length || 0,
    diretoria: userRoles?.filter((r: any) => r.role === "diretoria").length || 0,
    rh_matriz: userRoles?.filter((r: any) => r.role === "rh_matriz").length || 0,
    rh_filial: userRoles?.filter((r: any) => r.role === "rh_filial").length || 0,
    gestor: userRoles?.filter((r: any) => r.role === "gestor").length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground mt-1">
          Configure permissões hierárquicas e controle de acesso ao sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">usuários ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4 text-destructive" />
              Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.diretoria}</div>
            <p className="text-xs text-muted-foreground">master</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              RH Matriz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rh_matriz}</div>
            <p className="text-xs text-muted-foreground">nível 1</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-500" />
              RH Filial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rh_filial}</div>
            <p className="text-xs text-muted-foreground">nível 2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-500" />
              Gestores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gestor}</div>
            <p className="text-xs text-muted-foreground">nível 3</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Usuários com Permissões
              </CardTitle>
              <CardDescription className="mt-1">
                {filteredRoles?.length || 0} de {userRoles?.length || 0} usuário(s)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os perfis</SelectItem>
                  <SelectItem value="diretoria">Diretoria</SelectItem>
                  <SelectItem value="rh_matriz">RH Matriz</SelectItem>
                  <SelectItem value="rh_filial">RH Filial</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="colaborador_clt">Colaborador CLT</SelectItem>
                  <SelectItem value="prestador_pj">Prestador PJ</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredRoles && filteredRoles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((userRole: any) => (
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
                      <div className="flex items-center justify-end gap-1">
                        {userRole.role !== "diretoria" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRole(userRole)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRole(userRole.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : searchTerm || roleFilter !== "all" ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum resultado encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum perfil configurado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hierarquia Visual de Perfis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Hierarquia de Perfis e Permissões
          </CardTitle>
          <CardDescription>
            Entenda os níveis de acesso e suas responsabilidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nível 0 - Master */}
          <div className="border-l-4 border-destructive pl-4 py-3 bg-destructive/5 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">MASTER - Admin do Sistema</h4>
                  <Badge variant="destructive">Nível 0</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Role: <code className="bg-muted px-1 rounded">diretoria</code> • Apenas ti@isssl.com.br
                </p>
                <div className="text-sm space-y-1">
                  <p className="text-green-600">✓ Acesso total e irrestrito ao sistema</p>
                  <p className="text-green-600">✓ Único que pode gerenciar permissões de usuários</p>
                  <p className="text-green-600">✓ Configurações críticas do sistema</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nível 1 - RH Matriz */}
          <div className="border-l-4 border-primary pl-4 py-3 bg-primary/5 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">Gerente/Supervisor de RH</h4>
                  <Badge>Nível 1</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Role: <code className="bg-muted px-1 rounded">rh_matriz</code> • Acesso geral (todas filiais)
                </p>
                <div className="text-sm space-y-1">
                  <p className="text-green-600">✓ Visualizar e gerenciar todas as filiais</p>
                  <p className="text-green-600">✓ CRUD completo de funcionários CLT e PJ</p>
                  <p className="text-green-600">✓ Aprovar férias, contratos, documentos</p>
                  <p className="text-green-600">✓ Relatórios financeiros consolidados</p>
                  <p className="text-red-600">✗ Não pode alterar permissões de sistema</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nível 2 - RH Filial */}
          <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-500/5 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">Assistente/Analista de RH</h4>
                  <Badge variant="secondary">Nível 2</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Role: <code className="bg-muted px-1 rounded">rh_filial</code> • Vinculado a uma unidade específica
                </p>
                <div className="text-sm space-y-1">
                  <p className="text-green-600">✓ Visualizar apenas funcionários da filial vinculada</p>
                  <p className="text-green-600">✓ Cadastrar e editar funcionários da filial</p>
                  <p className="text-green-600">✓ Registrar documentos, ponto, benefícios</p>
                  <p className="text-red-600">✗ Não aprova férias (apenas solicita)</p>
                  <p className="text-red-600">✗ Sem acesso a outras filiais</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nível 3 - Gestor */}
          <div className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-500/5 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">Gestor de Departamento</h4>
                  <Badge variant="outline">Nível 3</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Role: <code className="bg-muted px-1 rounded">gestor</code> • Pode ter unidade e/ou departamento
                </p>
                <div className="text-sm space-y-1">
                  <p className="text-green-600">✓ Visualizar equipe do departamento</p>
                  <p className="text-green-600">✓ Aprovar ponto e jornadas de trabalho</p>
                  <p className="text-green-600">✓ Primeira aprovação de férias</p>
                  <p className="text-red-600">✗ Não cadastra/edita funcionários</p>
                  <p className="text-red-600">✗ Sem acesso financeiro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Regras de Segurança:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• RH Filial DEVE ter uma unidade vinculada</li>
                  <li>• Gestor pode ter unidade e/ou departamento opcionais</li>
                  <li>• Não é possível atribuir permissões a si mesmo</li>
                  <li>• A role Diretoria é protegida e só pode ser do ti@isssl.com.br</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Nível de Usuário</DialogTitle>
            <DialogDescription>
              Altere o nível de acesso do usuário {editingRole?.user_name}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Usuário</p>
                <p className="text-sm text-muted-foreground">{editingRole?.user_name}</p>
                <p className="text-xs text-muted-foreground">{editingRole?.user_email}</p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-2">
                <Badge variant={roleColors[editingRole?.role as keyof typeof roleColors] || "secondary"}>
                  {roleLabels[editingRole?.role as keyof typeof roleLabels]}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant={roleColors[selectedEditRole as keyof typeof roleColors] || "secondary"}>
                  {roleLabels[selectedEditRole as keyof typeof roleLabels] || "Selecione"}
                </Badge>
              </div>

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Nível</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o novo nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rh_matriz">RH Matriz (Nível 1)</SelectItem>
                        <SelectItem value="rh_filial">RH Filial (Nível 2)</SelectItem>
                        <SelectItem value="gestor">Gestor (Nível 3)</SelectItem>
                        <SelectItem value="colaborador_clt">Colaborador CLT</SelectItem>
                        <SelectItem value="prestador_pj">Prestador PJ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(selectedEditRole === "rh_filial" || selectedEditRole === "gestor") && (
                <FormField
                  control={editForm.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Unidade {selectedEditRole === "rh_filial" ? "(Obrigatório)" : "(Opcional)"}
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

              {selectedEditRole === "gestor" && (
                <FormField
                  control={editForm.control}
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateRole.isPending}>
                  Continuar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Mudança de Nível</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Você está alterando o nível de acesso de:</p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium">{editingRole?.user_name}</p>
                  <p className="text-sm text-muted-foreground">{editingRole?.user_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={roleColors[pendingUpdate?.previousRole as keyof typeof roleColors] || "secondary"}>
                    {roleLabels[pendingUpdate?.previousRole as keyof typeof roleLabels]}
                  </Badge>
                  <ArrowRight className="h-4 w-4" />
                  <Badge variant={roleColors[pendingUpdate?.role as keyof typeof roleColors] || "secondary"}>
                    {roleLabels[pendingUpdate?.role as keyof typeof roleLabels]}
                  </Badge>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Impacto da Mudança:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    {pendingUpdate?.role === "rh_matriz" && (
                      <>
                        <li>• Terá acesso a todas as filiais</li>
                        <li>• Poderá aprovar férias e contratos</li>
                      </>
                    )}
                    {pendingUpdate?.role === "rh_filial" && (
                      <>
                        <li>• Acesso restrito à filial vinculada</li>
                        <li>• Pode cadastrar funcionários da filial</li>
                      </>
                    )}
                    {pendingUpdate?.role === "gestor" && (
                      <>
                        <li>• Acesso ao departamento vinculado</li>
                        <li>• Pode aprovar ponto e férias (1º nível)</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate} disabled={updateRole.isPending}>
              {updateRole.isPending ? "Atualizando..." : "Confirmar Mudança"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
