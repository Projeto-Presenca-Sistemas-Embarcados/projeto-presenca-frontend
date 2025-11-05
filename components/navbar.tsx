"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthSession, clearAuthSession } from "../lib/auth-storage";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  // Start with a stable SSR value and hydrate after mount to avoid mismatches
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    // Hydrate client-side auth state after mount (defer to next tick to satisfy lint rule)
    const update = () => setLogged(!!getAuthSession()?.isAuthenticated);
    const t = window.setTimeout(update, 0);
    window.addEventListener("storage", update);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("storage", update);
    };
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth");
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Presença Escolar
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          {logged ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-gray-900 text-white hover:bg-black"
            >
              Sair
            </button>
          ) : (
            <Link href="/auth" className="hover:underline">
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
