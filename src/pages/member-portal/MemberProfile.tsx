import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogOut, Phone, MapPin, Calendar, Users, Heart, CreditCard, Tags } from 'lucide-react';
import type { Member } from '@/types/members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function MemberProfile() {
    const navigate = useNavigate();
    const [member, setMember] = useState<Member | null>(null);

    useEffect(() => {
        const sessionData = sessionStorage.getItem('memberPortalSession');
        if (!sessionData) {
            navigate('/m/login');
            return;
        }

        try {
            const parsed = JSON.parse(sessionData);
            setMember(parsed);
        } catch (e) {
            navigate('/m/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('memberPortalSession');
        navigate('/m/login');
    };

    if (!member) return null;

    return (
        <div className="min-h-screen bg-muted/30 p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header & Avatar */}
                <Card className="border-t-4 border-t-primary">
                    <CardHeader className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                        <Avatar className="w-24 h-24 border-2 border-primary/20">
                            <AvatarImage src={member.profile_image_url || undefined} alt={member.first_name} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                {member.first_name?.[0]}{member.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-2xl mb-1">{member.first_name} {member.middle_name} {member.last_name}</CardTitle>
                            <CardDescription className="text-base flex items-center justify-center md:justify-start gap-2">
                                <User className="h-4 w-4" />
                                {member.membership_type || 'Regular'} Member
                            </CardDescription>
                            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                    {member.membership_status?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0 mt-4 md:mt-0">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Phone Number</span>
                                <span className="font-medium">{member.phone || 'Not provided'}</span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Email Address</span>
                                <span className="font-medium">{member.email || 'Not provided'}</span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</span>
                                <span className="font-medium">
                                    {[member.address_line_1, member.address_line_2, member.city, member.state, member.country]
                                        .filter(Boolean).join(', ') || 'Not provided'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Details */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Personal Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Gender</span>
                                <span className="font-medium capitalize">{member.gender || 'Not provided'}</span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Date of Birth</span>
                                <span className="font-medium">
                                    {member.date_of_birth ? format(new Date(member.date_of_birth), 'MMM d, yyyy') : 'Not provided'}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Marital Status</span>
                                <span className="font-medium capitalize">{member.marital_status || 'Not provided'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Heart className="h-5 w-5 text-primary" />
                                Emergency Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Name</span>
                                <span className="font-medium">{member.emergency_contact_name || 'Not provided'}</span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Phone Number</span>
                                <span className="font-medium">{member.emergency_contact_phone || 'Not provided'}</span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Relationship</span>
                                <span className="font-medium">{member.emergency_contact_relationship || 'Not provided'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Membership Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Membership Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Membership Type</span>
                                <span className="font-medium">{member.membership_type || 'Not specified'}</span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className="font-medium capitalize">{member.membership_status || 'Not specified'}</span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Date Joined</span>
                                <span className="font-medium">
                                    {member.date_joined ? format(new Date(member.date_joined), 'MMM d, yyyy') : 'Not provided'}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Baptism Date</span>
                                <span className="font-medium">
                                    {member.baptism_date ? format(new Date(member.baptism_date), 'MMM d, yyyy') : 'Not provided'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Groups Section */}
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Groups
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(member as any).member_groups && (member as any).member_groups.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {(member as any).member_groups.map((group: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="border">
                                            {group}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground">No groups assigned to this member</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tags Section */}
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Tags className="h-5 w-5 text-primary" />
                                Tags
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(member as any).tags_array && (member as any).tags_array.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {(member as any).tags_array.map((tag: string, i: number) => (
                                        <Badge key={i} variant="outline" className="border">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground">No tags assigned to this member</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-8">
                    If any of this information is incorrect, please contact your church admin to update your records.
                </p>
            </div>
        </div>
    );
}
