// ── Database row types ────────────────────────────────────────────────────

export interface Card {
  id: string;
  name: string;
  /** Optional line like "Best friend since uni". Added to the schema. */
  relationship: string | null;
  message: string;
  /** Theme key — see lib/themes.ts */
  theme: string;
  /** Already converted to Spotify embed URL on insert */
  spotify_url: string | null;
  /** Array of public Supabase Storage URLs */
  photo_urls: string[];
  approved: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      cards: {
        Row: Card;
        Insert: Omit<Card, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Card>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
