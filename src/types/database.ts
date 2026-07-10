// These types mirror supabase/schema.sql. Once your Supabase project is live, regenerate
// with the CLI for a source of truth that can't drift:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts

export interface Database {
  // Required by current @supabase/ssr / postgrest-js generics.
  __InternalSupabase: {
    PostgrestVersion: string;
  };
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          diet_type: "vegetarian" | "vegan" | "non_vegetarian";
          activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
          height_cm: number | null;
          weight_kg: number | null;
          age: number | null;
          gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
          allergies: string[];
          units: "metric" | "imperial";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      Relationships: never[];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          calorie_target: number;
          protein_target_g: number;
          carb_target_g: number;
          fat_target_g: number;
          fibre_target_g: number;
          water_target_ml: number;
          goal_weight_kg: number | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["goals"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
      Relationships: never[];
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          meal_image_id: string | null;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
          source: "photo" | "manual" | "voice" | "barcode";
          raw_input: string | null;
          detected_items: Array<{ name: string; quantity?: string; confidence?: number }>;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          fibre_g: number;
          sugar_g: number;
          sodium_mg: number;
          confidence: number | null;
          ai_explanation: string | null;
          logged_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["meal_logs"]["Row"]> & {
          user_id: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
        };
        Update: Partial<Database["public"]["Tables"]["meal_logs"]["Row"]>;
      Relationships: never[];
      };
      meal_images: {
        Row: { id: string; user_id: string; storage_path: string; created_at: string };
        Insert: { user_id: string; storage_path: string };
        Update: Partial<{ storage_path: string }>;
      Relationships: never[];
      };
      daily_totals: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          fibre_g: number;
          water_ml: number;
        };
        Insert: Partial<Database["public"]["Tables"]["daily_totals"]["Row"]> & {
          user_id: string;
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_totals"]["Row"]>;
      Relationships: never[];
      };
      weight_logs: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          unit: "kg" | "lb";
          measured_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weight_logs"]["Row"]> & {
          user_id: string;
          weight: number;
        };
        Update: Partial<Database["public"]["Tables"]["weight_logs"]["Row"]>;
      Relationships: never[];
      };
      health_metrics: {
        Row: {
          id: string;
          user_id: string;
          metric: string;
          value: number;
          unit: string;
          source: string;
          recorded_at: string;
          recorded_date: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["health_metrics"]["Row"]> & {
          user_id: string;
          metric: string;
          value: number;
          unit: string;
          source: string;
          recorded_at: string;
          recorded_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["health_metrics"]["Row"]>;
      Relationships: never[];
      };
      ai_feedback: {
        Row: {
          id: string;
          user_id: string;
          period: "daily" | "weekly";
          summary: string;
          recommendations: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_feedback"]["Row"]> & {
          user_id: string;
          period: "daily" | "weekly";
          summary: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_feedback"]["Row"]>;
      Relationships: never[];
      };
      settings: {
        Row: {
          user_id: string;
          dark_mode: boolean;
          notifications: Record<string, boolean>;
          updated_at: string;
          health_connected: boolean;
          health_sync_token_hash: string | null;
          health_last_sync_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["settings"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
      Relationships: never[];
      };
      workout_logs: {
        Row: {
          id: string;
          user_id: string;
          workout_type:
            | "walking" | "running" | "elliptical" | "cycling" | "swimming"
            | "strength_training" | "hiit" | "yoga" | "rowing" | "hiking"
            | "sports" | "other";
          date: string;
          start_time: string;
          duration_minutes: number;
          calories_burned: number;
          source: "manual" | "apple_health";
          health_workout_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_logs"]["Row"]> & {
          user_id: string;
          workout_type: Database["public"]["Tables"]["workout_logs"]["Row"]["workout_type"];
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_logs"]["Row"]>;
      Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
