export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      mood_logs: {
        Row: {
          id: string
          user_id: string
          created_at: string 
          mood: string
          focus_level: number
          suggestions: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          mood: string
          focus_level: number
          suggestions?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          mood?: string
          focus_level?: number
          suggestions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quizzes: {
        Row: {
          id: string
          user_id: string | null 
          topic: string
          difficulty: string
          num_questions: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null 
          topic: string
          difficulty: string
          num_questions: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          topic?: string
          difficulty?: string
          num_questions?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          options: Json 
          correct_option_index: number 
          explanation_prompt: string | null 
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          options: Json 
          correct_option_index: number
          explanation_prompt?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          options?: Json
          correct_option_index?: number
          explanation_prompt?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          score: number
          answers_submitted: Json 
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          score: number
          answers_submitted: Json
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          score?: number
          answers_submitted?: Json
          completed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      study_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string 
          completed: boolean
          subject: string | null
          plan_type: string // e.g., 'task', 'exam', 'revision'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date: string 
          completed?: boolean
          subject?: string | null
          plan_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string 
          completed?: boolean
          subject?: string | null
          plan_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_rooms: {
        Row: {
          id: string
          name: string
          topic: string | null
          created_by_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          topic?: string | null
          created_by_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          topic?: string | null
          created_by_user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_rooms_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_room_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          message_text: string 
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          message_text: string 
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          message_text?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_messages_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      doubt_resolution_logs: {
        Row: {
          id: string
          user_id: string
          question_image_data_uri: string | null // Storing data URI for simplicity for now
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_image_data_uri?: string | null
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_image_data_uri?: string | null
          explanation?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubt_resolution_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      smart_notes_logs: {
        Row: {
          id: string
          user_id: string
          content_type: string // 'test' or 'chapter'
          original_content_preview: string | null // A preview of the content
          generated_notes: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: string
          original_content_preview?: string | null
          generated_notes: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: string
          original_content_preview?: string | null
          generated_notes?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_notes_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_assistant_logs: {
        Row: {
          id: string
          user_id: string
          query: string
          context: string | null
          preferences: string | null
          ai_answer: string | null
          ai_study_tips: Json | null // Array of strings
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          context?: string | null
          preferences?: string | null
          ai_answer?: string | null
          ai_study_tips?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          context?: string | null
          preferences?: string | null
          ai_answer?: string | null
          ai_study_tips?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_assistant_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      customization_requests_logs: {
        Row: {
          id: string
          user_id: string
          command: string
          ai_instruction: string | null
          ai_explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          command: string
          ai_instruction?: string | null
          ai_explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          command?: string
          ai_instruction?: string | null
          ai_explanation?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customization_requests_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

    