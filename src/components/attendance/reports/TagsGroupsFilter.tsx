import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import MultipleSelector, { type Option } from '@/components/ui/multiselect';
import { DatePresetPicker, type DatePresetValue } from './DatePresetPicker';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { useGroups } from '@/hooks/useGroups';
import { useOrganization } from '@/contexts/OrganizationContext';

interface TagsGroupsFilterProps {
  tagItemIds: string[];
  onTagItemIdsChange: (ids: string[]) => void;
  groupIds: string[];
  onGroupIdsChange: (ids: string[]) => void;
  datePreset: DatePresetValue;
  onDatePresetChange: (v: DatePresetValue) => void;
}

export function TagsGroupsFilter({
  tagItemIds,
  onTagItemIdsChange,
  groupIds,
  onGroupIdsChange,
  datePreset,
  onDatePresetChange,
}: TagsGroupsFilterProps) {
  const { currentOrganization } = useOrganization();
  const { data: tags = [] } = useTagsQuery(currentOrganization?.id);
  const { data: paginated } = useGroups({ page: 1, pageSize: 200 });
  const groups = paginated?.data || [];

  const tagOptions: Option[] = useMemo(() => {
    const opts: Option[] = [];
    tags.forEach((tag) => tag.tag_items.forEach((item) => opts.push({ value: item.id, label: item.name })));
    return opts;
  }, [tags]);

  const groupOptions: Option[] = useMemo(() => {
    return groups.map((g) => ({ value: g.id, label: g.name || 'Group' }));
  }, [groups]);

  const selectedTagOptions = useMemo(
    () => tagOptions.filter((o) => tagItemIds.includes(o.value)),
    [tagOptions, tagItemIds]
  );
  const selectedGroupOptions = useMemo(
    () => groupOptions.filter((o) => groupIds.includes(o.value)),
    [groupOptions, groupIds]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Tags</Label>
        <MultipleSelector
          value={selectedTagOptions}
          options={tagOptions}
          onChange={(opts: Option[]) => onTagItemIdsChange(opts.map((o) => o.value))}
          placeholder="Select tags"
        />
      </div>
      <div>
        <Label>Groups</Label>
        <MultipleSelector
          value={selectedGroupOptions}
          options={groupOptions}
          onChange={(opts: Option[]) => onGroupIdsChange(opts.map((o) => o.value))}
          placeholder="Select groups"
        />
      </div>
      <div className='md:col-span-2'>
        <DatePresetPicker value={datePreset} onChange={onDatePresetChange} />
      </div>
    </div>
  );
}