import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Mail,
  Phone,
  History,
  Send,
  Trash2,
  Edit,
  CreditCard
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

import { useOrganization } from '@/contexts/OrganizationContext';
import { useCommunicationTargets } from '@/hooks/useCommunicationTargets';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { useAllGroups } from '@/hooks/useGroups';
import type { MemberSearchResult } from '@/hooks/useMemberSearch';

import { MessageTypeSelector } from './communication/components/MessageTypeSelector';
import { RecipientSelector } from './communication/components/RecipientSelector';
import { MessageComposer } from './communication/components/MessageComposer';
import { BestPractices } from './communication/components/BestPractices';
import { SenderIdManager } from './communication/components/SenderIdManager';
import { SmsCreditWidget, TransactionHistory, useVerifySmsPurchase } from '@/components/shared/sms-credits';
import { useCommunicationTemplates, useDeleteTemplate } from '@/hooks/useCommunicationTemplates';
import { useCommunicationHistory, useCreateCommunicationHistory } from '@/hooks/useCommunicationHistory';
import { sendSmsMessage } from '@/services/sms.service';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function Communication() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'compose');
  const verifyPurchaseMutation = useVerifySmsPurchase();
  const queryClient = useQueryClient();

  useEffect(() => {

    const fullUrl = new URL(window.location.href);
    const urlParams = new URLSearchParams(fullUrl.search || window.location.search);

    const verifyPayment = urlParams.get('verify_payment') || searchParams.get('verify_payment');
    const reference = urlParams.get('reference') || urlParams.get('trxref') || searchParams.get('reference') || searchParams.get('trxref');
    const amountGhs = urlParams.get('amount') || searchParams.get('amount');
    const creditsPurchased = urlParams.get('credits') || searchParams.get('credits');
    const orgName = urlParams.get('org_name') || searchParams.get('org_name');
    const appName = urlParams.get('app_name') || searchParams.get('app_name');

    // Wait for auth & org contexts to be ready
    if (!currentOrganization?.id || !user?.id) return;

    if (verifyPayment === 'true' && reference && amountGhs && creditsPurchased) {
      const verify = async () => {
        try {
          // Immediately remove the query params so React Strict Mode doesn't fire this twice

          // Clear router params if they exist there
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('verify_payment');
          newParams.delete('reference');
          newParams.delete('trxref');
          newParams.delete('amount');
          newParams.delete('credits');
          newParams.delete('org_name');
          newParams.delete('app_name');
          setSearchParams(newParams, { replace: true });

          // Also clear window.location.search cleanly without reloading
          const url = new URL(window.location.href);
          url.search = '';
          window.history.replaceState({}, document.title, url.toString());

          await verifyPurchaseMutation.mutateAsync({
            organizationId: currentOrganization.id,
            organizationName: orgName || currentOrganization.name,
            userId: user.id,
            reference,
            amountGhs: Number(amountGhs),
            creditsPurchased: Number(creditsPurchased),
            appName: appName || 'ChurchHub360',
          });
          toast.success(`Successfully verified and added ${creditsPurchased} SMS credits!`);
        } catch (error: any) {
          toast.error(error.message || 'Failed to verify payment. Please contact support.');
        }
      };
      verify();
    }
  }, [searchParams, currentOrganization?.id, user?.id]); // Dep array checks .id to prevent infinite loops on object reference changes
  const [messageType, setMessageType] = useState<'email' | 'sms'>('sms');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Recipient selection state
  const [selectAllMembers, setSelectAllMembers] = useState(false);
  const [selectedTagItemIds, setSelectedTagItemIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>([]);
  const [additionalRecipients, setAdditionalRecipients] = useState<string>('');

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Queries for selectors
  const { data: relationalTags = [] } = useTagsQuery(currentOrganization?.id);
  const { data: allGroups = [] } = useAllGroups();

  const { data: dbTemplates = [] } = useCommunicationTemplates();
  const { data: dbHistory = [] } = useCommunicationHistory();
  const createHistoryMutation = useCreateCommunicationHistory();
  const deleteTemplateMutation = useDeleteTemplate();

  // Fetch targets using RPC hook
  const { data: targetMembers = [], isLoading: isLoadingTargets } = useCommunicationTargets({
    selectAll: selectAllMembers,
    groupIds: selectedGroupIds,
    tagItemIds: selectedTagItemIds,
    individualIds: selectedMembers.map(m => m.id)
  });

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = dbTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject || '');
      setMessage(template.content);
      setSelectedTemplate(templateId);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (messageType === 'sms' && val.length > 150) {
      return; // Force limit
    }
    setMessage(val);
  };


  // Handle sending the message
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const manualPhones = additionalRecipients
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (targetMembers.length === 0 && manualPhones.length === 0) {
      toast.error('Please select at least one recipient or enter a manual phone number');
      return;
    }

    if (messageType === 'email' && !subject.trim()) {
      toast.error('Please enter a subject for the email');
      return;
    }

    try {
      if (messageType === 'sms') {
        // Extract required variables from the message template
        const expectedVariables = [...message.matchAll(/\{([^}]+)\}/g)].map(match => match[1]);

        const recipients = [
          ...targetMembers.map(m => {
            const nameParts = m.name.split(' ');
            const first_name = nameParts[0] || '';
            const last_name = nameParts.slice(1).join(' ') || '';

            const addressObj = currentOrganization?.address as any;
            const orgAddressString = addressObj ? `${addressObj.street || ''}, ${addressObj.city || ''}, ${addressObj.state || ''}`.replace(/^, | ,|, $/g, '').trim() : '';

            // Build a full object with all possible properties first
            const fullMemberData: Record<string, any> = {
              ...m,
              phone: m.phone || '',
              first_name,
              last_name,
              full_name: m.name || '', // Map name to full_name so {full_name} variable works
              organization_name: currentOrganization?.name || '',
              organization_email: currentOrganization?.email || '',
              organization_phone: currentOrganization?.phone || '',
              organization_address: orgAddressString,
            };

            // Then ONLY pick out the 'phone' and properties that were actually requested as variables
            const filteredMemberData: Record<string, any> = { phone: fullMemberData.phone };
            expectedVariables.forEach(variable => {
              filteredMemberData[variable] = fullMemberData[variable];
            });

            return filteredMemberData;
          }),
          ...manualPhones.map(phone => {
            const addressObj = currentOrganization?.address as any;
            const orgAddressString = addressObj ? `${addressObj.street || ''}, ${addressObj.city || ''}, ${addressObj.state || ''}`.replace(/^, | ,|, $/g, '').trim() : '';

            // For manual phones, provide phone and empty strings for expected member variables, but keep org variables
            const manualData: Record<string, any> = { phone };
            const orgVars: Record<string, string> = {
              organization_name: currentOrganization?.name || '',
              organization_email: currentOrganization?.email || '',
              organization_phone: currentOrganization?.phone || '',
              organization_address: orgAddressString,
            };

            expectedVariables.forEach(variable => {
              if (orgVars[variable] !== undefined) {
                manualData[variable] = orgVars[variable];
              } else {
                manualData[variable] = '';
              }
            });
            return manualData;
          })
        ].filter(r => Boolean(r.phone && String(r.phone).trim().length > 0));

        if (recipients.length === 0) {
          toast.error('None of the selected members or manually entered numbers have a valid phone number');
          return;
        }

        // Use the organization's specific sender ID if configured, otherwise fallback to the global default
        // Ensure it doesn't exceed the 11 character limit enforced by Arkesel
        const orgSenderId = currentOrganization?.sms_sender_id;
        let senderId = orgSenderId || import.meta.env.VITE_DEFAULT_SMS_SENDER_ID || currentOrganization?.name || 'ChurchHub';
        senderId = senderId.substring(0, 11);

        // For development, we'll use sandbox mode. In production, change isSandbox to false.
        const isSandbox = false //import.meta.env.DEV;

        await sendSmsMessage({
          sender: senderId,
          message,
          recipients: recipients as any, // Bypass strict type check for dynamic template variables
          sandbox: isSandbox,
          organizationId: currentOrganization?.id
        });

        // Invalidate the SMS balance query to immediately refetch and update the UI
        queryClient.invalidateQueries({ queryKey: ['sms_balance', currentOrganization?.id] });
      }

      const totalRecipientsCount = targetMembers.length + manualPhones.length;

      await createHistoryMutation.mutateAsync({
        type: messageType,
        subject: messageType === 'email' ? subject : undefined,
        content: message,
        recipient_type: selectAllMembers ? 'all' : 'custom',
        recipient_ids: targetMembers.map(m => m.id), // Storing the final unique member IDs resolved
        recipient_count: totalRecipientsCount,
        status: 'sent', // Optimistically marking as sent
      });

      toast.success(`${messageType.toUpperCase()} sent successfully to ${totalRecipientsCount} recipients`);

      // Reset form
      setPreviewOpen(false);
      setSelectedTemplate('');
      setSubject('');
      setMessage('');
      setSelectedTagItemIds([]);
      setSelectedGroupIds([]);
      setSelectedMembers([]);
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    }
  };


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Communication & Engagement</h1>
        </div>
        <div className="flex items-center gap-2">
          <SenderIdManager />
          <SmsCreditWidget
            organizationId={currentOrganization?.id}
            organizationName={currentOrganization?.name || undefined}
            organizationEmail={currentOrganization?.email || undefined}
            organizationPhone={currentOrganization?.phone || undefined}
            userId={user?.id}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full h-[100px] md:h-fit md:grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Compose Message
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Message History
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            SMS Billing & Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Composition Area */}
            <div className="lg:col-span-2 space-y-6">
              <MessageTypeSelector messageType={messageType} onChange={setMessageType} />

              <RecipientSelector
                organizationId={currentOrganization?.id}
                selectAllMembers={selectAllMembers}
                setSelectAllMembers={setSelectAllMembers}
                selectedGroupIds={selectedGroupIds}
                setSelectedGroupIds={setSelectedGroupIds}
                selectedTagItemIds={selectedTagItemIds}
                setSelectedTagItemIds={setSelectedTagItemIds}
                selectedMembers={selectedMembers}
                setSelectedMembers={setSelectedMembers}
                additionalRecipients={additionalRecipients}
                setAdditionalRecipients={setAdditionalRecipients}
                groups={allGroups}
                tags={relationalTags}
                targetCount={targetMembers.length + additionalRecipients.split(',').filter(p => p.trim().length > 0).length}
                isLoadingTargets={isLoadingTargets}
              />

              <MessageComposer
                messageType={messageType}
                templates={dbTemplates.filter(t => t.type === messageType)}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                subject={subject}
                setSubject={setSubject}
                message={message}
                handleMessageChange={handleMessageChange}
                previewOpen={previewOpen}
                setPreviewOpen={setPreviewOpen}
                handleSend={handleSendMessage}
                targetMembers={targetMembers}
                additionalRecipients={additionalRecipients}
              />
            </div>

            {/* Sidebar / Guidelines */}
            <div className="space-y-6">
              <BestPractices />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dbHistory.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {item.type === 'email' ? (
                            <Mail className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="truncate max-w-[230px]" title={item.subject || item.content}>
                            {item.subject || item.content}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {dbHistory.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                  </div>
                  <Button variant="link" className="w-full mt-4" onClick={() => setActiveTab('history')}>
                    View All History
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>View previously sent messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dbHistory.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.type === 'email' ? (
                          <Mail className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Phone className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-medium">{item.subject || item.content.substring(0, 50) + '...'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sent to {item.recipient_count} members • {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={['delivered', 'sent'].includes(item.status) ? 'default' : 'secondary'} className={['delivered', 'sent'].includes(item.status) ? 'bg-green-500' : ''}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
                {dbHistory.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>No messages sent yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>Manage your reusable message templates</CardDescription>
              </div>
              <Button onClick={() => {
                setMessageType('sms');
                setActiveTab('compose');
                setSelectedTemplate('new');
              }}>
                <Edit className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dbTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 space-y-3 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {template.type === 'email' ? (
                            <Mail className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Phone className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium">{template.name}</span>
                        </div>
                        {template.subject && (
                          <div className="text-sm text-muted-foreground">{template.subject}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setMessageType(template.type);
                            setActiveTab('compose');
                            handleTemplateSelect(template.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this template?')) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm bg-muted p-3 rounded-md line-clamp-3 flex-1">
                      {template.content}
                    </div>
                    <Button variant="secondary" className="w-full mt-auto" onClick={() => {
                      setMessageType(template.type);
                      setActiveTab('compose');
                      handleTemplateSelect(template.id);
                    }}>
                      Use Template
                    </Button>
                  </div>
                ))}
                {dbTemplates.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>No templates found</p>
                    <Button variant="link" onClick={() => {
                      setMessageType('sms');
                      setActiveTab('compose');
                      setSelectedTemplate('new');
                    }}>
                      Create your first template
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>SMS Billing & Transactions</CardTitle>
              <CardDescription>View your SMS credit purchase history and usage ledger</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistory organizationId={currentOrganization?.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}