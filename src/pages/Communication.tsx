import { useState } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Users, 
  User, 
  Send, 
  History, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
}

// Mock data for templates
const messageTemplates: { email: Template[], sms: Template[] } = {
  email: [
    {
      id: 'blank-email',
      name: 'Blank Template',
      type: 'email' as const,
      subject: '',
      content: ''
    },
    {
      id: 'welcome-email',
      name: 'Welcome New Member',
      type: 'email' as const,
      subject: 'Welcome to Our Church Family!',
      content: `Dear [Name],

Welcome to our church family! We are thrilled to have you join us on this spiritual journey.

Our church community is built on love, faith, and fellowship. We believe that every person has a unique purpose and we're here to support you in discovering and fulfilling that purpose.

What to expect:
• Weekly worship services on Sundays at 10:00 AM
• Bible study groups throughout the week
• Community outreach programs
• Fellowship events and activities

If you have any questions or need assistance, please don't hesitate to reach out to us.

Blessings,
[Church Name] Team`
    },
    {
      id: 'event-reminder',
      name: 'Event Reminder',
      type: 'email' as const,
      subject: 'Reminder: [Event Name] - [Date]',
      content: `Dear [Name],

This is a friendly reminder about our upcoming event:

Event: [Event Name]
Date: [Date]
Time: [Time]
Location: [Location]

We're looking forward to seeing you there! This will be a wonderful opportunity for fellowship and spiritual growth.

Please let us know if you have any questions.

God bless,
[Church Name] Team`
    },
    {
      id: 'prayer-request',
      name: 'Prayer Request Response',
      type: 'email' as const,
      subject: 'We\'re Praying for You',
      content: `Dear [Name],

Thank you for sharing your prayer request with us. Please know that our entire church family is lifting you up in prayer.

"And the prayer of faith will save the sick, and the Lord will raise him up." - James 5:15

We believe in the power of prayer and trust that God will work in your situation according to His perfect will.

You are loved and supported,
[Church Name] Prayer Team`
    }
  ],
  sms: [
    {
      id: 'blank-sms',
      name: 'Blank Template',
      type: 'sms' as const,
      content: ''
    },
    {
      id: 'service-reminder',
      name: 'Service Reminder',
      type: 'sms' as const,
      content: 'Hi [Name]! Reminder: Service tomorrow at 10 AM. See you there! - [Church Name]'
    },
    {
      id: 'event-update',
      name: 'Event Update',
      type: 'sms' as const,
      content: 'Hi [Name]! Quick update about [Event]: [Details]. Questions? Reply or call us. Blessings! - [Church Name]'
    },
    {
      id: 'prayer-support',
      name: 'Prayer Support',
      type: 'sms' as const,
      content: 'Hi [Name], our church family is praying for you today. You are loved and not alone. God bless! - [Church Name]'
    }
  ]
};

