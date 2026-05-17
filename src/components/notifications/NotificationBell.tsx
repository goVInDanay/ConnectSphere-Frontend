import React, { useRef, useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { useToast } from "../../context/ToastContext";
import { Avatar } from "../ui/Avatar";
import type { Notification } from "../../types";
import { timeAgo, cn } from "../../utils";

function NotifIcon({ type }: { type: string }) {
  const base = "w-7 h-7 rounded-full flex items-center justify-center text-sm";
  const map: Record<string, { bg: string; emoji: string }> = {
    LIKE: { bg: "bg-rose-500/20 text-rose-400", emoji: "❤️" },
    COMMENT: { bg: "bg-blue-500/20 text-blue-400", emoji: "💬" },
    REPLY: { bg: "bg-purple-500/20 text-purple-400", emoji: "↩️" },
    FOLLOW: { bg: "bg-green-500/20 text-green-400", emoji: "👤" },
    MENTION: { bg: "bg-yellow-500/20 text-yellow-400", emoji: "@" },
    ACCOUNT_ACTION: { bg: "bg-orange-500/20 text-orange-400", emoji: "⚠️" },
    BROADCAST: { bg: "bg-brand-500/20 text-brand-400", emoji: "📢" },
  };
  const item = map[type] ?? { bg: "bg-surface-hover", emoji: "🔔" };
  return (
    <span className={cn(base, item.bg)} aria-hidden>
      {item.emoji}
    </span>
  );
}

function resolveLink(n: Notification): string | null {
  if (n.deepLinkUrl) return n.deepLinkUrl;
  if (n.targetType === "POST" && n.targetId) return `/posts/${n.targetId}`;
  if (n.targetType === "COMMENT" && n.targetId) return `/posts/${n.targetId}`;
  if (n.targetType === "USER" && n.actorId) return `/profile/${n.actorId}`;
  if (n.type === "FOLLOW" && n.actorId) return `/profile/${n.actorId}`;
  return null;
}

function NotifRow({
  notif,
  onRead,
  onDelete,
  onNavigate,
}: {
  notif: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigate: (link: string | null, notif: Notification) => void;
}) {
  const link = resolveLink(notif);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer relative",
        !notif.readStatus && "bg-brand-500/5 border-l-2 border-brand-500",
      )}
      onClick={() => onNavigate(link, notif)}
    >
      {!notif.readStatus && (
        <span className="absolute right-10 top-3.5 w-2 h-2 rounded-full bg-brand-400" />
      )}

      <NotifIcon type={notif.type} />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug",
            notif.readStatus
              ? "text-muted-foreground"
              : "text-foreground font-medium",
          )}
        >
          {notif.message || `New ${notif.type.toLowerCase()} notification`}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.readStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead(notif.notificationId);
            }}
            className="p-1 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif.notificationId);
          }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavigate = async (link: string | null, notif: Notification) => {
    if (!notif.readStatus) {
      try {
        await markAsRead(notif.notificationId);
      } catch {}
    }
    setOpen(false);
    if (link) navigate(link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all duration-200",
          open
            ? "bg-brand-500/10 text-brand-400"
            : "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
        )}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5 shadow-glow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-brand-500/10 text-brand-400 font-medium rounded-full px-2 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-surface-hover"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors px-2 py-1 rounded-lg hover:bg-surface-hover"
              >
                See all
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                <Bell className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifRow
                  key={n.notificationId}
                  notif={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
