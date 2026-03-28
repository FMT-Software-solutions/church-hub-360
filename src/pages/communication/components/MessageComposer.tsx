import { Eye, Send, Plus, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { CommunicationTarget } from '@/hooks/useCommunicationTargets';
import { TemplateFormDrawer } from './TemplateFormDrawer';
import { useState, useMemo, useEffect } from 'react';

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
  handleSend: () => void;
  targetMembers: CommunicationTarget[];
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
  targetMembers
}: MessageComposerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

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
          <div className="flex justify-between">
            <Label htmlFor="message">Message Body</Label>
            {messageType === 'sms' && (
              <span className={`text-xs ${message.length > 150 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                {message.length} / 150 characters
              </span>
            )}
          </div>
          <Textarea
            id="message"
            placeholder={messageType === 'sms' ? "Type your SMS message here..." : "Type your email message here..."}
            className="min-h-[200px]"
            value={message}
            onChange={handleMessageChange}
          />
          <p className="text-xs text-muted-foreground">
            Tip: You can use personalization tags like {'{name}'} in your message.
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!message || targetMembers.length === 0}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Message
              </Button>
            </DialogTrigger>
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
                    <span><strong>To:</strong> {targetMembers.length} recipient{targetMembers.length !== 1 ? 's' : ''}</span>
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
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Edit Message
                </Button>
                <Button onClick={handleSend}>
                  <Send className="mr-2 h-4 w-4" />
                  Confirm & Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={() => setPreviewOpen(true)} disabled={!message || targetMembers.length === 0}>
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
