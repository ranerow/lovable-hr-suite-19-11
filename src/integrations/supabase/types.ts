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
      benefits: {
        Row: {
          active: boolean | null
          applies_to: string
          benefit_type: string
          created_at: string | null
          default_value: number | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          applies_to: string
          benefit_type: string
          created_at?: string | null
          default_value?: number | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          applies_to?: string
          benefit_type?: string
          created_at?: string | null
          default_value?: number | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      candidate_documents: {
        Row: {
          candidate_id: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          upload_date: string | null
        }
        Insert: {
          candidate_id: string
          document_type: string
          file_name: string
          file_url: string
          id?: string
          upload_date?: string | null
        }
        Update: {
          candidate_id?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          applied_date: string | null
          cover_letter: string | null
          cpf_cnpj: string | null
          created_at: string | null
          current_stage: string | null
          email: string
          id: string
          job_opening_id: string
          name: string
          notes: string | null
          overall_score: number | null
          phone: string | null
          resume_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applied_date?: string | null
          cover_letter?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          current_stage?: string | null
          email: string
          id?: string
          job_opening_id: string
          name: string
          notes?: string | null
          overall_score?: number | null
          phone?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applied_date?: string | null
          cover_letter?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          current_stage?: string | null
          email?: string
          id?: string
          job_opening_id?: string
          name?: string
          notes?: string | null
          overall_score?: number | null
          phone?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
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
      disciplinary_actions: {
        Row: {
          acknowledgment_date: string | null
          action_date: string
          action_type: string
          applied_by: string | null
          created_at: string | null
          description: string | null
          document_url: string | null
          employee_acknowledgment: boolean | null
          employee_id: string
          id: string
          notes: string | null
          reason: string
          severity: string | null
          suspension_days: number | null
          updated_at: string | null
          witness_1: string | null
          witness_2: string | null
        }
        Insert: {
          acknowledgment_date?: string | null
          action_date: string
          action_type: string
          applied_by?: string | null
          created_at?: string | null
          description?: string | null
          document_url?: string | null
          employee_acknowledgment?: boolean | null
          employee_id: string
          id?: string
          notes?: string | null
          reason: string
          severity?: string | null
          suspension_days?: number | null
          updated_at?: string | null
          witness_1?: string | null
          witness_2?: string | null
        }
        Update: {
          acknowledgment_date?: string | null
          action_date?: string
          action_type?: string
          applied_by?: string | null
          created_at?: string | null
          description?: string | null
          document_url?: string | null
          employee_acknowledgment?: boolean | null
          employee_id?: string
          id?: string
          notes?: string | null
          reason?: string
          severity?: string | null
          suspension_days?: number | null
          updated_at?: string | null
          witness_1?: string | null
          witness_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_actions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          active: boolean | null
          benefit_id: string
          created_at: string | null
          discount_from_payroll: boolean | null
          employee_id: string
          end_date: string | null
          id: string
          monthly_value: number | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          benefit_id: string
          created_at?: string | null
          discount_from_payroll?: boolean | null
          employee_id: string
          end_date?: string | null
          id?: string
          monthly_value?: number | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          benefit_id?: string
          created_at?: string | null
          discount_from_payroll?: boolean | null
          employee_id?: string
          end_date?: string | null
          id?: string
          monthly_value?: number | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
      employee_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string | null
          employee_id: string
          id: string
          new_status: string
          notes: string | null
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          new_status: string
          notes?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          new_status?: string
          notes?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_status_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_trainings: {
        Row: {
          attendance_status: string | null
          certificate_url: string | null
          completion_date: string | null
          created_at: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          notes: string | null
          scheduled_date: string | null
          score: number | null
          training_id: string
          updated_at: string | null
        }
        Insert: {
          attendance_status?: string | null
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          score?: number | null
          training_id: string
          updated_at?: string | null
        }
        Update: {
          attendance_status?: string | null
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          score?: number | null
          training_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_trainings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
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
      job_openings: {
        Row: {
          approved_by_director: string | null
          approved_by_legal: string | null
          approved_by_manager: string | null
          benefits: string[] | null
          closing_date: string | null
          contract_duration: string | null
          contract_type: string
          created_at: string | null
          created_by: string | null
          department_id: string | null
          description: string | null
          id: string
          monthly_value_pj: number | null
          opening_date: string | null
          requirements: string | null
          role_id: string | null
          salary_range_max: number | null
          salary_range_min: number | null
          service_scope: string | null
          status: string | null
          title: string
          unit_id: string | null
          updated_at: string | null
          workload: number | null
        }
        Insert: {
          approved_by_director?: string | null
          approved_by_legal?: string | null
          approved_by_manager?: string | null
          benefits?: string[] | null
          closing_date?: string | null
          contract_duration?: string | null
          contract_type: string
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          monthly_value_pj?: number | null
          opening_date?: string | null
          requirements?: string | null
          role_id?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          service_scope?: string | null
          status?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string | null
          workload?: number | null
        }
        Update: {
          approved_by_director?: string | null
          approved_by_legal?: string | null
          approved_by_manager?: string | null
          benefits?: string[] | null
          closing_date?: string | null
          contract_duration?: string | null
          contract_type?: string
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          monthly_value_pj?: number | null
          opening_date?: string | null
          requirements?: string | null
          role_id?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          service_scope?: string | null
          status?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string | null
          workload?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_openings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_invitations: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          contract_type: string
          created_at: string | null
          created_by: string | null
          email: string
          employee_id: string | null
          expires_at: string
          full_name: string
          id: string
          ip_address: string | null
          status: string
          token: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          contract_type: string
          created_at?: string | null
          created_by?: string | null
          email: string
          employee_id?: string | null
          expires_at: string
          full_name: string
          id?: string
          ip_address?: string | null
          status?: string
          token: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          contract_type?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          employee_id?: string | null
          expires_at?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          status?: string
          token?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_invitations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pj_certifications: {
        Row: {
          alert_days_before: number | null
          certification_type: string
          created_at: string | null
          employee_id: string
          expiry_date: string
          file_url: string
          id: string
          issue_date: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          alert_days_before?: number | null
          certification_type: string
          created_at?: string | null
          employee_id: string
          expiry_date: string
          file_url: string
          id?: string
          issue_date: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_days_before?: number | null
          certification_type?: string
          created_at?: string | null
          employee_id?: string
          expiry_date?: string
          file_url?: string
          id?: string
          issue_date?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pj_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pj_contract_renewals: {
        Row: {
          adjustment_percentage: number | null
          contract_id: string
          id: string
          new_end_date: string
          new_value: number | null
          notes: string | null
          previous_end_date: string
          previous_value: number | null
          renewal_date: string | null
        }
        Insert: {
          adjustment_percentage?: number | null
          contract_id: string
          id?: string
          new_end_date: string
          new_value?: number | null
          notes?: string | null
          previous_end_date: string
          previous_value?: number | null
          renewal_date?: string | null
        }
        Update: {
          adjustment_percentage?: number | null
          contract_id?: string
          id?: string
          new_end_date?: string
          new_value?: number | null
          notes?: string | null
          previous_end_date?: string
          previous_value?: number | null
          renewal_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pj_contract_renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pj_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      pj_contracts: {
        Row: {
          auto_renewal: boolean | null
          contract_number: string
          contract_url: string | null
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          monthly_value: number
          notes: string | null
          payment_day: number | null
          renewal_notice_days: number | null
          service_scope: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renewal?: boolean | null
          contract_number: string
          contract_url?: string | null
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          monthly_value: number
          notes?: string | null
          payment_day?: number | null
          renewal_notice_days?: number | null
          service_scope: string
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renewal?: boolean | null
          contract_number?: string
          contract_url?: string | null
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          monthly_value?: number
          notes?: string | null
          payment_day?: number | null
          renewal_notice_days?: number | null
          service_scope?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pj_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pj_invoices: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string | null
          due_date: string | null
          employee_id: string
          id: string
          invoice_number: string
          invoice_url: string | null
          issue_date: string
          notes: string | null
          payment_date: string | null
          payment_status: string | null
          reference_month: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          invoice_number: string
          invoice_url?: string | null
          issue_date: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: string | null
          reference_month: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          invoice_number?: string
          invoice_url?: string | null
          issue_date?: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: string | null
          reference_month?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pj_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pj_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pj_invoices_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      trainings: {
        Row: {
          active: boolean | null
          applies_to: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          instructor: string | null
          location: string | null
          name: string
          required_for_roles: string[] | null
          training_type: string | null
          updated_at: string | null
          validity_months: number | null
        }
        Insert: {
          active?: boolean | null
          applies_to?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          location?: string | null
          name: string
          required_for_roles?: string[] | null
          training_type?: string | null
          updated_at?: string | null
          validity_months?: number | null
        }
        Update: {
          active?: boolean | null
          applies_to?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          location?: string | null
          name?: string
          required_for_roles?: string[] | null
          training_type?: string | null
          updated_at?: string | null
          validity_months?: number | null
        }
        Relationships: []
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
      vacations: {
        Row: {
          acquisition_period_end: string
          acquisition_period_start: string
          approved_by_director: string | null
          approved_by_hr: string | null
          approved_by_manager: string | null
          created_at: string | null
          days_remaining: number | null
          days_used: number | null
          director_approval_date: string | null
          employee_id: string
          end_date: string | null
          hr_approval_date: string | null
          id: string
          manager_approval_date: string | null
          notes: string | null
          request_date: string | null
          return_date: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          vacation_days: number
          vacation_type: string | null
        }
        Insert: {
          acquisition_period_end: string
          acquisition_period_start: string
          approved_by_director?: string | null
          approved_by_hr?: string | null
          approved_by_manager?: string | null
          created_at?: string | null
          days_remaining?: number | null
          days_used?: number | null
          director_approval_date?: string | null
          employee_id: string
          end_date?: string | null
          hr_approval_date?: string | null
          id?: string
          manager_approval_date?: string | null
          notes?: string | null
          request_date?: string | null
          return_date?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          vacation_days?: number
          vacation_type?: string | null
        }
        Update: {
          acquisition_period_end?: string
          acquisition_period_start?: string
          approved_by_director?: string | null
          approved_by_hr?: string | null
          approved_by_manager?: string | null
          created_at?: string | null
          days_remaining?: number | null
          days_used?: number | null
          director_approval_date?: string | null
          employee_id?: string
          end_date?: string | null
          hr_approval_date?: string | null
          id?: string
          manager_approval_date?: string | null
          notes?: string | null
          request_date?: string | null
          return_date?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          vacation_days?: number
          vacation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      validate_employee_documents: {
        Args: { employee_id_param: string }
        Returns: {
          contract_type: string
          is_valid: boolean
          missing_documents: string[]
        }[]
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
