import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Edit3,
  UserPlus,
  UserMinus,
  Camera,
  Check,
  X,
  Key,
  Grid3X3,
  Users,
  UserCheck,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { PostCard } from "../components/posts/PostCard";
import { PostSkeleton, ProfileSkeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi, postsApi, followsApi } from "../api";
import type { User, Post, Follow } from "../types";
import { formatDate, formatCount, getErrorMessage, cn } from "../utils";

// ── User list modal ───────────────────────────────────────────────────────────
interface UserListModalProps {
  title: string;
  userIds: number[];
  onClose: () => void;
}

function UserListModal({ title, userIds, onClose }: UserListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const fetched = await Promise.allSettled(
        userIds.map((id) => authApi.getProfile(id)),
      );
      setUsers(
        fetched
          .filter((r) => r.status === "fulfilled")
          .map((r) => (r as PromiseFulfilledResult<User>).value),
      );
      setLoading(false);
    };
    fetchUsers();
  }, [userIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {users.map((u) => (
                <Link
                  key={u.userId}
                  to={`/profile/${u.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                >
                  <Avatar
                    src={u.profilePicUrl}
                    name={u.fullName || u.username}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.fullName || u.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.username}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Deactivate confirmation modal ─────────────────────────────────────────────
function DeactivateModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-destructive/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="font-bold text-foreground">Deactivate Account?</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account will be deactivated. You won't be able to log in until
          it's reactivated. This action can be undone by contacting support.
        </p>
        <div className="flex gap-2 pt-1">
          <Button
            variant="destructive"
            isLoading={loading}
            onClick={onConfirm}
            className="flex-1"
          >
            Deactivate
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const userId = parseInt(userIdParam || "0", 10);
  const { user: currentUser, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    bio: "",
    username: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [savingPw, setSavingPw] = useState(false);

  // Followers / following modal
  type ModalMode = "followers" | "following" | "mutual" | null;
  const [modal, setModal] = useState<ModalMode>(null);
  const [modalUserIds, setModalUserIds] = useState<number[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Deactivate
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const isOwn = currentUser?.userId === userId;

  // ── Load profile data ────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoadingProfile(true);
    try {
      const [prof, follCnt, folwCnt, pCnt] = await Promise.all([
        authApi.getProfile(userId),
        followsApi.getFollowerCount(userId),
        followsApi.getFollowingCount(userId),
        postsApi.getPostCount(userId),
      ]);
      setProfile(prof);
      setFollowerCount(follCnt.followerCount);
      setFollowingCount(folwCnt.followingCount);
      setPostCount(pCnt.postCount);
      setEditForm({
        fullName: prof.fullName || "",
        bio: prof.bio || "",
        username: prof.username,
      });
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  const loadPosts = useCallback(async () => {
    if (!userId) return;
    setLoadingPosts(true);
    try {
      const data = await postsApi.getPostsByUser(userId);
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [userId]);

  const checkFollowing = useCallback(async () => {
    if (!currentUser || isOwn) return;
    try {
      // Primary: dedicated isFollowing endpoint
      const result = await followsApi.isFollowing(userId);
      setIsFollowing(result);
    } catch {
      // Fallback: scan the following list
      try {
        const following = await followsApi.getFollowing(currentUser.userId);
        setIsFollowing(following.some((f) => f.followeeId === userId));
      } catch {
        setIsFollowing(false);
      }
    }
  }, [currentUser, userId, isOwn]);

  useEffect(() => {
    loadProfile();
    loadPosts();
    checkFollowing();
  }, [loadProfile, loadPosts, checkFollowing]);

  // ── Follow / Unfollow ────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!currentUser) return;
    setFollowLoading(true);
    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? Math.max(0, c - 1) : c + 1));
    try {
      if (wasFollowing) {
        await followsApi.unfollow(userId);
        toast.success(`Unfollowed @${profile?.username}`);
      } else {
        await followsApi.follow(userId);
        toast.success(`Following @${profile?.username}`);
      }
    } catch (err) {
      // Revert on failure
      setIsFollowing(wasFollowing);
      setFollowerCount((c) => (wasFollowing ? c + 1 : Math.max(0, c - 1)));
      toast.error("Action failed", getErrorMessage(err));
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Open followers / following / mutual modal ────────────────────────────
  const openModal = async (mode: ModalMode) => {
    setModal(mode);
    setLoadingModal(true);
    try {
      let ids: number[] = [];
      if (mode === "followers") {
        const follows: Follow[] = await followsApi.getFollowers(userId);
        ids = follows.map((f) => f.followerId);
      } else if (mode === "following") {
        const follows: Follow[] = await followsApi.getFollowing(userId);
        ids = follows.map((f) => f.followeeId);
      } else if (mode === "mutual") {
        ids = await followsApi.getMutualFollows();
      }
      setModalUserIds(ids);
    } catch {
      toast.error("Failed to load users");
      setModal(null);
    } finally {
      setLoadingModal(false);
    }
  };

  // ── Edit profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile({
        fullName: editForm.fullName,
        bio: editForm.bio,
        username: editForm.username,
      });
      setProfile(updated);
      updateUser({
        fullName: updated.fullName,
        bio: updated.bio,
        username: updated.username,
        profilePicUrl: updated.profilePicUrl,
      });
      setEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Update failed", getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error("Both fields are required");
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword(pwForm);
      toast.success("Password changed!");
      setChangingPassword(false);
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error("Password change failed", getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  // ── Deactivate account ────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await authApi.deactivateAccount();
      toast.success("Account deactivated");
      await logout();
      navigate("/login");
    } catch (err) {
      toast.error("Failed to deactivate", getErrorMessage(err));
    } finally {
      setDeactivating(false);
      setShowDeactivate(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <AppLayout>
        <ProfileSkeleton />
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </AppLayout>
    );
  }

  const modalTitles: Record<NonNullable<ModalMode>, string> = {
    followers: "Followers",
    following: "Following",
    mutual: "Mutual Followers",
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Cover + avatar */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-br from-brand-900 via-brand-700 to-violet-800 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-violet-500/20" />
          </div>

          <div className="px-5 pb-5">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <Avatar
                  src={profile.profilePicUrl}
                  name={profile.fullName || profile.username}
                  size="xl"
                  className="ring-4 ring-card"
                />
                {isOwn && (
                  <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center cursor-pointer hover:bg-brand-600 transition-colors shadow-lg">
                    <Camera className="w-3.5 h-3.5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const { mediaApi } = await import("../api");
                        try {
                          const media = await mediaApi.uploadMedia(file);
                          const updated = await authApi.updateProfile({
                            profilePicUrl: media.url,
                          });
                          setProfile(updated);
                          updateUser({ profilePicUrl: updated.profilePicUrl });
                          toast.success("Profile picture updated!");
                        } catch {
                          toast.error("Upload failed");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-10">
                {isOwn ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Edit profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChangingPassword(true)}
                      leftIcon={<Key className="w-3.5 h-3.5" />}
                    >
                      Password
                    </Button>
                  </>
                ) : currentUser ? (
                  <>
                    <Button
                      variant={isFollowing ? "secondary" : "primary"}
                      size="sm"
                      isLoading={followLoading}
                      onClick={handleFollow}
                      leftIcon={
                        isFollowing ? (
                          <UserMinus className="w-3.5 h-3.5" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                    {/* Mutual followers button for other users */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal("mutual")}
                      leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                    >
                      Mutual
                    </Button>
                  </>
                ) : (
                  <Link to="/login">
                    <Button size="sm">Follow</Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Profile info */}
            {editing ? (
              <div className="space-y-3">
                <Input
                  label="Full name"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  placeholder="Your full name"
                />
                <Input
                  label="Username"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, username: e.target.value }))
                  }
                  placeholder="username"
                />
                <Textarea
                  label="Bio"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  placeholder="Tell people about yourself…"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    isLoading={savingProfile}
                    onClick={handleSaveProfile}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Save changes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(false)}
                    leftIcon={<X className="w-3.5 h-3.5" />}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground">
                  {profile.fullName || profile.username}
                </h1>
                <p className="text-sm text-muted-foreground mb-2">
                  @{profile.username}
                </p>
                {!profile.active && (
                  <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive rounded-full px-2 py-0.5 mb-2">
                    <AlertTriangle className="w-3 h-3" /> Account deactivated
                  </span>
                )}
                {profile.bio && (
                  <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    {profile.bio}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {formatDate(profile.createdAt)}
                  </span>
                </div>
              </>
            )}

            {/* Change password */}
            {changingPassword && (
              <div className="mt-4 p-4 bg-surface rounded-xl border border-border space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Change Password
                </h3>
                <Input
                  label="Current password"
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Current password"
                />
                <Input
                  label="New password"
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  placeholder="New password (min 8 chars)"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    isLoading={savingPw}
                    onClick={handleChangePassword}
                  >
                    Save password
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setChangingPassword(false);
                      setPwForm({ currentPassword: "", newPassword: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-border/40">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {formatCount(postCount)}
                </p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <button
                className="text-center hover:opacity-70 transition-opacity"
                onClick={() => openModal("followers")}
              >
                <p className="text-lg font-bold text-foreground">
                  {formatCount(followerCount)}
                </p>
                <p className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                  Followers
                </p>
              </button>
              <button
                className="text-center hover:opacity-70 transition-opacity"
                onClick={() => openModal("following")}
              >
                <p className="text-lg font-bold text-foreground">
                  {formatCount(followingCount)}
                </p>
                <p className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                  Following
                </p>
              </button>
            </div>

            {/* Deactivate account (own profile only) */}
            {isOwn && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <button
                  onClick={() => setShowDeactivate(true)}
                  className="flex items-center gap-2 text-xs text-destructive/70 hover:text-destructive transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Deactivate my account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Posts grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Grid3X3 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Posts
            </h2>
          </div>

          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <Grid3X3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isOwn ? "Share your first post!" : "No posts yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.postId}
                  post={post}
                  onDeleted={(id) =>
                    setPosts((p) => p.filter((x) => x.postId !== id))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <UserListModal
          title={modalTitles[modal]}
          userIds={modalUserIds}
          onClose={() => {
            setModal(null);
            setModalUserIds([]);
          }}
        />
      )}
      {showDeactivate && (
        <DeactivateModal
          onConfirm={handleDeactivate}
          onCancel={() => setShowDeactivate(false)}
          loading={deactivating}
        />
      )}
    </AppLayout>
  );
}
