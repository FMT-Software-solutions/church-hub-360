import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, QrCode, Share, Download, Loader2 } from 'lucide-react';
import type { AttendanceSessionWithRelations } from '@/types/attendance';
import type { MemberSummary } from '@/types/members';
import { useState, useEffect } from 'react';
import { useUrlShortener } from '@/modules/url-shortener/hooks/useUrlShortener';
import { useOrganization } from '@/contexts/OrganizationContext';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QuickSmsDialog } from '@/components/shared/sms/QuickSmsDialog';
import { baseUrl } from '@/constants/urls';

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

  // Load cached short URL from sessionStorage on mount
  useEffect(() => {
    if (!session?.id) return;
    const cachedKey = `ch360_attendance_shorturl_${session.id}`;
    const cachedUrl = sessionStorage.getItem(cachedKey);
    if (cachedUrl) {
      setShortUrl(cachedUrl);
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

  const getOrGenerateShortUrl = async () => {
    if (shortUrl) return shortUrl;
    if (!currentOrganization) return null;

    setIsGenerating(true);
    try {
      const longUrl = `${baseUrl}/${window.location.pathname}#/p/attendance/${session.id}`;
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

  const handleCopyLink = async () => {
    const url = await getOrGenerateShortUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleShowQr = async () => {
    const url = await getOrGenerateShortUrl();
    if (url) {
      setShowQrDialog(true);
    }
  };

  const handleDownloadQr = () => {
    const container = document.getElementById('session-qr-code');
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
            {shortUrl ? 'Copy Link' : 'Generate & Copy Link'}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleShowQr} disabled={isGenerating}>
              <QrCode className="w-4 h-4 mr-2" /> QR Code
            </Button>
            <Button variant="outline" onClick={handleSendSms} disabled={isGenerating}>
              <Share className="w-4 h-4 mr-2" /> SMS
            </Button>
          </div>
        </div>

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
                <div id="session-qr-code">
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
          />
        )}
      </CardContent>
    </Card>
  );
}