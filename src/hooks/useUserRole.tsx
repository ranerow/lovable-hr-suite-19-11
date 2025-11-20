import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "diretoria" | "rh_matriz" | "rh_filial" | "gestor" | "colaborador_clt" | "prestador_pj";

interface UserRoleData {
  role: UserRole;
  unit_id: string | null;
  department_id: string | null;
}

export const useUserRole = () => {
  const { data: userRole, isLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role, unit_id, department_id")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data as UserRoleData;
    },
  });

  const isAdmin = userRole?.role === "diretoria";
  const isRHMatriz = userRole?.role === "rh_matriz";
  const isRHFilial = userRole?.role === "rh_filial";
  const isGestor = userRole?.role === "gestor";
  const isRH = isAdmin || isRHMatriz || isRHFilial;

  const canEditEmployee = (employeeUnitId?: string | null, employeeDepartmentId?: string | null) => {
    if (!userRole) return false;

    // Diretoria pode editar todos
    if (isAdmin) return true;

    // RH Matriz pode editar todos
    if (isRHMatriz) return true;

    // RH Filial só pode editar da sua unidade
    if (isRHFilial) {
      return employeeUnitId === userRole.unit_id;
    }

    // Gestor só pode editar do seu departamento
    if (isGestor) {
      return employeeDepartmentId === userRole.department_id;
    }

    return false;
  };

  const canEditFinancial = () => {
    // Apenas Diretoria e RH Matriz podem editar dados financeiros
    return isAdmin || isRHMatriz;
  };

  const canEditStatus = () => {
    // Apenas Diretoria e RH podem alterar status
    return isAdmin || isRHMatriz || isRHFilial;
  };

  return {
    userRole: userRole?.role,
    isAdmin,
    isRHMatriz,
    isRHFilial,
    isGestor,
    isRH,
    canEditEmployee,
    canEditFinancial,
    canEditStatus,
    isLoading,
  };
};
