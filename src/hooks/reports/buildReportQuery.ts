import type { ReportFilters } from './useReportFilters';

export interface AttendanceReportQuery {
  date_from?: string;
  date_to?: string;
  branch_id?: string | 'all';
  occasion_ids?: string[];
  session_ids?: string[];
  tag_item_ids?: string[];
  group_ids?: string[];
  member_ids?: string[];
}

export function buildReportQuery(filters: ReportFilters): AttendanceReportQuery {
  const params: AttendanceReportQuery = {};

  if (filters.branchId && filters.branchId !== 'all') {
    params.branch_id = filters.branchId;
  }

  switch (filters.mode) {
    case 'occasions_sessions': {
      const { occasionId, sessionIds, datePreset } = filters.occasionsSessions;
      if (occasionId !== 'all') params.occasion_ids = [occasionId];
      const specificSessions = Array.isArray(sessionIds) && !sessionIds.includes('all');
      if (specificSessions) {
        params.session_ids = sessionIds as string[];
      } else {
        params.date_from = datePreset.range.from.toISOString();
        params.date_to = datePreset.range.to.toISOString();
      }
      break;
    }

    case 'tags_groups': {
      const { tagItemIds, groupIds, datePreset } = filters.tagsGroups;
      if (tagItemIds.length > 0) params.tag_item_ids = tagItemIds;
      if (groupIds.length > 0) params.group_ids = groupIds;
      params.date_from = datePreset.range.from.toISOString();
      params.date_to = datePreset.range.to.toISOString();
      break;
    }

    case 'members': {
      const { memberIds, occasionId, sessionIds, datePreset } = filters.members;
      if (memberIds.length > 0) params.member_ids = memberIds;
      if (occasionId !== 'all') params.occasion_ids = [occasionId];
      const specificSessions = Array.isArray(sessionIds) && !sessionIds.includes('all');
      if (specificSessions) params.session_ids = sessionIds as string[];
      params.date_from = datePreset.range.from.toISOString();
      params.date_to = datePreset.range.to.toISOString();
      break;
    }
  }

  return params;
}