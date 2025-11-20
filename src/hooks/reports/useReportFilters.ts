import { useMemo, useState } from 'react';
import type { DatePresetValue } from '@/components/attendance/reports/DatePresetPicker';

export type ReportFilterMode = 'occasions_sessions' | 'tags_groups' | 'members';

export interface OccasionsSessionsState {
  occasionId: string | 'all';
  sessionIds: string[] | ['all'];
  datePreset: DatePresetValue;
}

export interface TagsGroupsState {
  tagItemIds: string[];
  groupIds: string[];
  datePreset: DatePresetValue;
}

export interface MembersState {
  memberIds: string[];
  occasionId: string | 'all';
  sessionIds: string[] | ['all'];
  datePreset: DatePresetValue;
}

export interface ReportFilters {
  mode: ReportFilterMode;
  branchId: string | 'all';
  occasionsSessions: OccasionsSessionsState;
  tagsGroups: TagsGroupsState;
  members: MembersState;
  hasGenerated: boolean;
}

export function useReportFilters() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  const defaultPreset: DatePresetValue = {
    preset: 'last_30_days',
    range: { from: start, to: now },
  };

  const [filters, setFilters] = useState<ReportFilters>({
    mode: 'occasions_sessions',
    branchId: 'all',
    occasionsSessions: {
      occasionId: 'all',
      sessionIds: ['all'],
      datePreset: defaultPreset,
    },
    tagsGroups: {
      tagItemIds: [],
      groupIds: [],
      datePreset: defaultPreset,
    },
    members: {
      memberIds: [],
      occasionId: 'all',
      sessionIds: ['all'],
      datePreset: defaultPreset,
    },
    hasGenerated: false,
  });

  const setMode = (mode: ReportFilterMode) =>
    setFilters((f) => ({ ...f, mode, hasGenerated: false }));

  const setBranchId = (branchId: string | 'all') =>
    setFilters((f) => ({ ...f, branchId, hasGenerated: false }));

  const updateOccasionsSessions = (partial: Partial<OccasionsSessionsState>) =>
    setFilters((f) => ({ ...f, occasionsSessions: { ...f.occasionsSessions, ...partial }, hasGenerated: false }));

  const updateTagsGroups = (partial: Partial<TagsGroupsState>) =>
    setFilters((f) => ({ ...f, tagsGroups: { ...f.tagsGroups, ...partial }, hasGenerated: false }));

  const updateMembers = (partial: Partial<MembersState>) =>
    setFilters((f) => ({ ...f, members: { ...f.members, ...partial }, hasGenerated: false }));

  const markGenerated = () => setFilters((f) => ({ ...f, hasGenerated: true }));

  const isSpecificSessionSelected = (sessionIds: string[] | ['all']) =>
    Array.isArray(sessionIds) && sessionIds.length > 0 && !sessionIds.includes('all');

  const showOccasionsSessionsWidget = useMemo(
    () => filters.mode === 'occasions_sessions' || filters.mode === 'members',
    [filters.mode]
  );

  const showTagsGroupsWidget = useMemo(
    () => filters.mode === 'tags_groups',
    [filters.mode]
  );

  const showMembersWidget = useMemo(
    () => filters.mode === 'members',
    [filters.mode]
  );

  const showDatePresetWidget = useMemo(() => {
    switch (filters.mode) {
      case 'occasions_sessions':
        return !isSpecificSessionSelected(filters.occasionsSessions.sessionIds);
      case 'tags_groups':
        return true;
      case 'members':
        return true;
    }
  }, [filters.mode, filters.occasionsSessions.sessionIds]);

  const showReportWidgets = useMemo(() => filters.hasGenerated, [filters.hasGenerated]);

  const selectedMemberCount = useMemo(
    () => (filters.mode === 'members' ? filters.members.memberIds.length : 0),
    [filters.mode, filters.members.memberIds]
  );

  const showGenderWidget = useMemo(
    () => filters.mode !== 'members' || selectedMemberCount >= 2,
    [filters.mode, selectedMemberCount]
  );

  const isGenerateEnabled = useMemo(() => {
    switch (filters.mode) {
      case 'occasions_sessions':
        return true;
      case 'tags_groups':
        return filters.tagsGroups.tagItemIds.length > 0 || filters.tagsGroups.groupIds.length > 0;
      case 'members':
        return filters.members.memberIds.length > 0;
    }
  }, [filters]);

  return {
    filters,
    setMode,
    setBranchId,
    updateOccasionsSessions,
    updateTagsGroups,
    updateMembers,
    markGenerated,
    // flags
    showOccasionsSessionsWidget,
    showTagsGroupsWidget,
    showMembersWidget,
    showDatePresetWidget,
    showReportWidgets,
    showGenderWidget,
    isGenerateEnabled,
    isSpecificSessionSelected,
  } as const;
}