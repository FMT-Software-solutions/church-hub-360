import { cn } from '@/lib/utils';
import { Calendar, Edit, Filter, Loader2, Search, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { useDebounceValue } from '../../../hooks/useDebounce';
import { useGroups, type Group } from '../../../hooks/useGroups';
import { Pagination } from '../../shared/Pagination';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface GroupsListPanelProps {
  selectedGroup: string | null;
  onSelectGroup: (groupId: string) => void;
  onEditGroup: (groupId: string, group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
}

export function GroupsListPanel({
  selectedGroup,
  onSelectGroup,
  onEditGroup,
  onDeleteGroup,
}: GroupsListPanelProps) {
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [groupType, setGroupType] = useState<'permanent' | 'temporal' | 'all'>('all');
  
  // Debounce search term
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  
  // Fetch groups with search and pagination
  const { 
    data: groupsData, 
    isLoading
  } = useGroups({
    search: debouncedSearchTerm,
    page: currentPage,
    pageSize,
    groupType,
  });
  
  const groups = groupsData?.data || [];
  const totalCount = groupsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Show empty state only when we have no data and are not loading
  const showEmptyState = groups.length === 0 && !isLoading;
  
  // Event handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  const handleGroupTypeChange = (value: 'permanent' | 'temporal' | 'all') => {
    setGroupType(value);
    setCurrentPage(1); // Reset to first page when filtering
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getGroupStatusBadge = (group: Group) => {
    if (group.is_closed) {
      return (
        <Badge variant="destructive" className="text-xs">
          Closed
        </Badge>
      );
    }
    if (!group.is_active) {
      return (
        <Badge variant="secondary" className="text-xs">
          Inactive
        </Badge>
      );
    }
    return null;
  };

  const getGroupTypeBadge = (group: Group) => {
    return (
      <Badge variant="outline" className="text-xs capitalize">
        {group.type}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Groups
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <CardDescription className='flex justify-between flex-wrap gap-3'>
          Manage church groups and their members

           {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Group Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={groupType} onValueChange={handleGroupTypeChange}>
              <SelectTrigger className="">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="temporal">Temporal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Groups List */}
        <div className={cn("space-y-2", isLoading && "opacity-50 transition-opacity duration-200")}>
          {showEmptyState ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              {debouncedSearchTerm ? (
                <>
                  <p>No groups found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </>
              ) : (
                <>
                  <p>No groups yet</p>
                  <p className="text-sm">Create your first group to get started</p>
                </>
              )}
            </div>
          ) : (
            groups.map((group) => {
              const isSelected = selectedGroup === group.id;

              return (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectGroup(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{group.name}</p>
                          <div className="flex gap-1">
                            {getGroupStatusBadge(group)}
                            {getGroupTypeBadge(group)}
                          </div>
                        </div>
                        {(group.start_date || group.end_date) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>Started: {formatDate(group.start_date)}</span>
                            {group.end_date && (
                              <>
                                <span>•</span>
                                <span>Ends: {formatDate(group.end_date)}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGroup(group.id, group);
                        }}
                        disabled={group.is_closed}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(group.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination - only show if there are groups */}
        {totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            itemName="group"
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </CardContent>
    </Card>
  );
}
