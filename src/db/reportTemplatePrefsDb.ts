import Dexie, { type Table } from 'dexie';

export type ReportTemplateId = 'income_statement' | 'donations_breakdown' | 'pledges_summary' | string;

export interface ReportTemplatePreferences {
  id: string; // `${orgId}:${templateId}` for uniqueness
  orgId: string;
  templateId: ReportTemplateId;
  labels: Record<string, string>;
  updatedAt: number; // epoch millis
}

export class ChurchHubReportPrefsDB extends Dexie {
  reportTemplatePrefs!: Table<ReportTemplatePreferences, string>;

  constructor() {
    super('ChurchHubReportPrefsDB');
    this.version(1).stores({
      // primary key &id ensures unique records per org+template
      reportTemplatePrefs: '&id, orgId, templateId',
    });
  }
}

export const reportPrefsDb = new ChurchHubReportPrefsDB();

// Defaults for Income Statement template label keys
export type IncomeStatementLabelKey =
  | 'title'
  | 'revenue'
  | 'total_revenue'
  | 'other_income'
  | 'total_other_income'
  | 'expenditure'
  | 'total_expenditure'
  | 'summary'
  | 'total_income'
  | 'profit'
  | 'by_period';

export const DEFAULT_INCOME_STATEMENT_LABELS: Record<IncomeStatementLabelKey, string> = {
  title: 'Statement of Comprehensive Income',
  revenue: 'Revenue',
  total_revenue: 'Total Revenue',
  other_income: 'Other Income',
  total_other_income: 'Total Other Income',
  expenditure: 'Expenditure',
  total_expenditure: 'Total Expenditure',
  summary: 'Summary',
  total_income: 'Total Income',
  profit: 'Profit',
  by_period: 'By Period',
};

// Defaults for Donations Breakdown template label keys
export type DonationsBreakdownLabelKey = 'title' | 'categories' | 'total';

export const DEFAULT_DONATIONS_BREAKDOWN_LABELS: Record<DonationsBreakdownLabelKey, string> = {
  title: 'Contributions & Donations Breakdown',
  categories: 'Categories',
  total: 'Total',
};

// Removed Pledges page label keys and defaults (page remains static)

// Defaults for Pledges Summary template label keys
export type PledgesSummaryLabelKey =
  | 'title'
  | 'total_pledged'
  | 'total_paid'
  | 'outstanding'
  | 'by_pledge_type'
  | 'pledged'
  | 'fulfilled'
  | 'remaining';

export const DEFAULT_PLEDGES_SUMMARY_LABELS: Record<PledgesSummaryLabelKey, string> = {
  title: 'Pledges Summary',
  total_pledged: 'Total Pledged',
  total_paid: 'Total Paid',
  outstanding: 'Outstanding',
  by_pledge_type: 'By Pledge Type',
  pledged: 'Pledged',
  fulfilled: 'Fulfilled',
  remaining: 'Remaining',
};

export function defaultReportTemplatePreferences(
  orgId: string,
  templateId: ReportTemplateId,
  defaults: Record<string, string>
): ReportTemplatePreferences {
  return {
    id: `${orgId}:${templateId}`,
    orgId,
    templateId,
    labels: defaults,
    updatedAt: Date.now(),
  };
}