import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { memberPortalService } from '@/services/member-portal.service';
import { validateSessionForMarking } from '@/utils/attendance/sessionValidation';


// Haversine formula to calculate distance
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in m
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function PublicAttendanceMarking() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [locationState, setLocationState] = useState<{
    lat?: number;
    lng?: number;
    accuracy?: number;
    error?: string;
  }>({});

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      if (!sessionId) return;
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          organization:organizations(id, name)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      let finalSession = { ...data };

      // If the session inherits location, fetch the actual coordinates
      if (finalSession.location_id && !finalSession.location) {
        const { data: locData } = await supabase
          .from('attendance_locations')
          .select('*')
          .eq('id', finalSession.location_id)
          .single();

        if (locData) {
          finalSession.location = {
            lat: locData.lat,
            lng: locData.lng,
            radius: locData.radius
          };
        }
      }

      setSession(finalSession);

      // Trigger geolocation immediately if location is required
      if (finalSession.location) {
        handleGetLocation().then(position => {
          setLocationState({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        }).catch(() => {
          // If it times out or fails on load, we'll just clear the state 
          // so it tries again on submit rather than caching the error
          setLocationState({});
        });
      }

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('Invalid or expired session link.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        });
      }
    });
  };

  const auditLog = async (
    memberId: string | null,
    auditStatus: 'success' | 'failed',
    reason: string | null,
    dist?: number,
    loc?: { lat?: number, lng?: number, accuracy?: number }
  ) => {
    try {
      await supabase.from('attendance_self_mark_audit').insert({
        organization_id: session?.organization_id,
        session_id: session?.id,
        member_id: memberId,
        source: 'general_link',
        status: auditStatus,
        failure_reason: reason,
        submitted_latitude: loc?.lat,
        submitted_longitude: loc?.lng,
        submitted_accuracy: loc?.accuracy,
        distance_meters: dist,
        user_agent: navigator.userAgent
      });
    } catch (e) {
      console.error('Failed to write audit log', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !pin) return;
    setIsSubmitting(true);
    setErrorMessage('');
    setStatus('idle');

    let currentLoc = locationState;
    let distance: number | undefined = undefined;

    try {
      // 1. Check session rules
      if (!session.allow_self_marking) {
        await auditLog(null, 'failed', 'self_mark_disabled');
        throw new Error('Self-marking is not enabled for this session.');
      }
      if (!session.is_open) {
        await auditLog(null, 'failed', 'session_closed');
        throw new Error('This session is closed.');
      }

      // 2. Validate proximity if required
      if (session.location) {
        try {
          // If we haven't successfully retrieved it yet (or if the pre-load timed out), wait for it now
          if (!currentLoc.lat || !currentLoc.lng) {
            const position = await handleGetLocation();
            currentLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            setLocationState(currentLoc);
          }

          distance = getDistanceFromLatLonInM(
            currentLoc.lat!,
            currentLoc.lng!,
            session.location.lat,
            session.location.lng
          );

          if (currentLoc.accuracy && currentLoc.accuracy > 500) {
            await auditLog(null, 'failed', 'poor_accuracy', distance, currentLoc);
            throw new Error(`Your GPS accuracy is too poor (${Math.round(currentLoc.accuracy)}m). Please move to an open area and try again.`);
          }

          if (distance > (session.location.radius || 100)) {
            await auditLog(null, 'failed', 'outside_radius', distance, currentLoc);
            throw new Error(`You are not within the allowed proximity to mark attendance. Distance: ${Math.round(distance)}m`);
          }
        } catch (locErr: any) {
          // If the error was thrown by our own logic (poor accuracy or outside radius), just re-throw it
          if (locErr.message && (locErr.message.includes('GPS accuracy') || locErr.message.includes('not within the allowed proximity'))) {
            throw locErr;
          }

          await auditLog(null, 'failed', 'location_denied_or_error');
          // Provide a clearer error message for timeouts specifically
          const errorMsg = locErr.code === 3 || (locErr.message && locErr.message.includes('Timeout'))
            ? 'Location request timed out. Please ensure GPS is enabled and try again.'
            : locErr.message;
          throw new Error('Location access is required for this session. ' + errorMsg);
        }
      }

      // 3. Verify member credentials via memberPortalService
      const loginResult = await memberPortalService.loginWithPin(phone, pin);

      if (!loginResult.success || !loginResult.member) {
        await auditLog(null, 'failed', 'invalid_credentials', distance, currentLoc);
        throw new Error(loginResult.error || 'Invalid phone number or PIN.');
      }

      const memberData = (loginResult.member as any).json_build_object;
      console.log("memberData:", memberData)
      const memberId = memberData.id;

      if (!memberId) {
        await auditLog(null, 'failed', 'invalid_credentials', distance, currentLoc);
        throw new Error('Could not identify member from credentials.');
      }

      // Verify the member belongs to the same organization as the session
      if (memberData.organization_id !== session.organization_id) {
        await auditLog(memberId, 'failed', 'member_not_eligible', distance, currentLoc);
        throw new Error('You are not eligible to mark attendance for this session.');
      }

      // 4. Check eligibility using shared validation
      // Since public links can be used by anyone, if session.allowed_members is empty (general session),
      // we should not pass an empty array because validateSessionForMarking treats an empty array
      // as "no one is allowed". We should pass null or undefined.

      const allowedMemberIds = session.allowed_members && session.allowed_members.length > 0
        ? session.allowed_members
        : undefined;

      const validation = validateSessionForMarking(session, {
        origin: 'public_link',
        memberId: memberId,
        memberBranchId: memberData.branch_id,
        allowedMemberIds: allowedMemberIds,
        location: currentLoc.lat !== undefined && currentLoc.lng !== undefined ? { lat: currentLoc.lat, lng: currentLoc.lng, radius: currentLoc.accuracy } : null
      });

      if (!validation.ok) {
        // Find the most relevant reason to log and display
        const reason = validation.reasons[0] || 'member_not_eligible';
        await auditLog(memberId, 'failed', reason, distance, currentLoc);

        let msg = 'You are not eligible to mark attendance.';
        if (reason === 'session_closed') msg = 'This session is closed.';
        if (reason === 'outside_time_window') msg = 'Marking is outside the scheduled time window.';
        if (reason === 'outside_allowed_radius') msg = 'You are outside the allowed location radius.';
        if (reason === 'member_not_in_session_branch') msg = 'You are not in the branch assigned for this session.';

        throw new Error(msg);
      }

      // 5. Mark Attendance
      const { error: markError } = await supabase.from('attendance_records').insert({
        session_id: session.id,
        member_id: memberId,
        marked_by_mode: 'phone',
        marked_at: new Date().toISOString(),
        marked_by: null,
        location: currentLoc.lat !== undefined && currentLoc.lng !== undefined ? { lat: currentLoc.lat, lng: currentLoc.lng, accuracy: currentLoc.accuracy } : null
      });

      if (markError) {
        if (markError.code === '23505') { // Unique violation
          await auditLog(memberId, 'failed', 'already_marked', distance, currentLoc);
          throw new Error('Your attendance for this session has already been marked.');
        }
        throw markError;
      }

      await auditLog(memberId, 'success', null, distance, currentLoc);
      setStatus('success');

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'error' && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Error
            </CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center py-8">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <CardTitle className="text-2xl mb-2">Attendance Marked!</CardTitle>
          <CardDescription className='px-6'>
            You have successfully marked your attendance for {session?.name || session?.occasion_name}.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className='px-6 md:px-1 py-6 text-center'>
        {session?.organization?.name && (
          <div className="text-sm font-semibold text-primary uppercase tracking-wider">
            {session.organization.name}
          </div>
        )}

        <p className="text-sm text-foreground">Attendance marking for {session?.name || session?.occasion_name}</p>

        {session?.location && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
            <MapPin className="w-3 h-3" /> Location verification required
          </div>
        )}
      </div>

      <Card className="w-full max-w-md py-3">
        <CardHeader className="text-center">
          <CardTitle className="font-bold">Verify Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className='flex gap-1 items-center'>
              <div className="space-y-2 flex-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0241234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2 w-30">
                <Label htmlFor="pin">4 digit PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="****"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={4}
                  required
                  className="text-center tracking-widest text-lg"
                />
              </div>
            </div>
            <div className='flex justify-end'>
              <Button
                type="submit"
                className="w-30"
                disabled={isSubmitting || !phone || pin.length < 4}
              >
                {isSubmitting ? (
                  <span className="text-sm flex items-center gap-1">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {status === 'error' && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mt-6 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}