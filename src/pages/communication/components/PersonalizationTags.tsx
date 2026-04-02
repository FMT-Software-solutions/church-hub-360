import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const PERSONALIZATION_TAGS = [
  { tag: '{first_name}', label: 'First Name', description: "Recipient's first name" },
  { tag: '{last_name}', label: 'Last Name', description: "Recipient's last name" },
  { tag: '{full_name}', label: 'Full Name', description: "Recipient's complete name" },
  { tag: '{email}', label: 'Email', description: "Recipient's email address" },
  { tag: '{phone}', label: 'Phone', description: "Recipient's phone number" },
];

interface PersonalizationTagsProps {
  onInsertTag: (tag: string) => void;
  disabled?: boolean;
}

export function PersonalizationTags({ onInsertTag, disabled }: PersonalizationTagsProps) {
  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs"
                disabled={disabled}
                type="button"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                Insert Variable
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insert personalized member details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-3 border-b bg-muted/50">
          <h4 className="font-semibold text-sm">Personalization Variables</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Click a variable to insert it at your cursor position.
          </p>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 flex flex-col gap-1">
            {PERSONALIZATION_TAGS.map((item) => (
              <button
                key={item.tag}
                onClick={() => onInsertTag(item.tag)}
                className="flex flex-col items-start p-2 text-left text-sm rounded-md hover:bg-primary/10 transition-colors w-full"
              >
                <span className="font-medium text-primary">{item.tag}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
