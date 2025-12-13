"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold">
            DailySod
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-slate-600 sm:block">{email}</div>
            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4">
            <nav className="space-y-1 text-sm">
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/dashboard">
                Dashboard
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/install">
                Install widget
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/knowledge">
                Knowledge
              </a>
            </nav>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
