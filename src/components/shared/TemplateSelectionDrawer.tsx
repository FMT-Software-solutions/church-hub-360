import { TEMPLATE_COMPONENTS } from '@/components/shared/membershipCardTemplates';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';
import type { Organization } from '@/types';
import {
  DEFAULT_TEMPLATE_ID,
  getTemplateStorageKey,
  MEMBERSHIP_CARD_TEMPLATES,
  type MembershipCardTemplate
} from '@/types/membershipCardTemplates';
import { Check } from 'lucide-react';

interface TemplateSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (templateId: string) => void;
  selectedTemplateId?: string;
}

export function TemplateSelectionDrawer({
  isOpen,
  onClose,
  onTemplateSelect,
}: TemplateSelectionDrawerProps) {
  const { currentOrganization } = useOrganization();
  const { selectedTemplateId, selectTemplate } = useTemplateSelection();

  const currentTemplateId = selectedTemplateId || DEFAULT_TEMPLATE_ID;

  // Sample data for preview
  const sampleMember = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    membership_id: 'MEM001',
    date_of_birth: '1990-01-15',
    gender: 'Male',
    profile_image_url: null,
    date_joined: '2023-01-01',
  };

  const handleTemplateSelect = (templateId: string) => {
    selectTemplate(templateId);
    onTemplateSelect(templateId);
    
    // Save to localStorage if organization exists
    if (currentOrganization?.id) {
      const storageKey = getTemplateStorageKey(currentOrganization.id);
      localStorage.setItem(storageKey, templateId);
    }
  };

  const renderTemplatePreview = (template: MembershipCardTemplate) => {
    const TemplateComponent = TEMPLATE_COMPONENTS[template.id as keyof typeof TEMPLATE_COMPONENTS];
    
    if (!TemplateComponent) {
      return (
        <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm">Preview not available</span>
        </div>
      );
    }

    return (
      <div className="transform scale-75 origin-top-left overflow-hidden">
        <TemplateComponent
          member={sampleMember}
          organization={currentOrganization as Organization}
        />
      </div>
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'modern':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'classic':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'minimal':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'corporate':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="max-w-full sm:max-w-2xl p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Choose Membership Card Template
          </SheetTitle>
        </SheetHeader>

        <Separator className="mb-4" />

        <ScrollArea className="h-[calc(100vh-120px)] px-4">
          <div className="space-y-6">
            {MEMBERSHIP_CARD_TEMPLATES.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md py-2 px-4 ${
                  currentTemplateId === template.id 
                    ? 'border-2 border-primary shadow-md' 
                    : 'hover:border-1 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {currentTemplateId === template.id && (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  {/* Template Preview */}
                  <div className='h-[200px]'>
                    {renderTemplatePreview(template)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}