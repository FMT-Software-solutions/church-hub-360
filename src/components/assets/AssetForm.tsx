import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, UploadCloud } from 'lucide-react';
import { DatePicker } from '@/components/shared/DatePicker';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { useMemberDetails, type MemberSearchResult } from '@/hooks/useMemberSearch';
import { GroupSelect } from '@/components/finance/GroupSelect';
import type { CreateAssetInput, UpdateAssetInput, Asset } from '@/types/assets';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { SingleBranchSelector } from '@/components/shared/BranchSelector';

export interface AssetFormValues {
  name: string;
  description?: string;
  category?: string;
  status?: string;
  location?: string;
  branch_id?: string | null;
  assigned_to_member_id?: string | null;
  assigned_to_group_id?: string | null;
  assigned_to_type?: 'member' | 'group' | null;
  images: string[];
  purchase_date?: string | null;
  purchase_cost?: number;
  depreciation_percentage?: number;
}

export interface AssetFormProps {
  initialValues?: Partial<Asset>;
  onSubmit: (
    values: CreateAssetInput | UpdateAssetInput
  ) => Promise<void> | void;
  submitting?: boolean;
}

const CATEGORY_OPTIONS = [
  'Furniture',
  'Instruments',
  'Audio/Visual',
  'Electricals',
  'Vehicles',
  'Office Equipment',
  'Other',
];

const STATUS_OPTIONS = ['Active', 'In Storage', 'Damaged', 'Retired'];

