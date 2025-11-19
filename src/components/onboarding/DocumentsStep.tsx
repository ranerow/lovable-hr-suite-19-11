import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cltDocumentsSchema = z.object({
  ctps_number: z.string().min(1, "Número da CTPS é obrigatório"),
  ctps_series: z.string().min(1, "Série da CTPS é obrigatória"),
  ctps_state: z.string().min(2, "UF da CTPS é obrigatória"),
  pis_pasep: z.string().optional(),
});

const pjDocumentsSchema = z.object({
  municipal_registration: z.string().optional(),
  legal_representative: z.string().min(3, "Nome do responsável é obrigatório"),
  pj_type: z.enum(["empresa", "autonomo"]),
});

type CLTDocumentsData = z.infer<typeof cltDocumentsSchema>;
type PJDocumentsData = z.infer<typeof pjDocumentsSchema>;

interface CLTDocumentsStepProps {
  contractType: "CLT";
  initialData?: Partial<CLTDocumentsData>;
  onNext: (data: CLTDocumentsData) => void;
  onBack: () => void;
}

interface PJDocumentsStepProps {
  contractType: "PJ";
  initialData?: Partial<PJDocumentsData>;
  onNext: (data: PJDocumentsData) => void;
  onBack: () => void;
}

type DocumentsStepProps = CLTDocumentsStepProps | PJDocumentsStepProps;

export function DocumentsStep(props: DocumentsStepProps) {
  const { contractType, initialData, onNext, onBack } = props;

  if (contractType === "CLT") {
    return <CLTDocumentsForm initialData={initialData as Partial<CLTDocumentsData>} onNext={onNext as (data: CLTDocumentsData) => void} onBack={onBack} />;
  }
  
  return <PJDocumentsForm initialData={initialData as Partial<PJDocumentsData>} onNext={onNext as (data: PJDocumentsData) => void} onBack={onBack} />;
}

function CLTDocumentsForm({ initialData, onNext, onBack }: Omit<CLTDocumentsStepProps, "contractType">) {
  const form = useForm<CLTDocumentsData>({
    resolver: zodResolver(cltDocumentsSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = (data: CLTDocumentsData) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="ctps_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da CTPS</FormLabel>
                <FormControl>
                  <Input placeholder="0000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ctps_series"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Série da CTPS</FormLabel>
                <FormControl>
                  <Input placeholder="0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ctps_state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF da CTPS</FormLabel>
                <FormControl>
                  <Input placeholder="SP" maxLength={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pis_pasep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIS/PASEP (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="000.00000.00-0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            ← Voltar
          </Button>
          <Button type="submit">Próximo →</Button>
        </div>
      </form>
    </Form>
  );
}

function PJDocumentsForm({ initialData, onNext, onBack }: Omit<PJDocumentsStepProps, "contractType">) {
  const form = useForm<PJDocumentsData>({
    resolver: zodResolver(pjDocumentsSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = (data: PJDocumentsData) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="pj_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de PJ</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="empresa">Pessoa Jurídica - Empresa</SelectItem>
                    <SelectItem value="autonomo">Profissional Autônomo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legal_representative"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável Legal</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo do responsável" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="municipal_registration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inscrição Municipal (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="000000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            ← Voltar
          </Button>
          <Button type="submit">Próximo →</Button>
        </div>
      </form>
    </Form>
  );
}
