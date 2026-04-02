import { Send, Plus, Edit, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CommunicationTarget } from '@/hooks/useCommunicationTargets';
import { TemplateFormDrawer } from './TemplateFormDrawer';
import { PersonalizationTags } from './PersonalizationTags';
import { useState, useMemo, useEffect, useRef } from 'react';

export interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
}

interface MessageComposerProps {
  messageType: 'email' | 'sms';
  templates: Template[];
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  subject: string;
  setSubject: (subject: string) => void;
  message: string;
  handleMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  handleSend: () => Promise<void> | void;
  targetMembers: CommunicationTarget[];
  additionalRecipients?: string;
}

export function MessageComposer({
  messageType,
  templates,
  selectedTemplate,
  onTemplateSelect,
  subject,
  setSubject,
  message,
  handleMessageChange,
  previewOpen,
  setPreviewOpen,
  handleSend,
  targetMembers,
  additionalRecipients = ''
}: MessageComposerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendClick = async () => {
    setIsSending(true);
    try {
      await handleSend();
    } finally {
      setIsSending(false);
    }
  };

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = message;

    const newText = currentText.substring(0, start) + tag + currentText.substring(end);

    // Simulate an event to update the state in the parent
    const event = {
      target: { value: newText }
    } as React.ChangeEvent<HTMLTextAreaElement>;

    handleMessageChange(event);

    // Focus and move cursor after tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  useEffect(() => {
    if (selectedTemplate === 'new') {
      setEditingTemplateId(null);
      setDrawerOpen(true);
      onTemplateSelect(''); // Reset so it doesn't stay 'new'
    }
  }, [selectedTemplate, onTemplateSelect]);

  const handleCreateNew = () => {
    setEditingTemplateId(null);
    setDrawerOpen(true);
  };

  const handleEdit = () => {
    if (selectedTemplate && selectedTemplate !== 'new') {
      setEditingTemplateId(selectedTemplate);
      setDrawerOpen(true);
    }
  };

  const activeTemplateObj = useMemo(() => {
    if (!editingTemplateId) return undefined;
    return templates.find(t => t.id === editingTemplateId) as any;
  }, [editingTemplateId, templates]);

  const hasRecipients = targetMembers.length > 0 || (additionalRecipients && additionalRecipients.trim().length > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Message Content</CardTitle>
        </div>
        <div className="flex items-center gap-2 w-1/2 md:w-1/3">
          <div className="flex-1">
            <Select value={selectedTemplate} onValueChange={onTemplateSelect}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder="Use a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTemplate && selectedTemplate !== 'new' && (
            <Button variant="outline" size="icon" onClick={handleEdit} title="Edit selected template">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleCreateNew} title="Create new template">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {messageType === 'email' && (
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="message">Message Body</Label>
            <div className="flex items-center gap-4">
              <PersonalizationTags onInsertTag={handleInsertTag} />
              {messageType === 'sms' && (
                <span className={`text-xs ${message.length > 150 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                  {message.length} / 150 characters
                </span>
              )}
            </div>
          </div>
          <Textarea
            id="message"
            ref={textareaRef}
            placeholder={messageType === 'sms' ? "Type your SMS message here..." : "Type your email message here..."}
            className="min-h-[200px]"
            value={message}
            onChange={handleMessageChange}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Message Preview</DialogTitle>
                <DialogDescription>
                  This is how your message will appear to recipients.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 my-4">
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground border-b pb-2">
                    <span><strong>To:</strong> {targetMembers.length + additionalRecipients.split(',').filter(p => p.trim().length > 0).length} recipient(s)</span>
                    <span><strong>Type:</strong> {messageType.toUpperCase()}</span>
                  </div>
                  {messageType === 'email' && (
                    <div className="text-sm border-b pb-2">
                      <strong>Subject:</strong> {subject || '(No subject)'}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm pt-2">
                    {message.replace(/{name}/g, targetMembers[0]?.name?.split(' ')[0] || 'John')}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={isSending}>
                  Edit Message
                </Button>
                <Button onClick={handleSendClick} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isSending ? 'Sending...' : 'Confirm & Send'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={() => setPreviewOpen(true)} disabled={!message || !hasRecipients}>
            <Send className="mr-2 h-4 w-4" />
            Review & Send
          </Button>
        </div>
      </CardContent>

      <TemplateFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        messageType={messageType}
        templateToEdit={activeTemplateObj}
      />
    </Card>
  );
}
