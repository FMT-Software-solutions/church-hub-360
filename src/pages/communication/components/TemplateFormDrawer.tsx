import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTemplate, useUpdateTemplate, type CommunicationTemplate } from '@/hooks/useCommunicationTemplates';
import { toast } from 'sonner';

interface TemplateFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageType: 'email' | 'sms';
  templateToEdit?: CommunicationTemplate;
}

export function TemplateFormDrawer({ open, onOpenChange, messageType, templateToEdit }: TemplateFormDrawerProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  useEffect(() => {
    if (open) {
      if (templateToEdit) {
        setName(templateToEdit.name);
        setSubject(templateToEdit.subject || '');
        setContent(templateToEdit.content);
      } else {
        setName('');
        setSubject('');
        setContent('');
      }
    }
  }, [open, templateToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!content.trim()) {
      toast.error('Template content is required');
      return;
    }

    try {
      if (templateToEdit) {
        await updateMutation.mutateAsync({
          id: templateToEdit.id,
          updates: {
            name,
            subject: messageType === 'email' ? subject : undefined,
            content
          }
        });
        toast.success('Template updated successfully');
      } else {
        await createMutation.mutateAsync({
          name,
          type: messageType,
          subject: messageType === 'email' ? subject : undefined,
          content
        });
        toast.success('Template created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] flex flex-col h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{templateToEdit ? 'Edit Template' : 'Create New Template'}</SheetTitle>
          <SheetDescription>
            {templateToEdit
              ? `Update your ${messageType.toUpperCase()} template below.`
              : `Create a reusable ${messageType.toUpperCase()} template.`}
          </SheetDescription>
        </SheetHeader>

        <form id="template-form" onSubmit={handleSubmit} className="space-y-6 p-6 flex-1">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Welcome Message, Event Reminder"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {messageType === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input
                id="template-subject"
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="template-content">Message Content</Label>
              {messageType === 'sms' && (
                <span className={`text-xs ${content.length > 150 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                  {content.length} / 150 characters
                </span>
              )}
            </div>
            <Textarea
              id="template-content"
              placeholder="Type your template message here..."
              className="min-h-[200px]"
              value={content}
              onChange={(e) => {
                if (messageType === 'sms' && e.target.value.length > 150) return;
                setContent(e.target.value);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Tip: You can use personalization tags like {'{name}'} in your message.
            </p>
          </div>
        </form>

        <SheetFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button type="submit" form="template-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Template'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}