import { z } from 'zod';

// Location validation schema
const locationSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  radius: z.number().min(1, 'Radius must be at least 1 meter').max(10000, 'Radius cannot exceed 10km').optional(),
  country: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state_region: z.string().trim().optional().nullable(),
  street: z.string().trim().optional().nullable(),
  full_address: z.string().trim().optional().nullable(),
}).optional();

// Marking modes validation (updated to align with AttendanceMarkingModes)
const markingModesSchema = z.object({
  manual: z.boolean(),
  email: z.boolean(),
  phone: z.boolean(),
  membership_id: z.boolean(),
}).refine(
  (modes) => Object.values(modes).some(Boolean),
  'At least one marking mode must be enabled'
);

// Base attendance session schema
export const attendanceSessionSchema = z.object({
  name: z.string()
    .min(1, 'Session name is required')
    .max(100, 'Session name must be less than 100 characters')
    .trim()
    .optional(),

  occasion_id: z
    .uuid('Invalid occasion ID'),

  branch_id: z.uuid('Invalid branch ID').optional(),

  start_time: z.string()
    .min(1, 'Start time is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid start time'),

  end_time: z.string()
    .min(1, 'End time is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid end time'),

  is_open: z.boolean(),

  allow_self_marking: z.boolean().default(true),

  location_id: z.uuid('Invalid location ID').nullable().optional(),

  location: locationSchema,

  allowed_tags: z.array(z.string().uuid('Invalid tag ID')).optional(),

  // Optional scoping to groups and members
  allowed_groups: z.array(z.string().uuid('Invalid group ID')).optional(),
  allowed_members: z.array(z.string().uuid('Invalid member ID')).optional(),

  marking_modes: markingModesSchema,
}).refine(
  (data) => {
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    return endTime > startTime;
  },
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
).refine(
  (data) => {
    // If self marking is allowed and no inherited location is provided,
    // they must provide a custom location
    if (data.allow_self_marking && !data.location_id && !data.location) {
      return false;
    }
    return true;
  },
  {
    message: 'Location settings are required when self marking is enabled',
    path: ['location'],
  }
);

// Schema for creating a new session
export const createAttendanceSessionSchema = attendanceSessionSchema;

// Schema for updating an existing session
export const updateAttendanceSessionSchema = attendanceSessionSchema.partial().extend({
  id: z.string().uuid('Invalid session ID'),
});

// Type inference
export type AttendanceSessionFormData = z.infer<typeof attendanceSessionSchema>;
export type CreateAttendanceSessionFormData = z.infer<typeof createAttendanceSessionSchema>;
export type UpdateAttendanceSessionFormData = z.infer<typeof updateAttendanceSessionSchema>;

// Default form values
export const defaultSessionFormValues: Partial<AttendanceSessionFormData> = {
  is_open: false,
  allow_self_marking: true,
  location_id: null,
  marking_modes: {
    manual: true,
    email: true,
    phone: true,
    membership_id: true,
  },
};
