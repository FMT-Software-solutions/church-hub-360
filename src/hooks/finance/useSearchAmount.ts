import { useState, useEffect, useRef } from 'react';
import { useDebounceValue } from '@/hooks/useDebounce';
import type { AmountOperator, AmountComparison } from '@/utils/finance/search';

interface UseSearchAmountProps {
  onSearchChange?: (search?: string) => void;
  onAmountSearchChange?: (cmp: AmountComparison | null) => void;
}

export function useSearchAmount({ onSearchChange, onAmountSearchChange }: UseSearchAmountProps) {
  const [searchMode, setSearchMode] = useState<'text' | 'amount'>('text');
  const [amountOperator, setAmountOperator] = useState<AmountOperator>('=');
  const [amountInput, setAmountInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);

  // Use refs to avoid dependency loops in useEffects
  const handlersRef = useRef({ onSearchChange, onAmountSearchChange });
  useEffect(() => {
    handlersRef.current = { onSearchChange, onAmountSearchChange };
  }, [onSearchChange, onAmountSearchChange]);

  // Propagate debounced search term to parent
  useEffect(() => {
    const next = debouncedSearchTerm?.trim();
    if (searchMode === 'text') {
      handlersRef.current.onSearchChange?.(next ? next : undefined);
    }
  }, [debouncedSearchTerm, searchMode]);

  // When switching modes, clear counterpart search
  useEffect(() => {
    if (searchMode === 'amount') {
      // Clear text search when entering amount mode
      setSearchTerm('');
      handlersRef.current.onSearchChange?.(undefined);
    } else {
      // Clear amount search when switching back to text mode
      setAmountInput('');
      setAmountOperator('=');
      handlersRef.current.onAmountSearchChange?.(null);
    }
  }, [searchMode]);

  const handleApplyAmount = () => {
    const numStr = amountInput.replace(/,/g, '');
    const num = Number(numStr);
    if (!Number.isNaN(num)) {
      handlersRef.current.onAmountSearchChange?.({ operator: amountOperator, value: num });
    } else {
      handlersRef.current.onAmountSearchChange?.(null);
    }
  };
  
  const handleClearAmount = () => {
    setAmountInput('');
    setAmountOperator('=');
    handlersRef.current.onAmountSearchChange?.(null);
  };

  const handleClearText = () => {
    setSearchTerm('');
    handlersRef.current.onSearchChange?.(undefined);
  };

  return {
    searchMode,
    setSearchMode,
    amountOperator,
    setAmountOperator,
    amountInput,
    setAmountInput,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    handleApplyAmount,
    handleClearAmount,
    handleClearText
  };
}
