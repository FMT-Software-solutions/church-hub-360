import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounceValue } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOccasionSearch, useOccasionDetails, type OccasionSearchResult } from '@/hooks/attendance/useAttendanceSearch';

export interface OccasionSearchTypeaheadProps {
  value?: OccasionSearchResult[];
  onChange?: (items: OccasionSearchResult[]) => void;
  placeholder?: string;
  multiSelect?: boolean; // default false; current use-case is single-select
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

interface OccasionItemProps {
  item: OccasionSearchResult;
  isSelected: boolean;
  multiSelect: boolean;
  onSelect: (item: OccasionSearchResult) => void;
  onDeselect: (item: OccasionSearchResult) => void;
}

function OccasionItem({ item, isSelected, multiSelect, onSelect, onDeselect }: OccasionItemProps) {
  const handleClick = () => {
    if (isSelected) onDeselect(item); else onSelect(item);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer transition-colors rounded-md',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent/50'
      )}
      onClick={handleClick}
    >
      {multiSelect && (
        <Checkbox checked={isSelected} onChange={() => {}} className="pointer-events-none" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.display_name}</div>
        {item.display_subtitle && (
          <div className="text-xs text-muted-foreground truncate">{item.display_subtitle}</div>
        )}
      </div>
      {!multiSelect && isSelected && <Check className="h-4 w-4 text-primary" />}
    </div>
  );
}

function SelectedOccasionBadge({ item, onRemove, disabled }: { item: OccasionSearchResult; onRemove: (i: OccasionSearchResult) => void; disabled?: boolean; }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1 mr-1 mb-1">
      <span className="truncate max-w-[160px]">{item.display_name}</span>
      {!disabled && (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(item); }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}

export function OccasionSearchTypeahead({
  value = [],
  onChange,
  placeholder = 'Search occasions...',
  multiSelect = false,
  disabled = false,
  className,
  emptyMessage = 'No occasions found',
  loadingMessage = 'Searching occasions...',
}: OccasionSearchTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults = [], isLoading, error } = useOccasionSearch(debouncedSearchTerm, 10);

  // Ensure values have display info when controlled with IDs externally
  const selectedIds = value.map(v => v.id);
  const { data: selectedDetails = [] } = useOccasionDetails(selectedIds);
  const displayValue = value.length ? value : selectedDetails;

  const handleSelect = (item: OccasionSearchResult) => {
    if (disabled) return;
    let newValue: OccasionSearchResult[];
    if (multiSelect) {
      const exists = displayValue.some(v => v.id === item.id);
      if (exists) return;
      newValue = [...displayValue, item];
    } else {
      newValue = [item];
      setIsOpen(false);
      setSearchTerm('');
      setInputValue('');
    }
    onChange?.(newValue);
  };

  const handleDeselect = (item: OccasionSearchResult) => {
    if (disabled) return;
    const newValue = displayValue.filter(v => v.id !== item.id);
    onChange?.(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    setSearchTerm(newVal);
    if (newVal.trim() && !isOpen) setIsOpen(true);
    else if (!newVal.trim() && isOpen) setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsEditing(true);
    if (inputValue.trim()) setIsOpen(true);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

  const handleClearInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setSearchTerm('');
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onChange?.([]);
    setSearchTerm('');
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const isSelected = (item: OccasionSearchResult) => displayValue.some(v => v.id === item.id);

  const getDisplayValue = () => {
    // When single-select has a selection, allow typing to override display
    if (!multiSelect && displayValue.length > 0) {
      if (isEditing || isOpen || inputValue.trim().length > 0) return inputValue;
      return displayValue[0].display_name;
    }
    return inputValue;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {multiSelect && displayValue.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {displayValue.map((item) => (
            <SelectedOccasionBadge key={item.id} item={item} onRemove={handleDeselect} disabled={disabled} />
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          className={cn('pr-20', disabled && 'opacity-50 cursor-not-allowed')}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue.trim().length > 0 && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-muted"
              onClick={handleClearInput}
              tabIndex={-1}
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {!multiSelect && displayValue.length > 0 && !disabled && inputValue.trim().length === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleClearSelection}
              tabIndex={-1}
              aria-label="Clear selected occasion"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Search className="h-4 w-4 opacity-50" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-md">
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">{loadingMessage}</div>
            ) : error ? (
              <div className="p-4 text-center text-sm text-destructive">Error loading occasions</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {debouncedSearchTerm.trim() ? emptyMessage : 'Start typing to search occasions'}
              </div>
            ) : (
              <div className="p-1">
                {searchResults.map((item) => (
                  <OccasionItem
                    key={item.id}
                    item={item}
                    isSelected={isSelected(item)}
                    multiSelect={!!multiSelect}
                    onSelect={handleSelect}
                    onDeselect={handleDeselect}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
          {multiSelect && displayValue.length > 0 && (
            <div className="border-t p-2 text-xs text-muted-foreground text-center">
              {displayValue.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}