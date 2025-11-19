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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Search, Briefcase, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const jobOpeningSchema = z.object({
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  contract_type: z.enum(["CLT", "PJ"]),
  salary_range_min: z.number().min(0).optional(),
  salary_range_max: z.number().min(0).optional(),
  monthly_value_pj: z.number().min(0).optional(),
  workload: z.number().min(0).optional(),
  requirements: z.string().optional(),
  status: z.string(),
});

type JobOpeningFormData = z.infer<typeof jobOpeningSchema>;

const statusColors = {
  aberta: "secondary",
  aprovacao_gestor: "default",
  aprovacao_diretoria: "default",
  aprovacao_juridico: "default",
  publicada: "default",
  em_selecao: "default",
  fechada: "secondary",
  cancelada: "destructive",
} as const;

const statusLabels = {
  aberta: "Aberta",
  aprovacao_gestor: "Aprovação Gestor",
  aprovacao_diretoria: "Aprovação Diretoria",
  aprovacao_juridico: "Aprovação Jurídico",
  publicada: "Publicada",
  em_selecao: "Em Seleção",
  fechada: "Fechada",
  cancelada: "Cancelada",
};

const stageLabels = {
  inscrito: "Inscrito",
  triagem: "Triagem",
  teste: "Teste",
  entrevista_rh: "Entrevista RH",
  entrevista_gestor: "Entrevista Gestor",
  entrevista_final: "Entrevista Final",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export default function Recruitment() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<JobOpeningFormData>({
    resolver: zodResolver(jobOpeningSchema),
    defaultValues: {
      title: "",
      description: "",
      contract_type: "CLT",
      status: "aberta",
    },
  });

  const { data: jobOpenings, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["job_openings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_openings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select(`
          *,
          job_opening:job_openings(title, contract_type)
        `)
        .order("applied_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: JobOpeningFormData) => {
      const { error } = await supabase.from("job_openings").insert([{
        title: data.title,
        description: data.description,
        contract_type: data.contract_type,
        salary_range_min: data.salary_range_min,
        salary_range_max: data.salary_range_max,
        monthly_value_pj: data.monthly_value_pj,
        workload: data.workload,
        requirements: data.requirements,
        status: data.status,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_openings"] });
      toast({ title: "Vaga criada com sucesso!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao criar vaga", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: JobOpeningFormData }) => {
      const { error } = await supabase.from("job_openings").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_openings"] });
      toast({ title: "Vaga atualizada com sucesso!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar vaga", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenDialog = (job?: any) => {
    if (job) {
      setEditingJob(job);
      form.reset(job);
    } else {
      setEditingJob(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingJob(null);
    form.reset();
  };

  const onSubmit = (data: JobOpeningFormData) => {
    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredJobs = jobOpenings?.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recrutamento & Seleção</h1>
          <p className="text-muted-foreground mt-1">Gerencie vagas e candidatos</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Vaga
        </Button>
      </div>

      <Tabs defaultValue="vagas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vagas">Vagas</TabsTrigger>
          <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
        </TabsList>

        <TabsContent value="vagas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Vagas Abertas
              </CardTitle>
              <CardDescription>
                {filteredJobs?.length || 0} vaga(s) cadastrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar vaga..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoadingJobs ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : filteredJobs && filteredJobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Faixa Salarial</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.contract_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {job.contract_type === "CLT" && job.salary_range_min && job.salary_range_max
                            ? `R$ ${job.salary_range_min.toFixed(2)} - R$ ${job.salary_range_max.toFixed(2)}`
                            : job.contract_type === "PJ" && job.monthly_value_pj
                            ? `R$ ${job.monthly_value_pj.toFixed(2)}/mês`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[job.status as keyof typeof statusColors] || "secondary"}>
                            {statusLabels[job.status as keyof typeof statusLabels] || job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(job)}
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
                  {searchTerm ? "Nenhuma vaga encontrada" : "Nenhuma vaga cadastrada"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidatos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Candidatos
              </CardTitle>
              <CardDescription>
                {candidates?.length || 0} candidato(s) cadastrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCandidates ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : candidates && candidates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vaga</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate: any) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>
                          {candidate.job_opening?.title || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {stageLabels[candidate.current_stage as keyof typeof stageLabels] || candidate.current_stage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={candidate.status === "ativo" ? "default" : "secondary"}>
                            {candidate.status === "ativo" ? "Ativo" : candidate.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum candidato cadastrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Editar Vaga" : "Nova Vaga"}</DialogTitle>
            <DialogDescription>
              Preencha os dados da vaga
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Desenvolvedor Full Stack" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contrato *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CLT">CLT</SelectItem>
                          <SelectItem value="PJ">PJ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária (h/semana)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("contract_type") === "CLT" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salary_range_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salário Mínimo (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salary_range_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salário Máximo (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {form.watch("contract_type") === "PJ" && (
                <FormField
                  control={form.control}
                  name="monthly_value_pj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingJob ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
