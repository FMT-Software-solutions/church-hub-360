import { Users, User, AlertCircle, Tag, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import type { MemberSearchResult } from '@/hooks/useMemberSearch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemberStatistics } from '@/hooks/useMemberQueries';
import { useMembershipCounts } from '@/hooks/useMembershipCounts';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { Group } from '@/hooks/useGroups';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';

import { Textarea } from '@/components/ui/textarea';

interface RecipientSelectorProps {
  organizationId: string | undefined;
  selectAllMembers: boolean;
  setSelectAllMembers: (val: boolean) => void;
  selectedGroupIds: string[];
  setSelectedGroupIds: (ids: string[]) => void;
  selectedTagItemIds: string[];
  setSelectedTagItemIds: (ids: string[]) => void;
  selectedMembers: MemberSearchResult[];
  setSelectedMembers: (members: MemberSearchResult[]) => void;
  additionalRecipients: string;
  setAdditionalRecipients: (val: string) => void;
  groups: Group[];
  tags: RelationalTagWithItems[];
  targetCount: number;
  isLoadingTargets: boolean;
}

export function RecipientSelector({
  organizationId,
  selectAllMembers,
  setSelectAllMembers,
  selectedGroupIds,
  setSelectedGroupIds,
  selectedTagItemIds,
  setSelectedTagItemIds,
  selectedMembers,
  setSelectedMembers,
  additionalRecipients,
  setAdditionalRecipients,
  groups,
  tags,
  targetCount,
  isLoadingTargets
}: RecipientSelectorProps) {
  const { data: memberStats } = useMemberStatistics(organizationId);
  const { data: membershipCounts } = useMembershipCounts();
  const [activeTab, setActiveTab] = useState<'individuals' | 'groups' | 'tags'>('groups');
  const [selectedTagCategory, setSelectedTagCategory] = useState<string | null>(tags[0]?.id || null);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds(selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((id: string) => id !== groupId)
      : [...selectedGroupIds, groupId]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map(g => g.id));
    }
  };

  const handleTagItemToggle = (itemId: string) => {
    setSelectedTagItemIds(selectedTagItemIds.includes(itemId)
      ? selectedTagItemIds.filter((id: string) => id !== itemId)
      : [...selectedTagItemIds, itemId]
    );
  };

  const currentCategoryItems = useMemo(() => {
    return tags.find(t => t.id === selectedTagCategory)?.tag_items || [];
  }, [tags, selectedTagCategory]);

  const handleSelectAllTagsInCategory = () => {
    const itemIds = currentCategoryItems.map(i => i.id);
    const allSelected = itemIds.every(id => selectedTagItemIds.includes(id));

    if (allSelected) {
      setSelectedTagItemIds(selectedTagItemIds.filter(id => !itemIds.includes(id)));
    } else {
      const newSelections = new Set([...selectedTagItemIds, ...itemIds]);
      setSelectedTagItemIds(Array.from(newSelections));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipients</CardTitle>
        <CardDescription>Select who should receive this message</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <Button
            variant={selectAllMembers ? 'default' : 'outline'}
            onClick={() => {
              setSelectAllMembers(!selectAllMembers);
              if (!selectAllMembers) {
                // If turning ON "All Members", clear other selections to avoid confusion
                setSelectedGroupIds([]);
                setSelectedTagItemIds([]);
                setSelectedMembers([]);
              }
            }}
            className="flex-1 relative"
          >
            <Users className="mr-2 h-4 w-4" />
            All Members
            {memberStats?.total_members && (
              <Badge variant="secondary" className="ml-2 bg-background/20">
                {memberStats.total_members}
              </Badge>
            )}
          </Button>
        </div>

        {!selectAllMembers && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 border-b pb-4">
              <Button
                variant={activeTab === 'groups' ? 'default' : 'outline'}
                onClick={() => setActiveTab('groups')}
                className="flex-1 relative"
              >
                <Layers className="mr-2 h-4 w-4" />
                Groups
                <Badge variant="secondary" className="ml-2 bg-background/20">
                  {membershipCounts?.total_in_any_group || 0}
                </Badge>
              </Button>
              <Button
                variant={activeTab === 'tags' ? 'default' : 'outline'}
                onClick={() => setActiveTab('tags')}
                className="flex-1 relative"
              >
                <Tag className="mr-2 h-4 w-4" />
                Tags
                <Badge variant="secondary" className="ml-2 bg-background/20">
                  {membershipCounts?.total_in_any_tag || 0}
                </Badge>
              </Button>
              <Button
                variant={activeTab === 'individuals' ? 'default' : 'outline'}
                onClick={() => setActiveTab('individuals')}
                className="flex-1"
              >
                <User className="mr-2 h-4 w-4" />
                Specific Members
              </Button>
            </div>

            {activeTab === 'groups' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Select Groups</Label>
                  <Button variant="outline" size="sm" onClick={handleSelectAllGroups}>
                    {selectedGroupIds.length === groups.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${selectedGroupIds.includes(group.id) ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted'
                          }`}
                        onClick={() => handleGroupToggle(group.id)}
                      >
                        <Checkbox
                          checked={selectedGroupIds.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between w-full">
                            <p className="text-sm font-medium leading-none">{group.name}</p>
                            <Badge variant="secondary" className="ml-2 bg-background/50">
                              {membershipCounts?.groups?.[group.id] || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {activeTab === 'tags' && (
              <div className="flex flex-col md:flex-row gap-6 border rounded-md h-[400px]">
                {/* Tag Categories Sidebar */}
                <div className="w-full md:w-1/3 border-r bg-muted/20">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {tags.map((tag) => {
                        const selectedCount = tag.tag_items.filter(i => selectedTagItemIds.includes(i.id)).length;
                        return (
                          <button
                            key={tag.id}
                            onClick={() => setSelectedTagCategory(tag.id)}
                            className={`w-full flex items-center justify-between p-3 text-sm rounded-md transition-colors ${selectedTagCategory === tag.id
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-muted'
                              }`}
                          >
                            <span className="truncate pr-2">{tag.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={selectedTagCategory === tag.id ? "secondary" : "outline"}>
                                {membershipCounts?.tag_categories?.[tag.id] || 0}
                              </Badge>
                              {selectedCount > 0 && (
                                <Badge variant="default" className={selectedTagCategory === tag.id ? "bg-white text-primary hover:bg-white" : ""}>
                                  {selectedCount} ✓
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Tag Items Area */}
                <div className="w-full md:w-2/3 flex flex-col h-full">
                  <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                    <h3 className="font-semibold text-sm">
                      {tags.find(t => t.id === selectedTagCategory)?.name} Options
                    </h3>
                    {currentCategoryItems.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleSelectAllTagsInCategory}>
                        {currentCategoryItems.every(i => selectedTagItemIds.includes(i.id))
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentCategoryItems.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${selectedTagItemIds.includes(item.id) ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted'
                            }`}
                          onClick={() => handleTagItemToggle(item.id)}
                        >
                          <Checkbox
                            checked={selectedTagItemIds.includes(item.id)}
                            onCheckedChange={() => handleTagItemToggle(item.id)}
                          />
                          <div className="flex flex-col space-y-1 w-full">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-medium leading-none">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-background/50">
                                  {membershipCounts?.tag_items?.[item.id] || 0}
                                </Badge>
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: item.color || '#ccc' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {currentCategoryItems.length === 0 && (
                        <div className="col-span-2 text-center text-sm text-muted-foreground py-8">
                          No options found for this category
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {activeTab === 'individuals' && (
              <div className="space-y-2">
                <Label>Search Members</Label>
                {organizationId && (
                  <MemberSearchTypeahead
                    organizationId={organizationId}
                    value={selectedMembers}
                    onChange={setSelectedMembers}
                    multiSelect
                    placeholder="Search for members..."
                  />
                )}
              </div>
            )}

          </div>
        )}

        {selectAllMembers && (
          <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary" />
            <p className="text-sm">
              This message will be sent to <strong>all active members</strong> in your organization.
            </p>
          </div>
        )}



        <div className="pt-4 border-t space-y-2">
          <Label htmlFor="additional-recipients">Additional Recipients (Manual)</Label>
          <Textarea
            id="additional-recipients"
            placeholder="Enter phone numbers separated by commas (e.g. 0244123456, +233541234567)"
            value={additionalRecipients}
            onChange={(e) => setAdditionalRecipients(e.target.value)}
            className="resize-none h-20"
          />
          <p className="text-xs text-muted-foreground">
            Use this to send to non-members or specific numbers.
          </p>
        </div>

        {/* Summary of target selection */}
        {!isLoadingTargets && targetCount > 0 && (
          <div className="bg-green-500/10 p-3 rounded-md flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
              <Users className="h-4 w-4" />
              {targetCount} Recipient{targetCount === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
