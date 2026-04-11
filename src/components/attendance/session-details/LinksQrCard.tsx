import { QuickSmsDialog } from '@/components/shared/sms/QuickSmsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { baseUrl } from '@/constants/urls';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUrlShortener } from '@/modules/url-shortener/hooks/useUrlShortener';
import type { AttendanceSessionWithRelations } from '@/types/attendance';
import type { MemberSummary } from '@/types/members';
import { Download, Link as LinkIcon, Loader2, Share, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

interface LinksQrCardProps {
  session: AttendanceSessionWithRelations;
  eligibleMembers: MemberSummary[];
}

export function LinksQrCard({ session, eligibleMembers }: LinksQrCardProps) {
  const { currentOrganization } = useOrganization();
  const shortenUrlMutation = useUrlShortener();
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsRecipients, setSmsRecipients] = useState<{ phone: string, name: string, id: string }[]>([]);

  const { data: smsHistory } = useQuery({
    queryKey: ['session-sms-history', session.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_history')
        .select('*')
        .eq('type', 'sms')
        .contains('metadata', { session_id: session.id })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session.id,
  });

  const getOrGenerateShortUrl = async () => {
    if (shortUrl) return shortUrl;
    if (!currentOrganization) return null;

    setIsGenerating(true);
    try {
      const longUrl = `${baseUrl}/#/p/attendance/${session.id}`;
      const result = await shortenUrlMutation.mutateAsync({
        longUrl,
        organizationId: currentOrganization.id,
      });
      setShortUrl(result.shortUrl);
      sessionStorage.setItem(`ch360_attendance_shorturl_${session.id}`, result.shortUrl);
      return result.shortUrl;
    } catch (error) {
      toast.error('Failed to generate short link');
      console.error(error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Load cached short URL from sessionStorage on mount, or generate it if missing
  useEffect(() => {
    if (!session?.id) return;
    const cachedKey = `ch360_attendance_shorturl_${session.id}`;
    const cachedUrl = sessionStorage.getItem(cachedKey);
    if (cachedUrl) {
      setShortUrl(cachedUrl);
    } else {
      // Auto-generate if not cached
      getOrGenerateShortUrl();
    }
  }, [session?.id]);

  // If the session doesn't allow self-marking, don't show the controls
  if (!session.allow_self_marking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Links & QR</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Self-marking is disabled for this session. Enable it in session settings to generate links and QR codes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isSessionClosedOrPast = !session.is_open || new Date(session.end_time) < new Date();

  if (isSessionClosedOrPast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Links & QR</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This session is closed or has ended. Public links and QR codes are no longer active.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCopyLink = async () => {
    const url = await getOrGenerateShortUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  // const handleShowQr = async () => {
  //   const url = await getOrGenerateShortUrl();
  //   if (url) {
  //     setShowQrDialog(true);
  //   }
  // };

  const handleDownloadQr = () => {
    const container = document.getElementById('session-qr-code-modal');
    const svg = container?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_Code_${session.name || 'Session'}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleDownloadQrDirect = () => {
    const container = document.getElementById('session-qr-code-direct');
    const svg = container?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_Code_${session.name || 'Session'}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleSendSms = async () => {
    const url = await getOrGenerateShortUrl();
    if (!url) return;

    // Use the eligibleMembers passed down from the parent
    // These are either the explicit allowlist, or the full unpaginated active members
    const validMembers = eligibleMembers
      .filter(m => !!m.phone)
      .map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`,
        phone: m.phone as string
      }));

    if (validMembers.length === 0) {
      toast.error('No eligible members with phone numbers found.');
      return;
    }

    setSmsRecipients(validMembers);
    setShowSmsDialog(true);
  };

  const defaultSmsMessage = `Please mark your attendance for "${session.name || session.occasion_name}": ${shortUrl}`;

  const smsEligibleCount = eligibleMembers.filter(m => !!m.phone).length;
  const hasSentSms = smsHistory && smsHistory.length > 0;
  const lastSmsSent = hasSentSms ? smsHistory[0] : null;
  const totalSmsSentCount = hasSentSms ? smsHistory.reduce((sum: number, record: any) => sum + (record.recipient_count || 0), 0) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Links & QR</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Share a link or QR code for members to mark their own attendance.
        </p>

        {shortUrl && (
          <div className="mb-4 p-3 bg-muted rounded-md text-xs font-mono break-all text-center">
            {shortUrl}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <Button variant="outline" onClick={handleCopyLink} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
            {shortUrl ? 'Copy Link' : 'Generate Link'}
          </Button>
          <Button variant="outline" onClick={handleSendSms} disabled={isGenerating}>
            <Share className="w-4 h-4 mr-2" /> Send SMS ({smsEligibleCount} members)
          </Button>
        </div>

        {hasSentSms && lastSmsSent && (
          <Alert className="mb-4 mt-2 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-900 dark:text-blue-200">
            <Info className="h-4 w-4 !text-blue-800 dark:!text-blue-200" />

            <AlertDescription className="text-xs">
              {smsHistory.length > 1
                ? `SMS messages have been sent ${smsHistory.length} times for this session (Total recipients: ${totalSmsSentCount}). Last sent on ${new Date(lastSmsSent.created_at).toLocaleDateString()}.`
                : `An SMS was sent for this session to ${lastSmsSent.recipient_count} members on ${new Date(lastSmsSent.created_at).toLocaleDateString()}.`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Direct QR Code Display */}
        {shortUrl && (
          <div className="mt-6 flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/30">
            <div className="p-3 bg-white rounded-lg inline-block mb-3">
              <div id="session-qr-code-direct">
                <QRCodeSVG
                  value={shortUrl}
                  size={160}
                  level="H"
                />
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleDownloadQrDirect} className="w-full max-w-[160px]">
              <Download className="w-4 h-4 mr-2" /> Download QR
            </Button>
          </div>
        )}

        {/* QR Code Dialog */}
        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="sm:max-w-sm text-center flex flex-col items-center">
            <DialogHeader>
              <DialogTitle>Session QR Code</DialogTitle>
              <DialogDescription>
                Members can scan this to mark their attendance.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-white rounded-lg my-4 inline-block">
              {shortUrl && (
                <div id="session-qr-code-modal">
                  <QRCodeSVG
                    value={shortUrl}
                    size={200}
                    level="H"
                  />
                </div>
              )}
            </div>
            <Button onClick={handleDownloadQr} className="w-full max-w-[200px]">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </DialogContent>
        </Dialog>

        {/* Bulk SMS Dialog */}
        {showSmsDialog && shortUrl && (
          <QuickSmsDialog
            isOpen={showSmsDialog}
            onOpenChange={setShowSmsDialog}
            recipients={smsRecipients}
            defaultMessage={defaultSmsMessage}
            metadata={{ session_id: session.id }}
          />
        )}


      </CardContent>
    </Card>
  );
}