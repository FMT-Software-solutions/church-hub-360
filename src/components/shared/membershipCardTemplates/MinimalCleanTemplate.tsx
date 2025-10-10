import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrganizationLogo } from '@/components/shared/OrganizationLogo';
import { format } from 'date-fns';
import { type CardTemplateProps } from '@/types/membershipCardTemplates';

export function MinimalCleanTemplate({ member, organization }: CardTemplateProps) {
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

  // Use organization brand colors or fallback to default - always use light theme for consistency
  const brandColors = organization.brand_colors;
  const colorScheme = brandColors?.light;
  
  const primaryColor = colorScheme?.primary || '#374151';
  const accentColor = colorScheme?.accent || '#06b6d4';
  
  // Get foreground colors for text
  const primaryTextColor = colorScheme?.primaryForeground || '#ffffff';

  return (
    <div className="w-[400px] h-[250px] bg-white rounded-2xl shadow-sm border border-gray-200 p-4 relative overflow-hidden">
      
      {/* Subtle accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <OrganizationLogo
            src={organization.logo}
            fallback={organization.name?.charAt(0) || 'C'}
            size="md"
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold max-w-[320px] leading-5">
              {organization.name || 'ChurchHub360'}
            </h3>
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              MEMBERSHIP CARD
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Profile Section */}
        <div className="flex flex-col items-center">
          <Avatar className="w-20 h-20 border-2 border-gray-200">
            <AvatarImage
              src={member.profile_image_url || ''}
              alt={`${member.first_name} ${member.last_name}`}
              className="object-cover"
            />
            <AvatarFallback 
              className="text-lg font-semibold"
              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
            >
              {member.first_name[0]}
              {member.last_name[0]}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Information Section */}
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-lg font-bold text-gray-900 leading-tight">
              {member.first_name} {member.last_name}
            </h4>
            <p 
              className="text-sm font-mono font-medium mt-1"
              style={{ color: primaryColor }}
            >
              ID: {member.membership_id}
            </p>
          </div>

          <div className="space-y-1">
            {member.email && (
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-14">Email:</span>
                <span className="text-gray-900">{member.email}</span>
              </div>
            )}
            
            {member.date_of_birth && (
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-14">DOB:</span>
                <span className="text-gray-900">
                  {format(new Date(member.date_of_birth), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-14">Gender:</span>
              <span className="text-gray-900">{formatGender(member.gender)}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-14">Issued:</span>
              <span className="text-gray-900">{issueDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle background pattern */}
      <div className="absolute bottom-4 right-4 opacity-5">
        <div 
          className="w-16 h-16 rounded-full border-2"
          style={{ borderColor: accentColor }}
        />
      </div>
    </div>
  );
}