import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Edit,
  Shuffle,
  Grid3X3,
  Check,
  X,
  Link,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarPath, processAvatarUrl } from '@/utils/asset-path';

interface AvatarPickerProps {
  value?: string | null;
  onChange: (avatarUrl: string) => void;
  onSave?: (avatarUrl: string) => Promise<void>;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  firstName?: string;
  lastName?: string;
}

const AVATAR_SIZES = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
  xl: 'h-24 w-24',
};

const EDIT_ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
};

const femaleAvatarIds = [
  '85',
  '74',
  '67',
  '60',
  '86',
  '65',
  '75',
  '98',
  '97',
  '70',
  '92',
  '76',
  '99',
  '72',
  '56',
  '77',
  '83',
  '51',
  '58',
  '88',
  '73',
  '61',
  '54',
  '93',
  '100',
  '52',
  '82',
  '57',
  '59',
  '79',
  '89',
  '94',
  '66',
  '53',
  '71',
  '80',
  '62',
  '84',
  '81',
  '69',
  '90',
  '55',
  '95',
  '96',
  '63',
  '64',
  '78',
  '91',
  '87',
  '68',
];

const maleAvatarIds = [
  '43',
  '2',
  '40',
  '19',
  '23',
  '12',
  '39',
  '29',
  '6',
  '35',
  '33',
  '28',
  '25',
  '32',
  '9',
  '27',
  '34',
  '3',
  '50',
  '37',
  '11',
  '30',
  '4',
  '18',
  '44',
  '10',
  '20',
  '8',
  '15',
  '21',
  '1',
  '47',
  '7',
  '31',
  '22',
  '38',
  '42',
  '36',
  '14',
  '48',
  '49',
  '45',
  '46',
  '17',
  '26',
  '5',
  '13',
  '16',
  '24',
  '41',
];

// Generate avatar URLs for the picker using local images
const generateAvatarList = (gender: 'male' | 'female') => {
  const avatarIds = gender === 'male' ? maleAvatarIds : femaleAvatarIds;
  return avatarIds.map((id) => getAvatarPath(id));
};

export function AvatarPicker({
  value,
  onChange,
  onSave,
  fallbackText,
  size = 'lg',
  disabled = false,
  firstName,
  lastName,
}: AvatarPickerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(value || '');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'male' | 'female'>('male');
  const customInputRef = useRef<HTMLDivElement>(null);

  const maleAvatars = generateAvatarList('male');
  const femaleAvatars = generateAvatarList('female');

  // Handle click outside for custom URL popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customInputRef.current &&
        !customInputRef.current.contains(event.target as Node)
      ) {
        setShowCustomInput(false);
      }
    };

    if (showCustomInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomInput]);

  const generateRandomAvatar = () => {
    // Combine both male and female avatar IDs for random selection
    const allAvatarIds = [...maleAvatarIds, ...femaleAvatarIds];
    const randomId =
      allAvatarIds[Math.floor(Math.random() * allAvatarIds.length)];
    const randomAvatar = getAvatarPath(randomId);
    setSelectedAvatar(randomAvatar);
  };

  const generateInitialsAvatar = () => {
    if (firstName && lastName) {
      // Clear the selected avatar to use the fallback initials display
      setSelectedAvatar('');
    }
  };

  const handleSave = async () => {
    if (!selectedAvatar) return;

    setIsLoading(true);
    try {
      onChange(selectedAvatar);
      if (onSave) {
        await onSave(selectedAvatar);
      }
      setIsEditing(false);
      setShowCustomInput(false);
      setCustomUrl('');
    } catch (error) {
      console.error('Failed to save avatar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedAvatar(value || '');
    setIsEditing(false);
    setShowCustomInput(false);
    setCustomUrl('');
  };

  const handleCustomUrlSubmit = () => {
    if (customUrl.trim()) {
      setSelectedAvatar(customUrl.trim());
      setShowCustomInput(false);
      setCustomUrl('');
    }
  };

  return (
    <div className="relative inline-block">
      {/* Main Avatar */}
      <Avatar className={cn(AVATAR_SIZES[size], 'cursor-pointer')}>
        <AvatarImage src={selectedAvatar || processAvatarUrl(value) || ''} />
        <AvatarFallback>
          {fallbackText ||
            (firstName && lastName ? `${firstName[0]}${lastName[0]}` : 'U')}
        </AvatarFallback>
      </Avatar>

      {/* Edit Icon */}
      {!disabled && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={cn(
            'absolute -bottom-1 -right-1 rounded-full p-1 shadow-md',
            EDIT_ICON_SIZES[size]
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}

      {/* Action Buttons */}
      {isEditing && (
        <div className="absolute -top-2 left-full ml-2 flex flex-col gap-2 z-50 dark:bg-gray-800/50 bg-gray-50 backdrop-filter backdrop-blur-sm p-2 rounded border dark:border-gray-700">
          {/* Random Avatar Button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2 whitespace-nowrap"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              generateRandomAvatar();
            }}
          >
            <Shuffle className="h-4 w-4" />
            Random
          </Button>

          {/* Initials Avatar Button */}
          {firstName && lastName && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2 whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                generateInitialsAvatar();
              }}
            >
              <User className="h-4 w-4" />
              Initials
            </Button>
          )}

          {/* Avatar Picker Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2 whitespace-nowrap"
              >
                <Grid3X3 className="h-4 w-4" />
                Gallery
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <h4 className="font-medium">Choose Avatar</h4>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as 'male' | 'female')
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="male" className="gap-2">
                      <User className="h-4 w-4" />
                      Male
                    </TabsTrigger>
                    <TabsTrigger value="female" className="gap-2">
                      <Users className="h-4 w-4" />
                      Female
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="male" className="mt-4">
                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                      {maleAvatars.map((avatarUrl, index) => (
                        <button
                          key={index}
                          type="button"
                          className={cn(
                            'relative rounded-full border-2 transition-all hover:scale-105',
                            selectedAvatar === avatarUrl
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-transparent hover:border-gray-300'
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedAvatar(avatarUrl);
                          }}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>M{index + 1}</AvatarFallback>
                          </Avatar>
                          {selectedAvatar === avatarUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="female" className="mt-4">
                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                      {femaleAvatars.map((avatarUrl, index) => (
                        <button
                          key={index}
                          type="button"
                          className={cn(
                            'relative rounded-full border-2 transition-all hover:scale-105',
                            selectedAvatar === avatarUrl
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-transparent hover:border-gray-300'
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedAvatar(avatarUrl);
                          }}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>F{index + 1}</AvatarFallback>
                          </Avatar>
                          {selectedAvatar === avatarUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </PopoverContent>
          </Popover>

          {/* Custom URL Button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2 whitespace-nowrap"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCustomInput(!showCustomInput);
            }}
          >
            <Link className="h-4 w-4" />
            Custom
          </Button>

          <Separator className="bg-gray-300 dark:bg-gray-600" />

          {/* Save/Cancel Buttons */}
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              disabled={isLoading}
            >
              <Check className="h-3 w-3" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCancel();
              }}
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Custom URL Input */}
      {showCustomInput && (
        <div
          ref={customInputRef}
          className="absolute top-full mt-2 left-0 right-0 min-w-64 p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50"
        >
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="custom-url" className="text-sm font-medium">
              Custom Avatar URL
            </Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCustomInput(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              id="custom-url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomUrlSubmit();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCustomUrlSubmit();
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
