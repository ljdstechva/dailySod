"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Account created. Check your email if confirmation is enabled.");
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <a href="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back
        </a>

        <h1 className="mt-6 text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Register to access your DailySod dashboard.
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
              placeholder="Create a password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={onRegister}
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          {status && <p className="text-sm text-slate-600">{status}</p>}

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a className="font-medium text-slate-900 hover:underline" href="/login">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
