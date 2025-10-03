import { useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useBranches } from '@/hooks/queries';
import { useOrganization } from '@/contexts/OrganizationContext';

interface BranchSelectorProps {
  value?: string | string[];
  onValueChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  showActiveOnly?: boolean;
  allowSelectAll?: boolean;
  selectAllLabel?: string;
}

export function BranchSelector({
  value,
  onValueChange,
  placeholder = "Select branch...",
  multiple = false,
  disabled = false,
  className,
  showActiveOnly = true,
  allowSelectAll = false,
  selectAllLabel = "All Branches",
}: BranchSelectorProps) {
  const { currentOrganization } = useOrganization();
  const { data: branches = [], isLoading } = useBranches(currentOrganization?.id);

  // Filter branches based on showActiveOnly prop
  const filteredBranches = useMemo(() => {
    return showActiveOnly ? branches.filter(branch => branch.is_active) : branches;
  }, [branches, showActiveOnly]);

  // Handle value changes
  const handleValueChange = (branchId: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      
      if (branchId === 'all' && allowSelectAll) {
        // Toggle select all
        const allBranchIds = filteredBranches.map(branch => branch.id);
        const isAllSelected = allBranchIds.every(id => currentValues.includes(id));
        onValueChange(isAllSelected ? [] : allBranchIds);
      } else {
        // Toggle individual branch
        const newValues = currentValues.includes(branchId)
          ? currentValues.filter(id => id !== branchId)
          : [...currentValues, branchId];
        onValueChange(newValues);
      }
    } else {
      onValueChange(branchId);
    }
  };

  // Get display text
  const getDisplayText = () => {
    if (multiple) {
      const selectedValues = Array.isArray(value) ? value : [];
      if (selectedValues.length === 0) return placeholder;
      
      if (allowSelectAll && selectedValues.length === filteredBranches.length) {
        return selectAllLabel;
      }
      
      if (selectedValues.length === 1) {
        const branch = filteredBranches.find(b => b.id === selectedValues[0]);
        return branch?.name || placeholder;
      }
      
      return `${selectedValues.length} branches selected`;
    } else {
      const selectedBranch = filteredBranches.find(b => b.id === value);
      return selectedBranch?.name || placeholder;
    }
  };

  // Check if branch is selected
  const isBranchSelected = (branchId: string) => {
    if (multiple) {
      const selectedValues = Array.isArray(value) ? value : [];
      return selectedValues.includes(branchId);
    }
    return value === branchId;
  };

  // Check if all branches are selected (for multiple mode)
  const isAllSelected = useMemo(() => {
    if (!multiple || !allowSelectAll) return false;
    const selectedValues = Array.isArray(value) ? value : [];
    return filteredBranches.length > 0 && filteredBranches.every(branch => selectedValues.includes(branch.id));
  }, [multiple, allowSelectAll, value, filteredBranches]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled || isLoading}
          className={cn(
            "justify-between",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search branches..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading branches..." : "No branches found."}
            </CommandEmpty>
            <CommandGroup>
              {allowSelectAll && multiple && (
                <CommandItem
                  value="all"
                  onSelect={() => handleValueChange('all')}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isAllSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{selectAllLabel}</span>
                </CommandItem>
              )}
              {filteredBranches.map((branch) => (
                <CommandItem
                  key={branch.id}
                  value={branch.name}
                  onSelect={() => handleValueChange(branch.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isBranchSelected(branch.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{branch.name}</span>
                    {branch.location && (
                      <span className="text-sm text-muted-foreground">
                        {branch.location}
                      </span>
                    )}
                  </div>
                  {!branch.is_active && (
                    <Badge variant="secondary" className="ml-auto">
                      Inactive
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Multiple branch selector with badges display
interface MultipleBranchSelectorProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showActiveOnly?: boolean;
  allowSelectAll?: boolean;
  selectAllLabel?: string;
  showBadges?: boolean;
  maxBadges?: number;
}

export function MultipleBranchSelector({
  value,
  onValueChange,
  showBadges = true,
  maxBadges = 3,
  ...props
}: MultipleBranchSelectorProps) {
  const { currentOrganization } = useOrganization();
  const { data: branches = [] } = useBranches(currentOrganization?.id);

  const selectedBranches = useMemo(() => {
    return branches.filter(branch => value.includes(branch.id));
  }, [branches, value]);

  const removeBranch = (branchId: string) => {
    onValueChange(value.filter(id => id !== branchId));
  };

  return (
    <div className="space-y-2">
      <BranchSelector
        {...props}
        value={value}
        onValueChange={onValueChange as (value: string | string[]) => void}
        multiple={true}
      />
      
      {showBadges && selectedBranches.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedBranches.slice(0, maxBadges).map((branch) => (
            <Badge
              key={branch.id}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => removeBranch(branch.id)}
            >
              {branch.name}
              <button
                type="button"
                className="ml-1 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBranch(branch.id);
                }}
              >
                ×
              </button>
            </Badge>
          ))}
          {selectedBranches.length > maxBadges && (
            <Badge variant="outline">
              +{selectedBranches.length - maxBadges} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}