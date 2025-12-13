"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateClient, ClientRow } from "@/lib/client";

type ConvoRow = {
  id: string;
  session_id: string;
  page_url: string | null;
  last_message_at: string;
  created_at: string;
};

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [client, setClient] = useState<ClientRow | null>(null);

  const [convoCount7d, setConvoCount7d] = useState<number>(0);
  const [msgCount7d, setMsgCount7d] = useState<number>(0);
  const [recentConvos, setRecentConvos] = useState<ConvoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const since = useMemo(() => isoDaysAgo(7), []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setEmail(userData.user.email || "");

      const c = await getOrCreateClient();
      setClient(c);

      // 1) Conversations last 7 days
      const { count: convoCount, error: convoErr } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("client_id", c.id)
        .gte("created_at", since);

      if (convoErr) throw convoErr;
      setConvoCount7d(convoCount || 0);

      // 2) Messages last 7 days (join via conversations)
      // We can do this in 2 steps to keep it simple:
      const { data: convosForMsgs, error: convoListErr } = await supabase
        .from("conversations")
        .select("id")
        .eq("client_id", c.id);

      if (convoListErr) throw convoListErr;

      const convoIds = (convosForMsgs || []).map((x) => x.id);
      if (convoIds.length === 0) {
        setMsgCount7d(0);
        setRecentConvos([]);
        setLoading(false);
        return;
      }

      const { count: msgCount, error: msgErr } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .gte("created_at", since);

      if (msgErr) throw msgErr;
      setMsgCount7d(msgCount || 0);

      // 3) Recent conversations
      const { data: recent, error: recentErr } = await supabase
        .from("conversations")
        .select("id, session_id, page_url, last_message_at, created_at")
        .eq("client_id", c.id)
        .order("last_message_at", { ascending: false })
        .limit(10);

      if (recentErr) throw recentErr;
      setRecentConvos((recent || []) as ConvoRow[]);

      setLoading(false);
    };

    run().catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, [router, since]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {email || "…"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Conversations (7d)" value={loading ? "…" : String(convoCount7d)} />
        <StatCard label="Messages (7d)" value={loading ? "…" : String(msgCount7d)} />
        <StatCard label="Client ID" value={client ? client.id : "…"} mono />
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Recent conversations</div>
          <a
            className="text-sm font-medium text-slate-900 hover:underline"
            href="/app/install"
          >
            Install widget
          </a>
        </div>

        {loading ? (
          <div className="mt-3 text-sm text-slate-600">Loading…</div>
        ) : recentConvos.length === 0 ? (
          <div className="mt-3 text-sm text-slate-600">No conversations yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-600">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-3">Last message</th>
                  <th className="py-2 pr-3">Session</th>
                  <th className="py-2 pr-3">Page</th>
                </tr>
              </thead>
              <tbody>
                {recentConvos.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3">
                      {new Date(c.last_message_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">
                      {c.session_id}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {c.page_url ? truncate(c.page_url, 44) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="text-sm text-slate-600">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${mono ? "font-mono text-base break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
