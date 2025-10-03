import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, User, Camera, X } from 'lucide-react';
import { format } from 'date-fns';
import { ModernFileUpload } from '@/components/shared/ModernFileUpload';
import { ProfilePhotoCropper } from '@/components/shared/ProfilePhotoCropper';

// Form data interface
export interface DefaultMembershipFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender: string;
  maritalStatus: string;
  phoneNumber: string;
  email: string;
  address: string;
  membershipId: string;
  dateJoined?: Date;
  isBaptized: boolean;
  baptismDate?: Date;
  profilePhoto?: File;
}

// Form validation errors interface
export interface FormValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  address?: string;
  dateJoined?: string;
  baptismDate?: string;
}

// Form methods interface for external access
export interface DefaultMembershipFormMethods {
  getFormData: () => DefaultMembershipFormData;
  validateForm: () => { isValid: boolean; errors: FormValidationErrors };
  resetForm: () => void;
}

interface DefaultMembershipFormProps {
  isPreviewMode?: boolean;
  className?: string;
  onFormDataChange?: (data: DefaultMembershipFormData) => void;
}

export const DefaultMembershipForm = forwardRef<
  DefaultMembershipFormMethods,
  DefaultMembershipFormProps
>(({ isPreviewMode = false, className = '', onFormDataChange }, ref) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [membershipId] = useState(() => {
    // Generate random 6-8 digit number
    const minDigits = 6;
    const maxDigits = 8;
    const digits =
      Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber.toString();
  }); // Auto-generated random 6-8 digit number
  const [dateJoined, setDateJoined] = useState<Date>();
  const [isBaptized, setIsBaptized] = useState(false);
  const [baptismDate, setBaptismDate] = useState<Date>();

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Validation errors state
  const [errors, setErrors] = useState<FormValidationErrors>({});

  // Helper function to get current form data
  const getFormData = (): DefaultMembershipFormData => ({
    firstName,
    middleName,
    lastName,
    dateOfBirth,
    gender,
    maritalStatus,
    phoneNumber,
    email,
    address,
    membershipId,
    dateJoined,
    isBaptized,
    baptismDate: isBaptized ? baptismDate : undefined,
    profilePhoto: profilePhoto || undefined,
  });

  // Helper function to validate form
  const validateForm = (): {
    isValid: boolean;
    errors: FormValidationErrors;
  } => {
    const newErrors: FormValidationErrors = {};

    // Required field validations
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!maritalStatus) {
      newErrors.maritalStatus = 'Marital status is required';
    }
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!dateJoined) {
      newErrors.dateJoined = 'Date joined is required';
    }
    if (isBaptized && !baptismDate) {
      newErrors.baptismDate = 'Baptism date is required when baptized';
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  // Helper function to reset form
  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setDateOfBirth(undefined);
    setGender('');
    setMaritalStatus('');
    setPhoneNumber('');
    setEmail('');
    setAddress('');
    setDateJoined(undefined);
    setIsBaptized(false);
    setBaptismDate(undefined);
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    setErrors({});
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getFormData,
    validateForm,
    resetForm,
  }));

  // Notify parent of form data changes
  React.useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(getFormData());
    }
  }, [
    firstName,
    middleName,
    lastName,
    dateOfBirth,
    gender,
    maritalStatus,
    phoneNumber,
    email,
    address,
    dateJoined,
    isBaptized,
    baptismDate,
    profilePhoto,
    onFormDataChange,
  ]);

  // Profile photo handlers
  const handleFileSelect = (file: File) => {
    setSelectedImageFile(file);
    setIsCropperOpen(true);
  };

  const handleCropComplete = (croppedFile: File) => {
    setProfilePhoto(croppedFile);

    // Create preview URL
    if (profilePhotoPreview) {
      URL.revokeObjectURL(profilePhotoPreview);
    }
    const previewUrl = URL.createObjectURL(croppedFile);
    setProfilePhotoPreview(previewUrl);

    setIsCropperOpen(false);
    setSelectedImageFile(null);
  };

  const handleRemovePhoto = () => {
    if (profilePhotoPreview) {
      URL.revokeObjectURL(profilePhotoPreview);
    }
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (profilePhotoPreview) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
    };
  }, []);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Membership Registration Form
        </h2>
        <p className="text-muted-foreground">
          Please fill out all required information to complete your membership
          registration.
        </p>
      </div>

      {/* Profile Photo Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Photo
          </h3>
        </div>

        <div className="flex items-baseline gap-2 space-y-4">
          {/* Photo Preview */}
          <div className="relative w-fit">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden">
              {profilePhotoPreview ? (
                <img
                  src={profilePhotoPreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No photo</p>
                </div>
              )}
            </div>

            {profilePhotoPreview && !isPreviewMode && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={handleRemovePhoto}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Upload Section */}
          {!isPreviewMode && (
            <div className="w-full max-w-[300px]">
              <ModernFileUpload
                onFileSelect={handleFileSelect}
                accept="image/*"
                maxSize={5}
                variant="compact"
                disabled={isPreviewMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </h3>
        </div>

        {/* Full Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isPreviewMode}
              className={`w-full ${errors.firstName ? 'border-red-500' : ''}`}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName" className="text-sm font-medium">
              Middle Name
            </Label>
            <Input
              id="middleName"
              placeholder="Enter middle name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              disabled={isPreviewMode}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isPreviewMode}
              className={`w-full ${errors.lastName ? 'border-red-500' : ''}`}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          {/* Date of Birth */}
          <div className="space-y-2 border border-dashed py-2 px-4">
            <Label className="text-sm font-medium">
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full md:w-auto justify-start text-left font-normal ${
                    errors.dateOfBirth ? 'border-red-500' : ''
                  }`}
                  disabled={isPreviewMode}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfBirth ? (
                    format(dateOfBirth, 'PPP')
                  ) : (
                    <span>Select date of birth</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateOfBirth}
                  onSelect={setDateOfBirth}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dateOfBirth && (
              <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-3 border border-dashed py-2 px-4">
            <Label className="text-sm font-medium">
              Gender <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={gender}
              onValueChange={setGender}
              disabled={isPreviewMode}
              className="flex flex-wrap gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
            {errors.gender && (
              <p className="text-sm text-red-500">{errors.gender}</p>
            )}
          </div>

          {/* Marital Status */}
          <div className="space-y-2 border border-dashed py-2 px-4">
            <Label className="text-sm font-medium">
              Marital Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={maritalStatus}
              onValueChange={setMaritalStatus}
              disabled={isPreviewMode}
            >
              <SelectTrigger
                className={`w-full md:w-auto ${
                  errors.maritalStatus ? 'border-red-500' : ''
                }`}
              >
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
            {errors.maritalStatus && (
              <p className="text-sm text-red-500">{errors.maritalStatus}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-2">
          <h3 className="text-lg font-semibold text-foreground">
            Contact Information
          </h3>
        </div>

        {/* Phone and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isPreviewMode}
              className={`w-full ${errors.phoneNumber ? 'border-red-500' : ''}`}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPreviewMode}
              className={`w-full ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Residential Address <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="address"
            placeholder="Enter your full residential address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isPreviewMode}
            className={`w-full min-h-[80px] ${
              errors.address ? 'border-red-500' : ''
            }`}
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address}</p>
          )}
        </div>
      </div>

      {/* Membership Information Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-2">
          <h3 className="text-lg font-semibold text-foreground">
            Membership Information
          </h3>
        </div>

        {/* Membership ID and Date Joined */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="membershipId" className="text-sm font-medium">
              Membership ID
            </Label>
            <Input
              id="membershipId"
              value={membershipId}
              disabled
              className="w-full bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated membership ID
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Date Joined <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    errors.dateJoined ? 'border-red-500' : ''
                  }`}
                  disabled={isPreviewMode}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateJoined ? (
                    format(dateJoined, 'PPP')
                  ) : (
                    <span>Select date joined</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateJoined}
                  onSelect={setDateJoined}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dateJoined && (
              <p className="text-sm text-red-500">{errors.dateJoined}</p>
            )}
          </div>
        </div>

        {/* Baptism Status */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="baptized"
              checked={isBaptized}
              onCheckedChange={(checked) => setIsBaptized(checked as boolean)}
              disabled={isPreviewMode}
            />
            <Label htmlFor="baptized" className="text-sm font-medium">
              I have been baptized
            </Label>
          </div>

          {isBaptized && (
            <div className="ml-6 space-y-2">
              <Label className="text-sm font-medium">
                Baptism Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full md:w-auto justify-start text-left font-normal ${
                      errors.baptismDate ? 'border-red-500' : ''
                    }`}
                    disabled={isPreviewMode}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {baptismDate ? (
                      format(baptismDate, 'PPP')
                    ) : (
                      <span>Select baptism date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={baptismDate}
                    onSelect={setBaptismDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.baptismDate && (
                <p className="text-sm text-red-500">{errors.baptismDate}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Photo Cropper Modal */}
      <ProfilePhotoCropper
        isOpen={isCropperOpen}
        onClose={() => {
          setIsCropperOpen(false);
          setSelectedImageFile(null);
        }}
        onCropComplete={handleCropComplete}
        imageFile={selectedImageFile}
      />
    </div>
  );
});
