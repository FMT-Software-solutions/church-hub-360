import { format } from 'date-fns';
import { User, Mail, Phone, Calendar, MapPin, Users, Heart, Crown, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Member } from '@/types/members';
import type { Organization } from '@/types/organizations';

interface PrintMemberDetailsProps {
  member: Member;
  organization: Organization;
  className?: string;
}

export default function PrintMemberDetails({ 
  member, 
  organization, 
  className = '' 
}: PrintMemberDetailsProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getFullName = () => {
    const parts = [member.first_name, member.middle_name, member.last_name].filter(Boolean);
    return parts.join(' ');
  };

  const getFullAddress = () => {
    const addressParts = [
      member.address_line_1,
      member.address_line_2,
      member.city,
      member.state,
      member.postal_code,
      member.country
    ].filter(Boolean);
    
    if (addressParts.length === 0) return 'Not provided';
    
    // Format as: Line1, Line2, City, State PostalCode, Country
    const line1 = member.address_line_1 || '';
    const line2 = member.address_line_2 ? `, ${member.address_line_2}` : '';
    const cityState = [member.city, member.state].filter(Boolean).join(', ');
    const postal = member.postal_code || '';
    const country = member.country || '';
    
    const parts = [
      line1 + line2,
      cityState + (postal ? ` ${postal}` : ''),
      country
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const primaryColor = organization.brand_colors?.light?.primary || '#3b82f6';
  const secondaryColor = organization.brand_colors?.light?.secondary || '#64748b';

  return (
    <div className={`print:bg-white bg-white text-black min-h-screen p-8 ${className}`}>
      {/* Header with Organization Info */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b-2" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-4">
          {organization.logo ? (
            <img
              src={organization.logo}
              alt={organization.name}
              className="h-16 w-16 object-contain rounded-lg"
            />
          ) : (
            <div 
              className="h-16 w-16 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Building2 className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
              {organization.name}
            </h1>
            <p className="text-sm" style={{ color: secondaryColor }}>
              Member Details Report
            </p>
          </div>
        </div>
        <div className="text-right text-sm" style={{ color: secondaryColor }}>
          <p>Generated on</p>
          <p className="font-medium">{format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      {/* Member Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Profile Photo and Basic Info */}
        <div className="lg:col-span-1">
          <Card className="border-2" style={{ borderColor: `${primaryColor}40` }}>
            <CardContent className="p-6 text-center">
              {member.profile_image_url ? (
                <img
                  src={member.profile_image_url}
                  alt={getFullName()}
                  className="h-32 w-32 rounded-full object-cover mx-auto mb-4 border-4"
                  style={{ borderColor: primaryColor }}
                />
              ) : (
                <div 
                  className="h-32 w-32 rounded-full flex items-center justify-center mx-auto mb-4 border-4"
                  style={{ backgroundColor: `${primaryColor}20`, borderColor: primaryColor }}
                >
                  <User className="h-16 w-16" style={{ color: primaryColor }} />
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">{getFullName()}</h2>
              <div className="space-y-2">
                <Badge 
                  variant="outline" 
                  className="text-sm font-medium"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  ID: {member.membership_id}
                </Badge>
                <Badge 
                  variant={member.membership_status === 'active' ? 'default' : 'secondary'}
                  className="text-sm capitalize"
                >
                  {member.membership_status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2">
          <Card className="border-2" style={{ borderColor: `${primaryColor}40` }}>
            <CardHeader className="pb-4" style={{ backgroundColor: `${primaryColor}10` }}>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" style={{ color: primaryColor }} />
                Personal Information
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                      First Name
                    </label>
                    <p className="text-base font-medium">{member.first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                      Middle Name
                    </label>
                    <p className="text-base font-medium">{member.middle_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                      Last Name
                    </label>
                    <p className="text-base font-medium">{member.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                      Date of Birth
                    </label>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: primaryColor }} />
                      {formatDate(member.date_of_birth)}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                      Gender
                    </label>
                    <p className="text-base font-medium capitalize">{member.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                      Marital Status
                    </label>
                    <p className="text-base font-medium capitalize flex items-center gap-2">
                      <Heart className="h-4 w-4" style={{ color: primaryColor }} />
                      {member.marital_status || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                      Membership Type
                    </label>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Crown className="h-4 w-4" style={{ color: primaryColor }} />
                      {member.membership_type || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                      Date Joined
                    </label>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: primaryColor }} />
                      {formatDate(member.date_joined)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="border-2" style={{ borderColor: `${primaryColor}40` }}>
          <CardHeader className="pb-4" style={{ backgroundColor: `${primaryColor}10` }}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" style={{ color: primaryColor }} />
              Contact Information
            </h3>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                Email Address
              </label>
              <p className="text-base font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: primaryColor }} />
                {member.email || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                Phone Number
              </label>
              <p className="text-base font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" style={{ color: primaryColor }} />
                {member.phone || 'Not provided'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" style={{ borderColor: `${primaryColor}40` }}>
          <CardHeader className="pb-4" style={{ backgroundColor: `${primaryColor}10` }}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
              Address Information
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div>
              <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                Full Address
              </label>
              <p className="text-base font-medium">{getFullAddress()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contact */}
      {(member.emergency_contact_name || member.emergency_contact_phone) && (
        <div className="mb-8">
          <Card className="border-2" style={{ borderColor: `${primaryColor}40` }}>
            <CardHeader className="pb-4" style={{ backgroundColor: `${primaryColor}10` }}>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: primaryColor }} />
                Emergency Contact
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                    Contact Name
                  </label>
                  <p className="text-base font-medium">{member.emergency_contact_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                    Phone Number
                  </label>
                  <p className="text-base font-medium">{member.emergency_contact_phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                    Relationship
                  </label>
                  <p className="text-base font-medium capitalize">{member.emergency_contact_relationship || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Membership Dates */}
      <div className="mb-8">
        <Card className="border-2" style={{ borderColor: `${primaryColor}40` }}>
          <CardHeader className="pb-4" style={{ backgroundColor: `${primaryColor}10` }}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
              Important Dates
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                  Date Joined
                </label>
                <p className="text-base font-medium">{formatDate(member.date_joined)}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                  Baptism Date
                </label>
                <p className="text-base font-medium">{formatDate(member.baptism_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: secondaryColor }}>
                  Confirmation Date
                </label>
                <p className="text-base font-medium">{formatDate(member.confirmation_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {member.notes && (
        <div className="mb-8">
          <Card className="border-2" style={{ borderColor: `${primaryColor}40` }}>
            <CardHeader className="pb-4" style={{ backgroundColor: `${primaryColor}10` }}>
              <h3 className="text-lg font-semibold">Notes</h3>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-base whitespace-pre-wrap">{member.notes}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t-2 text-center text-sm" style={{ borderColor: primaryColor, color: secondaryColor }}>
        <p>This document was generated from {organization.name} member management system.</p>
        <p className="mt-1">For official use only. Please handle with confidentiality.</p>
      </div>
    </div>
  );
}