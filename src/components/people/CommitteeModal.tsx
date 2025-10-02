import React from 'react';
import type { CommitteeFormData } from '../../types/people-configurations';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

interface CommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: CommitteeFormData;
  setFormData: React.Dispatch<React.SetStateAction<CommitteeFormData>>;
  isEditing: boolean;
  loading?: boolean;
}

export function CommitteeModal({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEditing,
  loading = false,
}: CommitteeModalProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave();
    }
  };

  const updateFormData = (field: keyof CommitteeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Committee' : 'Add New Committee'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Committee Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Committee Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="e.g., Finance Committee"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Brief description of this committee's purpose"
              rows={3}
            />
          </div>



          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => updateFormData('end_date', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Leave empty for ongoing committees
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Show this committee in lists and allow member assignments
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                updateFormData('is_active', checked)
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>{isEditing ? 'Update Committee' : 'Add Committee'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}