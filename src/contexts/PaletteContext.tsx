import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import type { BrandColors } from '@/types/organizations';
import { useOrganization } from './OrganizationContext';
import { hexToOklch } from '@/lib/utils';

// Predefined color palettes
export const PREDEFINED_PALETTES: Record<string, BrandColors> = {
  default: {
    light: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
    },
    dark: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      accent: '#22d3ee',
    },
  },
  emerald: {
    light: {
      primary: '#059669',
      secondary: '#64748b',
      accent: '#10b981',
    },
    dark: {
      primary: '#34d399',
      secondary: '#94a3b8',
      accent: '#6ee7b7',
    },
  },
  purple: {
    light: {
      primary: '#7c3aed',
      secondary: '#64748b',
      accent: '#8b5cf6',
    },
    dark: {
      primary: '#a78bfa',
      secondary: '#94a3b8',
      accent: '#c4b5fd',
    },
  },
  rose: {
    light: {
      primary: '#e11d48',
      secondary: '#64748b',
      accent: '#f43f5e',
    },
    dark: {
      primary: '#fb7185',
      secondary: '#94a3b8',
      accent: '#fda4af',
    },
  },
  orange: {
    light: {
      primary: '#ea580c',
      secondary: '#64748b',
      accent: '#f97316',
    },
    dark: {
      primary: '#fb923c',
      secondary: '#94a3b8',
      accent: '#fdba74',
    },
  },
  indigo: {
    light: {
      primary: '#4f46e5',
      secondary: '#64748b',
      accent: '#6366f1',
    },
    dark: {
      primary: '#818cf8',
      secondary: '#94a3b8',
      accent: '#a5b4fc',
    },
  },
};

export interface PaletteContextType {
  themeColors: BrandColors;
  currentPalette: string;
  setThemeColors: (colors: BrandColors) => void;
  setPredefinedPalette: (paletteName: string) => void;
  resetToDefault: () => void;
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME_COLORS: 'fmt-theme-colors',
  SELECTED_PALETTE: 'fmt-selected-palette',
  ORG_THEME_PREFIX: 'fmt-org-theme-',
};

interface PaletteProviderProps {
  children: ReactNode;
}

