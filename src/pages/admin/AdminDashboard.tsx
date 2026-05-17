import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  FileText,
  MessageSquare,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  UserX,
  UserCheck,
  RefreshCw,
  BarChart2,
  Eye,
  Ban,
  ChevronDown,
  Search,
  Filter,
} from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { adminApi, authApi } from "../../api";
import type { User, Post, Comment, Report } from "../../types";
import { timeAgo, formatCount, cn } from "../../utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminTab =
  | "overview"
  | "users"
  | "posts"
  | "comments"
  | "flagged"
  | "reports";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl border border-border bg-card hover:border-opacity-60 transition-all",
        onClick && "cursor-pointer hover:shadow-sm",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
          color,
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </button>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({
  active,
  flagged,
  suspended,
}: {
  active: boolean;
  flagged?: boolean;
  suspended?: boolean;
}) {
  if (flagged)
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
        Flagged
      </span>
    );
  if (suspended || !active)
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
        Inactive
      </span>
    );
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
      Active
    </span>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({
  user,
  onAction,
}: {
  user: User;
  onAction: (action: string, userId: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover/60 transition-colors group border border-transparent hover:border-border/40">
      <Avatar
        src={user.profilePicUrl}
        name={user.fullName || user.username}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {user.fullName || user.username}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          @{user.username} · {user.email}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground font-mono">
          {user.role}
        </span>
        <StatusBadge active={user.active} flagged={user.flagged} />
        {/* Actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-border bg-card shadow-xl z-20 overflow-hidden py-1">
              {user.active ? (
                <>
                  <button
                    onClick={() => {
                      onAction("suspend", user.userId);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5 text-orange-400" /> Suspend
                  </button>
                  <button
                    onClick={() => {
                      onAction("deactivate", user.userId);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5 text-destructive" />{" "}
                    Deactivate
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onAction("activate", user.userId);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-green-400" />{" "}
                  Reactivate
                </button>
              )}
              {user.flagged ? (
                <button
                  onClick={() => {
                    onAction("unflag", user.userId);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Unflag
                </button>
              ) : (
                <button
                  onClick={() => {
                    onAction("flag", user.userId);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover transition-colors"
                >
                  <Flag className="w-3.5 h-3.5 text-orange-400" /> Flag
                </button>
              )}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  onAction("delete", user.userId);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete user
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post row ──────────────────────────────────────────────────────────────────
function PostRow({
  post,
  onAction,
}: {
  post: Post;
  onAction: (a: string, id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-hover/60 transition-colors group border border-transparent hover:border-border/40">
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-1">{post.content}</p>
        <p className="text-xs text-muted-foreground">
          Post #{post.postId} · User {post.authorId} · {post.postType}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {post.isFlagged && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Flagged
          </span>
        )}
        {post.isDeleted && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            Deleted
          </span>
        )}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-border bg-card shadow-xl z-20 overflow-hidden py-1">
              <button
                onClick={() => {
                  onAction("approvePost", post.postId);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover"
              >
                <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Approve
              </button>
              <button
                onClick={() => {
                  onAction("rejectPost", post.postId);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover"
              >
                <XCircle className="w-3.5 h-3.5 text-yellow-400" /> Reject
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  onAction("deletePost", post.postId);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comment row ───────────────────────────────────────────────────────────────
function CommentRow({
  comment,
  onAction,
}: {
  comment: Comment;
  onAction: (a: string, id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-hover/60 transition-colors group border border-transparent hover:border-border/40">
      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
        <MessageSquare className="w-4 h-4 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-1">
          {comment.content}
        </p>
        <p className="text-xs text-muted-foreground">
          Comment #{comment.commentId} · User {comment.authorId} · Post{" "}
          {comment.postId}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {comment.isFlagged && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Flagged
          </span>
        )}
        {comment.isDeleted && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            Deleted
          </span>
        )}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-border bg-card shadow-xl z-20 overflow-hidden py-1">
              <button
                onClick={() => {
                  onAction("approveComment", comment.commentId);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover"
              >
                <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Approve
              </button>
              <button
                onClick={() => {
                  onAction("rejectComment", comment.commentId);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover"
              >
                <XCircle className="w-3.5 h-3.5 text-yellow-400" /> Reject
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  onAction("deleteComment", comment.commentId);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report row ────────────────────────────────────────────────────────────────
function ReportRow({
  report,
  onAction,
}: {
  report: Report;
  onAction: (a: string, id: number) => void;
}) {
  const id = report.reportId ?? report.id ?? 0;
  const statusColor =
    {
      PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      RESOLVED: "bg-green-500/10 text-green-400 border-green-500/20",
      REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
    }[report.status] ?? "";

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50">
      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-4 h-4 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-foreground">
            {report.reportType} Report
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              statusColor,
            )}
          >
            {report.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Target #{report.targetId} · {report.reason}
        </p>
      </div>
      {report.status === "PENDING" && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onAction("approveReport", id)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors font-medium"
          >
            Safe
          </button>
          <button
            onClick={() => onAction("rejectReport", id)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  count,
  icon: Icon,
  color,
  loading,
  onRefresh,
  search,
  onSearch,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
  onRefresh: () => void;
  search?: string;
  onSearch?: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            color,
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground bg-surface-hover rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Filter…"
              className="pl-7 pr-3 py-1.5 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-brand-500/50 w-32"
            />
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}

// ── AdminDashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  // AdminRoute already guarantees this component only renders for confirmed admins.
  // We only need the user object for display purposes, not for auth guarding.
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<User[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<Post[]>([]);
  const [flaggedComments, setFlaggedComments] = useState<Comment[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [commentReports, setCommentReports] = useState<Report[]>([]);

  // Search filters
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [commentSearch, setCommentSearch] = useState("");

  // ── Fetchers ────────────────────────────────────────────────────────────
  const setLoad = (key: string, val: boolean) =>
    setLoading((p) => ({ ...p, [key]: val }));

  const fetchUsers = useCallback(async () => {
    setLoad("users", true);
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoad("users", false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoad("posts", true);
    try {
      const data = await adminApi.getAllPosts();
      setPosts(data);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoad("posts", false);
    }
  }, []);

  const fetchComments = useCallback(async () => {
    setLoad("comments", true);
    try {
      const data = await adminApi.getAllComments();
      setComments(data);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoad("comments", false);
    }
  }, []);

  const fetchFlagged = useCallback(async () => {
    setLoad("flagged", true);
    try {
      const [fu, fp, fc] = await Promise.all([
        adminApi.getFlaggedUsers(),
        adminApi.getFlaggedPosts(),
        adminApi.getFlaggedComments(),
      ]);
      setFlaggedUsers(fu);
      setFlaggedPosts(fp);
      setFlaggedComments(fc);
    } catch {
      toast.error("Failed to load flagged content");
    } finally {
      setLoad("flagged", false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoad("reports", true);
    try {
      const [ur, cr] = await Promise.all([
        adminApi.getUserReports(),
        adminApi.getCommentReports(),
      ]);
      setUserReports(ur);
      setCommentReports(cr);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoad("reports", false);
    }
  }, []);

  // Load on tab change
  useEffect(() => {
    if (activeTab === "overview" || activeTab === "users") fetchUsers();
    if (activeTab === "overview" || activeTab === "posts") fetchPosts();
    if (activeTab === "overview" || activeTab === "comments") fetchComments();
    if (activeTab === "flagged") fetchFlagged();
    if (activeTab === "reports") fetchReports();
  }, [activeTab]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAction = async (action: string, id: number) => {
    try {
      switch (action) {
        case "suspend":
          await adminApi.suspendUser(id);
          setUsers((u) =>
            u.map((x) => (x.userId === id ? { ...x, active: false } : x)),
          );
          toast.success("User suspended");
          break;
        case "activate":
          await adminApi.activateUser(id);
          setUsers((u) =>
            u.map((x) => (x.userId === id ? { ...x, active: true } : x)),
          );
          toast.success("User reactivated");
          break;
        case "deactivate":
          await adminApi.deactivateUser(id);
          setUsers((u) =>
            u.map((x) => (x.userId === id ? { ...x, active: false } : x)),
          );
          toast.success("User deactivated");
          break;
        case "delete":
          await adminApi.deleteUser(id);
          setUsers((u) => u.filter((x) => x.userId !== id));
          toast.success("User deleted");
          break;
        case "flag":
          await adminApi.flagUser(id);
          setUsers((u) =>
            u.map((x) => (x.userId === id ? { ...x, flagged: true } : x)),
          );
          toast.success("User flagged");
          break;
        case "unflag":
          await adminApi.unflagUser(id);
          setUsers((u) =>
            u.map((x) => (x.userId === id ? { ...x, flagged: false } : x)),
          );
          toast.success("User unflagged");
          break;
        case "approvePost":
          await adminApi.approvePost(id);
          toast.success("Post approved");
          break;
        case "rejectPost":
          await adminApi.rejectPost(id);
          toast.success("Post rejected");
          break;
        case "deletePost":
          await adminApi.deletePost(id);
          setPosts((p) => p.filter((x) => x.postId !== id));
          toast.success("Post deleted");
          break;
        case "approveComment":
          await adminApi.approveComment(id);
          toast.success("Comment approved");
          break;
        case "rejectComment":
          await adminApi.rejectComment(id);
          toast.success("Comment rejected");
          break;
        case "deleteComment":
          await adminApi.deleteComment(id);
          setComments((c) => c.filter((x) => x.commentId !== id));
          toast.success("Comment deleted");
          break;
        case "approveReport":
          await adminApi.approveUserReport(id);
          setUserReports((r) =>
            r.map((x) =>
              (x.reportId ?? x.id) === id ? { ...x, status: "RESOLVED" } : x,
            ),
          );
          toast.success("Report resolved");
          break;
        case "rejectReport":
          await adminApi.rejectUserReport(id);
          setUserReports((r) =>
            r.map((x) =>
              (x.reportId ?? x.id) === id ? { ...x, status: "REJECTED" } : x,
            ),
          );
          toast.success("Report rejected");
          break;
        case "approveCommentReport":
          await adminApi.approveCommentReport(id);
          setCommentReports((r) =>
            r.map((x) =>
              (x.reportId ?? x.id) === id ? { ...x, status: "RESOLVED" } : x,
            ),
          );
          toast.success("Report resolved");
          break;
        case "rejectCommentReport":
          await adminApi.rejectCommentReport(id);
          setCommentReports((r) =>
            r.map((x) =>
              (x.reportId ?? x.id) === id ? { ...x, status: "REJECTED" } : x,
            ),
          );
          toast.success("Report rejected");
          break;
      }
    } catch {
      toast.error(`Action failed: ${action}`);
    }
  };

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(
    (u) =>
      !userSearch ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );
  const filteredPosts = posts.filter(
    (p) =>
      !postSearch || p.content.toLowerCase().includes(postSearch.toLowerCase()),
  );
  const filteredComments = comments.filter(
    (c) =>
      !commentSearch ||
      c.content.toLowerCase().includes(commentSearch.toLowerCase()),
  );

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "flagged", label: "Flagged", icon: Flag },
    { id: "reports", label: "Reports", icon: AlertTriangle },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage content, users, and moderation
            </p>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border",
                activeTab === id
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-brand-500/30",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Users"
                value={users.length}
                icon={Users}
                color="bg-blue-500/10 text-blue-400"
                onClick={() => setActiveTab("users")}
              />
              <StatCard
                label="Total Posts"
                value={posts.length}
                icon={FileText}
                color="bg-green-500/10 text-green-400"
                onClick={() => setActiveTab("posts")}
              />
              <StatCard
                label="Total Comments"
                value={comments.length}
                icon={MessageSquare}
                color="bg-purple-500/10 text-purple-400"
                onClick={() => setActiveTab("comments")}
              />
              <StatCard
                label="Pending Reports"
                value={
                  userReports.filter((r) => r.status === "PENDING").length +
                  commentReports.filter((r) => r.status === "PENDING").length
                }
                icon={AlertTriangle}
                color="bg-orange-500/10 text-orange-400"
                onClick={() => setActiveTab("reports")}
              />
              <StatCard
                label="Active Users"
                value={users.filter((u) => u.active).length}
                icon={UserCheck}
                color="bg-emerald-500/10 text-emerald-400"
              />
              <StatCard
                label="Flagged Users"
                value={flaggedUsers.length}
                icon={Flag}
                color="bg-orange-500/10 text-orange-400"
                onClick={() => setActiveTab("flagged")}
              />
              <StatCard
                label="Flagged Posts"
                value={flaggedPosts.length}
                icon={Flag}
                color="bg-red-500/10 text-red-400"
                onClick={() => setActiveTab("flagged")}
              />
              <StatCard
                label="Inactive Users"
                value={users.filter((u) => !u.active).length}
                icon={UserX}
                color="bg-destructive/10 text-destructive"
              />
            </div>

            {/* Quick Recent Users */}
            {users.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <SectionHeader
                  title="Recent Users"
                  count={users.slice(0, 5).length}
                  icon={Users}
                  color="bg-blue-500/10 text-blue-400"
                  loading={!!loading.users}
                  onRefresh={fetchUsers}
                />
                <div className="space-y-1">
                  {users.slice(0, 5).map((u) => (
                    <UserRow key={u.userId} user={u} onAction={handleAction} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Users tab ── */}
        {activeTab === "users" && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <SectionHeader
              title="All Users"
              count={filteredUsers.length}
              icon={Users}
              color="bg-blue-500/10 text-blue-400"
              loading={!!loading.users}
              onRefresh={fetchUsers}
              search={userSearch}
              onSearch={setUserSearch}
            />
            {loading.users && users.length === 0 ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-surface-hover animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((u) => (
                  <UserRow key={u.userId} user={u} onAction={handleAction} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Posts tab ── */}
        {activeTab === "posts" && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <SectionHeader
              title="All Posts"
              count={filteredPosts.length}
              icon={FileText}
              color="bg-green-500/10 text-green-400"
              loading={!!loading.posts}
              onRefresh={fetchPosts}
              search={postSearch}
              onSearch={setPostSearch}
            />
            {loading.posts && posts.length === 0 ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-surface-hover animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPosts.map((p) => (
                  <PostRow key={p.postId} post={p} onAction={handleAction} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Comments tab ── */}
        {activeTab === "comments" && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <SectionHeader
              title="All Comments"
              count={filteredComments.length}
              icon={MessageSquare}
              color="bg-purple-500/10 text-purple-400"
              loading={!!loading.comments}
              onRefresh={fetchComments}
              search={commentSearch}
              onSearch={setCommentSearch}
            />
            {loading.comments && comments.length === 0 ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-surface-hover animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredComments.map((c) => (
                  <CommentRow
                    key={c.commentId}
                    comment={c}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Flagged tab ── */}
        {activeTab === "flagged" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHeader
                title="Flagged Users"
                count={flaggedUsers.length}
                icon={Users}
                color="bg-orange-500/10 text-orange-400"
                loading={!!loading.flagged}
                onRefresh={fetchFlagged}
              />
              {flaggedUsers.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No flagged users
                </p>
              ) : (
                <div className="space-y-1">
                  {flaggedUsers.map((u) => (
                    <UserRow
                      key={u.userId}
                      user={{ ...u, flagged: true }}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHeader
                title="Flagged Posts"
                count={flaggedPosts.length}
                icon={FileText}
                color="bg-red-500/10 text-red-400"
                loading={!!loading.flagged}
                onRefresh={fetchFlagged}
              />
              {flaggedPosts.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No flagged posts
                </p>
              ) : (
                <div className="space-y-1">
                  {flaggedPosts.map((p) => (
                    <PostRow
                      key={p.postId}
                      post={{ ...p, isFlagged: true }}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHeader
                title="Flagged Comments"
                count={flaggedComments.length}
                icon={MessageSquare}
                color="bg-orange-500/10 text-orange-400"
                loading={!!loading.flagged}
                onRefresh={fetchFlagged}
              />
              {flaggedComments.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No flagged comments
                </p>
              ) : (
                <div className="space-y-1">
                  {flaggedComments.map((c) => (
                    <CommentRow
                      key={c.commentId}
                      comment={{ ...c, isFlagged: true }}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Reports tab ── */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHeader
                title="User Reports"
                count={userReports.length}
                icon={AlertTriangle}
                color="bg-orange-500/10 text-orange-400"
                loading={!!loading.reports}
                onRefresh={fetchReports}
              />
              {userReports.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No user reports
                </p>
              ) : (
                <div className="space-y-2">
                  {userReports.map((r) => (
                    <ReportRow
                      key={r.reportId ?? r.id}
                      report={r}
                      onAction={(a, id) =>
                        handleAction(
                          a === "approveReport"
                            ? "approveReport"
                            : "rejectReport",
                          id,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <SectionHeader
                title="Comment Reports"
                count={commentReports.length}
                icon={AlertTriangle}
                color="bg-red-500/10 text-red-400"
                loading={!!loading.reports}
                onRefresh={fetchReports}
              />
              {commentReports.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No comment reports
                </p>
              ) : (
                <div className="space-y-2">
                  {commentReports.map((r) => (
                    <ReportRow
                      key={r.reportId ?? r.id}
                      report={r}
                      onAction={(a, id) =>
                        handleAction(
                          a === "approveReport"
                            ? "approveCommentReport"
                            : "rejectCommentReport",
                          id,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
