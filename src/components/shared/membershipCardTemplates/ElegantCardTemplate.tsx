import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrganizationLogo } from '@/components/shared/OrganizationLogo';
import { format } from 'date-fns';
import { type CardTemplateProps } from '@/types/membershipCardTemplates';

export function ElegantCardTemplate({ member, organization }: CardTemplateProps) {
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
  
  const primaryColor = colorScheme?.primary || '#1e293b';
  const secondaryColor = colorScheme?.secondary || '#64748b';
  const accentColor = colorScheme?.accent || '#f59e0b';
  
  // Get foreground colors for text
  const primaryTextColor = colorScheme?.primaryForeground || '#ffffff';

  return (
    <div className="w-[400px] h-[250px] bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-2xl border border-slate-200 relative overflow-hidden">
      
      {/* Elegant background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full border-2" style={{ borderColor: accentColor }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full border-2" style={{ borderColor: primaryColor }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border" style={{ borderColor: secondaryColor }} />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-2 h-full flex flex-col">
        
        {/* Elegant Header */}
        <div className="mb-2">
          <div className="flex justify-center items-center space-x-2 mb-1">
            <OrganizationLogo
              src={organization.logo}
              fallback={organization.name?.charAt(0) || 'C'}
              size="md"
              className="bg-transparent"
            />
            <div className="border-l-2 pl-2 text-center" style={{ borderColor: accentColor }}>
              <h3 className="text-sm font-serif font-bold text-slate-800 leading-tight">
                {organization.name || 'ChurchHub360'}
              </h3>
              <p className="text-xs font-medium tracking-[0.2em] text-slate-600 mt-1">
                MEMBERSHIP CARD
              </p>
            </div>
          </div>
          {/* Decorative line */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-px" style={{ backgroundColor: accentColor }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <div className="w-8 h-px" style={{ backgroundColor: accentColor }} />
          </div>
          
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4">
          {/* Profile Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <Avatar className="w-20 h-20 border-3 shadow-lg" style={{ borderColor: accentColor }}>
                <AvatarImage
                  src={member.profile_image_url || ''}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="object-cover"
                />
                <AvatarFallback 
                  className="text-xl font-serif font-bold"
                  style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                >
                  {member.first_name[0]}
                  {member.last_name[0]}
                </AvatarFallback>
              </Avatar>
              
              {/* Elegant corner accent */}
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>

          {/* Information Section */}
          <div className="flex-1 space-y-1">
            <div>
              <h4 className="text-xl font-serif font-bold text-slate-800 leading-tight">
                {member.first_name} {member.last_name}
              </h4>
              <div className="flex items-center mt-1">
                <span className="text-xs font-medium text-slate-500 mr-2">ID:</span>
                <span 
                  className="text-sm font-mono font-bold px-2 py-[2px] rounded"
                  style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                >
                  {member.membership_id}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              {member.email && (
                <div className="flex items-start">
                  <span className="text-slate-500 font-medium w-16 flex-shrink-0">Email:</span>
                  <span className="text-slate-800 truncate">{member.email}</span>
                </div>
              )}
              
              {member.date_of_birth && (
                <div className="flex items-center">
                  <span className="text-slate-500 font-medium w-16 flex-shrink-0">DOB:</span>
                  <span className="text-slate-800">
                    {format(new Date(member.date_of_birth), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="text-slate-500 font-medium w-16 flex-shrink-0">Gender:</span>
                <span className="text-slate-800">{formatGender(member.gender)}</span>
              </div>
              
              <div className="flex items-center">
                <span className="text-slate-500 font-medium w-16 flex-shrink-0">Issued:</span>
                <span className="text-slate-800">{issueDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant footer accent */}
        <div className="absolute bottom-0 left-6 right-6 h-px" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
      </div>
    </div>
  );
}