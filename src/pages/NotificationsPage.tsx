import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Check, RefreshCw, Filter,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import type { Notification, NotificationType } from '../types';
import { timeAgo, cn } from '../utils';

// Type badge
const TYPE_CONFIG: Record<string, { color: string; label: string; emoji: string }> = {
  LIKE:           { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    label: 'Like',    emoji: '❤️' },
  COMMENT:        { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    label: 'Comment', emoji: '💬' },
  REPLY:          { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Reply', emoji: '↩️' },
  FOLLOW:         { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Follow',  emoji: '👤' },
  MENTION:        { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Mention', emoji: '@' },
  ACCOUNT_ACTION: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Account', emoji: '⚠️' },
  BROADCAST:      { color: 'bg-brand-500/10 text-brand-400 border-brand-500/20', label: 'Broadcast', emoji: '📢' },
};

function resolveLink(n: Notification): string | null {
  if (n.deepLinkUrl) return n.deepLinkUrl;
  if (n.targetType === 'POST' && n.targetId) return `/posts/${n.targetId}`;
  if (n.targetType === 'COMMENT' && n.targetId) return `/posts/${n.targetId}`;
  if (n.targetType === 'USER' && n.actorId) return `/profile/${n.actorId}`;
  if (n.type === 'FOLLOW' && n.actorId) return `/profile/${n.actorId}`;
  return null;
}

function NotificationCard({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.BROADCAST;
  const link = resolveLink(notif);

  const handleClick = () => {
    if (!notif.readStatus) onRead(notif.notificationId);
    if (link) navigate(link);
  };

  return (
    <div
      className={cn(
        'group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:border-border',
        notif.readStatus
          ? 'bg-card border-border/50 opacity-80 hover:opacity-100'
          : 'bg-brand-500/5 border-brand-500/20 hover:bg-brand-500/10'
      )}
      onClick={handleClick}
    >
      {!notif.readStatus && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-brand-500" />
      )}
      <div className={cn(
        'w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0',
        config.color
      )}>
        {config.emoji}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm leading-snug',
            notif.readStatus ? 'text-muted-foreground' : 'text-foreground font-medium'
          )}>
            {notif.message || `New ${config.label.toLowerCase()} notification`}
          </p>
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
            config.color
          )}>
            {config.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/60">
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-start mt-0.5">
        {!notif.readStatus && (
          <button
            onClick={(e) => { e.stopPropagation(); onRead(notif.notificationId); }}
            className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notif.notificationId); }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Filter tabs
const FILTERS = ['All', 'Unread', 'LIKE', 'COMMENT', 'FOLLOW', 'MENTION', 'ACCOUNT_ACTION'];

export default function NotificationsPage() {
  const { toast } = useToast();
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllRead, deleteNotification } =
    useNotifications();

  const [filter, setFilter] = useState('All');

  const filtered = notifications.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.readStatus;
    return n.type === filter;
  });

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success('All marked as read');
    } catch {
      toast.error('Failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
            {unreadCount > 0 && (
              <Button size="sm" variant="secondary" onClick={handleMarkAllRead} className="flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition-all',
                filter === f
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-brand-500/30'
              )}
            >
              {f === 'ACCOUNT_ACTION' ? 'Account' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface-hover animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'All'
                  ? "You're all caught up!"
                  : `No ${filter.toLowerCase()} notifications`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((n) => (
              <NotificationCard
                key={n.notificationId}
                notif={n}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
