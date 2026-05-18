import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Film,
  User,
  LogOut,
  Zap,
  Bell,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNotifications } from "../../context/NotificationContext";
import { Avatar } from "../ui/Avatar";
import { NotificationBell } from "../notifications/NotificationBell";
import { cn } from "../../utils";

function NavItem({
  to,
  icon: Icon,
  label,
  exact,
  mobile,
  badge,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  mobile?: boolean;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3.5 rounded-xl transition-all duration-200",
          mobile
            ? "flex-col gap-1 px-2 py-1.5 text-[10px] font-medium"
            : "px-3.5 py-2.5 text-sm font-medium",
          isActive
            ? mobile
              ? "text-brand-400"
              : "bg-brand-500/10 text-brand-400 nav-active-pill"
            : "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <Icon
              className={cn(
                "transition-all duration-200",
                mobile ? "w-5 h-5" : "w-4.5 h-4.5",
                isActive &&
                  !mobile &&
                  "drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]",
              )}
            />
            {badge != null && badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </span>
          <span>{label}</span>
          {isActive && !mobile && (
            <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-brand-400" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";

  const NAV_ITEMS = [
    { to: "/", icon: Home, label: "Home", exact: true },
    { to: "/explore", icon: Compass, label: "Explore" },
    { to: "/stories", icon: Film, label: "Stories" },
    {
      to: "/notifications",
      icon: Bell,
      label: "Notifications",
      badge: unreadCount,
    },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col z-40 border-r border-border bg-card/50 backdrop-blur-sm">
        {/* Logo */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text tracking-tight">
              ConnectSphere
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          {user && (
            <NavItem
              to={`/profile/${user.userId}`}
              icon={User}
              label="Profile"
            />
          )}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-border/50" />
              <p className="px-3.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                Admin
              </p>
              <NavItem to="/admin" icon={Shield} label="Admin Dashboard" />
            </>
          )}
        </nav>

        {user && (
          <div className="p-3 border-t border-border space-y-1">
            <div className="px-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Notifications
              </span>
              <NotificationBell />
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-hover transition-colors group">
              <Avatar
                src={user.profilePicUrl}
                name={user.fullName || user.username}
                size="sm"
                ring
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.fullName || user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-1">
          {[
            { to: "/", icon: Home, label: "Home", exact: true },
            { to: "/explore", icon: Compass, label: "Explore" },
            { to: "/stories", icon: Film, label: "Stories" },
            {
              to: "/notifications",
              icon: Bell,
              label: "Notifs",
              badge: unreadCount,
            },
          ].map((item) => (
            <NavItem key={item.to} {...item} mobile />
          ))}
          {user && (
            <NavLink
              to={`/profile/${user.userId}`}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all",
                  isActive ? "text-brand-400" : "text-muted-foreground",
                )
              }
            >
              <Avatar
                src={user.profilePicUrl}
                name={user.fullName || user.username}
                size="xs"
              />
              <span className="text-[10px] font-medium">Profile</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all",
                  isActive ? "text-brand-400" : "text-muted-foreground",
                )
              }
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-medium">Admin</span>
            </NavLink>
          )}
        </div>
      </nav>
    </>
  );
}
