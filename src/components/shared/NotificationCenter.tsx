import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function NotificationCenter() {
  const { unreadNotifications, markAsRead, refetch } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  const handleNotificationClick = (notification: any) => {
    markAsRead.mutate([notification.id]);
    setOpen(false);
    navigate(`/notifications?id=${notification.id}`);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-semibold">Notifications</h4>
            {unreadNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1"
                onClick={() =>
                  markAsRead.mutate(unreadNotifications.map((n) => n.id))
                }
              >
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {unreadNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              <div className="divide-y">
                {unreadNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="font-medium text-sm mb-1">
                      {notification.title}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {notification.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
