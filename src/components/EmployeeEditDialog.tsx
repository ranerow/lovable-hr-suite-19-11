import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { ArrowRight, Save } from "lucide-react";

const employeeEditSchema = z.object({
  full_name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  role_id: z.string().optional(),
  department_id: z.string().optional(),
  unit_id: z.string().optional(),
  salary: z.string().optional(),
  monthly_value: z.string().optional(),
  status: z.string(),
});

type EmployeeEditFormValues = z.infer<typeof employeeEditSchema>;

interface EmployeeEditDialogProps {
  employee: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmployeeEditDialog = ({ employee, open, onOpenChange }: EmployeeEditDialogProps) => {
  const { canEditFinancial, canEditStatus } = useUserRole();
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("*").eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("*").eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: {
      full_name: employee.full_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      address: employee.address || "",
      city: employee.city || "",
      state: employee.state || "",
      zip_code: employee.zip_code || "",
      role_id: employee.role_id || "",
      department_id: employee.department_id || "",
      unit_id: employee.unit_id || "",
      salary: employee.salary?.toString() || "",
      monthly_value: employee.monthly_value?.toString() || "",
      status: employee.status || "Ativo",
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (values: EmployeeEditFormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Calcular campos alterados
      const changedFields: Record<string, { old: any; new: any }> = {};
      Object.keys(values).forEach((key) => {
        const oldValue = employee[key];
        const newValue = values[key as keyof EmployeeEditFormValues];
        if (oldValue !== newValue && newValue !== "") {
          changedFields[key] = { old: oldValue, new: newValue };
        }
      });

      // Atualizar employee
      const updateData: any = { ...values };
      if (updateData.salary) updateData.salary = parseFloat(updateData.salary);
      if (updateData.monthly_value) updateData.monthly_value = parseFloat(updateData.monthly_value);

      const { error: updateError } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", employee.id);

      if (updateError) throw updateError;

      // Registrar histórico de edição
      if (Object.keys(changedFields).length > 0) {
        const { error: historyError } = await supabase.from("employee_edit_history").insert({
          employee_id: employee.id,
          edited_by: user.id,
          changed_fields: changedFields,
        });

        if (historyError) console.error("Erro ao registrar histórico:", historyError);
      }

      return changedFields;
    },
    onSuccess: (changedFields) => {
      queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
      queryClient.invalidateQueries({ queryKey: ["employee-edit-history", employee.id] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      
      const changeCount = Object.keys(changedFields).length;
      toast.success(`${changeCount} campo(s) atualizado(s) com sucesso`);
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao atualizar funcionário:", error);
      toast.error("Erro ao atualizar funcionário");
    },
  });

  const onSubmit = (values: EmployeeEditFormValues) => {
    // Verificar se há mudanças críticas
    const criticalChanges: string[] = [];
    
    if (values.status !== employee.status && values.status === "Demitido") {
      criticalChanges.push("Status → Demitido");
    }

    const oldSalary = employee.salary || employee.monthly_value || 0;
    const newSalary = parseFloat(values.salary || values.monthly_value || "0");
    if (newSalary > 0 && oldSalary > 0) {
      const percentChange = Math.abs((newSalary - oldSalary) / oldSalary) * 100;
      if (percentChange > 10) {
        criticalChanges.push(`Salário alterado em ${percentChange.toFixed(1)}%`);
      }
    }

    if (values.role_id !== employee.role_id) {
      criticalChanges.push("Mudança de cargo");
    }

    if (criticalChanges.length > 0) {
      setPendingChanges(values);
      setShowConfirmation(true);
    } else {
      updateEmployeeMutation.mutate(values);
    }
  };

  const confirmCriticalChange = () => {
    updateEmployeeMutation.mutate(pendingChanges as EmployeeEditFormValues);
    setShowConfirmation(false);
    setPendingChanges({});
  };

  const isFieldChanged = (fieldName: keyof EmployeeEditFormValues) => {
    const currentValue = form.watch(fieldName);
    const originalValue = employee[fieldName];
    return currentValue !== originalValue && currentValue !== "";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize as informações do funcionário. Campos com badge "Alterado" serão salvos.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Pessoal</TabsTrigger>
                  <TabsTrigger value="professional">Profissional</TabsTrigger>
                  <TabsTrigger value="financial" disabled={!canEditFinancial()}>
                    Financeiro
                  </TabsTrigger>
                  <TabsTrigger value="status" disabled={!canEditStatus()}>
                    Status
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Nome Completo
                          {isFieldChanged("full_name") && (
                            <Badge variant="secondary" className="text-xs">
                              Alterado
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Email
                          {isFieldChanged("email") && (
                            <Badge variant="secondary" className="text-xs">
                              Alterado
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Telefone
                          {isFieldChanged("phone") && (
                            <Badge variant="secondary" className="text-xs">
                              Alterado
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="professional" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="role_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Cargo
                          {isFieldChanged("role_id") && (
                            <Badge variant="secondary" className="text-xs">
                              Alterado
                            </Badge>
                          )}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cargo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
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
                    name="department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o departamento" />
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

                  <FormField
                    control={form.control}
                    name="unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a unidade" />
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
                </TabsContent>

                <TabsContent value="financial" className="space-y-4 mt-4">
                  {employee.contract_type === "CLT" ? (
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Salário
                            {isFieldChanged("salary") && (
                              <Badge variant="secondary" className="text-xs">
                                Alterado
                              </Badge>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" disabled={!canEditFinancial()} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="monthly_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Valor Mensal
                            {isFieldChanged("monthly_value") && (
                              <Badge variant="secondary" className="text-xs">
                                Alterado
                              </Badge>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" disabled={!canEditFinancial()} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>

                <TabsContent value="status" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Status
                          {isFieldChanged("status") && (
                            <Badge variant="secondary" className="text-xs">
                              Alterado
                            </Badge>
                          )}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Férias">Férias</SelectItem>
                            <SelectItem value="Afastado">Afastado</SelectItem>
                            <SelectItem value="Demitido">Demitido</SelectItem>
                            <SelectItem value="Aguardando Ativação">Aguardando Ativação</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateEmployeeMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alterações Críticas</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a fazer alterações importantes:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-4">
            {pendingChanges.status !== employee.status && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{employee.status}</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge variant="default">{pendingChanges.status}</Badge>
              </div>
            )}
            {(pendingChanges.salary || pendingChanges.monthly_value) && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  R$ {(employee.salary || employee.monthly_value || 0).toFixed(2)}
                </Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge variant="default">
                  R${" "}
                  {parseFloat(pendingChanges.salary || pendingChanges.monthly_value || "0").toFixed(2)}
                </Badge>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCriticalChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
