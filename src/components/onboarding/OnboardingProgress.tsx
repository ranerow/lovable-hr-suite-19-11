import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
}

const steps = [
  { number: 1, label: "Dados Pessoais" },
  { number: 2, label: "Endereço" },
  { number: 3, label: "Dados Bancários" },
  { number: 4, label: "Documentos" },
  { number: 5, label: "Upload" },
  { number: 6, label: "Revisão" },
];

export function OnboardingProgress({ currentStep, totalSteps, completionPercentage }: OnboardingProgressProps) {
  return (
    <div className="w-full space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Progresso do Cadastro
        </h2>
        <span className="text-sm font-medium text-primary">
          {completionPercentage}%
        </span>
      </div>
      
      <Progress value={completionPercentage} className="h-2" />
      
      <div className="flex justify-between items-center gap-2">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step.number < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.number === currentStep
                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.number < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                step.number
              )}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block text-center">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
