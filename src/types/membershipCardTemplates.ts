import type { Organization, OrganizationWithRole } from "./organizations";

export interface MembershipCardTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // SVG or image path for preview
  category: 'modern' | 'classic' | 'minimal' | 'corporate';
}

export interface CardTemplateProps {
  member: {
    first_name: string;
    last_name: string;
    email?: string | null;
    membership_id: string;
    date_of_birth?: string | null;
    gender?: string | null;
    profile_image_url?: string | null;
    date_joined?: string | null;
  };
  organization: Organization | OrganizationWithRole;
  isDarkMode?: boolean;
}

export interface TemplateSelectionState {
  selectedTemplateId: string;
  organizationId: string;
}

// Available templates
export const MEMBERSHIP_CARD_TEMPLATES: MembershipCardTemplate[] = [
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    description: 'Clean design with gradient background and modern typography',
    preview: '/templates/modern-gradient.svg',
    category: 'modern',
  },
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    description: 'Traditional layout with professional appearance',
    preview: '/templates/classic-professional.svg',
    category: 'classic',
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple and clean design with focus on essential information',
    preview: '/templates/minimal-clean.svg',
    category: 'minimal',
  },
  {
    id: 'corporate-branded',
    name: 'Corporate Branded',
    description: 'Corporate style with prominent branding elements',
    preview: '/templates/corporate-branded.svg',
    category: 'corporate',
  },
  {
    id: 'elegant-card',
    name: 'Elegant Card',
    description: 'Sophisticated design with elegant typography and layout',
    preview: '/templates/elegant-card.svg',
    category: 'modern',
  },
];

// Default template
export const DEFAULT_TEMPLATE_ID = 'modern-gradient';

// Local storage key pattern
export const getTemplateStorageKey = (organizationId: string): string => 
  `membership-card-template-${organizationId}`;