// Mock data for members
const mockMembers = [
  { id: '1', name: 'John Smith', email: 'john.smith@email.com', phone: '+1 (555) 123-4567', avatar: '/avatars/AV1.png', status: 'active' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1 (555) 234-5678', avatar: '/avatars/AV2.png', status: 'active' },
  { id: '3', name: 'Michael Brown', email: 'mike.brown@email.com', phone: '+1 (555) 345-6789', avatar: '/avatars/AV3.png', status: 'active' },
  { id: '4', name: 'Emily Davis', email: 'emily.davis@email.com', phone: '+1 (555) 456-7890', avatar: '/avatars/AV4.png', status: 'active' },
  { id: '5', name: 'David Wilson', email: 'david.w@email.com', phone: '+1 (555) 567-8901', avatar: '/avatars/AV5.png', status: 'active' },
  { id: '6', name: 'Lisa Anderson', email: 'lisa.anderson@email.com', phone: '+1 (555) 678-9012', avatar: '/avatars/AV6.png', status: 'active' },
];

// Mock data for member groups
const memberGroups = [
  { id: 'all', name: 'All Members', count: 156, description: 'All active church members' },
  { id: 'youth', name: 'Youth Group', count: 24, description: 'Members aged 13-25' },
  { id: 'seniors', name: 'Senior Members', count: 45, description: 'Members aged 65+' },
  { id: 'new-members', name: 'New Members', count: 12, description: 'Members joined in last 6 months' },
  { id: 'volunteers', name: 'Volunteers', count: 67, description: 'Active ministry volunteers' },
  { id: 'leadership', name: 'Leadership Team', count: 15, description: 'Church leadership and staff' },
];

// Mock data for sent messages
const sentMessages = [
  {
    id: '1',
    type: 'email',
    subject: 'Welcome to Our Church Family!',
    recipients: 'New Members (12)',
    sentAt: '2024-01-15T10:30:00Z',
    status: 'delivered',
    openRate: '85%',
    clickRate: '23%'
  },
  {
    id: '2',
    type: 'sms',
    subject: 'Sunday Service Reminder',
    recipients: 'All Members (156)',
    sentAt: '2024-01-14T18:00:00Z',
    status: 'delivered',
    deliveryRate: '98%'
  },
  {
    id: '3',
    type: 'email',
    subject: 'Youth Event This Friday',
    recipients: 'Youth Group (24)',
    sentAt: '2024-01-13T14:15:00Z',
    status: 'delivered',
    openRate: '92%',
    clickRate: '45%'
  },
  {
    id: '4',
    type: 'sms',
    subject: 'Prayer Meeting Tonight',
    recipients: 'Leadership Team (15)',
    sentAt: '2024-01-12T16:45:00Z',
    status: 'delivered',
    deliveryRate: '100%'
  }
];

export function Communication() {
  const [activeTab, setActiveTab] = useState('compose');
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [recipientType, setRecipientType] = useState<'individual' | 'group'>('group');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Filter members based on search term
  const filteredMembers = mockMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Handle blank template
    if (templateId === 'blank') {
      setSubject('');
      setMessage('');
      return;
    }
    
    const templates = messageTemplates[messageType];
    const template = templates.find(t => t.id === templateId);
    if (template) {
      if (messageType === 'email' && 'subject' in template) {
        setSubject(template.subject || '');
      }
      setMessage(template.content);
    }
  };

  // Handle member selection
  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (recipientType === 'group' && !selectedGroup) {
      toast.error('Please select a recipient group');
      return;
    }

    if (recipientType === 'individual' && selectedMembers.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (messageType === 'email' && !subject.trim()) {
      toast.error('Please enter a subject for the email');
      return;
    }

    // Simulate sending
    toast.success(`${messageType.toUpperCase()} sent successfully!`);
    
    // Reset form
    setSelectedTemplate('');
    setSubject('');
    setMessage('');
    setSelectedGroup('');
    setSelectedMembers([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Communication & Engagement</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Compose Message
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Message History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message Composition */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Compose Message
                  </CardTitle>
                  <CardDescription>
                    Create and send messages to your church members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Message Type Selection */}
                  <div className="space-y-2">
                    <Label>Message Type</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={messageType === 'email' ? 'default' : 'outline'}
                        onClick={() => setMessageType('email')}
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                      <Button
                        variant={messageType === 'sms' ? 'default' : 'outline'}
                        onClick={() => setMessageType('sms')}
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        SMS
                      </Button>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label>Choose Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template or start blank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blank">Blank Template</SelectItem>
                        {messageTemplates[messageType].map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject (Email only) */}
                  {messageType === 'email' && (
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject"
                      />
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={messageType === 'email' 
                        ? "Enter your email message here..." 
                        : "Enter your SMS message here (160 characters recommended)"}
                      rows={messageType === 'email' ? 10 : 4}
                      className="resize-none"
                    />
                    {messageType === 'sms' && (
                      <p className="text-sm text-muted-foreground">
                        {message.length}/160 characters
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Message Preview</DialogTitle>
                          <DialogDescription>
                            Preview how your {messageType} will appear to recipients
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {messageType === 'email' && subject && (
                            <div>
                              <Label className="text-sm font-medium">Subject:</Label>
                              <p className="text-sm bg-muted p-2 rounded">{subject}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm font-medium">Message:</Label>
                            <div className="text-sm bg-muted p-4 rounded whitespace-pre-wrap">
                              {message}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button onClick={handleSendMessage} className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recipients Selection */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recipients
                  </CardTitle>
                  <CardDescription>
                    Choose who will receive your message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipient Type */}
                  <div className="space-y-2">
                    <Label>Send To</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={recipientType === 'group' ? 'default' : 'outline'}
                        onClick={() => setRecipientType('group')}
                        className="flex items-center gap-1"
                      >
                        <Users className="h-3 w-3" />
                        Groups
                      </Button>
                      <Button
                        size="sm"
                        variant={recipientType === 'individual' ? 'default' : 'outline'}
                        onClick={() => setRecipientType('individual')}
                        className="flex items-center gap-1"
                      >
                        <User className="h-3 w-3" />
                        Individuals
                      </Button>
                    </div>
                  </div>

                  {recipientType === 'group' ? (
                    /* Group Selection */
                    <div className="space-y-3">
                      <Label>Select Group</Label>
                      {memberGroups.map((group) => (
                        <div
                          key={group.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedGroup === group.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedGroup(group.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{group.name}</p>
                              <p className="text-xs text-muted-foreground">{group.description}</p>
                            </div>
                            <Badge variant="secondary">{group.count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Individual Selection */
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Search Members</Label>
                        <Input
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <Label>Select Members ({selectedMembers.length} selected)</Label>
                        {filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedMembers.includes(member.id)}
                              onCheckedChange={() => handleMemberToggle(member.id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Message History
              </CardTitle>
              <CardDescription>
                View and manage your sent messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {msg.type === 'email' ? (
                          <Mail className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Phone className="h-4 w-4 text-green-500" />
                        )}
                        {getStatusIcon(msg.status)}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium">{msg.subject}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>To: {msg.recipients}</span>
                          <span>•</span>
                          <span>{new Date(msg.sentAt).toLocaleDateString()} at {new Date(msg.sentAt).toLocaleTimeString()}</span>
                        </div>
                        {msg.type === 'email' && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Open Rate: {msg.openRate}</span>
                            <span>Click Rate: {msg.clickRate}</span>
                          </div>
                        )}
                        {msg.type === 'sms' && (
                          <div className="text-xs text-muted-foreground">
                            Delivery Rate: {msg.deliveryRate}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}