export function PaletteProvider({ children }: PaletteProviderProps) {
  const { currentOrganization, updateOrganization } = useOrganization();
  const { resolvedTheme } = useTheme();
  const [themeColors, setThemeColors] = useState<BrandColors>(PREDEFINED_PALETTES.default);
  const [currentPalette, setCurrentPalette] = useState<string>('default');
  
  // Determine if we're in dark mode based on next-themes
  const isDarkMode = resolvedTheme === 'dark';

  // Load theme from localStorage or organization on mount
  useEffect(() => {
    const loadTheme = () => {
      // Dark mode is handled by next-themes, no localStorage needed

      if (currentOrganization) {
        // Load organization-specific theme
        const orgThemeKey = `${STORAGE_KEYS.ORG_THEME_PREFIX}${currentOrganization.id}`;
        const savedOrgTheme = localStorage.getItem(orgThemeKey);
        
        if (savedOrgTheme) {
          try {
            const parsedTheme = JSON.parse(savedOrgTheme);
            setThemeColors(parsedTheme.colors);
            setCurrentPalette(parsedTheme.palette);
          } catch (error) {
            console.error('Error parsing saved organization theme:', error);
            // Fallback to organization's brand colors
            if (currentOrganization.brand_colors) {
              setThemeColors(currentOrganization.brand_colors);
              setCurrentPalette('custom');
            }
          }
        } else if (currentOrganization.brand_colors) {
          // Use organization's brand colors
          setThemeColors(currentOrganization.brand_colors);
          setCurrentPalette('custom');
        }
      } else {
        // Load global theme for login screens
        const savedColors = localStorage.getItem(STORAGE_KEYS.THEME_COLORS);
        const savedPalette = localStorage.getItem(STORAGE_KEYS.SELECTED_PALETTE);
        
        if (savedColors && savedPalette) {
          try {
            setThemeColors(JSON.parse(savedColors));
            setCurrentPalette(savedPalette);
          } catch (error) {
            console.error('Error parsing saved theme:', error);
          }
        }
      }
    };

    loadTheme();
  }, [currentOrganization]);

  // Apply CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const colors = isDarkMode ? themeColors.dark : themeColors.light;
    
    // Convert hex colors to OKLCH format and apply to CSS variables
    root.style.setProperty('--primary', hexToOklch(colors.primary));
    root.style.setProperty('--secondary', hexToOklch(colors.secondary));
    root.style.setProperty('--accent', hexToOklch(colors.accent));
    
    // Don't manually manage dark class - let next-themes handle it
  }, [themeColors, isDarkMode]);

  const saveThemeToStorage = (colors: BrandColors, palette: string) => {
    if (currentOrganization) {
      // Save organization-specific theme
      const orgThemeKey = `${STORAGE_KEYS.ORG_THEME_PREFIX}${currentOrganization.id}`;
      localStorage.setItem(orgThemeKey, JSON.stringify({ colors, palette }));
    } else {
      // Save global theme
      localStorage.setItem(STORAGE_KEYS.THEME_COLORS, JSON.stringify(colors));
      localStorage.setItem(STORAGE_KEYS.SELECTED_PALETTE, palette);
    }
  };

  const handleSetThemeColors = async (colors: BrandColors) => {
    setThemeColors(colors);
    setCurrentPalette('custom');
    saveThemeToStorage(colors, 'custom');
    
    // Update organization in database if logged in
    if (currentOrganization && updateOrganization) {
      try {
        await updateOrganization({
          id: currentOrganization.id,
          brand_colors: colors,
        });
      } catch (error) {
        console.error('Error updating organization brand colors:', error);
      }
    }
  };

  const setPredefinedPalette = async (paletteName: string) => {
    const palette = PREDEFINED_PALETTES[paletteName];
    if (palette) {
      setThemeColors(palette);
      setCurrentPalette(paletteName);
      saveThemeToStorage(palette, paletteName);
      
      // Update organization in database if logged in
      if (currentOrganization && updateOrganization) {
        try {
          await updateOrganization({
            id: currentOrganization.id,
            brand_colors: palette,
          });
        } catch (error) {
          console.error('Error updating organization brand colors:', error);
        }
      }
    }
  };

  // Remove toggleDarkMode - use ThemeSwitcher component instead

  const resetToDefault = async () => {
    const defaultColors = PREDEFINED_PALETTES.default;
    setThemeColors(defaultColors);
    setCurrentPalette('default');
    saveThemeToStorage(defaultColors, 'default');
    
    // Update organization in database if logged in
    if (currentOrganization && updateOrganization) {
      try {
        await updateOrganization({
          id: currentOrganization.id,
          brand_colors: defaultColors,
        });
      } catch (error) {
        console.error('Error updating organization brand colors:', error);
      }
    }
  };

  const value: PaletteContextType = {
    themeColors,
    currentPalette,
    setThemeColors: handleSetThemeColors,
    setPredefinedPalette,
    resetToDefault,
  };

  return (
    <PaletteContext.Provider value={value}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette(): PaletteContextType {
  const context = useContext(PaletteContext);
  if (context === undefined) {
    throw new Error('usePalette must be used within a PaletteProvider');
  }
  return context;
}

// Helper function to get palette display name
export function getPaletteDisplayName(paletteName: string): string {
  const displayNames: Record<string, string> = {
    default: 'Default Blue',
    emerald: 'Emerald Green',
    purple: 'Royal Purple',
    rose: 'Rose Pink',
    orange: 'Vibrant Orange',
    indigo: 'Deep Indigo',
    custom: 'Custom Colors',
  };
  return displayNames[paletteName] || paletteName;
}