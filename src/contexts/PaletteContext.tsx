import { createContext, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { CompleteTheme } from '@/types/theme';
import { useOrganization } from './OrganizationContext';
import { PREDEFINED_PALETTES } from '@/data/predefined-palettes';
import { themeMap } from '@/themes';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { applyTheme, batchUpdateThemeProperties, normalizeTheme } from '@/utils/theme-util';

export interface PaletteContextType {
  selectedTheme: CompleteTheme | null;
  selectedThemeKey: string;
  applySelectedTheme: (themeKey: string) => void;
  updateThemeColor: (colorKey: string, value: string, mode: 'light' | 'dark') => void;
  resetToOrganizationTheme: () => void;
  allThemes: Record<string, CompleteTheme>;
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ORG_SELECTED_THEME_PREFIX: 'fmt-org-theme-',
  SELECTED_THEME_KEY: 'fmt-org-theme-key-',
};

interface PaletteProviderProps {
  children: ReactNode;
}

export function PaletteProvider({ children }: PaletteProviderProps) {
  const { selectedOrgId, currentOrganization } = useOrganization();
  const orgTheme = `${STORAGE_KEYS.ORG_SELECTED_THEME_PREFIX}${selectedOrgId}`;
  const orgThemeKey = `${STORAGE_KEYS.SELECTED_THEME_KEY}${selectedOrgId}`;

  const [
    selectedTheme,
    setSelectedTheme,
  ] = useLocalStorage<CompleteTheme | null>(orgTheme, null);
  const [selectedThemeKey, setSelectedThemeKey] = useLocalStorage<string>(
    orgThemeKey,
    ''
  );

  // Combine predefined palettes with themes from themes folder
  const allThemes = useMemo(() => {
    const combined: Record<string, CompleteTheme> = { ...PREDEFINED_PALETTES };

    // Add themes from themes folder
    themeMap.forEach((theme, key) => {
      combined[key] = theme;
    });

    return combined;
  }, []);

  // Load and apply theme from localStorage or organization on mount
  useEffect(() => {
    const loadTheme = () => {
      if (selectedOrgId || currentOrganization) {
        const savedOrgTheme = localStorage.getItem(orgTheme);

        if (savedOrgTheme) {
          const parsedTheme: CompleteTheme = JSON.parse(savedOrgTheme);
          try {
            const safe = normalizeTheme(parsedTheme);
            setSelectedTheme(safe);
            setSelectedThemeKey(safe.id);
            applyTheme(safe);
          } catch (error) {
            console.error('Error parsing saved organization palette:', error);
            // Fallback to organization's brand colors
            if (currentOrganization?.brand_colors) {
              const orgSafe = normalizeTheme(currentOrganization.brand_colors);
              setSelectedTheme(orgSafe);
              setSelectedThemeKey(orgSafe.id);
              applyTheme(orgSafe);
            }
          }
        } else if (currentOrganization?.brand_colors) {
          // Use organization's brand colors
          const orgSafe = normalizeTheme(currentOrganization.brand_colors);
          setSelectedTheme(orgSafe);
          setSelectedThemeKey(orgSafe.id);
          applyTheme(orgSafe);
        }
      } else {
        // use default theme
        const defaultTheme = PREDEFINED_PALETTES['default'];
        const safeDefault = normalizeTheme(defaultTheme);
        setSelectedTheme(safeDefault);
        setSelectedThemeKey('default');
        applyTheme(safeDefault);
      }
    };

    loadTheme();
  }, [selectedOrgId]);

  const applySelectedTheme = (themeKey: string) => {
    const selectedTheme = allThemes[themeKey];

    if (selectedTheme) {
      const safe = normalizeTheme(selectedTheme);
      setSelectedTheme(safe);
      setSelectedThemeKey(themeKey);
      applyTheme(safe);
    }
  };

  const updateThemeColor = (colorKey: string, value: string, mode: 'light' | 'dark') => {
    if (!selectedTheme) return;

    // Create updated theme with new color and change name to "custom"
    const updatedTheme = {
      ...selectedTheme,
      id: 'custom',
      name: 'Custom',
      [mode]: {
        ...selectedTheme[mode],
        [colorKey]: value
      }
    };

    // Update local state
    setSelectedTheme(updatedTheme);
    setSelectedThemeKey('custom');

    // Update DOM with the specific color change
    batchUpdateThemeProperties({
      colors: { [colorKey]: value },
      isDark: mode === 'dark'
    });
  };

  const resetToOrganizationTheme = () => {
    if (currentOrganization?.brand_colors) {
      const orgSafe = normalizeTheme(currentOrganization.brand_colors);
      setSelectedTheme(orgSafe);
      setSelectedThemeKey(orgSafe.id);
      applyTheme(orgSafe);
    }
  };

  const value: PaletteContextType = {
    selectedTheme,
    selectedThemeKey,
    allThemes,
    applySelectedTheme,
    updateThemeColor,
    resetToOrganizationTheme,
  };

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
}

export function usePalette(): PaletteContextType {
  const context = useContext(PaletteContext);
  if (context === undefined) {
    throw new Error('usePalette must be used within a PaletteProvider');
  }
  return context;
}
