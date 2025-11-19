import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, PartyPopper } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { PersonalDataStep } from "@/components/onboarding/PersonalDataStep";
import { AddressStep } from "@/components/onboarding/AddressStep";
import { DocumentsStep } from "@/components/onboarding/DocumentsStep";
import { DocumentUploadStep } from "@/components/onboarding/DocumentUploadStep";
import { ReviewStep } from "@/components/onboarding/ReviewStep";
import { toast } from "sonner";

export default function OnboardingPortal() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  useEffect(() => {
    // Salvar progresso no localStorage
    if (invitation) {
      localStorage.setItem(`onboarding_${token}`, JSON.stringify({
        currentStep,
        formData,
        documents,
      }));
    }
  }, [currentStep, formData, documents, token, invitation]);

  const validateToken = async () => {
    if (!token) {
      navigate("/");
      return;
    }

    try {
      // Verificar se existe progresso salvo
      const saved = localStorage.getItem(`onboarding_${token}`);
      if (saved) {
        const { currentStep: savedStep, formData: savedData, documents: savedDocs } = JSON.parse(saved);
        setCurrentStep(savedStep);
        setFormData(savedData);
        setDocuments(savedDocs);
      }

      const { data, error } = await supabase
        .from("onboarding_invitations")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        toast.error("Link inválido ou expirado");
        return;
      }

      if (data.status === "concluido") {
        toast.success("Cadastro já foi finalizado!");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error("Este link expirou. Entre em contato com o RH.");
        await supabase
          .from("onboarding_invitations")
          .update({ status: "expirado" })
          .eq("id", data.id);
        return;
      }

      setInvitation(data);

      // Atualizar status para em_andamento se for a primeira visita
      if (data.status === "pendente") {
        await supabase
          .from("onboarding_invitations")
          .update({ status: "em_andamento" })
          .eq("id", data.id);
      }
    } catch (error) {
      console.error("Erro ao validar token:", error);
      toast.error("Erro ao carregar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (step: number) => {
    if (!invitation) return;
    
    // Cálculo correto: step atual / total de steps * 100
    // Step 1: 17%, Step 2: 33%, Step 3: 50%, Step 4: 67%, Step 5: 83%, Step 6: 100%
    const percentage = Math.round((step / 6) * 100);
    
    console.log(`📊 Atualizando progresso: Step ${step} = ${percentage}%`);
    
    await supabase
      .from("onboarding_invitations")
      .update({ completion_percentage: percentage })
      .eq("id", invitation.id);
  };

  const handleNextStep = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
    const nextStep = currentStep + 1;
    console.log(`📝 Avançando para step ${nextStep}`);
    setCurrentStep(nextStep);
    updateProgress(nextStep); // Usar nextStep para cálculo correto
  };

  const handleBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleDocumentsNext = (docs: any[]) => {
    console.log(`📤 Enviando ${docs.length} documentos`);
    setDocuments(docs);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    updateProgress(nextStep); // Garantir que chegue a 83%
  };

  const handleFinalSubmit = async () => {
    if (!invitation) return;

    setIsSubmitting(true);
    try {
      console.log("✅ Finalizando onboarding para employee_id:", invitation.employee_id);
      
      // Atualizar progresso para 100% PRIMEIRO
      await updateProgress(6);
      
      // Atualizar dados do funcionário
      const { error: employeeError } = await supabase
        .from("employees")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          cpf: formData.cpf || formData.cnpj,
          birth_date: formData.birth_date,
          company_name: formData.company_name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          ctps_number: formData.ctps_number,
          ctps_series: formData.ctps_series,
          ctps_state: formData.ctps_state,
          pis_pasep: formData.pis_pasep,
          municipal_registration: formData.municipal_registration,
          legal_representative: formData.legal_representative,
          pj_type: formData.pj_type,
          status: "Aguardando Ativação", // Status para revisão do RH
        })
        .eq("id", invitation.employee_id);

      if (employeeError) throw employeeError;

      // Mover documentos para pasta definitiva e registrar
      for (const doc of documents.filter(d => d.url)) {
        // Registrar documento
        await supabase
          .from("employee_documents")
          .insert({
            employee_id: invitation.employee_id,
            document_type: doc.type,
            file_name: doc.label,
            file_url: doc.url,
          });
      }

      // Marcar convite como concluído
      console.log("Finalizando convite:", invitation.id);
      const { error: updateError } = await supabase
        .from("onboarding_invitations")
        .update({
          status: "concluido",
          completed_at: new Date().toISOString(),
          completion_percentage: 100,
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("❌ Erro ao atualizar status do convite:", updateError);
        throw new Error(`Falha ao finalizar convite: ${updateError.message}`);
      }
      
      console.log("✅ Convite finalizado com sucesso");

      // Notificar RH
      await supabase.functions.invoke("notify-rh-onboarding-complete", {
        body: {
          employeeName: formData.full_name,
          employeeEmail: formData.email,
          invitationId: invitation.id,
        },
      });

      // Limpar localStorage
      localStorage.removeItem(`onboarding_${token}`);

      toast.success("Cadastro finalizado com sucesso!");
      setCurrentStep(7); // Estado de sucesso
    } catch (error) {
      console.error("Erro ao finalizar cadastro:", error);
      toast.error("Erro ao finalizar cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="p-8">
          <p className="text-muted-foreground">Carregando...</p>
        </Card>
      </div>
    );
  }

  if (!invitation || invitation.status === "expirado") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="p-8 max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este link de cadastro está inválido ou expirou.
              <br />
              Por favor, entre em contato com o RH: rh@isssl.com.br
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  if (currentStep === 7) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <PartyPopper className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Cadastro Concluído!</h1>
          <p className="text-muted-foreground">
            Bem-vindo à equipe! O RH entrará em contato com você em breve para
            os próximos passos.
          </p>
          <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Bem-vindo ao ISSSL! 👋</h1>
            <p className="text-muted-foreground">
              Complete seu cadastro para finalizar o processo de admissão
            </p>
          </div>

          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={6}
            completionPercentage={Math.round((currentStep / 6) * 100)}
          />

          <div className="mt-8">
            {currentStep === 1 && (
              <PersonalDataStep
                contractType={invitation.contract_type}
                initialData={formData}
                onNext={handleNextStep}
              />
            )}

            {currentStep === 2 && (
              <AddressStep
                initialData={formData}
                onNext={handleNextStep}
                onBack={handleBackStep}
              />
            )}

            {currentStep === 3 && (
              <DocumentsStep
                contractType={invitation.contract_type}
                initialData={formData}
                onNext={handleNextStep}
                onBack={handleBackStep}
              />
            )}

            {currentStep === 4 && (
              <DocumentUploadStep
                contractType={invitation.contract_type}
                token={token!}
                onNext={handleDocumentsNext}
                onBack={handleBackStep}
              />
            )}

            {currentStep === 5 && (
              <ReviewStep
                data={formData}
                documents={documents}
                onBack={handleBackStep}
                onSubmit={handleFinalSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
