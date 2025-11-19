export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string | null
          document_type: string
          employee_id: string
          expiry_date: string | null
          file_name: string
          file_url: string
          id: string
          notes: string | null
          upload_date: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          employee_id: string
          expiry_date?: string | null
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          upload_date?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          employee_id?: string
          expiry_date?: string | null
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          auto_renewal: boolean | null
          birth_date: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          contract_end_date: string | null
          contract_end_date_pj: string | null
          contract_start_date: string | null
          contract_type: string
          cpf: string
          created_at: string | null
          ctps_number: string | null
          ctps_series: string | null
          ctps_state: string | null
          department_id: string | null
          email: string
          full_name: string
          hire_date: string
          id: string
          legal_representative: string | null
          monthly_value: number | null
          municipal_registration: string | null
          phone: string | null
          photo_url: string | null
          pis_pasep: string | null
          pj_type: string | null
          role_id: string | null
          salary: number | null
          service_scope: string | null
          shift_type: string | null
          state: string | null
          status: string
          technical_responsibility: string | null
          thirteenth_salary_provision: number | null
          unit_id: string | null
          updated_at: string | null
          user_id: string | null
          vacation_provision: number | null
          workload: number
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          auto_renewal?: boolean | null
          birth_date?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          contract_end_date?: string | null
          contract_end_date_pj?: string | null
          contract_start_date?: string | null
          contract_type: string
          cpf: string
          created_at?: string | null
          ctps_number?: string | null
          ctps_series?: string | null
          ctps_state?: string | null
          department_id?: string | null
          email: string
          full_name: string
          hire_date: string
          id?: string
          legal_representative?: string | null
          monthly_value?: number | null
          municipal_registration?: string | null
          phone?: string | null
          photo_url?: string | null
          pis_pasep?: string | null
          pj_type?: string | null
          role_id?: string | null
          salary?: number | null
          service_scope?: string | null
          shift_type?: string | null
          state?: string | null
          status?: string
          technical_responsibility?: string | null
          thirteenth_salary_provision?: number | null
          unit_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vacation_provision?: number | null
          workload?: number
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          auto_renewal?: boolean | null
          birth_date?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          contract_end_date?: string | null
          contract_end_date_pj?: string | null
          contract_start_date?: string | null
          contract_type?: string
          cpf?: string
          created_at?: string | null
          ctps_number?: string | null
          ctps_series?: string | null
          ctps_state?: string | null
          department_id?: string | null
          email?: string
          full_name?: string
          hire_date?: string
          id?: string
          legal_representative?: string | null
          monthly_value?: number | null
          municipal_registration?: string | null
          phone?: string | null
          photo_url?: string | null
          pis_pasep?: string | null
          pj_type?: string | null
          role_id?: string | null
          salary?: number | null
          service_scope?: string | null
          shift_type?: string | null
          state?: string | null
          status?: string
          technical_responsibility?: string | null
          thirteenth_salary_provision?: number | null
          unit_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vacation_provision?: number | null
          workload?: number
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          level: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          hours_worked: number | null
          id: string
          lunch_end: string | null
          lunch_start: string | null
          notes: string | null
          overtime_hours: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          hours_worked?: number | null
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          notes?: string | null
          overtime_hours?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          hours_worked?: number | null
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          notes?: string | null
          overtime_hours?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          active: boolean | null
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          id: string
          name: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          id?: string
          name: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          unit_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          unit_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_unit: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "diretoria"
        | "rh_matriz"
        | "rh_filial"
        | "gestor"
        | "colaborador_clt"
        | "prestador_pj"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "diretoria",
        "rh_matriz",
        "rh_filial",
        "gestor",
        "colaborador_clt",
        "prestador_pj",
      ],
    },
  },
} as const
