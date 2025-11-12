import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePresetPicker, type DatePresetValue } from "@/components/attendance/reports/DatePresetPicker";
import { mapPickerToDateFilter, mapDateFilterToPicker } from "@/utils/finance/dateFilter";
import type { DateFilter } from "@/types/finance";

export type StatsFilterItem = "all" | "income" | "contrib" | "expenses" | "pledges";

export interface StatsFilter {
  date_filter: DateFilter;
  item: StatsFilterItem;
}

interface StatsFilterBarProps {
  value: StatsFilter;
  onChange: (next: StatsFilter) => void;
}

export function StatsFilterBar({ value, onChange }: StatsFilterBarProps) {
  const presetValue = React.useMemo<DatePresetValue>(() => {
    return mapDateFilterToPicker(value.date_filter);
  }, [value.date_filter]);

  const handlePresetChange = (nextPreset: DatePresetValue) => {
    const nextDateFilter = mapPickerToDateFilter(nextPreset);
    onChange({ ...value, date_filter: nextDateFilter });
  };

  const handleItemChange = (next: StatsFilterItem) => {
    onChange({ ...value, item: next });
  };

  return (
    <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <DatePresetPicker
            value={presetValue}
            onChange={handlePresetChange}
          />
        </div>

        <div className="flex flex-col gap-0.5 md:col-span-2">
          <Label className="text-sm">Finance Item</Label>
          <Select value={value.item} onValueChange={handleItemChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="contrib">Contributions & Donations</SelectItem>
              <SelectItem value="expenses">Expenses</SelectItem>
              <SelectItem value="pledges">Pledges</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}