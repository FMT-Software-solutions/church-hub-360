import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrganizationLogo } from '@/components/shared/OrganizationLogo';
import { format } from 'date-fns';
import { type CardTemplateProps } from '@/types/membershipCardTemplates';
import { cn, colorToRgba } from '@/lib/utils';

export function ModernGradientTemplate({ member, organization }: CardTemplateProps) {
  const formatGender = (gender?: string | null) => {
    if (!gender) return 'N/A';
    return gender.toLowerCase() === 'male'
      ? 'M'
      : gender.toLowerCase() === 'female'
      ? 'F'
      : gender.charAt(0).toUpperCase();
  };

  const issueDate = member.date_joined
    ? format(new Date(member.date_joined), 'MMM yyyy')
    : format(new Date(), 'MMM yyyy');

  // Always use light theme colors for consistent printing
  const brandColors = organization.brand_colors;
  const colorScheme = brandColors?.light;
  
  const primaryColor = colorScheme?.primary || '#3b82f6';
  const primaryTextColor = colorScheme?.primaryForeground || '#ffffff';

  const primaryColorFull = colorToRgba(primaryColor, 1);
  const primaryColorHalf = colorToRgba(primaryColor, 0.5);

  return (
    <div
      className={cn(
        'w-[400px] h-[250px] rounded-xl shadow-lg p-4 relative overflow-hidden',
        
      )}
      style={{
        background: `linear-gradient(135deg, ${primaryColorFull} 0%, ${primaryColorHalf} 100%)`,
        color: primaryTextColor,
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute top-4 right-4 w-32 h-32 border-2 rounded-full"
          style={{ borderColor: primaryTextColor }}
        ></div>
        <div 
          className="absolute bottom-4 left-4 w-24 h-24 border-2 rounded-full"
          style={{ borderColor: primaryTextColor }}
        ></div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex mb-6 space-x-2">
          {/* Organization Logo */}
          <OrganizationLogo
            src={organization.logo}
            fallback={organization.name?.charAt(0) || 'C'}
            size="sm"
            className="rounded-full border-none shadow-lg"
          />

          {/* Organization Name and Card Type */}
          <div>
            <h3 className={cn('text-md font-bold leading-tight mb-1')} style={{ color: primaryTextColor }}>
              {organization.name || 'ChurchHub 360'}
            </h3>
            <p className="text-md opacity-90 font-semibold tracking-widest">
              MEMBERSHIP CARD
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex justify-between gap-4">
          {/* Left Side - Profile Image */}
          <div className="ml-2">
            <Avatar 
              className="w-20 h-20 border-2 rounded-2xl"
              style={{ borderColor: `${primaryTextColor}30` }}
            >
              <AvatarImage
                src={member.profile_image_url || ''}
                alt={`${member.first_name} ${member.last_name}`}
                className="object-cover"
              />
              <AvatarFallback 
                className="text-xl font-bold rounded-2xl"
                style={{ 
                  backgroundColor: `${primaryTextColor}20`, 
                  color: primaryTextColor 
                }}
              >
                {member.first_name[0]}
                {member.last_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Right Side - Member Info */}
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-lg font-bold leading-tight">
                {member.first_name} {member.last_name}
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <div>
                <span className="opacity-75">ID:</span>{' '}
                <span className="font-mono">
                  {member.membership_id}
                </span>
              </div>
              {member.email && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="opacity-75">Email:</span>{' '}
                  <span>{member.email}</span>
                </div>
              )}
              {member.date_of_birth && (
                <div>
                  <span className="opacity-75">DOB:</span>{' '}
                  <span>
                    {format(
                      new Date(member.date_of_birth),
                      'MMM d, yyyy'
                    )}
                  </span>
                </div>
              )}
              <div>
                <span className="opacity-75">Gender:</span>{' '}
                <span>{formatGender(member.gender)}</span>
              </div>
              <div>
                <span className="opacity-75">Issued:</span>{' '}
                <span>{issueDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}