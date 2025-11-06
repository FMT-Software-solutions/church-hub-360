import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  DEFAULT_AGE_GROUPS,
  formatAgeGroupLabel,
} from '@/constants/defaultAgeGroups';
import { useAgeGroupManagement } from '@/hooks/usePeopleConfigurationQueries';

interface AgeGroupEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  onSaved?: (
    ageGroups: { name: string; min_age: number; max_age: number }[]
  ) => void;
}

export default function AgeGroupEditorModal({
  open,
  onOpenChange,
  organizationId,
  onSaved,
}: AgeGroupEditorModalProps) {
  const {
    ageGroups,
    loading,
    operationLoading,
    error,
    updateAgeGroups,
  } = useAgeGroupManagement(organizationId);
  const [localGroups, setLocalGroups] = useState(ageGroups);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLocalGroups(ageGroups);
      setValidationError(null);
    }
  }, [open, ageGroups]);

  const canSave = useMemo(() => {
    if (!localGroups || localGroups.length === 0) return false;
    // Basic validation: ensure numeric ages and min <= max
    for (const g of localGroups) {
      if (g.name.trim().length === 0) return false;
      if (Number.isNaN(g.min_age) || Number.isNaN(g.max_age)) return false;
      if (g.min_age < 0 || g.max_age < 0) return false;
      if (g.min_age > g.max_age) return false;
    }
    return true;
  }, [localGroups]);

  const handleAddGroup = () => {
    const last = localGroups[localGroups.length - 1];
    const start = last ? last.max_age + 1 : 0;
    setLocalGroups([
      ...localGroups,
      {
        name: `Group ${localGroups.length + 1}`,
        min_age: start,
        max_age: start + 10,
      },
    ]);
  };

  const handleRemoveGroup = (idx: number) => {
    const next = localGroups.filter((_, i) => i !== idx);
    setLocalGroups(next);
  };

  const handleChange = (
    idx: number,
    key: 'name' | 'min_age' | 'max_age',
    value: string
  ) => {
    const next = [...localGroups];
    if (key === 'name') {
      next[idx].name = value;
    } else {
      const num = parseInt(value, 10);
      next[idx][key] = Number.isNaN(num) ? 0 : num;
    }
    setLocalGroups(next);
  };

  const handleResetDefaults = () => {
    setLocalGroups(DEFAULT_AGE_GROUPS);
    setValidationError(null);
  };

  const handleSave = async () => {
    setValidationError(null);
    // Basic gap fix: ensure contiguous ranges (optional)
    const sorted = [...localGroups].sort((a, b) => a.min_age - b.min_age);
    for (let i = 0; i < sorted.length; i++) {
      const g = sorted[i];
      if (g.min_age > g.max_age) {
        setValidationError(
          'Each group must have min_age less than or equal to max_age.'
        );
        return;
      }
      if (i > 0) {
        const prev = sorted[i - 1];
        if (g.min_age <= prev.max_age) {
          setValidationError(
            'Age ranges should not overlap. Adjust min/max values.'
          );
          return;
        }
      }
    }

    await updateAgeGroups(localGroups);
    if (onSaved) onSaved(localGroups);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Age Groups</DialogTitle>
          <DialogDescription>
            Configure age ranges used across statistics and filters. Changes are
            saved per organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <div className="space-y-3">
            {localGroups.map((g, idx) => (
              <div key={idx} className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {formatAgeGroupLabel(g)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveGroup(idx)}
                    disabled={localGroups.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`name-${idx}`}>Name</Label>
                    <Input
                      id={`name-${idx}`}
                      value={g.name}
                      onChange={(e) =>
                        handleChange(idx, 'name', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`min-${idx}`}>Min Age</Label>
                    <Input
                      id={`min-${idx}`}
                      type="number"
                      min={0}
                      value={g.min_age}
                      onChange={(e) =>
                        handleChange(idx, 'min_age', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`max-${idx}`}>Max Age</Label>
                    <Input
                      id={`max-${idx}`}
                      type="number"
                      min={0}
                      value={g.max_age}
                      onChange={(e) =>
                        handleChange(idx, 'max_age', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleAddGroup}>
              Add Group
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleResetDefaults}>
                Reset to Default
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave || operationLoading || loading}
              >
                {operationLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <p className="text-xs text-muted-foreground">
          Changes are organization-specific and immediately affect statistics
          and filtering.
        </p>
      </DialogContent>
    </Dialog>
  );
}
