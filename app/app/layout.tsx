"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setEmail(data.user.email || "");
    };
    run();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="text-lg font-semibold">
            DailySod
            <span className="ml-2 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
              beta
            </span>
          </a>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-300">{email}</div>

            <ThemeToggle />

            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <nav className="space-y-1 text-sm">
              <NavLink href="/app/dashboard" label="Dashboard" />
              <NavLink href="/app/install" label="Install widget" />
              <NavLink href="/app/knowledge" label="Knowledge base" />
            </nav>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              Tip: Add knowledge base content so the bot answers using your business info.
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
      href={href}
    >
      {label}
    </a>
  );
}
