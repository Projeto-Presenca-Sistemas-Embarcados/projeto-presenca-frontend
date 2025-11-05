export type AuthSession = {
  email: string;
  isAuthenticated: boolean;
  teacherId?: number;
};

const KEY = "teacher_auth";

export function setAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // ignore quota/serialization errors
  }
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.email || parsed.isAuthenticated !== true) return null;
    const session: AuthSession = {
      email: String(parsed.email),
      isAuthenticated: true,
    };
    if (typeof parsed.teacherId === "number")
      session.teacherId = parsed.teacherId;
    return session;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
