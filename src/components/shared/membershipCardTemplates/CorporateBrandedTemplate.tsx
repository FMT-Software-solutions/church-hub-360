import { OrganizationLogo } from '@/components/shared/OrganizationLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { colorToRgba } from '@/lib/utils';
import { type CardTemplateProps } from '@/types/membershipCardTemplates';
import { format } from 'date-fns';

export function CorporateBrandedTemplate({ member, organization }: CardTemplateProps) {
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
  
  const primaryColor = colorScheme?.primary || '#1e40af';
  const primaryTextColor = colorScheme?.primaryForeground || '#ffffff';
  const accentColor = colorScheme?.accent || '#06b6d4';
  const accentTextColor = colorScheme?.accentForeground || '#ffffff';

  return (
    <div className="w-[400px] h-[250px] bg-white rounded-lg shadow-xl border relative overflow-hidden"
         style={{ borderColor: primaryColor }}>
      
      {/* Brand Header with Logo Prominence */}
      <div 
        className="h-16 flex items-center justify-center relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${colorToRgba(primaryColor, 1)} 0%, ${colorToRgba(accentColor, 1)} 100%)`,
          color: primaryTextColor
        }}
      >
        <div className="flex items-center space-x-4">
          <OrganizationLogo
            src={organization.logo}
            fallback={organization.name?.charAt(0) || 'C'}
            size="sm"
            className="rounded-full border-3 border-white shadow-lg"
          />
          <div className="text-center">
            <h3 className="text-md font-bold leading-tight">
              {organization.name || 'ChurchHub360'}
            </h3>
            <p className="text-sm font-semibold tracking-widest opacity-90">
              MEMBERSHIP CARD
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-8 h-8 border-2 rounded-full" style={{ borderColor: `${primaryTextColor}30` }} />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-2 rounded-full" style={{ borderColor: `${primaryTextColor}30` }} />
      </div>

      {/* Member Information Section */}
      <div className="p-2 bg-gradient-to-br from-gray-50 to-white">
        <div className="flex gap-4 h-full">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <Avatar className="w-20 h-20 border-3 rounded-xl shadow-md" style={{ borderColor: accentColor }}>
              <AvatarImage
                src={member.profile_image_url || ''}
                alt={`${member.first_name} ${member.last_name}`}
                className="object-cover"
              />
              <AvatarFallback 
                className="text-xl font-bold rounded-xl"
                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
              >
                {member.first_name[0]}
                {member.last_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Member Details */}
          <div className="flex-1 space-y-1">
            <div>
              <h4 className="text-lg font-bold text-gray-900 leading-tight">
                {member.first_name} {member.last_name}
              </h4>
              <div 
                className="inline-block px-3 py-[2px] rounded-full text-xs font-bold mt-1"
                style={{ backgroundColor: accentColor, color: accentTextColor }}
              >
                ID: {member.membership_id}
              </div>
            </div>

            {member.email && (
              <div className="col-span-2">
                <span className="font-semibold text-sm text-gray-900">Email:</span>
                <p className="text-gray-700 font-medium">{member.email}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-sm">
              
              {member.date_of_birth && (
                <div>
                  <span className="font-semibold text-sm text-gray-900">DOB:</span>
                  <p className="text-gray-700 font-medium text-xs">
                    {format(new Date(member.date_of_birth), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
              
              <div>
                <span className="font-semibold text-sm text-gray-900">Gender:</span>
                <p className="text-gray-700 font-medium text-sm">{formatGender(member.gender)}</p>
              </div>
              
              <div>
                <span className="font-semibold text-sm text-gray-900">Issued:</span>
                <p className="text-gray-700 font-medium text-sm">{issueDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Footer */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2"
        style={{ 
          background: `linear-gradient(90deg, ${colorToRgba(primaryColor, 1)} 0%, ${colorToRgba(accentColor, 1)} 50%, ${colorToRgba(primaryColor, 1)} 100%)` 
        }}
      />
      
      {/* Corner branding elements */}
      <div 
        className="absolute top-24 right-2 w-3 h-12 rounded-full opacity-20"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  );
}