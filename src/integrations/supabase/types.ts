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
      consumed_meals: {
        Row: {
          calories: number
          carbs: number | null
          created_at: string
          fat: number | null
          id: string
          meal_date: string
          meal_name: string | null
          photo_url: string | null
          protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          meal_date?: string
          meal_name?: string | null
          photo_url?: string | null
          protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          meal_date?: string
          meal_name?: string | null
          photo_url?: string | null
          protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string
          exercise_data: Json
          exercise_name: string
          id: string
          notes: string | null
          sets: Json
          updated_at: string
          workout_session_id: string
        }
        Insert: {
          created_at?: string
          exercise_data?: Json
          exercise_name: string
          id?: string
          notes?: string | null
          sets?: Json
          updated_at?: string
          workout_session_id: string
        }
        Update: {
          created_at?: string
          exercise_data?: Json
          exercise_name?: string
          id?: string
          notes?: string | null
          sets?: Json
          updated_at?: string
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_completions: {
        Row: {
          created_at: string
          id: string
          meal_date: string
          meal_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_date: string
          meal_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_date?: string
          meal_index?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number | null
          id: string
          last_workout_date: string | null
          max_streak: number | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_workout_date?: string | null
          max_streak?: number | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_workout_date?: string | null
          max_streak?: number | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          age: number | null
          available_equipment: string[] | null
          body_type: string | null
          created_at: string
          dietary_restrictions: string | null
          experience_level: string | null
          gender: string | null
          goal: string | null
          gym_access: boolean | null
          height: number | null
          id: string
          name: string
          physical_limitations: string | null
          preferred_time: string | null
          target_areas: string[] | null
          training_frequency: number | null
          updated_at: string
          user_id: string
          weight: number | null
          workout_duration: string | null
        }
        Insert: {
          age?: number | null
          available_equipment?: string[] | null
          body_type?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          experience_level?: string | null
          gender?: string | null
          goal?: string | null
          gym_access?: boolean | null
          height?: number | null
          id?: string
          name: string
          physical_limitations?: string | null
          preferred_time?: string | null
          target_areas?: string[] | null
          training_frequency?: number | null
          updated_at?: string
          user_id: string
          weight?: number | null
          workout_duration?: string | null
        }
        Update: {
          age?: number | null
          available_equipment?: string[] | null
          body_type?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          experience_level?: string | null
          gender?: string | null
          goal?: string | null
          gym_access?: boolean | null
          height?: number | null
          id?: string
          name?: string
          physical_limitations?: string | null
          preferred_time?: string | null
          target_areas?: string[] | null
          training_frequency?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
          workout_duration?: string | null
        }
        Relationships: []
      }
      water_intake: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          intake_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          id?: string
          intake_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          intake_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          days: Json
          description: string | null
          goal: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: Json
          description?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days?: Json
          description?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          day_name: string
          id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          workout_plan_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day_name: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          workout_plan_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day_name?: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
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
