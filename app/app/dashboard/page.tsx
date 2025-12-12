"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Signed in as {email || "…"}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="text-sm font-semibold">Next</div>
        <div className="mt-2 text-sm text-slate-600">
          We’ll create your “client” record in Supabase and start showing real data.
        </div>
      </div>
    </div>
  );
}
