import { ModernFileUpload } from '@/components/shared/ModernFileUpload';
import { ProfilePhotoCropper } from '@/components/shared/ProfilePhotoCropper';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { CalendarIcon, Camera, FileText, Phone, User, X } from 'lucide-react';
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useMemo,
} from 'react';

// Form data interface - aligned with database schema
export interface DefaultMembershipFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth?: Date;
  gender: string;
  marital_status: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  membership_id: string;
  date_joined?: Date;
  baptism_date?: Date;
  notes?: string;
  profile_image_url?: string;
}

// Form validation errors interface
export interface FormValidationErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  date_joined?: string;
  baptism_date?: string;
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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
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
  const [baptismDate, setBaptismDate] = useState<Date>();
  const [notes, setNotes] = useState('');

  // Profile photo state
  const [_profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Validation errors state
  const [errors, setErrors] = useState<FormValidationErrors>({});

  // Memoized form data to prevent infinite re-renders
  const formData = useMemo(
    (): DefaultMembershipFormData => ({
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
      marital_status: maritalStatus,
      phone,
      email,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city,
      state,
      postal_code: postalCode,
      country,
      membership_id: membershipId,
      date_joined: dateJoined,
      baptism_date: baptismDate,
      notes,
      profile_image_url: profilePhotoPreview || undefined,
    }),
    [
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      maritalStatus,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      membershipId,
      dateJoined,
      baptismDate,
      notes,
      profilePhotoPreview,
    ]
  );

  // Helper function to get current form data
  const getFormData = useCallback((): DefaultMembershipFormData => formData, [
    formData,
  ]);

  // Helper function to validate form
  const validateForm = (): {
    isValid: boolean;
    errors: FormValidationErrors;
  } => {
    const newErrors: FormValidationErrors = {};

    // Required field validations
    if (!firstName.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!dateOfBirth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    if (!gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!maritalStatus) {
      newErrors.marital_status = 'Marital status is required';
    }
    if (!addressLine1.trim()) {
      newErrors.address_line_1 = 'Address is required';
    }
    if (!city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!postalCode.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }
    if (!country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (!dateJoined) {
      newErrors.date_joined = 'Date joined is required';
    }
    if (baptismDate && !baptismDate) {
      newErrors.baptism_date = 'Baptism date is required when baptized';
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
    setPhone('');
    setEmail('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('');
    setDateJoined(undefined);
    setBaptismDate(undefined);
    setNotes('');
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
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

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
      </div>

      {/* Profile Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>

      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                className={`w-full ${
                  errors.first_name ? 'border-red-500' : ''
                }`}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name}</p>
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
                className={`w-full ${errors.last_name ? 'border-red-500' : ''}`}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name}</p>
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
                      errors.date_of_birth ? 'border-red-500' : ''
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
              {errors.date_of_birth && (
                <p className="text-sm text-red-500">{errors.date_of_birth}</p>
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
                    errors.marital_status ? 'border-red-500' : ''
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
              {errors.marital_status && (
                <p className="text-sm text-red-500">{errors.marital_status}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phone and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPreviewMode}
                className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1" className="text-sm font-medium">
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="addressLine1"
                  placeholder="Enter street address"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${
                    errors.address_line_1 ? 'border-red-500' : ''
                  }`}
                />
                {errors.address_line_1 && (
                  <p className="text-sm text-red-500">
                    {errors.address_line_1}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2" className="text-sm font-medium">
                  Address Line 2
                </Label>
                <Input
                  id="addressLine2"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  disabled={isPreviewMode}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${errors.city ? 'border-red-500' : ''}`}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  placeholder="Enter state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${errors.state ? 'border-red-500' : ''}`}
                />
                {errors.state && (
                  <p className="text-sm text-red-500">{errors.state}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-sm font-medium">
                  Postal Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postalCode"
                  placeholder="Enter postal code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${
                    errors.postal_code ? 'border-red-500' : ''
                  }`}
                />
                {errors.postal_code && (
                  <p className="text-sm text-red-500">{errors.postal_code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="country"
                  placeholder="Enter country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${errors.country ? 'border-red-500' : ''}`}
                />
                {errors.country && (
                  <p className="text-sm text-red-500">{errors.country}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Membership Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                      errors.date_joined ? 'border-red-500' : ''
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
              {errors.date_joined && (
                <p className="text-sm text-red-500">{errors.date_joined}</p>
              )}
            </div>
          </div>

          {/* Baptism Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Baptism Date (Optional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full md:w-auto justify-start text-left font-normal ${
                    errors.baptism_date ? 'border-red-500' : ''
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
            {errors.baptism_date && (
              <p className="text-sm text-red-500">{errors.baptism_date}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about the member..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPreviewMode}
              className="w-full min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

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
