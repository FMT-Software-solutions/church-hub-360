import { format } from "date-fns";
import { User, Mail, Phone, Calendar, Building2, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Member } from "@/types/members";
import type { Organization } from "@/types/organizations";

interface PrintMembershipCardProps {
  member: Member;
  organization: Organization;
  className?: string;
}

export default function PrintMembershipCard({ 
  member, 
  organization, 
  className = '' 
}: PrintMembershipCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid';
    }
  };

  const getFullName = () => {
    const parts = [member.first_name, member.middle_name, member.last_name].filter(Boolean);
    return parts.join(' ');
  };

  const primaryColor = organization.brand_colors?.light?.primary || '#3b82f6';
  const secondaryColor = organization.brand_colors?.light?.secondary || '#64748b';
  const accentColor = organization.brand_colors?.light?.accent || '#f59e0b';

  return (
    <div className={`print:bg-white bg-white ${className}`}>
      {/* Membership Card - Credit card size (3.375" x 2.125") */}
      <Card 
        className="w-[3.375in] h-[2.125in] border-2 shadow-lg overflow-hidden relative"
        style={{ borderColor: primaryColor }}
      >
        {/* Header with Organization Info */}
        <div 
          className="h-16 px-3 py-2 flex items-center justify-between text-white relative"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="h-8 w-8 object-contain rounded bg-white/20 p-1 flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xs font-bold truncate leading-tight">
                {organization.name}
              </h1>
              <p className="text-[10px] opacity-90 truncate leading-tight">
                Membership Card
              </p>
            </div>
          </div>
          
          {/* Decorative corner accent */}
          <div 
            className="absolute top-0 right-0 w-8 h-8 transform rotate-45 translate-x-4 -translate-y-4"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        <CardContent className="p-3 h-[calc(2.125in-4rem)] flex">
          {/* Left side - Member Photo and Basic Info */}
          <div className="flex flex-col items-center w-20 mr-3">
            {member.profile_image_url ? (
              <img
                src={member.profile_image_url}
                alt={getFullName()}
                className="h-12 w-12 rounded-full object-cover border-2 mb-1"
                style={{ borderColor: primaryColor }}
              />
            ) : (
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center border-2 mb-1"
                style={{ backgroundColor: `${primaryColor}20`, borderColor: primaryColor }}
              >
                <User className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
            )}
            
            {/* Membership ID - Bold and prominent */}
            <div className="text-center">
              <div className="text-[8px] font-medium" style={{ color: secondaryColor }}>
                ID
              </div>
              <div 
                className="text-xs font-bold leading-tight"
                style={{ color: primaryColor }}
              >
                {member.membership_id}
              </div>
            </div>
          </div>

          {/* Right side - Member Details */}
          <div className="flex-1 min-w-0">
            {/* Member Name */}
            <div className="mb-2">
              <h2 className="text-sm font-bold truncate leading-tight">
                {getFullName()}
              </h2>
              <div 
                className="text-[10px] font-medium capitalize"
                style={{ color: secondaryColor }}
              >
                {member.membership_status}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-1 mb-2">
              {member.email && (
                <div className="flex items-center gap-1 text-[9px]">
                  <Mail className="h-2.5 w-2.5 flex-shrink-0" style={{ color: primaryColor }} />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-1 text-[9px]">
                  <Phone className="h-2.5 w-2.5 flex-shrink-0" style={{ color: primaryColor }} />
                  <span className="truncate">{member.phone}</span>
                </div>
              )}
            </div>

            {/* Important Dates */}
            <div className="space-y-0.5 text-[8px]">
              <div className="flex items-center gap-1">
                <Calendar className="h-2 w-2 flex-shrink-0" style={{ color: primaryColor }} />
                <span style={{ color: secondaryColor }}>DOB:</span>
                <span className="font-medium">{formatDate(member.date_of_birth)}</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-2 w-2 flex-shrink-0" style={{ color: primaryColor }} />
                <span style={{ color: secondaryColor }}>Joined:</span>
                <span className="font-medium">{formatDate(member.date_joined)}</span>
              </div>
              {member.gender && (
                <div className="flex items-center gap-1">
                  <User className="h-2 w-2 flex-shrink-0" style={{ color: primaryColor }} />
                  <span style={{ color: secondaryColor }}>Gender:</span>
                  <span className="font-medium capitalize">{member.gender}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Footer with Issue Date */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-4 px-3 flex items-center justify-between text-white text-[8px]"
          style={{ backgroundColor: `${primaryColor}dd` }}
        >
          <span>Issued: {format(new Date(), 'MMM dd, yyyy')}</span>
          <span className="opacity-75">Valid Member</span>
        </div>

        {/* Decorative elements */}
        <div 
          className="absolute bottom-4 right-3 w-6 h-6 rounded-full opacity-10"
          style={{ backgroundColor: accentColor }}
        />
        <div 
          className="absolute top-20 right-1 w-3 h-3 rounded-full opacity-10"
          style={{ backgroundColor: accentColor }}
        />
      </Card>

      {/* Card Back (Optional - for additional info) */}
      <div className="mt-4">
        <Card 
          className="w-[3.375in] h-[2.125in] border-2 shadow-lg"
          style={{ borderColor: `${primaryColor}40` }}
        >
          <CardContent className="p-3 h-full flex flex-col justify-between">
            {/* Organization Contact Info */}
            <div>
              <h3 className="text-xs font-bold mb-2" style={{ color: primaryColor }}>
                {organization.name}
              </h3>
              <div className="space-y-1 text-[9px]" style={{ color: secondaryColor }}>
                {organization.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-2.5 w-2.5" />
                    <span>{organization.email}</span>
                  </div>
                )}
                {organization.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5" />
                    <span>{organization.phone}</span>
                  </div>
                )}
                {organization.address && (
                  <div className="text-[8px] mt-1">
                    <p>{organization.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Terms or Additional Info */}
            <div className="text-[7px] text-center" style={{ color: secondaryColor }}>
              <p className="mb-1">This card is property of {organization.name}</p>
              <p>Please return if found • For official use only</p>
            </div>

            {/* QR Code placeholder or additional branding */}
            <div className="flex justify-center">
              <div 
                className="w-8 h-8 border rounded flex items-center justify-center"
                style={{ borderColor: `${primaryColor}40` }}
              >
                <div 
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: `${primaryColor}20` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}