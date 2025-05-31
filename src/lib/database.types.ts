
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
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          updated_at: string | null
          username: string | null
          class_level: string | null // e.g., "11", "12"
          target_year: number | null // e.g., 2026
          theme: string | null // e.g., "dark", "light"
          alarm_tone_url: string | null
          custom_countdown_event_name: string | null
          custom_countdown_target_date: string | null
        }
        Insert: {
          id: string // user_id from auth.users
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          username?: string | null
          class_level?: string | null
          target_year?: number | null
          theme?: string | null
          alarm_tone_url?: string | null
          custom_countdown_event_name?: string | null
          custom_countdown_target_date?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          username?: string | null
          class_level?: string | null
          target_year?: number | null
          theme?: string | null
          alarm_tone_url?: string | null
          custom_countdown_event_name?: string | null
          custom_countdown_target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
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
          class_level: string | null
          subject: string | null
          topic: string | null // Added for easier display
          topics: string[] | null
          question_source: string | null
          difficulty: string
          num_questions: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null 
          class_level?: string | null
          subject?: string | null
          topic?: string | null // Added for easier display
          topics?: string[] | null
          question_source?: string | null
          difficulty: string
          num_questions: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          class_level?: string | null
          subject?: string | null
          topic?: string | null // Added for easier display
          topics?: string[] | null
          question_source?: string | null
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
          quiz_id: string | null 
          question_text: string
          options: Json 
          correct_option_index: number 
          explanation_prompt: string | null 
          created_at: string
          class_level: string | null
          subject: string | null
          topic: string | null
          source: string | null 
          neet_syllabus_year: number | null 
        }
        Insert: {
          id?: string
          quiz_id?: string | null
          question_text: string
          options: Json 
          correct_option_index: number
          explanation_prompt?: string | null
          created_at?: string
          class_level?: string | null
          subject?: string | null
          topic?: string | null
          source?: string | null
          neet_syllabus_year?: number | null
        }
        Update: {
          id?: string
          quiz_id?: string | null
          question_text?: string
          options?: Json
          correct_option_index?: number
          explanation_prompt?: string | null
          created_at?: string
          class_level?: string | null
          subject?: string | null
          topic?: string | null
          source?: string | null
          neet_syllabus_year?: number | null
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
      saved_questions: {
        Row: {
            id: string
            user_id: string
            question_id: string | null 
            question_text: string
            options: Json
            correct_option_index: number
            explanation_prompt: string | null
            class_level: string | null
            subject: string | null
            topic: string | null
            source: string | null
            saved_at: string
        }
        Insert: {
            id?: string
            user_id: string
            question_id?: string | null
            question_text: string
            options: Json
            correct_option_index: number
            explanation_prompt?: string | null
            class_level?: string | null
            subject?: string | null
            topic?: string | null
            source?: string | null
            saved_at?: string
        }
        Update: {
            id?: string
            user_id?: string
            question_id?: string | null
            question_text?: string
            options?: Json
            correct_option_index?: number
            explanation_prompt?: string | null
            class_level?: string | null
            subject?: string | null
            topic?: string | null
            source?: string | null
            saved_at?: string
        }
        Relationships: [
            {
                foreignKeyName: "saved_questions_user_id_fkey"
                columns: ["user_id"]
                referencedRelation: "users"
                referencedColumns: ["id"]
            },
            {
                foreignKeyName: "saved_questions_question_id_fkey"
                columns: ["question_id"]
                referencedRelation: "questions"
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
          total_questions: number
          answers_submitted: Json 
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          score: number
          total_questions: number
          answers_submitted: Json
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
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
          start_time: string | null 
          duration_minutes: number | null 
          due_date: string 
          completed: boolean
          subject: string | null
          class_level: string | null 
          plan_type: string 
          created_at: string
          alarm_set_at: string | null 
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time?: string | null
          duration_minutes?: number | null
          due_date: string 
          completed?: boolean
          subject?: string | null
          class_level?: string | null
          plan_type: string
          created_at?: string
          alarm_set_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string | null
          duration_minutes?: number | null
          due_date?: string 
          completed?: boolean
          subject?: string | null
          class_level?: string | null
          plan_type?: string
          created_at?: string
          alarm_set_at?: string | null
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
      neet_guidelines: {
        Row: {
          id: string
          user_id: string
          tab_name: string
          content: string 
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tab_name: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tab_name?: string
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neet_guidelines_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          activity_type: string 
          description: string 
          details: Json | null 
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          description: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          description?: string
          details?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      custom_tasks: { 
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_tasks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_files: { 
        Row: {
          id: string
          user_id: string
          file_name: string
          file_path: string 
          file_type: string 
          size_bytes: number
          description: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_path: string
          file_type: string
          size_bytes: number
          description?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_path?: string
          file_type?: string
          size_bytes?: number
          description?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_files_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      dictionary_history: {
        Row: {
          id: string
          user_id: string
          word: string
          definition: string
          searched_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          definition: string
          searched_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word?: string
          definition?: string
          searched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dictionary_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      translation_history: {
        Row: {
          id: string
          user_id: string
          original_text: string
          translated_text: string
          source_language: string
          target_language: string
          translated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_text: string
          translated_text: string
          source_language: string
          target_language: string
          translated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_text?: string
          translated_text?: string
          source_language?: string
          target_language?: string
          translated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      calculator_history: {
        Row: {
          id: string
          user_id: string
          expression: string
          result: string
          calculated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expression: string
          result: string
          calculated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expression?: string
          result?: string
          calculated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calculator_history_user_id_fkey"
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
          question_image_data_uri: string | null 
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
          content_type: string 
          original_content_preview: string | null 
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
          session_id: string 
          role: "user" | "ai" | "ai-tips" 
          query: string | null 
          content: string 
          ai_answer: string | null 
          ai_study_tips: Json | null 
          context: string | null 
          preferences: string | null 
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          role: "user" | "ai" | "ai-tips"
          query?: string | null
          content: string
          ai_answer?: string | null
          ai_study_tips?: Json | null
          context?: string | null
          preferences?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          role?: "user" | "ai" | "ai-tips"
          query?: string | null
          content?: string
          ai_answer?: string | null
          ai_study_tips?: Json | null
          context?: string | null
          preferences?: string | null
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
      missions: {
        Row: {
          id: string;
          title: string;
          description: string;
          mission_type: "daily" | "weekly";
          reward_points: number;
          badge_id_reward: string | null; 
          is_active: boolean;
          created_at: string;
          target_value: number; 
          criteria_type: string; 
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          mission_type: "daily" | "weekly";
          reward_points: number;
          badge_id_reward?: string | null;
          is_active?: boolean;
          created_at?: string;
          target_value: number;
          criteria_type: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          mission_type?: "daily" | "weekly";
          reward_points?: number;
          badge_id_reward?: string | null;
          is_active?: boolean;
          created_at?: string;
          target_value?: number;
          criteria_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "missions_badge_id_reward_fkey";
            columns: ["badge_id_reward"];
            referencedRelation: "badges";
            referencedColumns: ["id"];
          }
        ];
      }
      user_missions: {
        Row: {
          id: string;
          user_id: string;
          mission_id: string;
          status: "locked" | "active" | "completed" | "failed";
          current_progress: number; 
          completed_at: string | null;
          started_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mission_id: string;
          status?: "locked" | "active" | "completed" | "failed";
          current_progress?: number;
          completed_at?: string | null;
          started_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mission_id?: string;
          status?: "locked" | "active" | "completed" | "failed";
          current_progress?: number;
          completed_at?: string | null;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_missions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_missions_mission_id_fkey";
            columns: ["mission_id"];
            referencedRelation: "missions";
            referencedColumns: ["id"];
          }
        ];
      }
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_name_or_url: string; 
          criteria: string; 
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon_name_or_url: string;
          criteria: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon_name_or_url?: string;
          criteria?: string;
          created_at?: string;
        };
        Relationships: [];
      }
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            referencedRelation: "badges";
            referencedColumns: ["id"];
          }
        ];
      }
      leaderboard_entries: {
        Row: {
          id: string;
          user_id: string;
          score: number; 
          rank: number | null;
          period: "daily" | "weekly" | "all_time";
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          rank?: number | null;
          period: "daily" | "weekly" | "all_time";
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score?: number;
          rank?: number | null;
          period?: "daily" | "weekly" | "all_time";
          last_updated?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users"; 
            referencedColumns: ["id"];
          }
        ];
      }
       ncert_books_metadata: { 
        Row: {
          id: string
          class_level: string 
          subject: string 
          book_name: string 
          chapters: Json 
          cover_image_url: string | null
        }
        Insert: {
          id?: string
          class_level: string
          subject: string
          book_name: string
          chapters: Json
          cover_image_url?: string | null
        }
        Update: {
          id?: string
          class_level?: string
          subject?: string
          book_name?: string
          chapters?: Json
          cover_image_url?: string | null
        }
        Relationships: []
      }
      user_ncert_notes: { 
        Row: {
          id: string
          user_id: string
          book_id: string 
          chapter_name: string 
          page_number: number | null 
          note_content: string 
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          chapter_name: string
          page_number?: number | null
          note_content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          chapter_name?: string
          page_number?: number | null
          note_content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ncert_notes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ncert_notes_book_id_fkey"
            columns: ["book_id"]
            referencedRelation: "ncert_books_metadata"
            referencedColumns: ["id"]
          }
        ]
      }
      game_metadata: {
        Row: {
          id: string; 
          title: string;
          description: string;
          genre: string;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          genre: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          genre?: string;
        };
        Relationships: [];
      }
      user_game_progress: {
        Row: {
          id: string; 
          user_id: string;
          game_id: string; 
          current_chapter: string | null; 
          current_room: string | null; 
          game_specific_state: Json | null; 
          score: number | null;
          last_played: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          current_chapter?: string | null;
          current_room?: string | null;
          game_specific_state?: Json | null;
          score?: number | null;
          last_played?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          current_chapter?: string | null;
          current_room?: string | null;
          game_specific_state?: Json | null;
          score?: number | null;
          last_played?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_game_progress_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_game_progress_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "game_metadata";
            referencedColumns: ["id"];
          }
        ];
      }
      game_leaderboard: { 
        Row: {
          id: string;
          user_id: string;
          game_id: string; 
          score: number;
          time_taken_seconds: number | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          score: number;
          time_taken_seconds?: number | null;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          score?: number;
          time_taken_seconds?: number | null;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_leaderboard_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_leaderboard_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "game_metadata";
            referencedColumns: ["id"];
          }
        ];
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
    
// Helper type for joined data, e.g. Quiz Attempts with Quiz Topic
export type QuizAttemptWithQuizTopic = Tables<'quiz_attempts'> & {
  quizzes: { topic: string | null, class_level: string | null, subject: string | null } | null; // Allow topic to be null
};


// Extending StudyRoomMessage to include profile information
export type StudyRoomMessageWithProfile = Tables<'study_room_messages'> & {
  profiles: { email: string | null; full_name: string | null; avatar_url: string | null } | null;
};

export type StudyPlanWithAlarm = Tables<'study_plans'>; 
export type Question = Tables<'questions'>;

// Game specific types
export type GameMetadata = Tables<'game_metadata'>;
export type UserGameProgress = Tables<'user_game_progress'>;
export type GameLeaderboardEntry = Tables<'game_leaderboard'>;

export interface ChronoMindState {
  currentChapter: 'intro' | 'chapter1' | 'chapter2' | 'chapter3' | 'chapter4' | 'chapter5' | 'completed';
  chapter1Progress: {
    kinematicsSolved: boolean;
    timeDilationSolved: boolean;
    projectileMotionSolved: boolean;
  };
  // Add more chapter progress states here
  // e.g. chapter2Progress: { puzzleA: boolean, puzzleB: boolean }
  playerChoices: Record<string, any>; // To store decisions that might affect story/puzzles
  memoryLossEvents: number; // Example of a game-specific stat
}

export interface NEETLabEscapeState {
  currentRoom: 'intro' | 'physics' | 'chemistry' | 'botany' | 'zoology' | 'final_hallway' | 'escaped' | 'failed';
  physicsPuzzlesSolved: boolean[]; // e.g., [false, false, false, false, false] for 5 puzzles
  chemistryPuzzlesSolved: boolean[];
  botanyPuzzlesSolved: boolean[];
  zoologyPuzzlesSolved: boolean[];
  masterLocksSolved: {
    physics: boolean;
    chemistry: boolean;
    botany: boolean;
    zoology: boolean;
  };
  remainingTime: number; // in seconds
  retriesUsed: number; // Count of incorrect attempts on major puzzles
  finalQuestionAnsweredCorrectly?: boolean; // For the final hallway
}

export type GameSpecificState = ChronoMindState | NEETLabEscapeState | Json; // Allow general Json for flexibility


// Type for AI Chat session preview on dashboard
export type ChatSessionPreview = {
  session_id: string;
  first_message_preview: string;
  last_message_at: string;
  user_id: string; 
};
