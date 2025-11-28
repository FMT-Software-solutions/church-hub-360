import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useAllNotifications,
  useNotifications,
} from '@/hooks/useNotifications';
import { Pagination } from '@/components/shared/Pagination';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MailOpen, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotificationDetail } from '@/components/notifications/NotificationDetail';

export function Notifications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailId = searchParams.get('id');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data, isLoading, refetch } = useAllNotifications({ page, pageSize, filter });
  const { markAsRead } = useNotifications();

  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate([notification.id]);
    }
    setSearchParams({ id: notification.id });
  };

  const handleMarkAllRead = () => {
    if (data?.data) {
      const unreadIds = data.data.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length > 0) {
        markAsRead.mutate(unreadIds);
      }
    }
  };

  // If we have a detailId, render the detail view
  if (detailId) {
    return (
      <div className="p-6">
        <NotificationDetail
          notificationId={detailId}
          onBack={() => setSearchParams({})}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your alerts and messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          {filter !== 'read' && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <MailOpen className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : data?.data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No notifications found
            </div>
          ) : (
            data?.data.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                            flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors
                            ${
                              !notification.is_read
                                ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                : ''
                            }
                        `}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className={`
                                mt-1 p-2 rounded-full 
                                ${
                                  !notification.is_read
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-muted text-muted-foreground'
                                }
                            `}
                  >
                    {notification.is_read ? (
                      <MailOpen className="w-4 h-4" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          !notification.is_read
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px]"
                        >
                          New
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-sm truncate ${
                        !notification.is_read
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {notification.message}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {data && (
          <div className="py-4 border-t">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil((data.count || 0) / pageSize)}
              pageSize={pageSize}
              totalItems={data.count || 0}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemName="notifications"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
