import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Save, Bell, Building2, Palette, Trash2 } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  usePalette,
  PREDEFINED_PALETTES,
  getPaletteDisplayName,
} from '../contexts/PaletteContext';
import { toast } from 'sonner';
import { OrganizationLogo } from '../components/shared/OrganizationLogo';
import { LogoSettingsMenu } from '../components/shared/LogoSettingsMenu';
import { ThemeSwitcher } from '../components/shared/ThemeSwitcher';
import type {
  LogoOrientation,
  LogoBackgroundSize,
  UpdateOrganizationData,
} from '../types/organizations';

export function Settings() {
  const { currentOrganization, updateOrganization } = useOrganization();
  const { currentPalette, setPredefinedPalette, setThemeColors } = usePalette();

  const [isLoading, setIsLoading] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'GHS',
  });
  const [logoSettings, setLogoSettings] = useState({
    orientation: 'square' as LogoOrientation,
    backgroundSize: 'contain' as LogoBackgroundSize,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    roleChanges: true,
    securityAlerts: true,
    appUpdates: true,
    newUserAdded: true,
  });
  const [customColors, setCustomColors] = useState({
    lightPrimary: '#3b82f6',
    lightSecondary: '#64748b',
    lightAccent: '#06b6d4',
    darkPrimary: '#60a5fa',
    darkSecondary: '#94a3b8',
    darkAccent: '#22d3ee',
  });
  const [isApplyingColors, setIsApplyingColors] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);

  // Load organization data on mount
  useEffect(() => {
    if (currentOrganization) {
      setOrgData({
        name: currentOrganization.name || '',
        email: currentOrganization.email || '',
        phone: currentOrganization.phone || '',
        address: currentOrganization.address || '',
        currency: currentOrganization.currency || 'USD',
      });
      setLogoSettings({
        orientation: currentOrganization.logo_settings?.orientation || 'square',
        backgroundSize:
          currentOrganization.logo_settings?.backgroundSize || 'contain',
      });
      setNotificationSettings({
        roleChanges:
          currentOrganization.notification_settings?.roleChanges ?? true,
        securityAlerts:
          currentOrganization.notification_settings?.securityAlerts ?? true,
        appUpdates:
          currentOrganization.notification_settings?.appUpdates ?? true,
        newUserAdded:
          currentOrganization.notification_settings?.newUserAdded ?? true,
      });
      if (currentOrganization.brand_colors) {
        setCustomColors({
          lightPrimary: currentOrganization.brand_colors.light.primary,
          lightSecondary: currentOrganization.brand_colors.light.secondary,
          lightAccent: currentOrganization.brand_colors.light.accent,
          darkPrimary: currentOrganization.brand_colors.dark.primary,
          darkSecondary: currentOrganization.brand_colors.dark.secondary,
          darkAccent: currentOrganization.brand_colors.dark.accent,
        });
      }
    }
  }, [currentOrganization]);

  const handleSaveOrganization = async () => {
    if (!currentOrganization || !updateOrganization) return;

    setIsLoading(true);
    try {
      const updateData: UpdateOrganizationData = {
        id: currentOrganization.id,
        ...orgData,
        logo_settings: logoSettings,
        notification_settings: notificationSettings,
      };

      await updateOrganization(updateData);
    } catch (error) {
      console.error('Error updating organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentOrganization || !updateOrganization) return;

    // In a real app, you would upload to a file storage service
    // For now, we'll just create a data URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const logoUrl = e.target?.result as string;
      try {
        await updateOrganization({
          id: currentOrganization.id,
          logo: logoUrl,
        });
      } catch (error) {
        console.error('Error updating logo:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!currentOrganization || !updateOrganization) return;

    try {
      await updateOrganization({
        id: currentOrganization.id,
        logo: undefined,
      });
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };

  const handleCustomColorChange = (colorKey: string, value: string) => {
    setCustomColors((prev) => ({ ...prev, [colorKey]: value }));
  };

  const applyCustomColors = async () => {
    setIsApplyingColors(true);
    setColorError(null);

    try {
      const brandColors = {
        light: {
          primary: customColors.lightPrimary,
          secondary: customColors.lightSecondary,
          accent: customColors.lightAccent,
        },
        dark: {
          primary: customColors.darkPrimary,
          secondary: customColors.darkSecondary,
          accent: customColors.darkAccent,
        },
      };

      // Apply colors to the theme immediately
      setThemeColors(brandColors);

      // Save to organization data
      if (currentOrganization && updateOrganization) {
        await updateOrganization({
          id: currentOrganization.id,
          brand_colors: brandColors,
        });
      }

      // Show success message
      toast.success('Colors applied successfully!');
    } catch (error) {
      console.error('Error applying colors:', error);
      setColorError('Failed to apply colors. Please try again.');
      toast.error('Failed to apply colors. Please try again.');
    } finally {
      setIsApplyingColors(false);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No organization selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your organization details, branding, and preferences
          </p>
        </div>
        <Button
          onClick={handleSaveOrganization}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </Button>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="organization"
            className="flex items-center space-x-2"
          >
            <Building2 className="h-4 w-4" />
            <span>Organization Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="flex items-center space-x-2"
          >
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={orgData.name}
                    onChange={(e) =>
                      setOrgData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={orgData.email}
                    onChange={(e) =>
                      setOrgData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter organization email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={orgData.phone}
                    onChange={(e) =>
                      setOrgData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={orgData.currency}
                    onValueChange={(value) =>
                      setOrgData((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger className="min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">GHS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={orgData.address}
                  onChange={(e) =>
                    setOrgData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Enter organization address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Logo</CardTitle>
              <CardDescription>
                Upload and configure your organization's logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-6">
                <div className="flex flex-col items-center space-y-4">
                  <OrganizationLogo
                    src={currentOrganization.logo}
                    fallback={currentOrganization.name.substring(0, 3)}
                    size="xl"
                    orientation={logoSettings.orientation}
                    backgroundSize={logoSettings.backgroundSize}
                    className="border-2 border-dashed border-border"
                  />
                  <div className="flex items-center space-x-2">
                    <LogoSettingsMenu
                      logoOrientation={logoSettings.orientation}
                      logoBackgroundSize={logoSettings.backgroundSize}
                      setOrientation={(orientation) =>
                        setLogoSettings((prev) => ({ ...prev, orientation }))
                      }
                      setBackgroundSize={(backgroundSize) =>
                        setLogoSettings((prev) => ({ ...prev, backgroundSize }))
                      }
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label
                      htmlFor="logo-upload"
                      className="text-base font-medium"
                    >
                      Upload Logo
                    </Label>
                    <div className="mt-2">
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: PNG or SVG format, max 2MB
                    </p>
                  </div>
                  {currentOrganization.logo && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveLogo}
                      className="flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove Logo</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Switch between light and dark modes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Choose from predefined palettes or create custom colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">
                  Predefined Palettes
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {Object.entries(PREDEFINED_PALETTES).map(([key, palette]) => (
                    <div
                      key={key}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        currentPalette === key ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={async () => {
                        setPredefinedPalette(key);
                        // Load predefined palette colors into custom colors for editing
                        setCustomColors({
                          lightPrimary: palette.light.primary,
                          lightSecondary: palette.light.secondary,
                          lightAccent: palette.light.accent,
                          darkPrimary: palette.dark.primary,
                          darkSecondary: palette.dark.secondary,
                          darkAccent: palette.dark.accent,
                        });

                        // Save the brand colors to the organization
                        if (currentOrganization && updateOrganization) {
                          try {
                            await updateOrganization({
                              id: currentOrganization.id,
                              brand_colors: {
                                light: {
                                  primary: palette.light.primary,
                                  secondary: palette.light.secondary,
                                  accent: palette.light.accent,
                                },
                                dark: {
                                  primary: palette.dark.primary,
                                  secondary: palette.dark.secondary,
                                  accent: palette.dark.accent,
                                },
                              },
                            });
                          } catch (error) {
                            console.error(
                              'Error saving predefined palette:',
                              error
                            );
                          }
                        }
                      }}
                    >
                      <div className="flex space-x-2 mb-2">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: palette.light.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: palette.light.secondary }}
                        />
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: palette.light.accent }}
                        />
                      </div>
                      <p className="text-sm font-medium">
                        {getPaletteDisplayName(key)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Custom Colors</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                  <div>
                    <h4 className="font-medium mb-3">Light Mode</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="lightPrimary" className="w-20">
                          Primary
                        </Label>
                        <Input
                          id="lightPrimary"
                          type="color"
                          value={customColors.lightPrimary}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'lightPrimary',
                              e.target.value
                            )
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customColors.lightPrimary}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'lightPrimary',
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="lightSecondary" className="w-20">
                          Secondary
                        </Label>
                        <Input
                          id="lightSecondary"
                          type="color"
                          value={customColors.lightSecondary}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'lightSecondary',
                              e.target.value
                            )
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customColors.lightSecondary}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'lightSecondary',
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="lightAccent" className="w-20">
                          Accent
                        </Label>
                        <Input
                          id="lightAccent"
                          type="color"
                          value={customColors.lightAccent}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'lightAccent',
                              e.target.value
                            )
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customColors.lightAccent}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'lightAccent',
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Dark Mode</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="darkPrimary" className="w-20">
                          Primary
                        </Label>
                        <Input
                          id="darkPrimary"
                          type="color"
                          value={customColors.darkPrimary}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'darkPrimary',
                              e.target.value
                            )
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customColors.darkPrimary}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'darkPrimary',
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="darkSecondary" className="w-20">
                          Secondary
                        </Label>
                        <Input
                          id="darkSecondary"
                          type="color"
                          value={customColors.darkSecondary}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'darkSecondary',
                              e.target.value
                            )
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customColors.darkSecondary}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'darkSecondary',
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="darkAccent" className="w-20">
                          Accent
                        </Label>
                        <Input
                          id="darkAccent"
                          type="color"
                          value={customColors.darkAccent}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'darkAccent',
                              e.target.value
                            )
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customColors.darkAccent}
                          onChange={(e) =>
                            handleCustomColorChange(
                              'darkAccent',
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={applyCustomColors}
                  disabled={isApplyingColors}
                  className="mt-4"
                >
                  {isApplyingColors ? 'Applying...' : 'Apply Custom Colors'}
                </Button>
                {colorError && (
                  <p className="text-sm text-destructive mt-2">{colorError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="roleChanges"
                    className="text-base font-medium"
                  >
                    Role Changes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when user roles are modified
                  </p>
                </div>
                <Switch
                  id="roleChanges"
                  checked={notificationSettings.roleChanges}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      roleChanges: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="securityAlerts"
                    className="text-base font-medium"
                  >
                    Security Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Important security notifications and alerts
                  </p>
                </div>
                <Switch
                  id="securityAlerts"
                  checked={notificationSettings.securityAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      securityAlerts: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="appUpdates" className="text-base font-medium">
                    App Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about new features and updates
                  </p>
                </div>
                <Switch
                  id="appUpdates"
                  checked={notificationSettings.appUpdates}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      appUpdates: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="newUserAdded"
                    className="text-base font-medium"
                  >
                    New Users
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new users join the organization
                  </p>
                </div>
                <Switch
                  id="newUserAdded"
                  checked={notificationSettings.newUserAdded}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      newUserAdded: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
