import { componentStyleOptions } from '@/constants/people-configurations';
import React from 'react';
import type {
  ComponentStyle,
  TagCategoryFormData,
} from '../../types/people-configurations';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: TagCategoryFormData;
  setFormData: React.Dispatch<React.SetStateAction<TagCategoryFormData>>;
  isEditing: boolean;
  loading?: boolean;
}

export function TagModal({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEditing,
  loading = false,
}: TagModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave();
    }
  };

  const updateFormData = (field: keyof TagCategoryFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Tag' : 'Add New Tag'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tag Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tag Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="e.g., Membership Status"
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
              placeholder="Brief description of this tag"
              rows={3}
            />
          </div>

          {/* Component Style */}
          <div className="space-y-2">
            <Label htmlFor="component_style">Component Style</Label>
            <Select
              value={formData.component_style}
              onValueChange={(value: ComponentStyle) =>
                updateFormData('component_style', value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select component style">
                  {formData.component_style &&
                    componentStyleOptions.find(
                      (opt) => opt.value === formData.component_style
                    )?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {componentStyleOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="dark:hover:text-accent-foreground"
                  >
                    <option.icon className="hover:text-accent-foreground" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Required Field</Label>
                <p className="text-sm text-muted-foreground">
                  Make this category required when adding members
                </p>
              </div>
              <Switch
                checked={formData.is_required}
                onCheckedChange={(checked) =>
                  updateFormData('is_required', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Show this category in forms and lists
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  updateFormData('is_active', checked)
                }
              />
            </div>
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
                <>{isEditing ? 'Keep Changes' : 'Add Tag'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
