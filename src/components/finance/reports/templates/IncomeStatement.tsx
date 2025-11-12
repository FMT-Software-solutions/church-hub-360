import * as React from 'react';
import type { IncomeResponseRow, ExpenseRecord } from '@/types/finance';
import { BaseTemplate } from './BaseTemplate';
import {
  incomeSections,
  expenseSections,
  formatCurrency,
} from '@/utils/finance/reports/aggregations';
import EditableLabel from './EditableLabel';
import {
  DEFAULT_INCOME_STATEMENT_LABELS,
} from '@/db/reportTemplatePrefsDb';
import { useReportTemplateLabels } from '@/hooks/reports/useReportTemplateLabels';

interface IncomeStatementProps {
  incomes: IncomeResponseRow[];
  expenses: ExpenseRecord[];
  periodLabel: string;
}

export function IncomeStatement({
  incomes,
  expenses,
  periodLabel,
}: IncomeStatementProps) {
  const inc = React.useMemo(() => incomeSections(incomes), [incomes]);
  const exp = React.useMemo(() => expenseSections(expenses), [expenses]);

  const totalIncome = inc.generalTotal + inc.otherTotal;
  const totalExpense = exp.total;
  const profit = totalIncome - totalExpense;

  const { labels, setLabel } = useReportTemplateLabels(
    'income_statement',
    DEFAULT_INCOME_STATEMENT_LABELS
  );

  return (
    <BaseTemplate
      title={
        <EditableLabel
          labelKey="title"
          text={labels.title as string}
          onSave={(key, v) => setLabel(key as any, v)}
        />
      }
      subtitle={`For the period: ${periodLabel}`}
    >
      {/* Revenue */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            <EditableLabel
              labelKey="revenue"
              text={labels.revenue}
              onSave={(key, v) => setLabel(key, v)}
              className="text-base font-semibold"
            />
          </h3>
          <div className="text-sm text-muted-foreground">GHS</div>
        </div>
        <div className="mt-2 space-y-1">
          {inc.generalItems.map((it) => (
            <div key={it.label} className="flex items-center justify-between">
              <span className="text-sm">{it.label}</span>
              <span className="text-sm font-medium">
                {formatCurrency(it.amount)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-y py-2 flex items-center justify-between">
          <EditableLabel
            labelKey="total_revenue"
            text={labels.total_revenue}
            onSave={(key, v) => setLabel(key, v)}
            className="text-sm font-medium"
          />
          <span className="text-sm font-semibold">
            {formatCurrency(inc.generalTotal)}
          </span>
        </div>
      </section>

      {/* Other Income */}
      <section className="my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            <EditableLabel
              labelKey="other_income"
              text={labels.other_income}
              onSave={(key, v) => setLabel(key, v)}
              className="text-base font-semibold"
            />
          </h3>
          <div className="text-sm text-muted-foreground">GHS</div>
        </div>
        <div className="mt-2 space-y-1">
          {inc.otherItems.map((it) => (
            <div key={it.label} className="flex items-center justify-between">
              <span className="text-sm">{it.label}</span>
              <span className="text-sm font-medium">
                {formatCurrency(it.amount)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-y py-2 flex items-center justify-between">
          <EditableLabel
            labelKey="total_other_income"
            text={labels.total_other_income}
            onSave={(key, v) => setLabel(key, v)}
            className="text-sm font-medium"
          />
          <span className="text-sm font-semibold">
            {formatCurrency(inc.otherTotal)}
          </span>
        </div>
      </section>

      {/* Expenditure */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            <EditableLabel
              labelKey="expenditure"
              text={labels.expenditure}
              onSave={(key, v) => setLabel(key, v)}
              className="text-base font-semibold"
            />
          </h3>
          <div className="text-sm text-muted-foreground">GHS</div>
        </div>
        <div className="mt-2 space-y-1">
          {exp.items.map((it) => (
            <div key={it.label} className="flex items-center justify-between">
              <span className="text-sm">{it.label}</span>
              <span className="text-sm font-medium">
                {formatCurrency(it.amount)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-y py-2 flex items-center justify-between">
          <EditableLabel
            labelKey="total_expenditure"
            text={labels.total_expenditure}
            onSave={(key, v) => setLabel(key, v)}
            className="text-sm font-medium"
          />
          <span className="text-sm font-semibold">
            {formatCurrency(totalExpense)}
          </span>
        </div>
      </section>

      {/* Totals */}
      <p className="mt-8 ">
        <EditableLabel
          labelKey="summary"
          text={labels.summary}
          onSave={(key, v) => setLabel(key, v)}
          className=""
        />
      </p>
      <section className="border p-2 border-border rounded-lg space-y-4">
        <div className="mt-2 flex items-center justify-between">
          <EditableLabel
            labelKey="total_income"
            text={labels.total_income}
            onSave={(key, v) => setLabel(key, v)}
            className="text-sm font-medium"
          />
          <span className="text-sm font-semibold">
            {formatCurrency(totalIncome)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <EditableLabel
            labelKey="total_expenditure"
            text={labels.total_expenditure}
            onSave={(key, v) => setLabel(key, v)}
            className="text-sm font-medium"
          />
          <span className="text-sm font-semibold">
            {formatCurrency(totalExpense)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <EditableLabel
            labelKey="profit"
            text={labels.profit}
            onSave={(key, v) => setLabel(key, v)}
            className="text-sm font-medium"
          />
          <span className="text-sm font-semibold">
            {formatCurrency(profit)}
          </span>
        </div>
      </section>
    </BaseTemplate>
  );
}
