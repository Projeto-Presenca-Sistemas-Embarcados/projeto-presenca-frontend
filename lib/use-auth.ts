"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuthSession,
  setAuthSession,
  type AuthSession,
} from "./auth-storage";
import { findTeacherByEmail } from "./api";

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = getAuthSession();
        if (!s) {
          if (requireAuth) router.replace("/auth");
          if (mounted) setLoading(false);
          return;
        }
        // If missing teacherId, fetch it by email
        if (!s.teacherId) {
          const teacher = await findTeacherByEmail(s.email);
          if (!teacher) {
            // No teacher found: clear session and redirect
            if (requireAuth) router.replace("/auth");
            if (mounted) setLoading(false);
            return;
          }
          const newSession: AuthSession = { ...s, teacherId: teacher.id };
          setAuthSession(newSession);
          if (mounted) setSession(newSession);
        } else {
          if (mounted) setSession(s);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro de autenticação";
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [requireAuth, router]);

  return { session, loading, error } as const;
}
