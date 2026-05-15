export interface FBPage {
  id: number;
  page_id: string;
  page_name: string;
  is_active: boolean;
  distribution_mode: 'manual' | 'round_robin' | 'ai_first';
  dify_api_key?: string;
  assigned_users?: string[];
}

export interface Conversation {
  id: number;
  page_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string | null;
  avatarUrl?: string | null;
  last_message: string;
  last_message_at: string;
  is_human_intervened: boolean;
  ad_id?: string;
  campaign_name?: string;
  ad_cost?: number;
  unread_count: number;
  assigned_to?: string;
  profile_link?: string;
  ad_image?: string;
  ad_message?: string;
  customer_note?: string;
}

export interface Message {
  id: number;
  sender_type: 'user' | 'ai' | 'human';
  message_text: string;
  ai_translation?: string | null;
  ai_translation_language?: string | null;
  translated_at?: string | null;
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
