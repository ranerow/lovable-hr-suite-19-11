import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Copy, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnboardingInvitationDialogProps {
  employee: {
    id: string;
    full_name: string;
    email: string;
    contract_type: string;
  };
}

export function OnboardingInvitationDialog({ employee }: OnboardingInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [validityDays, setValidityDays] = useState("15");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const generateInvitation = async () => {
    setIsGenerating(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(validityDays));

      const { error } = await supabase
        .from("onboarding_invitations")
        .insert({
          employee_id: employee.id,
          token,
          email: employee.email,
          full_name: employee.full_name,
          contract_type: employee.contract_type,
          expires_at: expiresAt.toISOString(),
          status: "pendente",
        });

      if (error) throw error;

      const link = `${window.location.origin}/onboarding/${token}`;
      setGeneratedLink(link);
      toast.success("Link gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar convite:", error);
      toast.error("Erro ao gerar convite");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const sendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-onboarding-email", {
        body: {
          to: employee.email,
          name: employee.full_name,
          link: generatedLink,
          validityDays: parseInt(validityDays),
        },
      });

      if (error) throw error;

      toast.success(`Email enviado para ${employee.email}!`);
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Link de Onboarding</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Funcionário</Label>
            <Input value={employee.full_name} disabled />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={employee.email} disabled />
          </div>

          <div>
            <Label>Tipo de Contrato</Label>
            <Input value={employee.contract_type} disabled />
          </div>

          <div>
            <Label>Validade do Link</Label>
            <Select value={validityDays} onValueChange={setValidityDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!generatedLink ? (
            <Button
              onClick={generateInvitation}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? "Gerando..." : "Gerar Link"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Link gerado!</span>
              </div>

              <div className="p-3 bg-muted rounded-md break-all text-sm">
                {generatedLink}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>

                <Button
                  onClick={sendEmail}
                  disabled={isSendingEmail}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSendingEmail ? "Enviando..." : "Enviar Email"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
