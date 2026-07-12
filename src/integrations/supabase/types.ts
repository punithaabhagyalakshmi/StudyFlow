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
      achievements: {
        Row: {
          badge: string
          description: string | null
          earned_at: string
          id: string
          title: string
          user_id: string
          xp_awarded: number | null
        }
        Insert: {
          badge: string
          description?: string | null
          earned_at?: string
          id?: string
          title: string
          user_id: string
          xp_awarded?: number | null
        }
        Update: {
          badge?: string
          description?: string | null
          earned_at?: string
          id?: string
          title?: string
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: []
      }
      ai_chats: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string | null
          starts_at: string
          subject_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          starts_at: string
          subject_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          starts_at?: string
          subject_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string | null
          front: string
          id: string
          known: boolean | null
          last_reviewed_at: string | null
          review_count: number | null
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id?: string | null
          front: string
          id?: string
          known?: boolean | null
          last_reviewed_at?: string | null
          review_count?: number | null
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string | null
          front?: string
          id?: string
          known?: boolean | null
          last_reviewed_at?: string | null
          review_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          period: Database["public"]["Enums"]["goal_period"]
          progress: number | null
          target: number | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          period: Database["public"]["Enums"]["goal_period"]
          progress?: number | null
          target?: number | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          period?: Database["public"]["Enums"]["goal_period"]
          progress?: number | null
          target?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string
          folder: string | null
          id: string
          subject_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          folder?: string | null
          id?: string
          subject_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          folder?: string | null
          id?: string
          subject_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string | null
          message: string | null
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string | null
          message?: string | null
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string | null
          message?: string | null
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed: boolean | null
          duration_minutes: number
          ended_at: string | null
          id: string
          started_at: string
          subject_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          duration_minutes: number
          ended_at?: string | null
          id?: string
          started_at?: string
          subject_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          subject_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college: string | null
          created_at: string
          daily_study_hours: number | null
          department: string | null
          full_name: string | null
          goals: string | null
          id: string
          onboarded: boolean
          preferred_study_time: string | null
          semester: number | null
          sleep_time: string | null
          target_gpa: number | null
          theme: string | null
          updated_at: string
          wake_time: string | null
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string
          daily_study_hours?: number | null
          department?: string | null
          full_name?: string | null
          goals?: string | null
          id: string
          onboarded?: boolean
          preferred_study_time?: string | null
          semester?: number | null
          sleep_time?: string | null
          target_gpa?: number | null
          theme?: string | null
          updated_at?: string
          wake_time?: string | null
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string
          daily_study_hours?: number | null
          department?: string | null
          full_name?: string | null
          goals?: string | null
          id?: string
          onboarded?: boolean
          preferred_study_time?: string | null
          semester?: number | null
          sleep_time?: string | null
          target_gpa?: number | null
          theme?: string | null
          updated_at?: string
          wake_time?: string | null
          year?: number | null
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          id: string
          questions: Json
          score: number | null
          subject_id: string | null
          title: string
          total: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          id?: string
          questions: Json
          score?: number | null
          subject_id?: string | null
          title: string
          total?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          id?: string
          questions?: Json
          score?: number | null
          subject_id?: string | null
          title?: string
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          period: Database["public"]["Enums"]["plan_period"]
          plan: Json
          starts_on: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          period: Database["public"]["Enums"]["plan_period"]
          plan: Json
          starts_on?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          period?: Database["public"]["Enums"]["plan_period"]
          plan?: Json
          starts_on?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          credits: number | null
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          credits?: number | null
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          credits?: number | null
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          recurrence: string | null
          reminder_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          recurrence?: string | null
          reminder_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          recurrence?: string | null
          reminder_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          last_active_date: string | null
          level: number
          longest_streak: number
          streak: number
          total_study_minutes: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          streak?: number
          total_study_minutes?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          streak?: number
          total_study_minutes?: number
          updated_at?: string
          user_id?: string
          xp?: number
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
      difficulty: "easy" | "medium" | "hard"
      event_type:
        | "class"
        | "exam"
        | "study"
        | "assignment"
        | "holiday"
        | "other"
      goal_period: "daily" | "weekly" | "monthly" | "semester"
      plan_period: "daily" | "weekly" | "monthly" | "revision"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed"
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
      difficulty: ["easy", "medium", "hard"],
      event_type: ["class", "exam", "study", "assignment", "holiday", "other"],
      goal_period: ["daily", "weekly", "monthly", "semester"],
      plan_period: ["daily", "weekly", "monthly", "revision"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
