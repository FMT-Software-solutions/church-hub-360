# Attendance Reports Redesign — Functional Specification

## Overview

ChurchHub360 needs a flexible, efficient, and user-friendly Attendance Reports module that lets users generate insights by scoping data via Occasions/Sessions, Tags/Groups, and Members. This specification organizes requirements and defines UI/UX behavior, state management, data flow, and export options to guide implementation and future maintenance.

## Goals

- Provide three top-level filter modes with dedicated filter widgets:
  - Occasions & Sessions
  - Tags & Groups
  - Members
- Allow quick toggling between filter modes, show only relevant filter inputs, and hide irrelevant widgets to reduce cognitive load.
- Support date presets/range selection in appropriate contexts.
- Generate reports on demand with a clear “Generate” action.
- Present three core report widgets with consistent export controls:
  - Table (attendance records)
  - Age Group breakdown (uses `useAgeGroupManagement`)
  - Gender breakdown
- Ensure responsive, mobile-first design and dark/light theme compatibility.

## Non-Goals

- Designing advanced chart visualizations beyond simple trend/breakdown displays.
- Implementing backend email delivery or server-side PDF generation (client-side exports only for now).

## Key User Stories

1. As a user, I can filter by occasions and sessions, choose a date range/preset if applicable, and generate a report.
2. As a user, I can filter by tags and groups (multi-select), optionally choose a date range/preset, and generate a report.
3. As a user, I can filter by members (multi-select), optionally scope by occasions/sessions and date range/preset, and generate a report.
4. As a user, I can export any report widget to CSV/XLSX/PDF/Print/Email from a shared export menu.

## Top-Level Filter Modes

### Mode 1: Occasions & Sessions

- Inputs:
  - Occasions: single-select `Select` (default “All Occasions”), populated via `useAttendanceOccasions`.
  - Sessions: multi-select `MultipleSelector` (default “All Sessions”), populated via `useAttendanceSessions`.
  - Date Range / Preset: `DatePresetPicker`.
- Behavior:
  - Selecting a specific occasion filters the sessions list to sessions belonging to that occasion.
  - “All Sessions” is the default. Users may select specific sessions.
  - When specific session(s) are selected (i.e., not “All Sessions”), hide the Date Range/Preset widget because specific sessions have their own intrinsic dates.
  - “Generate Report” triggers data fetch and reveals report widgets.

### Mode 2: Tags & Groups

- Inputs:
  - Tags: multi-select from relational tag items using `useRelationalTags` (items from `RelationalTagWithItems.tag_items`).
  - Groups: multi-select via `useGroups`.
  - Date Range / Preset: `DatePresetPicker`.
- Behavior:
  - Both Tags and Groups support multi-select; either can be empty.
  - Date Range/Preset is always visible here.
  - “Generate Report” triggers data fetch and reveals report widgets.

### Mode 3: Members

- Inputs:
  - Occasions & Sessions widget (same as Mode 1), optional to scope member reports.
  - Members: multi-select via `MemberSearchTypeahead`.
  - Date Range / Preset: `DatePresetPicker` (always visible for Members mode).
- Behavior:
  - Users may scope by occasion/session or leave them as “All”.
  - Multiple members can be selected; single-member selection has special behavior for Gender widget (see below).
  - “Generate Report” triggers data fetch and reveals report widgets.

## Filter Show/Hide Strategy (Flags)

Introduce a small set of computed flags derived from filter state and mode. These flags drive conditional rendering, keeping UI efficient and predictable.

### Suggested Types

```ts
type ReportFilterMode = 'occasions_sessions' | 'tags_groups' | 'members';

interface OccasionsSessionsState {
  occasionId: string | 'all';
  sessionIds: string[] | ['all'];
  datePreset: DatePresetValue; // { preset: 'last_30_days' | 'custom' | ... , range: { from: Date, to: Date } }
}

interface TagsGroupsState {
  tagItemIds: string[];
  groupIds: string[];
  datePreset: DatePresetValue;
}

interface MembersState {
  memberIds: string[];
  // Optional scoping
  occasionId: string | 'all';
  sessionIds: string[] | ['all'];
  datePreset: DatePresetValue;
}

interface ReportFilters {
  mode: ReportFilterMode;
  occasionsSessions: OccasionsSessionsState;
  tagsGroups: TagsGroupsState;
  members: MembersState;
  hasGenerated: boolean; // toggled true after user clicks Generate
}
```

