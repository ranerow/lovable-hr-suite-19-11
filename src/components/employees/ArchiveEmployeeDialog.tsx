import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Archive } from "lucide-react";

interface ArchiveEmployeeDialogProps {
  employeeName: string;
  employeeId: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
}

export function ArchiveEmployeeDialog({
  employeeName,
  employeeId,
  onConfirm,
  disabled,
}: ArchiveEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error("Por favor, informe o motivo do arquivamento");
      return;
    }

    setLoading(true);
    try {
      // 1. Buscar todos os dados do funcionário
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select(`
          *,
          roles(id, name, code),
          departments(id, name, code),
          units(id, name, code)
        `)
        .eq("id", employeeId)
        .single();

      if (employeeError) throw employeeError;

      // 2. Buscar dados relacionados
      const [
        { data: documents },
        { data: editHistory },
        { data: statusHistory },
        { data: benefits },
        { data: trainings },
        { data: timesheets },
      ] = await Promise.all([
        supabase.from("employee_documents").select("*").eq("employee_id", employeeId),
        supabase.from("employee_edit_history").select("*").eq("employee_id", employeeId),
        supabase.from("employee_status_history").select("*").eq("employee_id", employeeId),
        supabase.from("employee_benefits").select("*, benefits(*)").eq("employee_id", employeeId),
        supabase.from("employee_trainings").select("*, trainings(*)").eq("employee_id", employeeId),
        supabase.from("timesheets").select("*").eq("employee_id", employeeId),
      ]);

      // 3. Criar registro arquivado
      const { error: archiveError } = await supabase
        .from("archived_employees")
        .insert({
          original_employee_id: employeeId,
          employee_data: employee,
          documents: documents || [],
          edit_history: editHistory || [],
          status_history: statusHistory || [],
          benefits: benefits || [],
          trainings: trainings || [],
          timesheets: timesheets || [],
          archive_reason: reason,
          notes: notes || null,
        });

      if (archiveError) throw archiveError;

      // 4. Deletar funcionário
      await onConfirm();

      toast.success(`${employeeName} foi arquivado com sucesso`);
      setOpen(false);
      setReason("");
      setNotes("");
    } catch (error: any) {
      console.error("Erro ao arquivar:", error);
      toast.error(error.message || "Erro ao arquivar funcionário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={disabled}>
          <Archive className="h-4 w-4 mr-1" />
          Arquivar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Arquivar Funcionário</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Tem certeza que deseja arquivar <strong>{employeeName}</strong>?
              </p>
              <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                <p className="font-medium">Esta ação irá:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Preservar todos os dados e documentos</li>
                  <li>Manter histórico completo de alterações</li>
                  <li>Remover da lista de funcionários ativos</li>
                  <li>Permitir restauração futura se necessário</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Motivo do Arquivamento <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Demissão, Término de contrato, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais sobre o arquivamento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading || !reason.trim()}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? "Arquivando..." : "Sim, Arquivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
