// Placeholder Database type. Replace with auto-generated types via:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
// once the schema is applied.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          mode: "solo" | "coop" | "race";
          difficulty: "easy" | "medium" | "hard" | "expert" | "extreme";
          puzzle: string;
          solution: string;
          current_board: string | null;
          status: "waiting" | "active" | "completed" | "abandoned";
          invite_code: string | null;
          created_by: string | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["games"]["Row"]> & {
          mode: Database["public"]["Tables"]["games"]["Row"]["mode"];
          difficulty: Database["public"]["Tables"]["games"]["Row"]["difficulty"];
          puzzle: string;
          solution: string;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Row"]>;
        Relationships: [];
      };
      game_players: {
        Row: {
          id: string;
          game_id: string;
          user_id: string | null;
          guest_id: string | null;
          display_name: string;
          finished_at: string | null;
          finish_time_ms: number | null;
          mistakes: number;
          progress_pct: number;
          joined_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["game_players"]["Row"]> & {
          game_id: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_players"]["Row"]>;
        Relationships: [];
      };
      player_progress: {
        Row: {
          player_id: string;
          board: string;
          updated_at: string;
        };
        Insert: { player_id: string; board: string };
        Update: { board?: string };
        Relationships: [];
      };
      friendships: {
        Row: {
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: { user_id: string; friend_id: string };
        Update: Partial<{ user_id: string; friend_id: string }>;
        Relationships: [];
      };
      friend_requests: {
        Row: {
          id: string;
          from_user: string;
          to_user: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          from_user: string;
          to_user: string;
          status?: "pending" | "accepted" | "declined";
        };
        Update: { status?: "pending" | "accepted" | "declined" };
        Relationships: [];
      };
      scores: {
        Row: {
          id: string;
          user_id: string;
          difficulty: "easy" | "medium" | "hard" | "expert" | "extreme";
          mode: "solo" | "coop" | "race";
          score: number;
          elapsed_ms: number;
          mistakes: number;
          hints_used: number;
          game_id: string | null;
          daily_date: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          difficulty: "easy" | "medium" | "hard" | "expert" | "extreme";
          mode: "solo" | "coop" | "race";
          score: number;
          elapsed_ms: number;
          mistakes?: number;
          hints_used?: number;
          game_id?: string | null;
          daily_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["scores"]["Row"]>;
        Relationships: [];
      };
      daily_puzzles: {
        Row: {
          date: string;
          difficulty: "easy" | "medium" | "hard" | "expert" | "extreme";
          puzzle: string;
          solution: string;
          created_at: string;
        };
        Insert: {
          date: string;
          difficulty: "easy" | "medium" | "hard" | "expert" | "extreme";
          puzzle: string;
          solution: string;
        };
        Update: never;
        Relationships: [];
      };
      game_invites: {
        Row: {
          id: string;
          game_id: string;
          from_user: string;
          to_user: string;
          status: "pending" | "accepted" | "declined" | "expired";
          created_at: string;
        };
        Insert: {
          game_id: string;
          from_user: string;
          to_user: string;
          status?: "pending" | "accepted" | "declined" | "expired";
        };
        Update: { status?: "pending" | "accepted" | "declined" | "expired" };
        Relationships: [];
      };
      cell_locks: {
        Row: {
          game_id: string;
          cell_index: number;
          locked_by: string;
          expires_at: string;
        };
        Insert: {
          game_id: string;
          cell_index: number;
          locked_by: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["cell_locks"]["Row"]>;
        Relationships: [];
      };
      moves: {
        Row: {
          id: number;
          game_id: string;
          player_id: string;
          cell_index: number;
          value: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["moves"]["Row"], "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
