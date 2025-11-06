import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounceValue } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSessionSearch, useSessionDetails, type SessionSearchResult } from '@/hooks/attendance/useAttendanceSearch';

export interface SessionSearchTypeaheadProps {
  value?: SessionSearchResult[];
  onChange?: (items: SessionSearchResult[]) => void;
  placeholder?: string;
  multiSelect?: boolean; // default true
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  occasionId?: string; // optional: filter sessions by selected occasion
}

interface SessionItemProps {
  item: SessionSearchResult;
  isSelected: boolean;
  multiSelect: boolean;
  onSelect: (item: SessionSearchResult) => void;
  onDeselect: (item: SessionSearchResult) => void;
}

function SessionItem({ item, isSelected, multiSelect, onSelect, onDeselect }: SessionItemProps) {
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

function SelectedSessionBadge({ item, onRemove, disabled }: { item: SessionSearchResult; onRemove: (i: SessionSearchResult) => void; disabled?: boolean; }) {
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

export function SessionSearchTypeahead({
  value = [],
  onChange,
  placeholder = 'Search sessions...',
  multiSelect = true,
  disabled = false,
  className,
  emptyMessage = 'No sessions found',
  loadingMessage = 'Searching sessions...',
  occasionId,
}: SessionSearchTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults = [], isLoading, error } = useSessionSearch(debouncedSearchTerm, 10, occasionId);

  const selectedIds = value.map(v => v.id);
  const { data: selectedDetails = [] } = useSessionDetails(selectedIds);
  const displayValue = value.length ? value : selectedDetails;

  const handleSelect = (item: SessionSearchResult) => {
    if (disabled) return;
    let newValue: SessionSearchResult[];
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

  const handleDeselect = (item: SessionSearchResult) => {
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
    if (!disabled && inputValue.trim()) setIsOpen(true);
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

  const isSelected = (item: SessionSearchResult) => displayValue.some(v => v.id === item.id);

  const getDisplayValue = () => {
    if (!multiSelect && displayValue.length > 0) return displayValue[0].display_name;
    return inputValue;
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div>
      <div className={cn('relative w-full', className)} ref={containerRef}>
        

        <div className="relative">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={getDisplayValue()}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
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
            <Search className="h-4 w-4 opacity-50" />
          </div>
        </div>

      

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-md">
            <ScrollArea className="h-[300px] pr-4">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">{loadingMessage}</div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-destructive">Error loading sessions</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {debouncedSearchTerm.trim() ? emptyMessage : 'Start typing to search sessions'}
                </div>
              ) : (
                <div className="p-1">
                  {searchResults.map((item) => (
                    <SessionItem
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

       {multiSelect && displayValue.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {displayValue.map((item) => (
            <SelectedSessionBadge key={item.id} item={item} onRemove={handleDeselect} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  );
}