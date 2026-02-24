export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      action_types: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          key: string;
          label: string;
          sort_order: number | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key: string;
          label: string;
          sort_order?: number | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key?: string;
          label?: string;
          sort_order?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'action_types_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          admin_note: string | null;
          created_at: string;
          id: string;
          ip_address: string | null;
          new_values: Json | null;
          old_values: Json | null;
          record_id: string | null;
          table_name: string | null;
          tenant_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          admin_note?: string | null;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: string | null;
          table_name?: string | null;
          tenant_id: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          admin_note?: string | null;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: string | null;
          table_name?: string | null;
          tenant_id?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      case_followups: {
        Row: {
          action_date: string;
          action_type: string;
          case_id: string | null;
          created_at: string;
          description: string | null;
          detail: string | null;
          due_date: string | null;
          id: string;
          observations: string | null;
          process_stage: string;
          responsible: string | null;
          stage_status: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          action_date?: string;
          action_type?: string;
          case_id?: string | null;
          created_at?: string;
          description?: string | null;
          detail?: string | null;
          due_date?: string | null;
          id?: string;
          observations?: string | null;
          process_stage?: string;
          responsible?: string | null;
          stage_status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          action_date?: string;
          action_type?: string;
          case_id?: string | null;
          created_at?: string;
          description?: string | null;
          detail?: string | null;
          due_date?: string | null;
          id?: string;
          observations?: string | null;
          process_stage?: string;
          responsible?: string | null;
          stage_status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'case_followups_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'cases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'case_followups_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'v_control_alertas';
            referencedColumns: ['case_id'];
          },
          {
            foreignKeyName: 'case_followups_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      case_message_attachments: {
        Row: {
          case_id: string;
          content_type: string | null;
          created_at: string;
          file_name: string;
          file_size: number | null;
          id: string;
          message_id: string;
          storage_bucket: string;
          storage_path: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          content_type?: string | null;
          created_at?: string;
          file_name: string;
          file_size?: number | null;
          id?: string;
          message_id: string;
          storage_bucket?: string;
          storage_path: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Update: {
          case_id?: string;
          content_type?: string | null;
          created_at?: string;
          file_name?: string;
          file_size?: number | null;
          id?: string;
          message_id?: string;
          storage_bucket?: string;
          storage_path?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'case_message_attachments_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'cases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'case_message_attachments_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'v_control_alertas';
            referencedColumns: ['case_id'];
          },
          {
            foreignKeyName: 'case_message_attachments_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'case_messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'case_message_attachments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      case_messages: {
        Row: {
          body: string;
          case_id: string;
          created_at: string;
          id: string;
          is_urgent: boolean;
          parent_id: string | null;
          process_stage: string | null;
          sender_name: string | null;
          sender_role: string | null;
          tenant_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          case_id: string;
          created_at?: string;
          id?: string;
          is_urgent?: boolean;
          parent_id?: string | null;
          process_stage?: string | null;
          sender_name?: string | null;
          sender_role?: string | null;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          case_id?: string;
          created_at?: string;
          id?: string;
          is_urgent?: boolean;
          parent_id?: string | null;
          process_stage?: string | null;
          sender_name?: string | null;
          sender_role?: string | null;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'case_messages_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'cases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'case_messages_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'v_control_alertas';
            referencedColumns: ['case_id'];
          },
          {
            foreignKeyName: 'case_messages_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'case_messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'case_messages_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      cases: {
        Row: {
          actions_taken: string | null;
          closed_at: string | null;
          conduct_category: string | null;
          conduct_type: string | null;
          course_incident: string | null;
          created_at: string;
          guardian_notified: boolean | null;
          id: string;
          incident_date: string;
          incident_time: string | null;
          indagacion_due_date: string | null;
          indagacion_start_date: string | null;
          legacy_case_number: string | null;
          responsible: string | null;
          responsible_role: string | null;
          seguimiento_started_at: string | null;
          short_description: string | null;
          status: string;
          student_id: string | null;
          student_name: string | null;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          actions_taken?: string | null;
          closed_at?: string | null;
          conduct_category?: string | null;
          conduct_type?: string | null;
          course_incident?: string | null;
          created_at?: string;
          guardian_notified?: boolean | null;
          id?: string;
          incident_date?: string;
          incident_time?: string | null;
          indagacion_due_date?: string | null;
          indagacion_start_date?: string | null;
          legacy_case_number?: string | null;
          responsible?: string | null;
          responsible_role?: string | null;
          seguimiento_started_at?: string | null;
          short_description?: string | null;
          status?: string;
          student_id?: string | null;
          student_name?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          actions_taken?: string | null;
          closed_at?: string | null;
          conduct_category?: string | null;
          conduct_type?: string | null;
          course_incident?: string | null;
          created_at?: string;
          guardian_notified?: boolean | null;
          id?: string;
          incident_date?: string;
          incident_time?: string | null;
          indagacion_due_date?: string | null;
          indagacion_start_date?: string | null;
          legacy_case_number?: string | null;
          responsible?: string | null;
          responsible_role?: string | null;
          seguimiento_started_at?: string | null;
          short_description?: string | null;
          status?: string;
          student_id?: string | null;
          student_name?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cases_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cases_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      catalog_staging_batches: {
        Row: {
          applied_at: string | null;
          created_at: string;
          id: string;
          source_name: string | null;
          status: string;
          tenant_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          applied_at?: string | null;
          created_at?: string;
          id?: string;
          source_name?: string | null;
          status?: string;
          tenant_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          applied_at?: string | null;
          created_at?: string;
          id?: string;
          source_name?: string | null;
          status?: string;
          tenant_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'catalog_staging_batches_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      conduct_catalog: {
        Row: {
          active: boolean;
          conduct_category: string;
          conduct_type: string;
          created_at: string;
          id: string;
          sort_order: number;
        };
        Insert: {
          active?: boolean;
          conduct_category: string;
          conduct_type: string;
          created_at?: string;
          id?: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          conduct_category?: string;
          conduct_type?: string;
          created_at?: string;
          id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      conduct_types: {
        Row: {
          active: boolean;
          color: string;
          created_at: string | null;
          id: string;
          key: string;
          label: string;
          sort_order: number;
        };
        Insert: {
          active?: boolean;
          color: string;
          created_at?: string | null;
          id?: string;
          key: string;
          label: string;
          sort_order: number;
        };
        Update: {
          active?: boolean;
          color?: string;
          created_at?: string | null;
          id?: string;
          key?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      followup_evidence: {
        Row: {
          case_id: string | null;
          content_type: string | null;
          created_at: string;
          file_name: string;
          file_size: number | null;
          followup_id: string | null;
          id: string;
          storage_bucket: string;
          storage_path: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          case_id?: string | null;
          content_type?: string | null;
          created_at?: string;
          file_name: string;
          file_size?: number | null;
          followup_id?: string | null;
          id?: string;
          storage_bucket?: string;
          storage_path: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          case_id?: string | null;
          content_type?: string | null;
          created_at?: string;
          file_name?: string;
          file_size?: number | null;
          followup_id?: string | null;
          id?: string;
          storage_bucket?: string;
          storage_path?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'followup_evidence_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'cases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'followup_evidence_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'v_control_alertas';
            referencedColumns: ['case_id'];
          },
          {
            foreignKeyName: 'followup_evidence_followup_id_fkey';
            columns: ['followup_id'];
            isOneToOne: false;
            referencedRelation: 'case_followups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'followup_evidence_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      involucrados: {
        Row: {
          case_id: string | null;
          created_at: string;
          curso: string | null;
          id: string;
          nombre: string;
          rol: string;
          tenant_id: string | null;
        };
        Insert: {
          case_id?: string | null;
          created_at?: string;
          curso?: string | null;
          id?: string;
          nombre?: string;
          rol?: string;
          tenant_id?: string | null;
        };
        Update: {
          case_id?: string | null;
          created_at?: string;
          curso?: string | null;
          id?: string;
          nombre?: string;
          rol?: string;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'involucrados_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'cases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'involucrados_case_id_fkey';
            columns: ['case_id'];
            isOneToOne: false;
            referencedRelation: 'v_control_alertas';
            referencedColumns: ['case_id'];
          },
          {
            foreignKeyName: 'involucrados_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      platform_versions: {
        Row: {
          breaking_changes: Json | null;
          created_at: string;
          features: Json | null;
          id: string;
          is_active: boolean | null;
          is_mandatory: boolean | null;
          min_plan: string | null;
          release_notes: string | null;
          released_at: string;
          version: string;
        };
        Insert: {
          breaking_changes?: Json | null;
          created_at?: string;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_mandatory?: boolean | null;
          min_plan?: string | null;
          release_notes?: string | null;
          released_at?: string;
          version: string;
        };
        Update: {
          breaking_changes?: Json | null;
          created_at?: string;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_mandatory?: boolean | null;
          min_plan?: string | null;
          release_notes?: string | null;
          released_at?: string;
          version?: string;
        };
        Relationships: [];
      };
      process_stages: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          stage_name: string;
          stage_order: number;
          tenant_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          stage_name: string;
          stage_order: number;
          tenant_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          stage_name?: string;
          stage_order?: number;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'process_stages_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      stage_sla: {
        Row: {
          days_to_due: number | null;
          stage_key: string;
        };
        Insert: {
          days_to_due?: number | null;
          stage_key: string;
        };
        Update: {
          days_to_due?: number | null;
          stage_key?: string;
        };
        Relationships: [];
      };
      stg_action_types: {
        Row: {
          batch_id: string;
          description: string | null;
          id: number;
          is_active: boolean | null;
          key: string;
          label: string;
          sort_order: number | null;
          tenant_id: string;
        };
        Insert: {
          batch_id: string;
          description?: string | null;
          id?: number;
          is_active?: boolean | null;
          key: string;
          label: string;
          sort_order?: number | null;
          tenant_id: string;
        };
        Update: {
          batch_id?: string;
          description?: string | null;
          id?: number;
          is_active?: boolean | null;
          key?: string;
          label?: string;
          sort_order?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stg_action_types_batch_id_fkey';
            columns: ['batch_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_staging_batches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stg_action_types_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      stg_conduct_catalog: {
        Row: {
          batch_id: string;
          conduct_category: string;
          conduct_type: string;
          id: number;
          is_active: boolean | null;
          sort_order: number | null;
          tenant_id: string;
        };
        Insert: {
          batch_id: string;
          conduct_category: string;
          conduct_type: string;
          id?: number;
          is_active?: boolean | null;
          sort_order?: number | null;
          tenant_id: string;
        };
        Update: {
          batch_id?: string;
          conduct_category?: string;
          conduct_type?: string;
          id?: number;
          is_active?: boolean | null;
          sort_order?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stg_conduct_catalog_batch_id_fkey';
            columns: ['batch_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_staging_batches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stg_conduct_catalog_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      stg_conduct_types: {
        Row: {
          batch_id: string;
          id: number;
          is_active: boolean | null;
          sort_order: number | null;
          tenant_id: string;
          type_category: string;
          type_name: string;
        };
        Insert: {
          batch_id: string;
          id?: number;
          is_active?: boolean | null;
          sort_order?: number | null;
          tenant_id: string;
          type_category: string;
          type_name: string;
        };
        Update: {
          batch_id?: string;
          id?: number;
          is_active?: boolean | null;
          sort_order?: number | null;
          tenant_id?: string;
          type_category?: string;
          type_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stg_conduct_types_batch_id_fkey';
            columns: ['batch_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_staging_batches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stg_conduct_types_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      stg_stage_sla: {
        Row: {
          batch_id: string;
          days_to_due: number;
          id: number;
          is_active: boolean | null;
          stage_key: string;
          tenant_id: string;
        };
        Insert: {
          batch_id: string;
          days_to_due: number;
          id?: number;
          is_active?: boolean | null;
          stage_key: string;
          tenant_id: string;
        };
        Update: {
          batch_id?: string;
          days_to_due?: number;
          id?: number;
          is_active?: boolean | null;
          stage_key?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stg_stage_sla_batch_id_fkey';
            columns: ['batch_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_staging_batches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stg_stage_sla_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      students: {
        Row: {
          course: string | null;
          created_at: string;
          first_name: string;
          id: string;
          last_name: string;
          level: string | null;
          rut: string | null;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          course?: string | null;
          created_at?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          level?: string | null;
          rut?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          course?: string | null;
          created_at?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          level?: string | null;
          rut?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'students_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_catalogs: {
        Row: {
          catalog_type: string;
          created_at: string;
          description: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          key: string;
          label: string;
          metadata: Json | null;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          catalog_type: string;
          created_at?: string;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          key: string;
          label: string;
          metadata?: Json | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          catalog_type?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          key?: string;
          label?: string;
          metadata?: Json | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_catalogs_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          department: string | null;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean | null;
          last_login_at: string | null;
          phone: string | null;
          role: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          department?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean | null;
          last_login_at?: string | null;
          phone?: string | null;
          role?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          department?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_login_at?: string | null;
          phone?: string | null;
          role?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_profiles_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_settings: {
        Row: {
          created_at: string;
          id: string;
          setting_key: string;
          setting_value: Json;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          setting_key: string;
          setting_value: Json;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_settings_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_versions: {
        Row: {
          applied_at: string;
          auto_update_enabled: boolean | null;
          id: string;
          tenant_id: string;
          version_id: string;
        };
        Insert: {
          applied_at?: string;
          auto_update_enabled?: boolean | null;
          id?: string;
          tenant_id: string;
          version_id: string;
        };
        Update: {
          applied_at?: string;
          auto_update_enabled?: boolean | null;
          id?: string;
          tenant_id?: string;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_versions_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: true;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tenant_versions_version_id_fkey';
            columns: ['version_id'];
            isOneToOne: false;
            referencedRelation: 'platform_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      tenants: {
        Row: {
          address: string | null;
          created_at: string;
          date_format: string | null;
          deleted_at: string | null;
          email: string | null;
          favicon_url: string | null;
          features: Json | null;
          id: string;
          is_active: boolean | null;
          locale: string | null;
          logo_url: string | null;
          max_cases_per_month: number | null;
          max_students: number | null;
          max_users: number | null;
          name: string;
          phone: string | null;
          primary_color: string | null;
          rut: string | null;
          secondary_color: string | null;
          slug: string;
          storage_mb: number | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_plan: string | null;
          subscription_status: string | null;
          timezone: string | null;
          trial_end_date: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          date_format?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          favicon_url?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          locale?: string | null;
          logo_url?: string | null;
          max_cases_per_month?: number | null;
          max_students?: number | null;
          max_users?: number | null;
          name: string;
          phone?: string | null;
          primary_color?: string | null;
          rut?: string | null;
          secondary_color?: string | null;
          slug: string;
          storage_mb?: number | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_plan?: string | null;
          subscription_status?: string | null;
          timezone?: string | null;
          trial_end_date?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          date_format?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          favicon_url?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          locale?: string | null;
          logo_url?: string | null;
          max_cases_per_month?: number | null;
          max_students?: number | null;
          max_users?: number | null;
          name?: string;
          phone?: string | null;
          primary_color?: string | null;
          rut?: string | null;
          secondary_color?: string | null;
          slug?: string;
          storage_mb?: number | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_plan?: string | null;
          subscription_status?: string | null;
          timezone?: string | null;
          trial_end_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_control_alertas: {
        Row: {
          alerta_urgencia: string | null;
          case_id: string | null;
          course: string | null;
          curso_incidente: string | null;
          dias_restantes: number | null;
          estado_caso: string | null;
          estudiante: string | null;
          estudiante_rut: string | null;
          fecha: string | null;
          fecha_incidente: string | null;
          fecha_plazo: string | null;
          id: string | null;
          legacy_case_number: string | null;
          tipificacion_conducta: string | null;
          tipo: string | null;
        };
        Relationships: [];
      };
      v_control_unificado: {
        Row: {
          alerta_urgencia: string | null;
          case_id: string | null;
          course: string | null;
          curso_incidente: string | null;
          days_to_due: number | null;
          descripcion: string | null;
          detalle: string | null;
          dias_restantes: number | null;
          estado_caso: string | null;
          estado_etapa: string | null;
          estudiante: string | null;
          estudiante_rut: string | null;
          etapa_debido_proceso: string | null;
          fecha: string | null;
          fecha_incidente: string | null;
          fecha_plazo: string | null;
          followup_id: string | null;
          legacy_case_number: string | null;
          level: string | null;
          responsable: string | null;
          stage_num_from: number | null;
          student_id: string | null;
          tipificacion_conducta: string | null;
          tipo: string | null;
          tipo_accion: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_create_audit_log: {
        Args: {
          p_action: string;
          p_new_values?: Json;
          p_note?: string;
          p_record_id?: string;
          p_table_name?: string;
          p_tenant_id: string;
        };
        Returns: {
          action: string;
          admin_note: string | null;
          created_at: string;
          id: string;
          ip_address: string | null;
          new_values: Json | null;
          old_values: Json | null;
          record_id: string | null;
          table_name: string | null;
          tenant_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'audit_logs';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_delete_audit_log: {
        Args: { p_audit_id: string };
        Returns: boolean;
      };
      admin_purge_audit_logs: {
        Args: { p_before: string; p_tenant_id: string };
        Returns: number;
      };
      admin_update_audit_log_note: {
        Args: { p_audit_id: string; p_note: string };
        Returns: {
          action: string;
          admin_note: string | null;
          created_at: string;
          id: string;
          ip_address: string | null;
          new_values: Json | null;
          old_values: Json | null;
          record_id: string | null;
          table_name: string | null;
          tenant_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'audit_logs';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_update_tenant_profile: {
        Args: {
          p_department?: string;
          p_full_name?: string;
          p_is_active?: boolean;
          p_phone?: string;
          p_profile_id: string;
          p_role?: string;
        };
        Returns: {
          avatar_url: string | null;
          created_at: string;
          department: string | null;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean | null;
          last_login_at: string | null;
          phone: string | null;
          role: string;
          tenant_id: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'tenant_profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      apply_college_catalogs: { Args: { p_tenant_id: string }; Returns: Json };
      business_days_between: {
        Args: { end_date: string; start_date: string };
        Returns: number;
      };
      current_tenant_id: { Args: never; Returns: string };
      get_demo_colegio: {
        Args: Record<PropertyKey, never>;
        Returns: {
          address: string | null;
          email: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          phone: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          slug: string;
        };
      };
      is_platform_admin: { Args: never; Returns: boolean };
      is_tenant_admin: { Args: never; Returns: boolean };
      onboard_college: {
        Args: {
          p_admin_user_id?: string;
          p_email: string;
          p_name: string;
          p_slug: string;
          p_subscription_plan?: string;
          p_trial_days?: number;
        };
        Returns: Json;
      };
      platform_switch_tenant: {
        Args: { p_tenant_id: string };
        Returns: {
          avatar_url: string | null;
          created_at: string;
          department: string | null;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean | null;
          last_login_at: string | null;
          phone: string | null;
          role: string;
          tenant_id: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'tenant_profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      stats_casos_por_curso: {
        Args: { desde: string; hasta: string };
        Returns: {
          curso: string;
          total: number;
        }[];
      };
      stats_casos_por_mes: {
        Args: { desde: string; hasta: string };
        Returns: {
          mes: string;
          total: number;
        }[];
      };
      stats_casos_por_tipificacion: {
        Args: { desde: string; hasta: string };
        Returns: {
          tipo: string;
          total: number;
        }[];
      };
      stats_cumplimiento_plazos: {
        Args: { desde: string; hasta: string };
        Returns: {
          cumplimiento_pct: number;
          dentro_plazo: number;
          fuera_plazo: number;
          total_plazos: number;
        }[];
      };
      stats_kpis: {
        Args: { desde: string; hasta: string };
        Returns: {
          abiertos: number;
          casos_total: number;
          cerrados: number;
          promedio_cierre_dias: number;
        }[];
      };
      stats_mayor_carga: {
        Args: { desde: string; hasta: string };
        Returns: {
          responsable: string;
          total: number;
        }[];
      };
      stats_mayor_nivel: {
        Args: { desde: string; hasta: string };
        Returns: {
          level: string;
          total: number;
        }[];
      };
      stats_promedio_seguimientos_por_caso: {
        Args: { desde: string; hasta: string };
        Returns: {
          promedio: number;
        }[];
      };
      stats_reincidencia: {
        Args: { desde: string; hasta: string };
        Returns: {
          estudiantes_reincidentes: number;
        }[];
      };
      stats_tiempo_primer_seguimiento: {
        Args: { desde: string; hasta: string };
        Returns: {
          promedio_dias: number;
        }[];
      };
      start_due_process: {
        Args: { p_case_id: string; p_sla_days?: number };
        Returns: Json;
      };
      validate_college_catalogs: {
        Args: { p_batch_id?: string; p_tenant_id: string };
        Returns: {
          error_code: string;
          error_detail: string;
          row_ref: string;
          section: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
