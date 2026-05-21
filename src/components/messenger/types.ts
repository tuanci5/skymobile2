export interface FBPage {
  id: number;
  page_id: string;
  page_name: string;
  is_active: boolean;
  distribution_mode: 'manual' | 'round_robin' | 'ai_first';
  dify_api_key?: string;
  facebook_ad_account_id?: string | null;
  business_id?: string | null;
  assigned_users?: string[];
  assigned_ads_users?: string[];
  ai_reply_delay?: number;
  ai_start_hour?: number;
  ai_end_hour?: number;
}

export interface Conversation {
  id: number;
  page_id: string;
  page_name?: string | null;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string | null;
  avatarUrl?: string | null;
  last_message: string;
  last_message_at: string;
  is_human_intervened: boolean;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  creative_id?: string;
  ad_cost?: number;
  unread_count: number;
  assigned_to?: string;
  profile_link?: string;
  ad_image?: string;
  ad_message?: string;
  ad_permalink_url?: string;
  ad_source_status?: 'unknown' | 'ad_detected' | 'resolved' | 'permission_error' | 'fetch_error';
  ad_source_error?: string | null;
  ad_source_updated_at?: string | null;
  customer_note?: string;
  preferred_language_code?: string | null;
  preferred_language_label?: string | null;
  preferred_language_source?: 'manual' | 'detected' | 'fallback' | null;
  preferred_language_confidence?: number | null;
  preferred_language_updated_at?: string | null;
  manual_profile_url?: string | null;
  facebook_uid?: string | null;
  business_id?: string | null;
  customer_status?: string | null;
}

export interface ConversationAdSource {
  id: number;
  conversation_id: number;
  page_id: string;
  customer_id: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  creative_id?: string;
  ad_image?: string;
  ad_message?: string;
  ad_permalink_url?: string;
  source?: string;
  ref?: string;
  referer_uri?: string;
  status?: string;
  error_message?: string;
  first_seen_at: string;
  last_seen_at: string;
  click_count: number;
}

export interface Message {
  id: number;
  sender_type: 'user' | 'ai' | 'human';
  sender_name?: string | null;
  sender_email?: string | null;
  message_text: string;
  ai_translation?: string | null;
  ai_translation_language?: string | null;
  translated_at?: string | null;
  attachment_type?: 'image' | string | null;
  attachment_url?: string | null;
  attachment_proxy_url?: string | null;
  attachment_payload?: Record<string, any> | null;
  facebook_attachment_id?: string | null;
  created_at: string;
}

export interface ConversationNote {
  id: number;
  conversation_id: number;
  note_text: string;
  author_name?: string;
  author_email?: string;
  created_at: string;
}

export interface DetailedProduct {
  id: number;
  name: string;
  sale_price: number;
  import_price: number;
  import_date: string;
  seller: string;
  category: string;
  description: string;
  created_at: string;
}
