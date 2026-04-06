import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MemberSummary } from '@/types/members'
import { toPng } from 'html-to-image'
import confetti from 'canvas-confetti'
import { Label } from '@/components/ui/label'
import { SingleBranchSelector } from '@/components/shared/BranchSelector'
import { useAuth } from '@/contexts/AuthContext'
import { useRoleCheck } from '@/registry/access/RoleGuard'
import { useUserBranches } from '@/hooks/useBranchQueries'
import { useUrlShortener } from '@/modules/url-shortener'
import { QuickSmsDialog } from '@/components/shared/sms/QuickSmsDialog'
import { Copy, MessageSquare, Loader2 } from 'lucide-react'

function daysUntilBirthday(dobIso: string) {
  const now = new Date()
  const dob = new Date(dobIso)
  const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
  if (next < now) next.setFullYear(now.getFullYear() + 1)
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function computeAge(dobIso: string) {
  const dob = new Date(dobIso)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

function BirthdayActions({ member }: { member: MemberSummary }) {
  const [isShortening, setIsShortening] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const { currentOrganization } = useOrganization();
  const shortenUrlMutation = useUrlShortener();

  const getOrGenerateShortUrl = async () => {
    if (shortUrl) return shortUrl;

    setIsShortening(true);
    try {
      const longUrl = `${window.location.origin}${window.location.pathname}#/present/birthday/${member.id}`;
      const result = await shortenUrlMutation.mutateAsync({
        longUrl,
        organizationId: currentOrganization!.id,
      });
      setShortUrl(result.shortUrl);
      return result.shortUrl;
    } catch (error) {
      toast.error('Failed to generate short link');
      console.error(error);
      return null;
    } finally {
      setIsShortening(false);
    }
  };

  const handleCopyLink = async () => {
    const url = await getOrGenerateShortUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      toast.success('Wish link copied to clipboard');
    }
  };

  const handleSendSms = async () => {
    if (!member.phone) {
      toast.error('This member does not have a phone number saved');
      return;
    }
    const url = await getOrGenerateShortUrl();
    if (url) {
      const firstName = member.full_name.split(' ')[0] || member.full_name;
      const orgName = currentOrganization?.name || 'our church';
      setSmsMessage(`Happy Birthday ${firstName}! We celebrate you today and pray for God's blessings over your life from all of us at ${orgName}. View your special card here: ${url}`);
      setIsSmsOpen(true);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleCopyLink} disabled={isShortening}>
        {isShortening ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
        Copy Link
      </Button>
      <Button variant="default" size="sm" onClick={handleSendSms} disabled={isShortening || !member.phone}>
        {isShortening ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
        Send SMS
      </Button>

      {isSmsOpen && (
        <QuickSmsDialog
          isOpen={isSmsOpen}
          onOpenChange={setIsSmsOpen}
          recipientName={member.full_name}
          recipientPhone={member.phone as string}
          memberId={member.id}
          defaultMessage={smsMessage}
        />
      )}
    </>
  );
}

// DownloadCardButton logic has been moved directly into BirthdayCelebrantCard

function BirthdayCelebrantCard({ member }: { member: MemberSummary }) {
  const age = member.date_of_birth ? computeAge(member.date_of_birth as string) : undefined
  const [profileImageSrc, setProfileImageSrc] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pre-fetch the image and convert it to a base64 string so html-to-image doesn't face CORS issues
  useEffect(() => {
    if (member.profile_image_url) {
      fetch(member.profile_image_url)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setProfileImageSrc(reader.result as string);
          };
          reader.readAsDataURL(blob);
        })
        .catch((err) => {
          console.error("Failed to prefetch image for canvas:", err);
          // Fallback to original URL if fetch fails
          setProfileImageSrc(member.profile_image_url);
        });
    }
  }, [member.profile_image_url]);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      // Use raw html-to-image with solid background override
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: {
          backgroundColor: document.documentElement.classList.contains('dark') ? '#1e1e2e' : '#ffffff'
        },
        filter: () => {
          // Ignore unsupported classes or elements if needed
          return true;
        }
      });

      // Native browser download implementation (like product-photo-studio)
      const link = document.createElement('a');
      link.download = `${member.full_name.replace(/\s+/g, '-').toLowerCase()}-birthday-card.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const isDark = document.documentElement.classList.contains('dark');
      const colors = isDark ? ['#fde68a', '#fecaca', '#6ee7b7', '#93c5fd', '#d8b4fe'] : ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7'];
      confetti({ particleCount: 80, spread: 70, startVelocity: 40, colors });
    } catch (err) {
      console.error('Failed to download image:', err);
      toast.error('Failed to generate image');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div ref={cardRef} className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
            {profileImageSrc ? (
              <img src={profileImageSrc} alt={member.full_name} className="h-full w-full object-cover" />

            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl">🎉</div>
            )}
          </div>
          <div>
            <div className="text-xl font-bold">Happy Birthday, {member.full_name} 🎂</div>
            <div className="text-sm text-muted-foreground">{age !== undefined ? `${age} years` : ''}{member.branch_name ? ` • ${member.branch_name}` : ''}</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">Wishing you joy, blessings, and a wonderful year ahead.</div>
      </div>
      <CardContent className="flex items-center gap-2 pt-4">
        <Button variant="outline" size="sm" disabled={isDownloading} onClick={handleDownload}>
          {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Download Card
        </Button>
        <BirthdayActions member={member} />
      </CardContent>
    </Card>
  )
}

export default function Birthdays() {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const { user } = useAuth()
  const { canManageAllData } = useRoleCheck()
  const { data: userBranches = [] } = useUserBranches(user?.id, orgId)
  const assignedBranchIds = useMemo(
    () => userBranches.map((ub) => ub.branch_id).filter(Boolean) as string[],
    [userBranches]
  )

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['people-birthdays', orgId, branchId || 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('members_summary')
        .select('id, full_name, date_of_birth, profile_image_url, branch_name, phone, email, membership_id, branch_id')
        .eq('organization_id', orgId!)
        .not('date_of_birth', 'is', null)

      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
      } else if (!canManageAllData()) {
        if (assignedBranchIds.length === 0) return []
        const ids = assignedBranchIds.join(',')
        query = query.or(`branch_id.in.(${ids}),branch_id.is.null`)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    staleTime: 60 * 1000,
  })

  const today = members
    .filter((m: any) => m.date_of_birth)
    .filter((m: any) => {
      const dob = new Date(m.date_of_birth as string)
      const now = new Date()
      return dob.getDate() === now.getDate() && dob.getMonth() === now.getMonth()
    })

  const upcoming = members
    .filter((m: any) => m.date_of_birth)
    .map((m: any) => ({ ...m, days: daysUntilBirthday(m.date_of_birth as string) }))
    .filter((m: any) => m.days > 0 && m.days <= 30)
    .sort((a: any, b: any) => a.days - b.days)

  const within3 = upcoming.filter((m: any) => m.days <= 3)
  const within7 = upcoming.filter((m: any) => m.days > 3 && m.days <= 7)
  const later = upcoming.filter((m: any) => m.days > 7)

  useEffect(() => {
    if (isLoading) return
    if (today.length > 0) {
      const isDark = document.documentElement.classList.contains('dark')
      const colors = isDark ? ['#fde68a', '#fecaca', '#6ee7b7', '#93c5fd', '#d8b4fe'] : ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7']
      const end = Date.now() + 1200
        ; (function frame() {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors })
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors })
          if (Date.now() < end) requestAnimationFrame(frame)
        })()
    }
  }, [isLoading, today.length])

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Birthdays</h1>
          <p className="text-muted-foreground">Celebrate today’s birthdays and see upcoming ones.</p>
        </div>
        <div className="w-full sm:w-[280px]">
          <Label>Branch</Label>
          <SingleBranchSelector
            value={branchId}
            onValueChange={(v) => setBranchId(v || undefined)}
            placeholder="All branches"
            allowClear
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Today’s Celebrants</h2>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {today.length === 0 && !isLoading && (
          <div className="text-sm text-muted-foreground">No birthdays today.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {today.map((m: any) => (
            <BirthdayCelebrantCard key={m.id} member={m as MemberSummary} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upcoming Birthdays</h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium">Within 3 days</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
              {within3.map((m: any) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{m.full_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                      {m.profile_image_url ? (
                        <img src={m.profile_image_url} alt={m.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">🎂</div>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="text-muted-foreground">In {m.days} days</div>
                      <div className="text-muted-foreground">{m.membership_id ? `ID: ${m.membership_id}` : ''}</div>
                      <div className="text-muted-foreground">{m.phone || m.email || ''}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {within3.length === 0 && <div className="text-sm text-muted-foreground">None</div>}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Within 7 days</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
              {within7.map((m: any) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{m.full_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                      {m.profile_image_url ? (
                        <img src={m.profile_image_url} alt={m.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">🎁</div>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="text-muted-foreground">In {m.days} days</div>
                      <div className="text-muted-foreground">{m.branch_name || ''}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {within7.length === 0 && <div className="text-sm text-muted-foreground">None</div>}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Later this month</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
              {later.map((m: any) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{m.full_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                      {m.profile_image_url ? (
                        <img src={m.profile_image_url} alt={m.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">🎈</div>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="text-muted-foreground">In {m.days} days</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {later.length === 0 && <div className="text-sm text-muted-foreground">None</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}