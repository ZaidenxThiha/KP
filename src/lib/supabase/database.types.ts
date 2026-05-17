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
      api_sync_logs: {
        Row: {
          created_at: string
          endpoint: string | null
          error_message: string | null
          id: string
          response_status: number | null
          rows_affected: number | null
          success: boolean
          sync_type: string
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          response_status?: number | null
          rows_affected?: number | null
          success?: boolean
          sync_type: string
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          response_status?: number | null
          rows_affected?: number | null
          success?: boolean
          sync_type?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          new_value: Json | null
          note: string | null
          old_value: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      external_draws: {
        Row: {
          created_at: string
          draw_date: string
          draw_name: string | null
          external_draw_id: string
          fetched_at: string
          game_type: string
          id: string
          market: string
          raw_payload: Json | null
          result_number: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          draw_date: string
          draw_name?: string | null
          external_draw_id: string
          fetched_at?: string
          game_type: string
          id?: string
          market?: string
          raw_payload?: Json | null
          result_number?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          draw_date?: string
          draw_name?: string | null
          external_draw_id?: string
          fetched_at?: string
          game_type?: string
          id?: string
          market?: string
          raw_payload?: Json | null
          result_number?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          admin_approval_required: boolean
          api_result_mode: string
          auto_settle_enabled: boolean
          daily_claim_amount: number
          daily_claim_enabled: boolean
          default_close_before_minutes: number
          free_mode_enabled: boolean
          id: string
          new_player_bonus_amount: number
          new_player_bonus_enabled: boolean
          rapidapi_calendar_fallback_path: string | null
          rapidapi_calendar_path: string | null
          rapidapi_results_path: string | null
          updated_at: string
        }
        Insert: {
          admin_approval_required?: boolean
          api_result_mode?: string
          auto_settle_enabled?: boolean
          daily_claim_amount?: number
          daily_claim_enabled?: boolean
          default_close_before_minutes?: number
          free_mode_enabled?: boolean
          id?: string
          new_player_bonus_amount?: number
          new_player_bonus_enabled?: boolean
          rapidapi_calendar_fallback_path?: string | null
          rapidapi_calendar_path?: string | null
          rapidapi_results_path?: string | null
          updated_at?: string
        }
        Update: {
          admin_approval_required?: boolean
          api_result_mode?: string
          auto_settle_enabled?: boolean
          daily_claim_amount?: number
          daily_claim_enabled?: boolean
          default_close_before_minutes?: number
          free_mode_enabled?: boolean
          id?: string
          new_player_bonus_amount?: number
          new_player_bonus_enabled?: boolean
          rapidapi_calendar_fallback_path?: string | null
          rapidapi_calendar_path?: string | null
          rapidapi_results_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guesses: {
        Row: {
          created_at: string
          game_type: string
          guess_number: string
          id: string
          payout_mode_snapshot: string
          points_used: number
          possible_win_amount: number
          round_id: string
          settled_at: string | null
          status: string
          user_id: string
          winning_rate_snapshot: number
        }
        Insert: {
          created_at?: string
          game_type: string
          guess_number: string
          id?: string
          payout_mode_snapshot: string
          points_used: number
          possible_win_amount: number
          round_id: string
          settled_at?: string | null
          status?: string
          user_id: string
          winning_rate_snapshot: number
        }
        Update: {
          created_at?: string
          game_type?: string
          guess_number?: string
          id?: string
          payout_mode_snapshot?: string
          points_used?: number
          possible_win_amount?: number
          round_id?: string
          settled_at?: string | null
          status?: string
          user_id?: string
          winning_rate_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "guesses_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      number_limit_rules: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          game_type: string
          id: string
          market: string
          max_points: number
          rule_type: string
          rule_value: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          game_type: string
          id?: string
          market?: string
          max_points: number
          rule_type: string
          rule_value?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          game_type?: string
          id?: string
          market?: string
          max_points?: number
          rule_type?: string
          rule_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "number_limit_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "number_limit_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      officer_limits: {
        Row: {
          can_grant_welcome_bonus: boolean
          created_at: string
          daily_give_limit: number | null
          max_give_per_player: number | null
          officer_id: string
          updated_at: string
        }
        Insert: {
          can_grant_welcome_bonus?: boolean
          created_at?: string
          daily_give_limit?: number | null
          max_give_per_player?: number | null
          officer_id: string
          updated_at?: string
        }
        Update: {
          can_grant_welcome_bonus?: boolean
          created_at?: string
          daily_give_limit?: number | null
          max_give_per_player?: number | null
          officer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "officer_limits_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officer_limits_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: true
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      payout_settings: {
        Row: {
          active: boolean
          apply_to: string
          created_at: string
          created_by: string | null
          game_type: string
          id: string
          market: string
          payout_mode: string
          round_name: string
          winning_rate: number
        }
        Insert: {
          active?: boolean
          apply_to?: string
          created_at?: string
          created_by?: string | null
          game_type: string
          id?: string
          market?: string
          payout_mode: string
          round_name?: string
          winning_rate: number
        }
        Update: {
          active?: boolean
          apply_to?: string
          created_at?: string
          created_by?: string | null
          game_type?: string
          id?: string
          market?: string
          payout_mode?: string
          round_name?: string
          winning_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "payout_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          direction: string
          from_user_id: string | null
          id: string
          note: string | null
          related_guess_id: string | null
          related_round_id: string | null
          to_user_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          direction: string
          from_user_id?: string | null
          id?: string
          note?: string | null
          related_guess_id?: string | null
          related_round_id?: string | null
          to_user_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          direction?: string
          from_user_id?: string | null
          id?: string
          note?: string | null
          related_guess_id?: string | null
          related_round_id?: string | null
          to_user_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
          {
            foreignKeyName: "point_transactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
          {
            foreignKeyName: "point_transactions_related_guess_id_fkey"
            columns: ["related_guess_id"]
            isOneToOne: false
            referencedRelation: "guesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_related_round_id_fkey"
            columns: ["related_round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      profiles: {
        Row: {
          assigned_officer_id: string | null
          auth_user_id: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          points_balance: number
          role: string
          status: string
          updated_at: string
          username: string
        }
        Insert: {
          assigned_officer_id?: string | null
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          points_balance?: number
          role: string
          status?: string
          updated_at?: string
          username: string
        }
        Update: {
          assigned_officer_id?: string | null
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          points_balance?: number
          role?: string
          status?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      rounds: {
        Row: {
          api_result_number: string | null
          close_time: string
          created_at: string
          created_by: string | null
          external_draw_ref: string | null
          final_result_number: string | null
          game_type: string
          id: string
          manual_result_number: string | null
          market: string
          open_time: string | null
          result_source: string | null
          round_date: string
          round_name: string
          status: string
          updated_at: string
        }
        Insert: {
          api_result_number?: string | null
          close_time: string
          created_at?: string
          created_by?: string | null
          external_draw_ref?: string | null
          final_result_number?: string | null
          game_type: string
          id?: string
          manual_result_number?: string | null
          market?: string
          open_time?: string | null
          result_source?: string | null
          round_date: string
          round_name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          api_result_number?: string | null
          close_time?: string
          created_at?: string
          created_by?: string | null
          external_draw_ref?: string | null
          final_result_number?: string | null
          game_type?: string
          id?: string
          manual_result_number?: string | null
          market?: string
          open_time?: string | null
          result_source?: string | null
          round_date?: string
          round_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
          {
            foreignKeyName: "rounds_external_draw_ref_fkey"
            columns: ["external_draw_ref"]
            isOneToOne: false
            referencedRelation: "external_draws"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_admin_dashboard_stats: {
        Row: {
          officers: number | null
          payouts_today: number | null
          pending_guesses: number | null
          player_points: number | null
          players: number | null
          rounds_today: number | null
          stakes_today: number | null
        }
        Relationships: []
      }
      v_daily_pnl: {
        Row: {
          day: string | null
          payouts: number | null
          stakes: number | null
        }
        Relationships: []
      }
      v_number_exposure: {
        Row: {
          game_type: string | null
          guess_count: number | null
          guess_number: string | null
          round_id: string | null
          round_name: string | null
          total_exposure: number | null
          total_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guesses_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      v_officer_distribution: {
        Row: {
          given_today: number | null
          given_total: number | null
          officer_id: string | null
          username: string | null
        }
        Relationships: []
      }
      v_winning_rate_history: {
        Row: {
          active: boolean | null
          apply_to: string | null
          changed_by_username: string | null
          created_at: string | null
          created_by: string | null
          game_type: string | null
          id: string | null
          market: string | null
          payout_mode: string | null
          round_name: string | null
          winning_rate: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_officer_distribution"
            referencedColumns: ["officer_id"]
          },
        ]
      }
    }
    Functions: {
      admin_grant_points_to_officer: {
        Args: { p_amount: number; p_note?: string; p_officer_id: string }
        Returns: Json
      }
      admin_set_officer_limits: {
        Args: {
          p_can_grant_welcome_bonus?: boolean
          p_daily_give_limit?: number
          p_max_give_per_player?: number
          p_officer_id: string
        }
        Returns: {
          can_grant_welcome_bonus: boolean
          created_at: string
          daily_give_limit: number | null
          max_give_per_player: number | null
          officer_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "officer_limits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      app_error: {
        Args: { p_code: string; p_detail?: Json }
        Returns: undefined
      }
      apply_new_player_bonus: {
        Args: { p_player_id: string; p_with_bonus?: boolean }
        Returns: Json
      }
      approve_settlement: {
        Args: { p_round_id: string }
        Returns: {
          api_result_number: string | null
          close_time: string
          created_at: string
          created_by: string | null
          external_draw_ref: string | null
          final_result_number: string | null
          game_type: string
          id: string
          manual_result_number: string | null
          market: string
          open_time: string | null
          result_source: string | null
          round_date: string
          round_name: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auth_role: { Args: never; Returns: string }
      cancel_round_and_refund: {
        Args: { p_reason: string; p_round_id: string }
        Returns: Json
      }
      check_ledger_integrity: {
        Args: never
        Returns: {
          ledger_balance: number
          profile_balance: number
          user_id: string
        }[]
      }
      close_due_rounds: { Args: never; Returns: number }
      create_daily_2d_rounds: { Args: { p_date?: string }; Returns: number }
      create_manual_round: {
        Args: {
          p_close_time: string
          p_game_type: string
          p_market?: string
          p_open_time?: string
          p_round_date: string
          p_round_name?: string
        }
        Returns: {
          api_result_number: string | null
          close_time: string
          created_at: string
          created_by: string | null
          external_draw_ref: string | null
          final_result_number: string | null
          game_type: string
          id: string
          manual_result_number: string | null
          market: string
          open_time: string | null
          result_source: string | null
          round_date: string
          round_name: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_number_limit_rule: {
        Args: {
          p_game_type: string
          p_market: string
          p_max_points: number
          p_rule_type: string
          p_rule_value: Json
        }
        Returns: {
          active: boolean
          created_at: string
          created_by: string | null
          game_type: string
          id: string
          market: string
          max_points: number
          rule_type: string
          rule_value: Json
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "number_limit_rules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_profile_id: { Args: never; Returns: string }
      ensure_officer_limits: {
        Args: {
          p_daily_give_limit?: number
          p_max_give_per_player?: number
          p_officer_id: string
        }
        Returns: {
          can_grant_welcome_bonus: boolean
          created_at: string
          daily_give_limit: number | null
          max_give_per_player: number | null
          officer_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "officer_limits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      enter_manual_result: {
        Args: { p_note?: string; p_result_number: string; p_round_id: string }
        Returns: {
          api_result_number: string | null
          close_time: string
          created_at: string
          created_by: string | null
          external_draw_ref: string | null
          final_result_number: string | null
          game_type: string
          id: string
          manual_result_number: string | null
          market: string
          open_time: string | null
          result_source: string | null
          round_date: string
          round_name: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_officer_today_given: {
        Args: { p_officer_id: string }
        Returns: number
      }
      match_number_limit_rules: {
        Args: {
          p_game_type: string
          p_guess_number: string
          p_market: string
          p_round_id?: string
        }
        Returns: number
      }
      officer_give_points: {
        Args: { p_amount: number; p_note?: string; p_player_id: string }
        Returns: Json
      }
      officer_remove_points: {
        Args: { p_amount: number; p_note?: string; p_player_id: string }
        Returns: Json
      }
      place_guess: {
        Args: {
          p_guess_number: string
          p_points_used: number
          p_round_id: string
        }
        Returns: Json
      }
      record_audit: {
        Args: {
          p_action: string
          p_note?: string
          p_table: string
          p_target: string
        }
        Returns: undefined
      }
      require_player: {
        Args: never
        Returns: {
          assigned_officer_id: string | null
          auth_user_id: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          points_balance: number
          role: string
          status: string
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      require_role: {
        Args: { p_role: string }
        Returns: {
          assigned_officer_id: string | null
          auth_user_id: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          points_balance: number
          role: string
          status: string
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      run_auto_settlement: { Args: never; Returns: number }
      set_winning_rate: {
        Args: {
          p_apply_to?: string
          p_game_type: string
          p_market: string
          p_payout_mode: string
          p_round_name: string
          p_winning_rate: number
        }
        Returns: {
          active: boolean
          apply_to: string
          created_at: string
          created_by: string | null
          game_type: string
          id: string
          market: string
          payout_mode: string
          round_name: string
          winning_rate: number
        }
        SetofOptions: {
          from: "*"
          to: "payout_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      settle_round: { Args: { p_round_id: string }; Returns: Json }
      transition_round_status: {
        Args: { p_new_status: string; p_round_id: string }
        Returns: {
          api_result_number: string | null
          close_time: string
          created_at: string
          created_by: string | null
          external_draw_ref: string | null
          final_result_number: string | null
          game_type: string
          id: string
          manual_result_number: string | null
          market: string
          open_time: string | null
          result_source: string | null
          round_date: string
          round_name: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      trim_api_sync_logs: { Args: never; Returns: number }
      update_game_settings: {
        Args: { p_patch: Json }
        Returns: {
          admin_approval_required: boolean
          api_result_mode: string
          auto_settle_enabled: boolean
          daily_claim_amount: number
          daily_claim_enabled: boolean
          default_close_before_minutes: number
          free_mode_enabled: boolean
          id: string
          new_player_bonus_amount: number
          new_player_bonus_enabled: boolean
          rapidapi_calendar_fallback_path: string | null
          rapidapi_calendar_path: string | null
          rapidapi_results_path: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "game_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_number_limit_rule: {
        Args: { p_active?: boolean; p_max_points?: number; p_rule_id: string }
        Returns: {
          active: boolean
          created_at: string
          created_by: string | null
          game_type: string
          id: string
          market: string
          max_points: number
          rule_type: string
          rule_value: Json
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "number_limit_rules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      write_audit: {
        Args: {
          p_action: string
          p_new?: Json
          p_note?: string
          p_old?: Json
          p_table: string
          p_target: string
        }
        Returns: undefined
      }
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

