import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

export type DisplayMode = 'grid' | 'table';

export function useBranchesPreferences() {
  const { currentOrganization } = useOrganization();
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [pageSize, setPageSize] = useState(10);

  // Load preferences when organization changes
  useEffect(() => {
    if (currentOrganization?.id) {
      const savedDisplayMode = localStorage.getItem(`branches-display-mode-${currentOrganization.id}`);
      const savedPageSize = localStorage.getItem(`branches-page-size-${currentOrganization.id}`);
      
      if (savedDisplayMode) {
        setDisplayMode(savedDisplayMode as DisplayMode);
      }
      if (savedPageSize) {
        setPageSize(parseInt(savedPageSize, 10));
      }
    }
  }, [currentOrganization?.id]);

  // Save display mode when it changes
  useEffect(() => {
    if (currentOrganization?.id) {
      localStorage.setItem(`branches-display-mode-${currentOrganization.id}`, displayMode);
    }
  }, [displayMode, currentOrganization?.id]);

  // Save page size when it changes
  useEffect(() => {
    if (currentOrganization?.id) {
      localStorage.setItem(`branches-page-size-${currentOrganization.id}`, pageSize.toString());
    }
  }, [pageSize, currentOrganization?.id]);

  return {
    displayMode,
    setDisplayMode,
    pageSize,
    setPageSize
  };
}