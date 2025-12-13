// app/app/knowledge/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

type Status = "idle" | "saving" | "success" | "error";

export default function KnowledgePage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    return !!clientId && title.trim().length > 0 && content.trim().length > 0 && status !== "saving";
  }, [clientId, title, content, status]);

  // ✅ Get clientId using clients.owner_user_id (NOT user_id)
  useEffect(() => {
    async function loadClientId() {
      try {
        setClientLoading(true);

        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) throw userErr;
        if (!user) {
          setClientId(null);
          return;
        }

        const { data: client, error: clientErr } = await supabase
          .from("clients")
          .select("id")
          .eq("owner_user_id", user.id)
          .single();

        if (clientErr) throw clientErr;
        setClientId(client?.id ?? null);
      } catch (e: any) {
        console.error("[KnowledgePage] loadClientId failed:", e);
        setClientId(null);
      } finally {
        setClientLoading(false);
      }
    }

    loadClientId();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg("");
    if (!clientId) {
      setStatus("error");
      setErrorMsg("Client ID not found for this account.");
      return;
    }

    const t = title.trim();
    const c = content.trim();

    if (!t || !c) return;

    setStatus("saving");

    try {
      const res = await fetch("/api/kb/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ send clientId + title + content (what the route requires)
        body: JSON.stringify({ clientId, title: t, content: c, source: "manual" }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Upload failed");
      }

      setStatus("success");
      setTitle("");
      setContent("");

      // Reset success status after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMsg(error?.message || "Failed to save. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Knowledge Base</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Add documents to train your AI assistant. It will reference this data when chatting with visitors.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Client ID</p>
          <code className="text-xs font-mono bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded inline-block max-w-[240px] truncate">
            {clientLoading ? "LOADING..." : clientId || "NOT FOUND"}
          </code>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Return Policy"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the text content here..."
              rows={12}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow resize-y font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 min-h-[28px]">
              {status === "success" && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Saved successfully!
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                  <AlertCircle className="w-5 h-5" />
                  {errorMsg || "Failed to save. Please try again."}
                </div>
              )}

              {clientLoading && (
                <div className="text-sm text-slate-500 dark:text-slate-400">Loading your client…</div>
              )}

              {!clientLoading && !clientId && status !== "error" && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  No client found for this user (clients.owner_user_id mismatch).
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
            >
              <Save className="w-5 h-5" />
              {status === "saving" ? "Saving..." : "Save Document"}
            </button>
          </div>
        </form>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        Tip: Keep each document focused (e.g., Pricing, Hours, FAQs). Multiple smaller docs usually retrieve better than
        one huge doc.
      </div>
    </div>
  );
}
