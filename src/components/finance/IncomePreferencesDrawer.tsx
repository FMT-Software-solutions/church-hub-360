import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Settings } from 'lucide-react';
import { useIncomePreferences } from '@/hooks/finance/useIncomePreferences';
import { toast } from 'sonner';

interface IncomePreferencesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CategoryItem = { key: string; label: string };

export const IncomePreferencesDrawer: React.FC<IncomePreferencesDrawerProps> = ({ open, onOpenChange }) => {
  const { prefs, savePreferences } = useIncomePreferences();
  const [local, setLocal] = React.useState<{ categories: CategoryItem[] }>({ categories: [] });
  const [newCategoryLabel, setNewCategoryLabel] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setLocal({ categories: (prefs?.categories || []).map((c: any) => ({ key: c.key, label: c.label })) });
      setNewCategoryLabel('');
    }
  }, [open, prefs]);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const addCategoryLocal = () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const key = slugify(label) || 'other';
    if (local.categories.some((c) => c.key === key)) {
      toast.error('Category already exists');
      return;
    }
    setLocal((prev) => ({ categories: [...prev.categories, { key, label }] }));
    setNewCategoryLabel('');
  };

  const removeCategoryLocal = (key: string) => {
    setLocal((prev) => ({ categories: prev.categories.filter((c) => c.key !== key) }));
  };

  const updateCategoryLabelLocal = (key: string, label: string) => {
    setLocal((prev) => ({ categories: prev.categories.map((c) => (c.key === key ? { ...c, label } : c)) }));
  };

  const handleSave = async () => {
    await savePreferences({ categories: local.categories });
    toast.success('Preferences saved');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 w-full sm:max-w-xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Income Categories
                </SheetTitle>
                <SheetDescription>Customize categories used for income records</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>New Category</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      placeholder="Enter category name"
                    />
                    <Button type="button" onClick={addCategoryLocal}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {local.categories.map((cat) => (
                    <div key={cat.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={cat.label}
                          onChange={(e) => updateCategoryLabelLocal(cat.key, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeCategoryLocal(cat.key)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="border-t p-4">
            <Button className="w-full" onClick={handleSave}>Save Preferences</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IncomePreferencesDrawer;

