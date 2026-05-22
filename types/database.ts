export type UserRole = "user" | "specialist" | "coordinator" | "admin";
export type CaseStatus =
  | "draft"
  | "open"
  | "in_review"
  | "pending_specialist"
  | "resolved"
  | "closed"
  | "rejected";
export type CasePriority = "low" | "medium" | "high" | "urgent";
export type FileCategory =
  | "document"
  | "image"
  | "contract"
  | "report"
  | "evidence"
  | "other";
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "status_change"
  | "file_upload"
  | "file_delete"
  | "assign"
  | "login"
  | "logout";
export type EmailStatus = "pending" | "sent" | "failed" | "bounced";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          is_coordinator: boolean;
          department: string | null;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_coordinator?: boolean;
          department?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      cases: {
        Row: {
          id: string;
          case_number: string;
          title: string;
          description: string | null;
          status: CaseStatus;
          priority: CasePriority;
          category: string | null;
          created_by: string;
          assigned_to: string | null;
          coordinator_id: string | null;
          due_date: string | null;
          resolved_at: string | null;
          closed_at: string | null;
          tags: string[];
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_number?: string;
          title: string;
          description?: string | null;
          status?: CaseStatus;
          priority?: CasePriority;
          category?: string | null;
          created_by: string;
          assigned_to?: string | null;
          coordinator_id?: string | null;
          due_date?: string | null;
          tags?: string[];
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
      };
      case_files: {
        Row: {
          id: string;
          case_id: string;
          uploaded_by: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          category: FileCategory;
          description: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          uploaded_by: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          category?: FileCategory;
          description?: string | null;
          is_public?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["case_files"]["Insert"]>;
      };
      specialist_inputs: {
        Row: {
          id: string;
          case_id: string;
          specialist_id: string;
          content: string;
          recommendation: string | null;
          is_final: boolean;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          specialist_id: string;
          content: string;
          recommendation?: string | null;
          is_final?: boolean;
          submitted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["specialist_inputs"]["Insert"]
        >;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: AuditAction;
          table_name: string;
          record_id: string | null;
          case_id: string | null;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: never; // inserarea se face exclusiv prin log_audit()
        Update: never; // imutabil
      };
      email_log: {
        Row: {
          id: string;
          case_id: string | null;
          user_id: string | null;
          recipient_email: string;
          subject: string;
          template: string | null;
          status: EmailStatus;
          resend_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          user_id?: string | null;
          recipient_email: string;
          subject: string;
          template?: string | null;
          status?: EmailStatus;
          resend_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["email_log"]["Insert"]>;
      };
    };
    Functions: {
      auth_user_role: { Returns: UserRole };
      auth_is_coordinator: { Returns: boolean };
      auth_is_admin: { Returns: boolean };
      log_audit: {
        Args: {
          p_action: AuditAction;
          p_table_name: string;
          p_record_id?: string;
          p_case_id?: string;
          p_old_data?: Record<string, unknown>;
          p_new_data?: Record<string, unknown>;
          p_notes?: string;
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      case_status: CaseStatus;
      case_priority: CasePriority;
      file_category: FileCategory;
      audit_action: AuditAction;
      email_status: EmailStatus;
    };
  };
}
