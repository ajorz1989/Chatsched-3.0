import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { isSupabaseConfigured } from "../lib/supabase";
import SetupNotice from "./SetupNotice";

export default function RequireAuth({ children, role }: { children: ReactNode; role?: "admin" | "business" | "publisher" }) {
  const { user, profile, loading } = useAuth();

  if (!isSupabaseConfigured) return <SetupNotice />;

  if (loading) {
    return <div className="max-w-md mx-auto px-5 py-24 text-center text-billboard-inkSoft">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}
