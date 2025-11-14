import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Users, Clock, FileText } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and redirect
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/dashboard");
        }
      });
    });
  }, [navigate]);

  const features = [
    {
      icon: Users,
      title: "Gestão de Funcionários",
      description: "Cadastro completo, documentos e histórico funcional"
    },
    {
      icon: Clock,
      title: "Controle de Ponto",
      description: "Registro de entrada/saída e banco de horas"
    },
    {
      icon: FileText,
      title: "Relatórios",
      description: "Análises e exportações personalizadas"
    },
    {
      icon: Building2,
      title: "Multi-unidades",
      description: "Gerencie várias filiais e departamentos"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">HouterPro RH</h1>
          <Button onClick={() => navigate("/auth")}>
            Acessar Sistema
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="mb-6 text-5xl font-bold">
          Sistema Completo de
          <span className="block text-primary">Gestão de RH</span>
        </h2>
        <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
          Simplifique a gestão de pessoas da sua empresa com uma plataforma moderna e intuitiva
        </p>
        <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
          Começar Agora
        </Button>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border bg-card p-6 shadow-md transition-all hover:shadow-lg"
            >
              <feature.icon className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
