import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Bell, Shield, Plug } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: "Configurações salvas",
      description: "Suas alterações foram salvas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="rh">RH</TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Configure as informações básicas da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input id="company-name" placeholder="Nome da sua empresa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa</Label>
                <Input id="logo" type="file" accept="image/*" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Input id="timezone" defaultValue="America/Sao_Paulo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Input id="language" defaultValue="pt-BR" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rh" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Políticas de RH</CardTitle>
              <CardDescription>
                Configure as políticas e regras de recursos humanos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notice-period">Dias de Aviso Prévio</Label>
                <Input id="notice-period" type="number" defaultValue="30" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="work-hours">Horário Padrão de Trabalho (horas/dia)</Label>
                <Input id="work-hours" type="number" defaultValue="8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime-limit">Limite de Horas Extras (horas/mês)</Label>
                <Input id="overtime-limit" type="number" defaultValue="40" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Férias Fracionadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir divisão de férias em até 3 períodos
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Venda de Férias</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir venda de até 1/3 das férias
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Notificações</CardTitle>
              <CardDescription>
                Configure quando e como receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-alert">
                  Alertas de Contratos PJ (dias de antecedência)
                </Label>
                <Input id="contract-alert" type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-alert">
                  Alertas de Documentos Vencidos (dias de antecedência)
                </Label>
                <Input id="doc-alert" type="number" defaultValue="15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-alert">
                  Alertas de Certidões PJ (dias de antecedência)
                </Label>
                <Input id="cert-alert" type="number" defaultValue="15" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Aniversário</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações de aniversário dos colaboradores
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Férias</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas de períodos de férias vencendo
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Horas Extras</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas quando limite de horas extras for atingido
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Configure as integrações com sistemas externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timesheet-api">API do Sistema de Ponto</Label>
                <Input id="timesheet-api" placeholder="https://api.ponto.com.br" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payroll-api">API da Folha de Pagamento</Label>
                <Input id="payroll-api" placeholder="https://api.folha.com.br" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-smtp">Servidor SMTP (E-mail)</Label>
                <Input id="email-smtp" placeholder="smtp.empresa.com.br" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Porta</Label>
                  <Input id="smtp-port" defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Usuário</Label>
                  <Input id="smtp-user" placeholder="noreply@empresa.com.br" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Configure as políticas de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                <Input id="session-timeout" type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-password">Tamanho Mínimo da Senha</Label>
                <Input id="min-password" type="number" defaultValue="8" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exigir Senha Forte</Label>
                  <p className="text-sm text-muted-foreground">
                    Senha deve conter letras, números e caracteres especiais
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores (2FA)</Label>
                  <p className="text-sm text-muted-foreground">
                    Requer código adicional para login
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Log de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as ações importantes do sistema
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Restaurar Padrões</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
