"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateClient } from "@/lib/client";

export default function KnowledgePage() {
  const router = useRouter();
  const [title, setTitle] = useState("Website Info");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
    });
  }, [router]);

  const upload = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const client = await getOrCreateClient();

      const res = await fetch("/api/kb/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          title,
          text,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setStatus(`Saved: ${data.chunks} chunks`);
      setText("");
    } catch (e: any) {
      setStatus(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge base</h1>
        <p className="mt-1 text-sm text-slate-600">
          Paste business info here. Next, we’ll support file uploads.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Document title</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Text content</label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2"
            rows={10}
            placeholder="Paste services, hours, pricing notes, FAQs, policies…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          onClick={upload}
          disabled={loading || text.trim().length < 20}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save to knowledge base"}
        </button>

        {status && <p className="text-sm text-slate-600">{status}</p>}
      </div>
    </div>
  );
}
