import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  Users,
  UserCheck,
  Building,
} from 'lucide-react';
import { format } from 'date-fns';
import type { MemberFilters, MembershipStatus } from '@/types';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: MemberFilters;
  onFiltersChange: (filters: MemberFilters) => void;
  branches?: Array<{ id: string; name: string }>;
  membershipTypes?: string[];
  className?: string;
}

const membershipStatusOptions: { value: MembershipStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'deceased', label: 'Deceased' },
];

const ageRanges = [
  { value: 'all', label: 'All Ages' },
  { value: '0-17', label: 'Children (0-17)' },
  { value: '18-30', label: 'Young Adults (18-30)' },
  { value: '31-50', label: 'Adults (31-50)' },
  { value: '51-70', label: 'Mature Adults (51-70)' },
  { value: '71+', label: 'Seniors (71+)' },
];

export function FilterBar({
  filters,
  onFiltersChange,
  branches = [],
  membershipTypes = [],
  className,
}: FilterBarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateJoinedStart, setDateJoinedStart] = useState<Date | undefined>();
  const [dateJoinedEnd, setDateJoinedEnd] = useState<Date | undefined>();

  const updateFilter = (key: keyof MemberFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setDateJoinedStart(undefined);
    setDateJoinedEnd(undefined);
  };

  const handleAgeRangeChange = (value: string) => {
    if (value === 'all') {
      updateFilter('age_range', undefined);
    } else {
      const [min, max] = value.split('-').map(v => v === '+' ? undefined : parseInt(v));
      updateFilter('age_range', { min, max });
    }
  };

  const handleDateRangeChange = () => {
    if (dateJoinedStart || dateJoinedEnd) {
      updateFilter('date_joined_range', {
        start: dateJoinedStart?.toISOString().split('T')[0],
        end: dateJoinedEnd?.toISOString().split('T')[0],
      });
    } else {
      updateFilter('date_joined_range', undefined);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.membership_status && filters.membership_status !== 'all') count++;
    if (filters.membership_type && filters.membership_type !== 'all') count++;
    if (filters.branch_id && filters.branch_id !== 'all') count++;
    if (filters.gender && filters.gender !== 'all') count++;
    if (filters.age_range) count++;
    if (filters.date_joined_range) count++;
    if (filters.is_active !== 'all' && filters.is_active !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Search and Quick Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, email, phone, or membership ID..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Status Filter */}
        <Select
          value={filters.membership_status || 'all'}
          onValueChange={(value) => updateFilter('membership_status', value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <UserCheck className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {membershipStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="relative"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearFilters} size="sm">
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Branch Filter */}
            {branches.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Branch</Label>
                <Select
                  value={filters.branch_id || 'all'}
                  onValueChange={(value) => updateFilter('branch_id', value)}
                >
                  <SelectTrigger>
                    <Building className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Membership Type Filter */}
            {membershipTypes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Membership Type</Label>
                <Select
                  value={filters.membership_type || 'all'}
                  onValueChange={(value) => updateFilter('membership_type', value)}
                >
                  <SelectTrigger>
                    <Users className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {membershipTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Gender Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gender</Label>
              <Select
                value={filters.gender || 'all'}
                onValueChange={(value) => updateFilter('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Age Range</Label>
              <Select
                value={
                  filters.age_range
                    ? `${filters.age_range.min || 0}-${filters.age_range.max || '+'}`
                    : 'all'
                }
                onValueChange={handleAgeRangeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  {ageRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Joined Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Joined Range</Label>
            <div className="flex flex-col md:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateJoinedStart && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateJoinedStart ? format(dateJoinedStart, 'PPP') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateJoinedStart}
                    onSelect={setDateJoinedStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateJoinedEnd && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateJoinedEnd ? format(dateJoinedEnd, 'PPP') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateJoinedEnd}
                    onSelect={setDateJoinedEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button onClick={handleDateRangeChange} variant="outline" size="sm">
                Apply Date Range
              </Button>
            </div>
          </div>

          {/* Active Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={filters.is_active === undefined ? 'all' : filters.is_active.toString()}
              onValueChange={(value) => 
                updateFilter('is_active', value === 'all' ? 'all' : value === 'true')
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('search', '')}
              />
            </Badge>
          )}
          {filters.membership_status && filters.membership_status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.membership_status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('membership_status', 'all')}
              />
            </Badge>
          )}
          {filters.membership_type && filters.membership_type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.membership_type}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('membership_type', 'all')}
              />
            </Badge>
          )}
          {filters.branch_id && filters.branch_id !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Branch: {branches.find(b => b.id === filters.branch_id)?.name || 'Unknown'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('branch_id', 'all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}