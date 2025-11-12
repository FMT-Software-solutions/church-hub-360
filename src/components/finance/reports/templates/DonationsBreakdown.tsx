import * as React from "react";
import type { IncomeResponseRow } from "@/types/finance";
import { BaseTemplate } from "./BaseTemplate";
import { sumByCategory, formatCurrency } from "@/utils/finance/reports/aggregations";
import EditableLabel from "./EditableLabel";
import { DEFAULT_DONATIONS_BREAKDOWN_LABELS } from "@/db/reportTemplatePrefsDb";
import { useReportTemplateLabels } from "@/hooks/reports/useReportTemplateLabels";

interface DonationsBreakdownProps {
  contributionsAndDonations: IncomeResponseRow[];
  periodLabel: string;
}

export function DonationsBreakdown({ contributionsAndDonations, periodLabel }: DonationsBreakdownProps) {
  const map = React.useMemo(() => sumByCategory(contributionsAndDonations, (r) => r.category || 'Unknown'), [contributionsAndDonations]);
  const items = React.useMemo(() => Array.from(map.entries()).map(([label, amount]) => ({ label, amount })), [map]);
  const total = React.useMemo(() => contributionsAndDonations.reduce((s, r) => s + (r.amount || 0), 0), [contributionsAndDonations]);

  const { labels, setLabel } = useReportTemplateLabels('donations_breakdown', DEFAULT_DONATIONS_BREAKDOWN_LABELS);

  return (
    <BaseTemplate
      title={
        <EditableLabel
          labelKey="title"
          text={labels.title}
          onSave={(key, v) => setLabel(key, v)}
        />
      }
      subtitle={`For the period: ${periodLabel}`}
    >
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            <EditableLabel
              labelKey="categories"
              text={labels.categories}
              onSave={(key, v) => setLabel(key, v)}
              className="text-base font-semibold"
            />
          </h3>
          <div className="text-sm text-muted-foreground">GHS</div>
        </div>
        <div className="mt-2 space-y-1">
          {items.map((it) => (
            <div key={it.label} className="flex items-center justify-between">
              <span className="text-sm">{it.label}</span>
              <span className="text-sm font-medium">{formatCurrency(it.amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-t pt-2 flex items-center justify-between">
          <EditableLabel
            labelKey="total"
            text={labels.total}
            onSave={(key, v) => setLabel(key, v)}
            className="text-sm font-medium"
          />
          <span className="text-sm font-semibold">{formatCurrency(total)}</span>
        </div>
      </section>
    </BaseTemplate>
  );
}