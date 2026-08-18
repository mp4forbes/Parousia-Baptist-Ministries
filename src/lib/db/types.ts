/**
 * Legacy `*_kreyol` property names are retained for database compatibility.
 * These properties now contain French-language content.
 */
export interface AdminRecord {
  id: number;
  email: string;
  created_at: string;
  password_hash?: string | null;
  is_super_admin?: number;
}

export interface AdminDevice {
  id: number;
  email: string;
  device_hash: string;
  verified: number;
  created_at: string;
}

export interface PrayerRequest {
  id: number;
  requester_name: string | null;
  request_text: string;
  is_anonymous: number;
  created_at: string;
}

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title_kreyol: string;
  title_english: string;
  content_kreyol: string;
  content_english: string;
  date: string;
  created_at: string;
}

export interface ServiceSchedule {
  id: number;
  day_kreyol: string;
  day_english: string;
  time: string;
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
  image_url?: string;
  is_livestreamed?: number;
}

export interface HaitiMission {
  id: number;
  title_kreyol: string;
  title_english: string;
  date: string;
  description_kreyol: string;
  description_english: string;
  image_url: string;
  funds_raised: number;
  funds_goal: number;
}

export interface LocalOutreach {
  id: number;
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
  schedule_kreyol: string;
  schedule_english: string;
}

export interface EventRecord {
  id: number;
  title_kreyol: string;
  title_english: string;
  date: string;
  end_date?: string;
  time: string;
  location_kreyol: string;
  location_english: string;
  description_kreyol: string;
  description_english: string;
  images_json?: string;
  registration_type?: string;
  payment_required?: number | boolean;
  payment_amount?: string;
  payment_zelle_name?: string;
  payment_zelle_phone?: string;
  payment_instructions_english?: string;
  payment_instructions_kreyol?: string;
}

export interface Registration {
  id: number;
  event_id: number;
  event_title_kreyol?: string;
  event_title_english?: string;
  event_registration_type?: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  responses_json?: string;
  payment_status?: string;
  event_payment_required?: number | boolean;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface DailyDevotional {
  id: number;
  date: string;
  verse_ref_english: string;
  verse_ref_kreyol: string;
  verse_text_english: string;
  verse_text_kreyol: string;
  lesson_english: string;
  lesson_kreyol: string;
  status: 'pending' | 'approved';
}

export interface Sermon {
  id: number;
  title_kreyol: string;
  title_english: string;
  date: string;
  speaker: string;
  youtube_id: string;
  description_kreyol: string;
  description_english: string;
}

export interface KnowledgeBaseItem {
  id: number;
  title: string;
  type: string;
  url: string;
  created_at: string;
}

export interface Ministry {
  slug: string;
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
  image_url: string;
  bullets_kreyol: string;
  bullets_english: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notification_emails?: string;
  google_sheet_id?: string;
}

export interface MinistrySignup {
  id: number;
  ministry_slug: string;
  name: string;
  email: string;
  phone: string | null;
  responses: string;
  created_at: string;
}

export interface AdminSectionConfig {
  section_slug: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notification_emails: string;
}

export interface AdministrativeCareCategory {
  slug: string;
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
  images_json?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notification_emails?: string;
}

export interface AdministrativeCareSubmission {
  id: number;
  category_slug: string;
  name: string;
  email: string;
  phone: string | null;
  responses: string;
  language: string;
  created_at: string;
}
