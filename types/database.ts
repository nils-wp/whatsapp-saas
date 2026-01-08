export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string | null
          plan: string
          plan_limits: Json
          trial_ends_at: string | null
          subscription_status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id?: string | null
          plan?: string
          plan_limits?: Json
          trial_ends_at?: string | null
          subscription_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string | null
          plan?: string
          plan_limits?: Json
          trial_ends_at?: string | null
          subscription_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenant_members: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          role: string
          invited_email: string | null
          invited_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          role?: string
          invited_email?: string | null
          invited_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          role?: string
          invited_email?: string | null
          invited_at?: string
          accepted_at?: string | null
        }
      }
      whatsapp_accounts: {
        Row: {
          id: string
          tenant_id: string
          instance_name: string
          instance_id: string | null
          phone_number: string | null
          status: string
          qr_code: string | null
          qr_expires_at: string | null
          daily_limit: number
          messages_sent_today: number
          warmup_day: number
          last_message_at: string | null
          display_name: string | null
          profile_picture_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          instance_name: string
          instance_id?: string | null
          phone_number?: string | null
          status?: string
          qr_code?: string | null
          qr_expires_at?: string | null
          daily_limit?: number
          messages_sent_today?: number
          warmup_day?: number
          last_message_at?: string | null
          display_name?: string | null
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          instance_name?: string
          instance_id?: string | null
          phone_number?: string | null
          status?: string
          qr_code?: string | null
          qr_expires_at?: string | null
          daily_limit?: number
          messages_sent_today?: number
          warmup_day?: number
          last_message_at?: string | null
          display_name?: string | null
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          is_active: boolean
          agent_name: string
          colleague_name: string | null
          company_info: string | null
          calendly_link: string | null
          booking_cta: string
          script_steps: Json
          faq_entries: Json
          escalation_topics: string[]
          escalation_message: string
          disqualify_criteria: string[]
          disqualify_message: string
          response_delay_min: number
          response_delay_max: number
          max_messages_per_conversation: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          is_active?: boolean
          agent_name: string
          colleague_name?: string | null
          company_info?: string | null
          calendly_link?: string | null
          booking_cta?: string
          script_steps?: Json
          faq_entries?: Json
          escalation_topics?: string[]
          escalation_message?: string
          disqualify_criteria?: string[]
          disqualify_message?: string
          response_delay_min?: number
          response_delay_max?: number
          max_messages_per_conversation?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          agent_name?: string
          colleague_name?: string | null
          company_info?: string | null
          calendly_link?: string | null
          booking_cta?: string
          script_steps?: Json
          faq_entries?: Json
          escalation_topics?: string[]
          escalation_message?: string
          disqualify_criteria?: string[]
          disqualify_message?: string
          response_delay_min?: number
          response_delay_max?: number
          max_messages_per_conversation?: number
          created_at?: string
          updated_at?: string
        }
      }
      triggers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          is_active: boolean
          type: string
          webhook_id: string
          webhook_secret: string
          external_config: Json | null
          whatsapp_account_id: string | null
          agent_id: string | null
          first_message: string
          first_message_delay_seconds: number
          total_triggered: number
          total_conversations: number
          total_bookings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          is_active?: boolean
          type: string
          webhook_id?: string
          webhook_secret?: string
          external_config?: Json | null
          whatsapp_account_id?: string | null
          agent_id?: string | null
          first_message: string
          first_message_delay_seconds?: number
          total_triggered?: number
          total_conversations?: number
          total_bookings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          is_active?: boolean
          type?: string
          webhook_id?: string
          webhook_secret?: string
          external_config?: Json | null
          whatsapp_account_id?: string | null
          agent_id?: string | null
          first_message?: string
          first_message_delay_seconds?: number
          total_triggered?: number
          total_conversations?: number
          total_bookings?: number
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          tenant_id: string
          whatsapp_account_id: string | null
          agent_id: string | null
          trigger_id: string | null
          contact_phone: string
          contact_name: string | null
          contact_push_name: string | null
          external_lead_id: string | null
          status: string
          current_script_step: number
          escalated_at: string | null
          escalation_reason: string | null
          escalated_to: string | null
          outcome: string | null
          booked_at: string | null
          last_message_at: string | null
          last_agent_message_at: string | null
          last_contact_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          whatsapp_account_id?: string | null
          agent_id?: string | null
          trigger_id?: string | null
          contact_phone: string
          contact_name?: string | null
          contact_push_name?: string | null
          external_lead_id?: string | null
          status?: string
          current_script_step?: number
          escalated_at?: string | null
          escalation_reason?: string | null
          escalated_to?: string | null
          outcome?: string | null
          booked_at?: string | null
          last_message_at?: string | null
          last_agent_message_at?: string | null
          last_contact_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          whatsapp_account_id?: string | null
          agent_id?: string | null
          trigger_id?: string | null
          contact_phone?: string
          contact_name?: string | null
          contact_push_name?: string | null
          external_lead_id?: string | null
          status?: string
          current_script_step?: number
          escalated_at?: string | null
          escalation_reason?: string | null
          escalated_to?: string | null
          outcome?: string | null
          booked_at?: string | null
          last_message_at?: string | null
          last_agent_message_at?: string | null
          last_contact_message_at?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          tenant_id: string
          conversation_id: string
          direction: string
          sender_type: string
          content: string
          whatsapp_message_id: string | null
          message_type: string
          media_url: string | null
          agent_action: string | null
          script_step_used: number | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          conversation_id: string
          direction: string
          sender_type: string
          content: string
          whatsapp_message_id?: string | null
          message_type?: string
          media_url?: string | null
          agent_action?: string | null
          script_step_used?: number | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          conversation_id?: string
          direction?: string
          sender_type?: string
          content?: string
          whatsapp_message_id?: string | null
          message_type?: string
          media_url?: string | null
          agent_action?: string | null
          script_step_used?: number | null
          status?: string
          created_at?: string
        }
      }
      message_queue: {
        Row: {
          id: string
          tenant_id: string
          conversation_id: string | null
          queue_type: string
          status: string
          priority: number
          original_message: string
          reason: string | null
          suggested_response: string | null
          resolved_by: string | null
          resolved_at: string | null
          resolution_message: string | null
          scheduled_for: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          conversation_id?: string | null
          queue_type: string
          status?: string
          priority?: number
          original_message: string
          reason?: string | null
          suggested_response?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_message?: string | null
          scheduled_for?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          conversation_id?: string | null
          queue_type?: string
          status?: string
          priority?: number
          original_message?: string
          reason?: string | null
          suggested_response?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_message?: string | null
          scheduled_for?: string | null
          created_at?: string
        }
      }
      tenant_settings: {
        Row: {
          id: string
          tenant_id: string
          office_hours_enabled: boolean
          office_start: string
          office_end: string
          work_days: number[]
          timezone: string
          notify_on_escalation: boolean
          notify_on_booking: boolean
          notification_email: string | null
          slack_webhook_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          office_hours_enabled?: boolean
          office_start?: string
          office_end?: string
          work_days?: number[]
          timezone?: string
          notify_on_escalation?: boolean
          notify_on_booking?: boolean
          notification_email?: string | null
          slack_webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          office_hours_enabled?: boolean
          office_start?: string
          office_end?: string
          work_days?: number[]
          timezone?: string
          notify_on_escalation?: boolean
          notify_on_booking?: boolean
          notification_email?: string | null
          slack_webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics_daily: {
        Row: {
          id: string
          tenant_id: string
          whatsapp_account_id: string | null
          date: string
          messages_sent: number
          messages_received: number
          conversations_started: number
          conversations_completed: number
          escalations: number
          bookings: number
        }
        Insert: {
          id?: string
          tenant_id: string
          whatsapp_account_id?: string | null
          date: string
          messages_sent?: number
          messages_received?: number
          conversations_started?: number
          conversations_completed?: number
          escalations?: number
          bookings?: number
        }
        Update: {
          id?: string
          tenant_id?: string
          whatsapp_account_id?: string | null
          date?: string
          messages_sent?: number
          messages_received?: number
          conversations_started?: number
          conversations_completed?: number
          escalations?: number
          bookings?: number
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          icon: string
          is_featured: boolean
          is_active: boolean
          conversion_rate: number
          active_users: number
          personality: string | null
          goal: string | null
          script_steps: Json
          faq_entries: Json
          escalation_keywords: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          icon?: string
          is_featured?: boolean
          is_active?: boolean
          conversion_rate?: number
          active_users?: number
          personality?: string | null
          goal?: string | null
          script_steps?: Json
          faq_entries?: Json
          escalation_keywords?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          icon?: string
          is_featured?: boolean
          is_active?: boolean
          conversion_rate?: number
          active_users?: number
          personality?: string | null
          goal?: string | null
          script_steps?: Json
          faq_entries?: Json
          escalation_keywords?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_messages_sent: {
        Args: { p_instance_name: string }
        Returns: void
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
