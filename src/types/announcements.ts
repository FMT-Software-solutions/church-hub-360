export interface Announcement {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  is_deleted: boolean;
  created_by?: string | null;
  last_updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithMeta extends Announcement {
  slides_count?: number;
  created_by_name?: string | null;
}

export interface AnnouncementSlide {
  id: string;
  announcement_id: string;
  position: number;
  title?: string | null;
  content_html?: string | null;
  layout?: string | null;
  template_variant?: string | null;
  bg_color?: string | null;
  fg_color?: string | null;
  font_size?: number | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  description: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  description?: string;
}

export interface CreateSlideInput {
  announcement_id: string;
  position: number;
  title?: string;
  content_html?: string;
  layout?: string;
  template_variant?: string;
  bg_color?: string;
  fg_color?: string;
  font_size?: number;
}

export interface UpdateSlideInput extends Partial<CreateSlideInput> {}

