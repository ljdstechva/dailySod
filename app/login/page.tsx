"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    router.push("/app/dashboard");
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <a href="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back
        </a>

        <h1 className="mt-6 text-2xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your details to access your DailySod dashboard.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 p-6">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={onLogin}
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {status && <p className="text-sm text-slate-600">{status}</p>}

          <p className="text-center text-sm text-slate-600">
            No account?{" "}
            <a className="font-medium text-slate-900 hover:underline" href="/register">
              Create one
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