### Computed Flags

```ts
const showOccasionsSessionsWidget =
  filters.mode === 'occasions_sessions' || filters.mode === 'members';

const showTagsGroupsWidget = filters.mode === 'tags_groups';
const showMembersWidget = filters.mode === 'members';

// Date preset visibility logic
const isSpecificSessionSelected = (sessionIds: string[] | ['all']) =>
  Array.isArray(sessionIds) && sessionIds.length > 0 && !sessionIds.includes('all');

const showDatePresetWidget = (() => {
  switch (filters.mode) {
    case 'occasions_sessions':
      return !isSpecificSessionSelected(filters.occasionsSessions.sessionIds);
    case 'tags_groups':
      return true; // always shown
    case 'members':
      return true; // always shown
  }
})();

// Reports area visibility
const showReportWidgets = filters.hasGenerated;

// Gender widget visibility
const selectedMemberCount =
  filters.mode === 'members' ? filters.members.memberIds.length : 0;
const showGenderWidget =
  filters.mode !== 'members' || selectedMemberCount >= 2;

// Generate button enablement
const isGenerateEnabled = (() => {
  switch (filters.mode) {
    case 'occasions_sessions':
      return true; // always can generate based on current selections
    case 'tags_groups':
      return (
        filters.tagsGroups.tagItemIds.length > 0 ||
        filters.tagsGroups.groupIds.length > 0
      );
    case 'members':
      return filters.members.memberIds.length > 0; // require at least one member
  }
})();
```

This minimal flag set keeps rendering decisions simple and deterministic.

## Query Composition (useAttendanceReport)

Build query params from the active mode and filter state. Avoid sending unnecessary parameters.

### Base shape

```ts
interface AttendanceReportQuery {
  date_from?: string; // ISO
  date_to?: string;   // ISO
  occasion_ids?: string[];
  session_ids?: string[];
  tag_item_ids?: string[];
  group_ids?: string[];
  member_ids?: string[];
}
```

### Mode-specific mapping

- Occasions & Sessions:
  - If occasionId !== 'all', set `occasion_ids = [occasionId]`.
  - If specific sessions selected (not `['all']`), set `session_ids = sessionIds` and omit `date_from/date_to` (session dates are intrinsic).
  - Else, include `date_from/date_to` from the date preset.

- Tags & Groups:
  - Include any selected `tag_item_ids` and `group_ids`.
  - Always include `date_from/date_to` from the date preset.

- Members:
  - Include `member_ids` (required to enable Generate).
  - Optionally include scoped `occasion_ids`/`session_ids` if provided.
  - Always include `date_from/date_to` from the date preset.

## Report Widgets

### 1) Table Widget

- Shows attendance records for the selected filters in tabular form.
- Columns: Date/Time, Session, Member, plus optional metadata (e.g., occasion name).
- Performance: Virtualize long lists (e.g., using a simple windowed list or a lightweight table with pagination).
- Export: Uses shared Export Menu (CSV/XLSX/PDF/Print/Email).

### 2) Age Group Widget

- Displays counts for configured age groups of the organization.
- Data source: `useAgeGroupManagement(organizationId)` to get defined age groups; combine with report records to populate counts.
- Export: Table format of [Age Group, Count] via shared Export Menu.

### 3) Gender Widget

- Displays counts by gender for the selected filters.
- Special rule: In Members mode, if only one member is selected, show disabled/empty state; enable when 2+ members selected.
- Export: Table format of [Gender, Count] via shared Export Menu.

## Shared Export Menu (Reusable)

