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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          activity_date: string
          id: string
          lectures_watched: number
          questions_solved: number
          study_seconds: number
          tests_taken: number
          user_id: string
        }
        Insert: {
          activity_date?: string
          id?: string
          lectures_watched?: number
          questions_solved?: number
          study_seconds?: number
          tests_taken?: number
          user_id: string
        }
        Update: {
          activity_date?: string
          id?: string
          lectures_watched?: number
          questions_solved?: number
          study_seconds?: number
          tests_taken?: number
          user_id?: string
        }
        Relationships: []
      }
      lecture_progress: {
        Row: {
          chapter: string | null
          completed: boolean
          id: string
          last_position_seconds: number
          lecture_id: string
          progress_percent: number
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter?: string | null
          completed?: boolean
          id?: string
          last_position_seconds?: number
          lecture_id: string
          progress_percent?: number
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: string | null
          completed?: boolean
          id?: string
          last_position_seconds?: number
          lecture_id?: string
          progress_percent?: number
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          level: number
          target_year: number | null
          updated_at: string
          xp: number
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          level?: number
          target_year?: number | null
          updated_at?: string
          xp?: number
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          level?: number
          target_year?: number | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          chapter: string
          created_at: string
          id: string
          is_correct: boolean
          skipped: boolean
          subject: string
          test_attempt_id: string | null
          user_id: string
        }
        Insert: {
          chapter: string
          created_at?: string
          id?: string
          is_correct: boolean
          skipped?: boolean
          subject: string
          test_attempt_id?: string | null
          user_id: string
        }
        Update: {
          chapter?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          skipped?: boolean
          subject?: string
          test_attempt_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_test_attempt_id_fkey"
            columns: ["test_attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          accuracy: number
          created_at: string
          id: string
          kind: string
          score: number
          subject: string | null
          test_id: string | null
          time_taken_seconds: number
          title: string
          total: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          created_at?: string
          id?: string
          kind?: string
          score?: number
          subject?: string | null
          test_id?: string | null
          time_taken_seconds?: number
          title: string
          total?: number
          user_id: string
        }
        Update: {
          accuracy?: number
          created_at?: string
          id?: string
          kind?: string
          score?: number
          subject?: string | null
          test_id?: string | null
          time_taken_seconds?: number
          title?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
