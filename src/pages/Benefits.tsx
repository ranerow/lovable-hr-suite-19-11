import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Search, Gift } from "lucide-react";

const benefitSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  benefit_type: z.enum(["vt", "vr", "va", "health_plan", "gympass", "outros"]),
  applies_to: z.enum(["clt", "pj", "ambos"]),
  default_value: z.number().min(0).optional(),
  is_mandatory: z.boolean().default(false),
  active: z.boolean().default(true),
});

type BenefitFormData = z.infer<typeof benefitSchema>;

const benefitTypeLabels = {
  vt: "Vale Transporte",
  vr: "Vale Refeição",
  va: "Vale Alimentação",
  health_plan: "Plano de Saúde",
  gympass: "Gympass",
  outros: "Outros",
};

const appliesToLabels = {
  clt: "CLT",
  pj: "PJ",
  ambos: "CLT e PJ",
};

export default function Benefits() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      name: "",
      description: "",
      benefit_type: "outros",
      applies_to: "ambos",
      default_value: 0,
      is_mandatory: false,
      active: true,
    },
  });

  const { data: benefits, isLoading } = useQuery({
    queryKey: ["benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefits")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BenefitFormData) => {
      const { error } = await supabase.from("benefits").insert([{
        name: data.name,
        description: data.description,
        benefit_type: data.benefit_type,
        applies_to: data.applies_to,
        default_value: data.default_value,
        is_mandatory: data.is_mandatory,
        active: data.active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      toast({ title: "Benefício criado com sucesso!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao criar benefício", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BenefitFormData }) => {
      const { error } = await supabase.from("benefits").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      toast({ title: "Benefício atualizado com sucesso!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar benefício", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenDialog = (benefit?: any) => {
    if (benefit) {
      setEditingBenefit(benefit);
      form.reset({
        name: benefit.name || "",
        description: benefit.description || "",
        benefit_type: benefit.benefit_type || "outros",
        applies_to: benefit.applies_to || "ambos",
        default_value: benefit.default_value || 0,
        is_mandatory: benefit.is_mandatory ?? false,
        active: benefit.active ?? true,
      });
    } else {
      setEditingBenefit(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBenefit(null);
    form.reset();
  };

  const onSubmit = (data: BenefitFormData) => {
    if (editingBenefit) {
      updateMutation.mutate({ id: editingBenefit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredBenefits = benefits?.filter((benefit) =>
    benefit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Benefícios</h1>
          <p className="text-muted-foreground mt-1">Gerencie os benefícios oferecidos</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Benefício
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Lista de Benefícios
          </CardTitle>
          <CardDescription>
            {filteredBenefits?.length || 0} benefício(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar benefício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredBenefits && filteredBenefits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aplica-se a</TableHead>
                  <TableHead>Valor Padrão</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBenefits.map((benefit) => (
                  <TableRow key={benefit.id}>
                    <TableCell className="font-medium">{benefit.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {benefitTypeLabels[benefit.benefit_type as keyof typeof benefitTypeLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appliesToLabels[benefit.applies_to as keyof typeof appliesToLabels]}
                    </TableCell>
                    <TableCell>
                      {benefit.default_value ? `R$ ${benefit.default_value.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={benefit.is_mandatory ? "default" : "secondary"}>
                        {benefit.is_mandatory ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={benefit.active ? "default" : "secondary"}>
                        {benefit.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(benefit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum benefício encontrado" : "Nenhum benefício cadastrado"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBenefit ? "Editar Benefício" : "Novo Benefício"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do benefício
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Vale Transporte" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="benefit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(benefitTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applies_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aplica-se a *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(appliesToLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="default_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Padrão (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_mandatory"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Obrigatório</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativo</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingBenefit ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
