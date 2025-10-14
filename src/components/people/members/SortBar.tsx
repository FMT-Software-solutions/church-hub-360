import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sort options based on members_summary view fields
export interface SortOption {
  value: string;
  label: string;
  field: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface SortBarProps {
  onSortChange: (sortConfig: SortConfig | null) => void;
  className?: string;
}

// Available sort options based on members_summary fields
const SORT_OPTIONS: SortOption[] = [
  { value: 'full_name_asc', label: 'Name (A-Z)', field: 'full_name' },
  { value: 'full_name_desc', label: 'Name (Z-A)', field: 'full_name' },
  { value: 'date_joined_desc', label: 'Newest Members', field: 'date_joined' },
  { value: 'date_joined_asc', label: 'Oldest Members', field: 'date_joined' },
  { value: 'age_asc', label: 'Age (Youngest First)', field: 'age' },
  { value: 'age_desc', label: 'Age (Oldest First)', field: 'age' },
  {
    value: 'membership_years_desc',
    label: 'Longest Members',
    field: 'membership_years',
  },
  {
    value: 'membership_years_asc',
    label: 'Newest Members (by years)',
    field: 'membership_years',
  },
  {
    value: 'membership_status_asc',
    label: 'Status (A-Z)',
    field: 'membership_status',
  },
  {
    value: 'membership_status_desc',
    label: 'Status (Z-A)',
    field: 'membership_status',
  },
  {
    value: 'membership_type_asc',
    label: 'Type (A-Z)',
    field: 'membership_type',
  },
  {
    value: 'membership_type_desc',
    label: 'Type (Z-A)',
    field: 'membership_type',
  },
  // { value: 'branch_name_asc', label: 'Branch (A-Z)', field: 'branch_name' },
  // { value: 'branch_name_desc', label: 'Branch (Z-A)', field: 'branch_name' },
  // { value: 'city_asc', label: 'City (A-Z)', field: 'city' },
  // { value: 'city_desc', label: 'City (Z-A)', field: 'city' },
  // { value: 'tag_count_desc', label: 'Most Tagged', field: 'tag_count' },
  // { value: 'tag_count_asc', label: 'Least Tagged', field: 'tag_count' },
  { value: 'created_at_desc', label: 'Recently Added', field: 'created_at' },
  { value: 'created_at_asc', label: 'Oldest Records', field: 'created_at' },
  { value: 'updated_at_desc', label: 'Recently Updated', field: 'updated_at' },
  // {
  //   value: 'updated_at_asc',
  //   label: 'Least Recently Updated',
  //   field: 'updated_at',
  // },
];

const STORAGE_KEY = 'memberlist_sort_config';

export function SortBar({ onSortChange, className }: SortBarProps) {
  const [selectedSort, setSelectedSort] = useState<string>('');

  // Load sort configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedSort = localStorage.getItem(STORAGE_KEY);
      if (savedSort) {
        const sortConfig: SortConfig = JSON.parse(savedSort);
        const sortValue = `${sortConfig.field}_${sortConfig.direction}`;

        // Verify the saved sort option still exists
        const sortOption = SORT_OPTIONS.find(
          (option) => option.value === sortValue
        );
        if (sortOption) {
          setSelectedSort(sortValue);
          onSortChange(sortConfig);
        } else {
          // Clean up invalid saved sort
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading sort configuration:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [onSortChange]);

  // Handle sort selection change
  const handleSortChange = (value: string) => {
    if (value === selectedSort) {
      // If same option is selected, clear the sort
      setSelectedSort('');
      onSortChange(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    setSelectedSort(value);

    if (value) {
      const sortOption = SORT_OPTIONS.find((option) => option.value === value);
      if (sortOption) {
        const direction = value.endsWith('_desc') ? 'desc' : 'asc';
        const sortConfig: SortConfig = {
          field: sortOption.field,
          direction,
        };

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sortConfig));
        } catch (error) {
          console.error('Error saving sort configuration:', error);
        }

        onSortChange(sortConfig);
      }
    } else {
      onSortChange(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Clear sort
  const clearSort = () => {
    setSelectedSort('');
    onSortChange(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Get current sort direction for display
  const getCurrentSortDirection = () => {
    if (!selectedSort) return null;
    return selectedSort.endsWith('_desc') ? 'desc' : 'asc';
  };

  const sortDirection = getCurrentSortDirection();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-1 mr-1 text-sm">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        Sort By
      </div>

      <Select value={selectedSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={selectedSort ? undefined : 'Name (A-Z)'} />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.value.endsWith('_desc') ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedSort && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSort}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      )}

      {/* Sort direction indicator */}
      {sortDirection && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
          {sortDirection === 'desc' ? (
            <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUp className="h-3 w-3" />
          )}
          <span className="capitalize">{sortDirection}</span>
        </div>
      )}
    </div>
  );
}

export default SortBar;
