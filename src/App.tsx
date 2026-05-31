import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastContainer } from "./components/ui/Toast";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";

// Public pages
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const HomePage = React.lazy(() => import("./pages/HomePage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const ExplorePage = React.lazy(() => import("./pages/ExplorePage"));

// Auth-required pages
const StoriesPage = React.lazy(() => import("./pages/StoriesPage"));
const EditPostPage = React.lazy(() => import("./pages/EditPostPage"));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage"));

// Admin pages
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <React.Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route
                  path="/search"
                  element={<Navigate to="/explore" replace />}
                />
                <Route path="/profile/:userId" element={<ProfilePage />} />

                <Route
                  path="/stories"
                  element={
                    <ProtectedRoute>
                      <StoriesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/posts/:postId/edit"
                  element={
                    <ProtectedRoute>
                      <EditPostPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </React.Suspense>
            <ToastContainer />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
