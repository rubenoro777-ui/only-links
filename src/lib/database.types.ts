/**
 * Hand-written to mirror the SQL in `supabase/migrations`.
 */

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
          handle: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          theme: string;
          socials: Json;
          stripe_customer_id: string | null;
          stripe_connect_account_id: string | null;
          stripe_connect_charges_enabled: boolean;
          stripe_connect_payouts_enabled: boolean;
          stripe_connect_details_submitted: boolean;
          subscription_status: string;
          subscription_id: string | null;
          custom_bg: string | null;
          custom_accent: string | null;
          custom_text: string | null;
          custom_font: string | null;
          custom_css: string | null;
          custom_domain: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          theme?: string;
          socials?: Json;
          stripe_customer_id?: string | null;
          stripe_connect_account_id?: string | null;
          stripe_connect_charges_enabled?: boolean;
          stripe_connect_payouts_enabled?: boolean;
          stripe_connect_details_submitted?: boolean;
          subscription_status?: string;
          subscription_id?: string | null;
          custom_bg?: string | null;
          custom_accent?: string | null;
          custom_text?: string | null;
          custom_font?: string | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          handle?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          theme?: string;
          socials?: Json;
          stripe_customer_id?: string | null;
          stripe_connect_account_id?: string | null;
          stripe_connect_charges_enabled?: boolean;
          stripe_connect_payouts_enabled?: boolean;
          stripe_connect_details_submitted?: boolean;
          subscription_status?: string;
          subscription_id?: string | null;
          custom_bg?: string | null;
          custom_accent?: string | null;
          custom_text?: string | null;
          custom_font?: string | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      links: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          url: string;
          position: number;
          is_locked: boolean;
          price_cents: number | null;
          access_ttl_minutes: number;
          archived_at: string | null;
          section_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          url: string;
          position?: number;
          is_locked?: boolean;
          price_cents?: number | null;
          access_ttl_minutes?: number;
          archived_at?: string | null;
          section_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          url?: string;
          position?: number;
          is_locked?: boolean;
          price_cents?: number | null;
          access_ttl_minutes?: number;
          archived_at?: string | null;
          section_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "links_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "links_section_id_fkey";
            columns: ["section_id"];
            referencedRelation: "link_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      link_sections: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          position: number;
          collapsed_by_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          position?: number;
          collapsed_by_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          position?: number;
          collapsed_by_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "link_sections_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      click_events: {
        Row: {
          id: string;
          link_id: string;
          referrer: string | null;
          visitor_id: string | null;
          country: string | null;
          city: string | null;
          device_type: string | null;
          browser: string | null;
          os: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          referrer?: string | null;
          visitor_id?: string | null;
          country?: string | null;
          city?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          referrer?: string | null;
          visitor_id?: string | null;
          country?: string | null;
          city?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "click_events_link_id_fkey";
            columns: ["link_id"];
            referencedRelation: "links";
            referencedColumns: ["id"];
          },
        ];
      };
      page_views: {
        Row: {
          id: string;
          profile_id: string;
          visitor_id: string | null;
          referrer: string | null;
          country: string | null;
          device_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          visitor_id?: string | null;
          referrer?: string | null;
          country?: string | null;
          device_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          visitor_id?: string | null;
          referrer?: string | null;
          country?: string | null;
          device_type?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_views_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      link_unlocks: {
        Row: {
          id: string;
          link_id: string;
          stripe_session_id: string;
          visitor_id: string | null;
          email: string | null;
          access_token: string;
          expires_at: string;
          redeemed_at: string | null;
          revoked_at: string | null;
          platform_fee_cents: number | null;
          creator_net_cents: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          stripe_session_id: string;
          visitor_id?: string | null;
          email?: string | null;
          access_token?: string;
          expires_at?: string;
          redeemed_at?: string | null;
          revoked_at?: string | null;
          platform_fee_cents?: number | null;
          creator_net_cents?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          stripe_session_id?: string;
          visitor_id?: string | null;
          email?: string | null;
          access_token?: string;
          expires_at?: string;
          redeemed_at?: string | null;
          revoked_at?: string | null;
          platform_fee_cents?: number | null;
          creator_net_cents?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "link_unlocks_link_id_fkey";
            columns: ["link_id"];
            referencedRelation: "links";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      has_link_unlock: {
        Args: { p_link_id: string; p_visitor_id: string };
        Returns: boolean;
      };
      redeem_link_access_token: {
        Args: { p_link_id: string; p_access_token: string };
        Returns: boolean;
      };
      validate_link_access_cookie: {
        Args: { p_link_id: string; p_access_token: string };
        Returns: boolean;
      };
      get_link_access_token_for_visitor: {
        Args: { p_link_id: string; p_visitor_id: string };
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type Profile = Tables<"profiles">;
export type Link = Tables<"links">;
export type LinkSection = Tables<"link_sections">;
