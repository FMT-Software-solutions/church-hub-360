import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  DEFAULT_TEMPLATE_ID,
  getTemplateStorageKey
} from '@/types/membershipCardTemplates';

export function useTemplateSelection() {
  const { currentOrganization } = useOrganization();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [isLoading, setIsLoading] = useState(true);

  // Load template selection from localStorage when organization changes
  useEffect(() => {
    if (currentOrganization?.id) {
      setIsLoading(true);
      const storageKey = getTemplateStorageKey(currentOrganization.id);
      const savedTemplateId = localStorage.getItem(storageKey);
      
      if (savedTemplateId) {
        setSelectedTemplateId(savedTemplateId);
      } else {
        setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
      }
      
      setIsLoading(false);
    }
  }, [currentOrganization?.id]);

  // Listen for storage changes to sync across components
  useEffect(() => {
    if (!currentOrganization?.id) return;

    const storageKey = getTemplateStorageKey(currentOrganization.id);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setSelectedTemplateId(e.newValue);
      }
    };

    // Listen for storage events (cross-tab/window changes)
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab changes
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === storageKey && e.detail.newValue) {
        setSelectedTemplateId(e.detail.newValue);
      }
    };

    window.addEventListener('templateSelectionChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('templateSelectionChange', handleCustomStorageChange as EventListener);
    };
  }, [currentOrganization?.id]);

  // Function to update template selection
  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    // Persist to localStorage
    if (currentOrganization?.id) {
      const storageKey = getTemplateStorageKey(currentOrganization.id);
      localStorage.setItem(storageKey, templateId);
      
      // Dispatch custom event for same-tab synchronization
      window.dispatchEvent(new CustomEvent('templateSelectionChange', {
        detail: { key: storageKey, newValue: templateId }
      }));
    }
  };

  // Function to get template selection for a specific organization
  const getTemplateForOrganization = (organizationId: string): string => {
    const storageKey = getTemplateStorageKey(organizationId);
    return localStorage.getItem(storageKey) || DEFAULT_TEMPLATE_ID;
  };

  // Function to clear template selection for current organization
  const clearTemplateSelection = () => {
    if (currentOrganization?.id) {
      const storageKey = getTemplateStorageKey(currentOrganization.id);
      localStorage.removeItem(storageKey);
      setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
    }
  };

  return {
    selectedTemplateId,
    selectTemplate,
    getTemplateForOrganization,
    clearTemplateSelection,
    isLoading,
  };
}