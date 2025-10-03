import { useState, useEffect } from 'react';
import type { MemberDisplayPreferences } from '@/types/members';

const DEFAULT_PREFERENCES: MemberDisplayPreferences = {
  view_mode: 'table',
  page_size: 20,
  sort_field: 'last_name',
  sort_order: 'asc',
  show_inactive: false,
  columns_visible: {
    membership_id: true,
    name: true,
    email: true,
    phone: true,
    membership_status: true,
    membership_type: true,
    join_date: true,
    actions: true,
  },
};

export function useMemberPreferences(organizationId: string | undefined) {
  const [preferences, setPreferences] = useState<MemberDisplayPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = organizationId ? `member-preferences-${organizationId}` : null;

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (!storageKey) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPreferences });
      }
    } catch (error) {
      console.error('Error loading member preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: Partial<MemberDisplayPreferences>) => {
    if (!storageKey) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error saving member preferences:', error);
    }
  };

  // Update view mode (table/card)
  const setViewMode = (viewMode: 'table' | 'card') => {
    savePreferences({ view_mode: viewMode });
  };

  // Update page size
  const setPageSize = (pageSize: number) => {
    savePreferences({ page_size: pageSize });
  };

  // Update sorting
  const setSorting = (sortField: string, sortOrder: 'asc' | 'desc') => {
    savePreferences({ sort_field: sortField, sort_order: sortOrder });
  };

  // Toggle show inactive members
  const toggleShowInactive = () => {
    savePreferences({ show_inactive: !preferences.show_inactive });
  };

  // Update column visibility
  const setColumnVisibility = (column: keyof MemberDisplayPreferences['columns_visible'], visible: boolean) => {
    savePreferences({
      columns_visible: {
        ...preferences.columns_visible,
        [column]: visible,
      },
    });
  };

  // Reset to default preferences
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Error resetting member preferences:', error);
      }
    }
  };

  return {
    preferences,
    isLoading,
    setViewMode,
    setPageSize,
    setSorting,
    toggleShowInactive,
    setColumnVisibility,
    resetPreferences,
    savePreferences,
  };
}