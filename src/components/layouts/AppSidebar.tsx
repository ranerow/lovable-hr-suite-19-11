import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  FileText,
  Settings,
  Building2,
  Briefcase,
  Building,
  Gift,
  Calendar,
  GraduationCap,
  Shield,
  DollarSign,
  Upload,
  UserPlus,
  FolderOpen,
  ClipboardCheck
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Funcionários", url: "/employees", icon: Users },
  { title: "Convites Onboarding", url: "/onboarding-invitations", icon: UserPlus },
  { title: "Documentos", url: "/documents", icon: Upload },
  { title: "Docs Consolidados", url: "/employee-documents", icon: FolderOpen },
  { title: "Financeiro RH", url: "/finance-rh", icon: DollarSign },
  { title: "Ponto", url: "/timesheets", icon: Clock },
  { title: "Relatórios", url: "/reports", icon: FileText },
  { title: "Recrutamento", url: "/recruitment", icon: Briefcase },
];

const cltModules = [
  { title: "Benefícios", url: "/benefits", icon: Gift },
  { title: "Férias", url: "/vacations", icon: Calendar },
  { title: "Treinamentos", url: "/trainings", icon: GraduationCap },
];

const pjModules = [
  { title: "Contratos PJ", url: "/pj-contracts", icon: FileText },
];

const configItems = [
  { title: "Departamentos", url: "/departments", icon: Building },
  { title: "Unidades", url: "/units", icon: Building2 },
  { title: "Cargos", url: "/roles", icon: Briefcase },
  { title: "Compliance", url: "/compliance", icon: Shield },
  { title: "Permissões", url: "/permissions", icon: Shield },
  { title: "Plano de Testes", url: "/test-plan", icon: ClipboardCheck },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-6">
          <h1 className={`font-bold text-xl text-sidebar-foreground transition-opacity ${!open ? 'opacity-0' : ''}`}>
            HouterPro RH
          </h1>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Módulos CLT</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cltModules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Módulos PJ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pjModules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
