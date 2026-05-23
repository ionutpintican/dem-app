export type UserRole =
  | "radiolog"
  | "oncolog"
  | "chirurg_oncolog"
  | "chirurg_plastician"
  | "radioterapeut"
  | "genetician"
  | "psiholog"
  | "nutritionist"
  | "admin";

export type CaseStatus =
  | "nou"
  | "in_lucru"
  | "gata_expediere"
  | "trimis"
  | "arhivat";

export type FileCategory =
  | "analiza"
  | "imagistica"
  | "reteta"
  | "trimitere"
  | "altele";

export type EmailType =
  | "confirmare_caz"
  | "creare_cont"
  | "notif_echipa"
  | "decizie_finala"
  | "reminder";

export type EmailStatus = "trimis" | "eroare";

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

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          is_coordinator: boolean;
          is_active: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: UserRole;
          is_coordinator?: boolean;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      cases: {
        Row: {
          id: string;
          patient_name: string;
          patient_email: string;
          patient_dob: string;
          patient_phone: string | null;
          description: string;
          status: CaseStatus;
          created_at: string;
          decision_sent_at: string | null;
          sent_by: string | null;
        };
        Insert: {
          id?: string;
          patient_name: string;
          patient_email: string;
          patient_dob: string;
          patient_phone?: string | null;
          description: string;
          status?: CaseStatus;
          decision_sent_at?: string | null;
          sent_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
      };
      case_files: {
        Row: {
          id: string;
          case_id: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          category: FileCategory;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          category?: FileCategory;
        };
        Update: Partial<Database["public"]["Tables"]["case_files"]["Insert"]>;
      };
      specialist_inputs: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          role_at_time: string;
          content: Record<string, unknown>;
          is_coordinator_conclusion: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          role_at_time: string;
          content?: Record<string, unknown>;
          is_coordinator_conclusion?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["specialist_inputs"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: AuditAction;
          resource_type: string | null;
          resource_id: string | null;
          case_id: string | null;
          ip_address: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      email_log: {
        Row: {
          id: string;
          case_id: string | null;
          email_type: EmailType;
          recipient: string;
          status: EmailStatus;
          sent_at: string;
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          email_type: EmailType;
          recipient: string;
          status?: EmailStatus;
        };
        Update: Partial<Database["public"]["Tables"]["email_log"]["Insert"]>;
      };
    };
    Enums: {
      user_role: UserRole;
      case_status: CaseStatus;
      file_category: FileCategory;
      email_type: EmailType;
      email_status: EmailStatus;
      audit_action: AuditAction;
    };
  };
}
