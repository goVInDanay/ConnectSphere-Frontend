<<<<<<< HEAD
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap } from 'lucide-react';
=======
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Zap } from "lucide-react";
>>>>>>> recovery-branch

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center animate-pulse-glow">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand-500"
<<<<<<< HEAD
                style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
=======
                style={{
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }}
>>>>>>> recovery-branch
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
