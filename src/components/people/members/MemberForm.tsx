import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { type Member, type CreateMemberData, type UpdateMemberData, type MemberFormField } from '@/types/members';

interface MemberFormProps {
  member?: Member;
  membershipFormSchema?: MemberFormField[];
  branches?: Array<{ id: string; name: string }>;
  onSubmit: (data: CreateMemberData | UpdateMemberData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Base schema for required fields
type MemberFormValues = z.infer<typeof baseMemberSchema> & Record<string, any>;

const baseMemberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  date_of_birth: z.date().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  address_line_1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  membership_status: z.enum(['active', 'inactive', 'pending', 'suspended', 'transferred', 'deceased']),
  membership_type: z.string().optional(),
  date_joined: z.date().optional(),
  branch_id: z.string().nullable().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  notes: z.string().optional(),
});

export function MemberForm({
  member,
  membershipFormSchema = [],
  branches = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: MemberFormProps) {
  const [dynamicSchema, setDynamicSchema] = useState(baseMemberSchema);

  // Create dynamic schema based on membership form schema
  useEffect(() => {
    if (membershipFormSchema && membershipFormSchema.length > 0) {
      const dynamicFields = membershipFormSchema.reduce((acc, field) => {
        acc[field.id] = z.any().optional();
        return acc;
      }, {} as Record<string, z.ZodTypeAny>);

      const extendedSchema = baseMemberSchema.extend(dynamicFields) as any;
      setDynamicSchema(extendedSchema);
    } else {
      setDynamicSchema(baseMemberSchema as any);
    }
  }, [membershipFormSchema]);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      first_name: member?.first_name || '',
      last_name: member?.last_name || '',
      email: member?.email || '',
      phone: member?.phone || '',
      date_of_birth: member?.date_of_birth ? new Date(member.date_of_birth) : undefined,
      gender: member?.gender || undefined,
      marital_status: member?.marital_status || undefined,
      address_line_1: member?.address_line_1 || '',
      city: member?.city || '',
      state: member?.state || '',
      postal_code: member?.postal_code || '',
      country: member?.country || '',
      membership_status: member?.membership_status || "active",
      membership_type: member?.membership_type || '',
      date_joined: member?.date_joined ? new Date(member.date_joined) : undefined,
      branch_id: member?.branch_id || null,
      emergency_contact_name: member?.emergency_contact_name || '',
      emergency_contact_phone: member?.emergency_contact_phone || '',
      emergency_contact_relationship: member?.emergency_contact_relationship || '',
      notes: member?.notes || '',
      ...member?.form_data,
    },
  });

  const handleSubmit = async (data: any) => {
    const { additional_fields, ...baseData } = data;
    
    // Extract additional fields from dynamic form schema
    const additionalFields: Record<string, any> = {};
    membershipFormSchema.forEach((field) => {
      if (data[field.id] !== undefined) {
        additionalFields[field.id] = data[field.id];
      }
    });

    const submitData = {
      ...baseData,
      additional_fields: additionalFields,
    };

    await onSubmit(submitData);
  };

  const renderDynamicField = (field: MemberFormField) => {
    switch (field.type) {
      case 'text':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }: { field: any }) => (
              <FormItem>
                <FormLabel>{field.label} {field.required && '*'}</FormLabel>
                <FormControl>
                  <Input {...formField} placeholder={field.placeholder} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'textarea':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }: { field: any }) => (
              <FormItem>
                <FormLabel>{field.label} {field.required && '*'}</FormLabel>
                <FormControl>
                  <Textarea {...formField} placeholder={field.placeholder} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }: { field: any }) => (
              <FormItem>
                <FormLabel>{field.label} {field.required && '*'}</FormLabel>
                <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option: any) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'checkbox':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }: { field: any }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{field.label} {field.required && '*'}</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'date':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }: { field: any }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{field.label} {field.required && '*'}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !formField.value && 'text-muted-foreground'
                        )}
                      >
                        {formField.value ? (
                          format(formField.value, 'PPP')
                        ) : (
                          <span>{field.placeholder || 'Pick a date'}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formField.value}
                      onSelect={formField.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         <SelectItem value="male">Male</SelectItem>
                         <SelectItem value="female">Female</SelectItem>
                         <SelectItem value="other">Other</SelectItem>
                       </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         <SelectItem value="single">Single</SelectItem>
                         <SelectItem value="married">Married</SelectItem>
                         <SelectItem value="divorced">Divorced</SelectItem>
                         <SelectItem value="widowed">Widowed</SelectItem>
                       </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Branch Selector */}
              {branches.length > 0 && (
                <FormField
                  control={form.control}
                  name="branch_id"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                        defaultValue={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Branch</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address_line_1"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="membership_status"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Membership Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="membership_type"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Membership Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Regular, Associate, Youth" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
              control={form.control}
              name="date_joined"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Join Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_contact_phone"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_contact_relationship"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Spouse, Parent, Sibling" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {membershipFormSchema.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {membershipFormSchema.map(renderDynamicField)}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {member ? 'Update Member' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
}