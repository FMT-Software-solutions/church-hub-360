export { ModernGradientTemplate } from './ModernGradientTemplate';
export { ClassicProfessionalTemplate } from './ClassicProfessionalTemplate';
export { MinimalCleanTemplate } from './MinimalCleanTemplate';
export { CorporateBrandedTemplate } from './CorporateBrandedTemplate';
export { ElegantCardTemplate } from './ElegantCardTemplate';

// Template component mapping
import { ModernGradientTemplate } from './ModernGradientTemplate';
import { ClassicProfessionalTemplate } from './ClassicProfessionalTemplate';
import { MinimalCleanTemplate } from './MinimalCleanTemplate';
import { CorporateBrandedTemplate } from './CorporateBrandedTemplate';
import { ElegantCardTemplate } from './ElegantCardTemplate';

export const TEMPLATE_COMPONENTS = {
  'modern-gradient': ModernGradientTemplate,
  'classic-professional': ClassicProfessionalTemplate,
  'minimal-clean': MinimalCleanTemplate,
  'corporate-branded': CorporateBrandedTemplate,
  'elegant-card': ElegantCardTemplate,
} as const;

export type TemplateComponentKey = keyof typeof TEMPLATE_COMPONENTS;