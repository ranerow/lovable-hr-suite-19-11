import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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

const formSchema = z.object({
  employee_id: z.string().min(1, "Selecione um colaborador"),
  action_type: z.string().min(1, "Selecione o tipo"),
  action_date: z.string().min(1, "Data obrigatória"),
  reason: z.string().min(1, "Motivo obrigatório"),
  severity: z.string().min(1, "Selecione a gravidade"),
  description: z.string().optional(),
  suspension_days: z.number().optional(),
});

export default function Compliance() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action_type: "",
      severity: "leve",
      suspension_days: 0,
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, contract_type")
        .eq("status", "Ativo")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

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

  const createAction = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data, error } = await supabase
        .from("disciplinary_actions")
        .insert([values as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary_actions"] });
      toast.success("Ação disciplinar registrada com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao registrar ação disciplinar");
      console.error(error);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createAction.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Advertências & Compliance</h1>
        <p className="text-muted-foreground mt-1">Gestão de processos disciplinares</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Processos Disciplinares
              </CardTitle>
              <CardDescription>
                {actions?.length || 0} registro(s) de ações disciplinares
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Advertência
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Ação Disciplinar</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da advertência ou notificação
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="employee_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Colaborador</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o colaborador" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employees?.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.full_name} ({emp.contract_type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="action_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Ação</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="advertencia_verbal">Advertência Verbal</SelectItem>
                                <SelectItem value="advertencia_escrita">Advertência Escrita</SelectItem>
                                <SelectItem value="suspensao">Suspensão</SelectItem>
                                <SelectItem value="notificacao_contratual">Notificação Contratual (PJ)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="action_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gravidade</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a gravidade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="leve">Leve</SelectItem>
                                <SelectItem value="media">Média</SelectItem>
                                <SelectItem value="grave">Grave</SelectItem>
                                <SelectItem value="gravissima">Gravíssima</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("action_type") === "suspensao" && (
                        <FormField
                          control={form.control}
                          name="suspension_days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dias de Suspensão</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o motivo da ação disciplinar"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição Detalhada (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Informações adicionais sobre o ocorrido"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createAction.isPending}>
                        {createAction.isPending ? "Salvando..." : "Registrar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
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
