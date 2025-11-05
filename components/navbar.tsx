"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthSession, clearAuthSession } from "../lib/auth-storage";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [logged, setLogged] = useState(
    () => !!getAuthSession()?.isAuthenticated
  );

  useEffect(() => {
    const onStorage = () => setLogged(!!getAuthSession()?.isAuthenticated);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