export default function AssetForm({
  initialValues,
  onSubmit,
  submitting,
}: AssetFormProps) {
  const { currentOrganization } = useOrganization();
  const [values, setValues] = useState<AssetFormValues>({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    category: initialValues?.category || '',
    status: initialValues?.status || 'Active',
    location: initialValues?.location || '',
    branch_id: initialValues?.branch_id || null,
    assigned_to_member_id: initialValues?.assigned_to_member_id || null,
    assigned_to_group_id: initialValues?.assigned_to_group_id || null,
    assigned_to_type: initialValues?.assigned_to_type || null,
    images: initialValues?.images || [],
    purchase_date: initialValues?.purchase_date || null,
    purchase_cost: initialValues?.purchase_cost || undefined,
    depreciation_percentage: initialValues?.depreciation_percentage || undefined,
  });

  const [categorySelection, setCategorySelection] = useState<string>(
    CATEGORY_OPTIONS.includes(values.category || '')
      ? values.category || ''
      : 'Other'
  );

  const [assignmentMode, setAssignmentMode] = useState<'none' | 'member' | 'group'>(
    values.assigned_to_type === 'member' ? 'member' : values.assigned_to_type === 'group' ? 'group' : 'none'
  );

  const [selectedMember, setSelectedMember] = useState<MemberSearchResult[]>([]);
  const { data: initialMemberDetails } = useMemberDetails(
    values.assigned_to_member_id ? [values.assigned_to_member_id] : []
  );

  useEffect(() => {
    if (initialMemberDetails && initialMemberDetails.length > 0) {
      const m = initialMemberDetails[0] as any;
      const display: MemberSearchResult = {
        ...m,
        display_name: m.full_name || `${m.first_name} ${m.last_name}`.trim(),
        display_subtitle: [m.membership_id, m.email, m.phone].filter(Boolean).join(' • '),
      };
      setSelectedMember([display]);
    }
  }, [initialMemberDetails]);

  const { uploadFile, isUploading, uploadProgress } = useCloudinaryUpload();

  useEffect(() => {
    if (categorySelection !== 'Other') {
      setValues((v) => ({ ...v, category: categorySelection }));
    }
  }, [categorySelection]);

  const handleChange = (field: keyof AssetFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = useMemo(() => {
    return values.name.trim().length > 0 && !submitting;
  }, [values.name, submitting]);

  const handleImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls: string[] = [];
    for (const file of files) {
      const result = await uploadFile(file, {
        folder: 'assets/images',
        maxSize: 10,
      });
      urls.push(result.url);
    }
    setValues((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    e.target.value = '';
  };

  const removeImage = (url: string) => {
    setValues((prev) => ({
      ...prev,
      images: prev.images.filter((u) => u !== url),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateAssetInput | UpdateAssetInput = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      category: values.category || undefined,
      status: values.status || undefined,
      location: values.location?.trim() || undefined,
      branch_id: values.branch_id || null,
      assigned_to_member_id:
        assignmentMode === 'member' ? values.assigned_to_member_id || null : null,
      assigned_to_group_id:
        assignmentMode === 'group' ? values.assigned_to_group_id || null : null,
      assigned_to_type:
        assignmentMode === 'none' ? null : values.assigned_to_type || null,
      images: values.images,
      purchase_date: values.purchase_date || null,
      purchase_cost: values.purchase_cost || undefined,
      depreciation_percentage: values.depreciation_percentage || undefined,
    };
    await onSubmit(payload);
  };

  const depreciationPreview = useMemo(() => {
    if (!values.purchase_cost || !values.depreciation_percentage) return null;
    const cost = Number(values.purchase_cost);
    const rate = Number(values.depreciation_percentage);
    if (isNaN(cost) || isNaN(rate)) return null;
    
    const depreciationAmount = (cost * rate) / 100;
    const currentValue = Math.max(0, cost - depreciationAmount);
    
    return {
      depreciationAmount,
      currentValue
    };
  }, [values.purchase_cost, values.depreciation_percentage]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label>Name</Label>
          <Input
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Yamaha Keyboard P125"
          />
        </div>
        <div className="space-y-3">
          <Label>Category</Label>
          <Select
            value={categorySelection}
            onValueChange={setCategorySelection}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categorySelection === 'Other' && (
            <Input
              value={values.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="Enter custom category"
            />
          )}
        </div>
        <div className="md:col-span-2 space-y-3">
          <Label>Description</Label>
          <Textarea
            value={values.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-3">
          <Label>Status</Label>
          <Select
            value={values.status || ''}
            onValueChange={(val) => handleChange('status', val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label>Location</Label>
          <Input
            value={values.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g., Main Auditorium"
          />
        </div>
        <div className="space-y-3">
          <Label>Branch</Label>
          <SingleBranchSelector
            value={values.branch_id || undefined}
            onValueChange={(id) => handleChange('branch_id', id || null)}
          />
        </div>
        <div className="space-y-3">
          <DatePicker
            label="Purchase Date"
            value={values.purchase_date || ''}
            onChange={(d) => handleChange('purchase_date', d || null)}
            disableFuture
          />
        </div>
      </div>

      <div className="border rounded-md p-4 bg-muted/20 space-y-4">
        <h3 className="text-sm font-medium">Financial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Purchase Cost</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={values.purchase_cost || ''}
              onChange={(e) => handleChange('purchase_cost', parseFloat(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-3">
            <Label>Depreciation Percentage (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={values.depreciation_percentage || ''}
              onChange={(e) => handleChange('depreciation_percentage', parseFloat(e.target.value))}
              placeholder="0.0"
            />
          </div>
        </div>
        
        {depreciationPreview && (
          <div className="mt-4 p-3 bg-background rounded border text-sm grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground block">Depreciation Amount</span>
              <span className="font-medium text-red-500">
                -{new Intl.NumberFormat('en-US', { style: 'currency', currency: currentOrganization?.currency || 'GHS' }).format(depreciationPreview.depreciationAmount)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Current Estimated Value</span>
              <span className="font-medium text-green-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: currentOrganization?.currency || 'GHS' }).format(depreciationPreview.currentValue)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label>Assignment</Label>
        <RadioGroup
          value={assignmentMode}
          onValueChange={(val) => {
            setAssignmentMode(val as 'none' | 'member' | 'group');
            if (val === 'none') {
              setValues((v) => ({
                ...v,
                assigned_to_type: null,
                assigned_to_member_id: null,
                assigned_to_group_id: null,
              }));
              setSelectedMember([]);
            } else if (val === 'member') {
              setValues((v) => ({
                ...v,
                assigned_to_type: 'member',
                assigned_to_member_id: null,
              }));
              setSelectedMember([]);
            } else {
              setValues((v) => ({
                ...v,
                assigned_to_type: 'group',
                assigned_to_group_id: null,
              }));
            }
          }}
          className="flex flex-wrap gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="assign-none" />
            <Label htmlFor="assign-none">None</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="member" id="assign-member" />
            <Label htmlFor="assign-member">Member</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="group" id="assign-group" />
            <Label htmlFor="assign-group">Group</Label>
          </div>
        </RadioGroup>

        {assignmentMode === 'member' && currentOrganization?.id && (
          <MemberSearchTypeahead
            organizationId={currentOrganization.id}
            branchId={values.branch_id || undefined}
            value={selectedMember}
            onChange={(members) => {
              const m = members[0];
              if (!m) {
                setSelectedMember([]);
                setValues((v) => ({ ...v, assigned_to_type: 'member', assigned_to_member_id: null }));
                return;
              }
              setSelectedMember([m]);
              setValues((v) => ({
                ...v,
                assigned_to_type: 'member',
                assigned_to_member_id: m.id,
              }));
            }}
            placeholder="Search member to assign"
            multiSelect={false}
          />
        )}
        {assignmentMode === 'group' && (
          <GroupSelect
            value={values.assigned_to_group_id || undefined}
            onChange={(id) =>
              setValues((v) => ({
                ...v,
                assigned_to_type: 'group',
                assigned_to_group_id: id || null,
              }))
            }
          />
        )}
      </div>

      <div className="space-y-3">
        <Label>Images</Label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImagesSelect}
            className="hidden"
            id="asset-images-input"
          />
          <Button
            type="button"
            onClick={() =>
              document.getElementById('asset-images-input')?.click()
            }
            disabled={isUploading}
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Images'}
          </Button>
        </div>
        {values.images.length > 0 && (
          <ScrollArea className="h-[180px] border rounded-md p-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {values.images.map((url) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt="asset"
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeImage(url)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {values.images.length === 0 && (
          <Badge variant="outline">No images uploaded</Badge>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!canSubmit || submitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
