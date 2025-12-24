import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { AmountOperator } from '@/utils/finance/search';

interface SearchAmountSwitcherProps {
  searchMode: 'text' | 'amount';
  onSearchModeChange: (mode: 'text' | 'amount') => void;
  amountOperator: AmountOperator;
  onAmountOperatorChange: (op: AmountOperator) => void;
  amountInput: string;
  onAmountInputChange: (val: string) => void;
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  onApplyAmount: () => void;
  searchPlaceholder?: string;
}

export const SearchAmountSwitcher: React.FC<SearchAmountSwitcherProps> = ({
  searchMode,
  onSearchModeChange,
  amountOperator,
  onAmountOperatorChange,
  amountInput,
  onAmountInputChange,
  searchTerm,
  onSearchTermChange,
  onApplyAmount,
  searchPlaceholder = 'Search records...',
}) => {
  return (
    <div className="flex flex-1 gap-2 items-center">
      {/* Search mode toggle */}
      <div className="flex items-center gap-2">
        <Label htmlFor="amount-mode" className="text-xs">Amount</Label>
        <Switch
          id="amount-mode"
          checked={searchMode === 'amount'}
          onCheckedChange={(checked) => onSearchModeChange(checked ? 'amount' : 'text')}
        />
      </div>

      {/* Operator select when amount mode */}
      {searchMode === 'amount' && (
        <div className="min-w-[110px]">
          <Select
            value={amountOperator}
            onValueChange={(v) => onAmountOperatorChange(v as AmountOperator)}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder=">" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=">">&gt;</SelectItem>
              <SelectItem value=">=">&gt;=</SelectItem>
              <SelectItem value="=">=</SelectItem>
              <SelectItem value="<">{'<'}</SelectItem>
              <SelectItem value="<=">{'<='}</SelectItem>
              <SelectItem value="!=">!=</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Unified input: displays either text or amount with operator */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={searchMode === 'amount' ? 'Enter amount (e.g., 100 or 1,000.50)' : searchPlaceholder}
          value={searchMode === 'amount' ? `${amountOperator} ${amountInput}` : searchTerm}
          onChange={(e) => {
            if (searchMode === 'amount') {
              const raw = e.target.value;
              // Strip leading operator if user edits it inline, keep only numeric part after operator
              const cleaned = raw.replace(/^\s*([<>]=?|!?=)?\s*/, '');
              // Allow digits, commas, dot
              const numericPart = cleaned.replace(/[^0-9.,]/g, '');
              onAmountInputChange(numericPart);
            } else {
              onSearchTermChange(e.target.value);
            }
          }}
          className="pl-9"
        />
      </div>

      {/* Apply button when in amount mode */}
      {searchMode === 'amount' && (
        <Button
          variant="outline"
          onClick={onApplyAmount}
          disabled={!amountInput.trim()}
        >
          Apply
        </Button>
      )}
    </div>
  );
};
