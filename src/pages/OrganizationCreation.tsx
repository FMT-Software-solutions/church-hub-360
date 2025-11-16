import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCreateBranch } from '@/hooks/useBranchQueries';
import { useRelationalTags } from '@/hooks/useRelationalTags';
import { useCreateGroup } from '@/hooks/useGroups';
import { useUserQueries } from '@/hooks/useUserQueries';
import type { CreateOrganizationData } from '@/types/organizations';
import type { CompleteTheme } from '@/types/theme';
import { PREDEFINED_PALETTES } from '@/data/predefined-palettes';
import { getDefaultCategoriesSorted } from '@/utils/defaultTagsData';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Users, Building2, CheckCircle2 } from 'lucide-react';

interface OwnerForm {
  email: string;
  firstName: string;
  lastName: string;
}

export default function OrganizationCreation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrganization } = useOrganization();
  const createBranchMutation = useCreateBranch();
  const { bulkCreateTags } = useRelationalTags();
  const createGroupMutation = useCreateGroup();
  const { createUser } = useUserQueries();

  const isAllowed = user?.email === 'admin@churchhub360.com';

  const [orgForm, setOrgForm] = useState<CreateOrganizationData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'GHS',
    is_active: true,
  });

  const [selectedThemeKey, setSelectedThemeKey] = useState<string>('default');
  const selectedTheme: CompleteTheme | null = useMemo(() => {
    return PREDEFINED_PALETTES[selectedThemeKey] || PREDEFINED_PALETTES['default'];
  }, [selectedThemeKey]);

  const [owners, setOwners] = useState<OwnerForm[]>([
    { email: '', firstName: '', lastName: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdMainBranchId, setCreatedMainBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAllowed) {
      navigate('/dashboard');
    }
  }, [isAllowed, navigate]);

  const handleOrgInput = (field: keyof CreateOrganizationData, value: string) => {
    setOrgForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOwnerChange = (index: number, field: keyof OwnerForm, value: string) => {
    setOwners((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as OwnerForm;
      return next;
    });
  };

  const addOwnerRow = () => {
    setOwners((prev) => [...prev, { email: '', firstName: '', lastName: '' }]);
  };

  const removeOwnerRow = (index: number) => {
    setOwners((prev) => prev.filter((_, i) => i !== index));
  };

  const createDefaultGroups = async (branchId: string | null) => {
    const defaults = [
      { name: "Men's Fellowship", description: 'Core fellowship group', type: 'permanent' as const },
      { name: "Women's Fellowship", description: 'Core fellowship group', type: 'permanent' as const },
      { name: 'Youth Ministry', description: 'Young adults group', type: 'permanent' as const },
      { name: "Children's Ministry", description: 'Children group', type: 'permanent' as const },
      { name: 'Prayer Group', description: 'Intercession group', type: 'permanent' as const },
      { name: 'Bible Study', description: 'Weekly study group', type: 'permanent' as const },
    ];

    for (const g of defaults) {
      await createGroupMutation.mutateAsync({
        name: g.name,
        description: g.description,
        type: g.type,
        branch_id: branchId || undefined,
      });
    }
  };

  const seedDefaultTags = async () => {
    const categories = getDefaultCategoriesSorted();
    const tagsPayload = categories.map(({ category }) => ({
      name: category.name,
      description: category.description,
      is_required: category.is_required,
      component_style: category.component_style,
      display_order: category.display_order,
      items: category.items.map((it) => ({
        name: it.label,
        description: it.description,
        color: it.color,
        display_order: it.display_order,
      })),
    }));

    await bulkCreateTags(tagsPayload);
  };

  const createOwners = async () => {
    for (const o of owners.filter((x) => x.email && x.firstName && x.lastName)) {
      await createUser.mutateAsync({
        email: o.email,
        firstName: o.firstName,
        lastName: o.lastName,
        role: 'owner',
        branchIds: undefined,
      });
    }
  };

  const handleSubmit = async () => {
    if (!orgForm.name.trim()) return;
    if (!isAllowed) return;

    setIsSubmitting(true);
    try {
      const newOrg = await createOrganization({
        ...orgForm,
        name: orgForm.name.trim(),
        brand_colors: selectedTheme,
      });

      const mainBranch = await createBranchMutation.mutateAsync({
        name: 'Main Branch',
        location: orgForm.address || '',
        description: 'Default main branch',
        contact: orgForm.phone || '',
        is_active: true,
        organization_id: newOrg.id,
      });
      setCreatedMainBranchId(mainBranch.id);

      await seedDefaultTags();

      await createDefaultGroups(mainBranch.id);

      await createOwners();

      toast.success('Organization created successfully');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAllowed) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Create Organization</h1>
          <p className="text-muted-foreground mt-2">Initial setup with owners, branch, tags, groups</p>
        </div>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organization" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Organization</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="owners" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Owners</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Basic information for the new organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input id="name" value={orgForm.name} onChange={(e) => handleOrgInput('name', e.target.value)} placeholder="Enter organization name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={orgForm.email || ''} onChange={(e) => handleOrgInput('email', e.target.value)} placeholder="contact@church.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={orgForm.phone || ''} onChange={(e) => handleOrgInput('phone', e.target.value)} placeholder="+233 (0) xxxxxxxxx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={orgForm.currency || 'GHS'} onValueChange={(value) => handleOrgInput('currency', value)}>
                    <SelectTrigger className="min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">GHS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" value={orgForm.address || ''} onChange={(e) => handleOrgInput('address', e.target.value)} placeholder="123 Main St, Accra, Ghana" rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Selection</CardTitle>
              <CardDescription>Choose a brand palette for the organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Label className="text-base font-medium">Theme</Label>
              <Select value={selectedThemeKey} onValueChange={setSelectedThemeKey}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PREDEFINED_PALETTES).map(([key, theme]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: theme.light.primary }} />
                          <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: theme.light.secondary }} />
                          <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: theme.light.accent }} />
                        </div>
                        <span>{theme.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTheme && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Light</div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded border" style={{ backgroundColor: selectedTheme.light.primary }} />
                      <div className="w-8 h-8 rounded border" style={{ backgroundColor: selectedTheme.light.secondary }} />
                      <div className="w-8 h-8 rounded border" style={{ backgroundColor: selectedTheme.light.accent }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Dark</div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded border" style={{ backgroundColor: selectedTheme.dark.primary }} />
                      <div className="w-8 h-8 rounded border" style={{ backgroundColor: selectedTheme.dark.secondary }} />
                      <div className="w-8 h-8 rounded border" style={{ backgroundColor: selectedTheme.dark.accent }} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Owner Accounts</CardTitle>
              <CardDescription>Create owner users for the new organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {owners.map((o, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={o.email} onChange={(e) => handleOwnerChange(idx, 'email', e.target.value)} placeholder="owner@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={o.firstName} onChange={(e) => handleOwnerChange(idx, 'firstName', e.target.value)} placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={o.lastName} onChange={(e) => handleOwnerChange(idx, 'lastName', e.target.value)} placeholder="Doe" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => removeOwnerRow(idx)} className="w-full">Remove</Button>
                  </div>
                </div>
              ))}
              <div className="flex">
                <Button type="button" variant="outline" onClick={addOwnerRow}>Add Owner</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end items-center gap-3">
        {createdMainBranchId && (
          <div className="flex items-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
            <span>Main branch created</span>
          </div>
        )}
        <Button onClick={handleSubmit} disabled={isSubmitting || !orgForm.name.trim()}>
          {isSubmitting ? 'Creating...' : 'Create Organization'}
        </Button>
      </div>
    </div>
  );
}