- Component: `ReportExportMenu`
- UI: ShadCN `DropdownMenu` with options: CSV, XLSX, PDF, Print, Email.
- Inputs:
  - `filenameBase: string`
  - `getRows: () => Array<Record<string, unknown>>` (returns tabular rows)
  - `getSummary?: () => Array<[string, unknown]>` (optional summary rows)
  - `disabled?: boolean`
- Behavior:
  - CSV/XLSX: generated from `getRows` and `getSummary`.
  - PDF: compact summary + rows; use dynamic import for `jspdf` to keep bundle lean.
  - Print: prints the section via `useReactToPrint`.
  - Email: opens `EmailReportDialog` with exported file attached or link to download.

## Component Structure & Files

```
src/components/attendance/reports/
  ReportsInsights.tsx           // Container + orchestration
  TopFiltersBar.tsx             // Tabs: Occasions/Sessions, Tags/Groups, Members
  OccasionsSessionsFilter.tsx   // Existing widget (refined behavior)
  TagsGroupsFilter.tsx          // New: tags+groups only
  MembersFilter.tsx             // New: members + optional occasions/sessions
  DatePresetPicker.tsx          // Existing

  widgets/
    TableReport.tsx             // Attendance records table
    AgeGroupReport.tsx          // Age group breakdown
    GenderReport.tsx            // Gender breakdown

  ReportExportMenu.tsx          // Shared export dropdown

src/hooks/reports/
  useReportFilters.ts           // Holds filter state + computed flags
  buildReportQuery.ts           // Maps filter state -> `AttendanceReportQuery`
```

## State Management

- Keep filters local to `ReportsInsights` via `useReportFilters` to minimize global coupling.
- Use `useMemo` for derived flags and query params.
- Debounce member search input; avoid excessive re-renders.

## Data & Types

- Occasions: `useAttendanceOccasions` → `AttendanceOccasionWithRelations[]`.
- Sessions: `useAttendanceSessions` → list of `AttendanceSession`.
- Tags: `useRelationalTags` → `RelationalTagWithItems[]` and their `tag_items`.
- Groups: `useGroups` → `PaginatedGroupsResponse.data: Group[]` (unwrap for options).
- Members: `MemberSearchTypeahead` → `MemberSearchResult[]` for selections.
- Age Groups: `useAgeGroupManagement(organizationId)` → configured age groups.
- Report: `useAttendanceReport(params)` → summary, trend, records, breakdowns.

## UX & Performance

- Mobile-first layout; stack filter widgets vertically on small screens.
- Light/dark theming using Tailwind & ShadCN tokens.
- Virtualize large tables or paginate in-memory for responsiveness.
- Use dynamic imports for heavy libraries (e.g., `jspdf`).

## Accessibility

- Keyboard-accessible tabs and dropdowns.
- Clear focus styles and ARIA labels for select/multiselect.
- Descriptive empty/disabled states.

## Error Handling

- Show non-blocking inline messages for data load failures.
- Use `sonner` toasts for transient notifications (e.g., export ready).

## Testing Strategy

- Unit tests for filter flag logic (`useReportFilters`).
- Integration tests for query composition (`buildReportQuery`).
- Snapshot tests for widgets with common states.
- Manual QA for large data sets and export correctness.

## Implementation Plan (Phased)

1. Create `useReportFilters` with types and computed flags; unit tests.
2. Build `TopFiltersBar` and connect to filter state.
3. Refine `OccasionsSessionsFilter` behavior and add `TagsGroupsFilter`, `MembersFilter`.
4. Implement `buildReportQuery` and integrate with `useAttendanceReport`.
5. Implement Table, Age Group, Gender widgets; wire up Export Menu.
6. Polish UX: disabled states, responsive behavior, accessibility.
7. Add tests; run builds; document known limitations.

## Risks & Mitigations

- Large datasets → Pagination/virtualization and memoization.
- Complex filter combinations → Keep query composition centralized and tested.
- Export size/performance → Dynamic imports, streaming CSV/XLSX where possible.