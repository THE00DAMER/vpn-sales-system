/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  password_plain?: string;
  display_name: string;
  telegram_id: string;
  role: 'admin' | 'superadmin';
  permissions: string[]; // JSON array parsed
  status: 'active' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  telegram_id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  language: 'en' | 'fa';
  status: 'active' | 'blocked';
  tags: string[]; // array of strings
  loyalty_points: number;
  total_trials_used: number;
  trial_limit: number;
  referral_code: string;
  referred_by: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  type: 'new_purchase' | 'renewal';
  status: 'pending_payment' | 'approved' | 'rejected' | 'completed';
  plan: string;
  location: string;
  discount_code: string | null;
  loyalty_points_used: number;
  total_amount: number;
  currency: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method_id: string;
  customer_id: number;
  receipt_file_path: string | null;
  tracking_ref: string;
  admin_id: number | null;
  status: 'submitted' | 'approved' | 'rejected';
  rejection_reason: string | null;
  notes: string;
  created_at: string;
  reviewed_at: string | null;
}

export interface Service {
  id: number;
  customer_id: number;
  order_id: number | null;
  service_name: string;
  status: 'active' | 'expired' | 'suspended';
  location: string;
  plan: string;
  traffic_limit: string;
  start_date: string;
  end_date: string;
  subscription_link_encrypted: string;
  protocol: string;
  config_remarks: string;
  admin_notes: string;
  reveal_count: number;
  last_link_health_check: string | null;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface TrialConfig {
  id: number;
  link_encrypted: string;
  location: string;
  validity_hours: number;
  max_usage_total: number;
  current_usage: number;
  status: 'unused' | 'used' | 'active';
  assigned_customer_id: number | null;
  assigned_order_id: number | null;
  requires_approval: number; // 0 or 1
  description: string;
  created_at: string;
}

export interface Tutorial {
  id: number;
  title_en: string;
  title_fa: string;
  description_en: string;
  description_fa: string;
  category: string;
  video_link: string;
  post_link: string;
  display_order: number;
  active: number; // 0 or 1
  created_at: string;
}

export interface SoftwareDownload {
  id: number;
  name: string;
  os: string;
  description_en: string;
  description_fa: string;
  direct_link: string;
  alt_link: string;
  official_link: string;
  version: string;
  active: number; // 0 or 1
  display_order: number;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  customer_id: number;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  assigned_admin_id: number | null;
  last_reply_at: string;
  created_at: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: 'admin' | 'user';
  sender_id: number;
  message: string;
  created_at: string;
}

export interface Broadcast {
  id: number;
  admin_id: number;
  filter_json: string;
  message_en: string;
  message_fa: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  admin_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface BackupRecord {
  id: number;
  file_path: string;
  size: number;
  type: 'manual' | 'auto';
  created_at: string;
}

export interface Referral {
  id: number;
  referrer_customer_id: number;
  referred_customer_id: number;
  status: 'joined' | 'purchased';
  reward_granted: number;
  created_at: string;
}

export interface Plan {
  id: number;
  name_en: string;
  name_fa: string;
  price_irr: number;
  price_usd: number;
  duration_months: number;
  traffic_limit_gb: number;
  active: boolean;
}

export interface DiscountCode {
  id: number;
  code: string;
  discount_percent: number;
  active: boolean;
  expires_at: string;
}

export interface SystemSettings {
  business_name: string;
  currency: string;
  timezone: string;
  maintenance_mode: {
    bot_global: boolean;
    message_en: string;
    message_fa: string;
  };
  payment_methods: Array<{
    id: string;
    name: string;
    active: boolean;
    details: string;
  }>;
  bot_token: string;
  bot_admin_id: string;
  bot_menu: {
    buttons: Array<{
      id: string;
      title_en: string;
      title_fa: string;
      callback: string;
      active: boolean;
    }>;
  };
  bot_texts: {
    welcome_en: string;
    welcome_fa: string;
    help_en: string;
    help_fa: string;
  };
  video_tutorial_url?: string;
  plans?: Plan[];
  discount_codes?: DiscountCode[];
}
