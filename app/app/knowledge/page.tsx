// app/app/knowledge/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, AlertCircle, CheckCircle2, Loader2, Pencil, Trash2, X } from "lucide-react";

type Status = "idle" | "saving" | "success" | "error";

type KnowledgeDoc = {
  id: string;
  title: string;
  source?: string | null;
  created_at?: string | null;
  content: string;
};

export default function KnowledgePage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [knowledge, setKnowledge] = useState<KnowledgeDoc[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbError, setKbError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDoc | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const loadKnowledge = useCallback(async () => {
    if (!clientId) return;

    setKbLoading(true);
    setKbError("");
    try {
      const { data: docs, error } = await supabase
        .from("kb_documents")
        .select("id,title,source,created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const docIds = (docs || []).map((d) => d.id);
      let contentMap: Record<string, string> = {};

      if (docIds.length > 0) {
        const { data: chunks, error: chunkErr } = await supabase
          .from("kb_chunks")
          .select("document_id,chunk_index,content")
          .in("document_id", docIds)
          .order("chunk_index", { ascending: true });

        if (chunkErr) throw chunkErr;

        contentMap = (chunks || []).reduce<Record<string, string>>((acc, c) => {
          const existing = acc[c.document_id];
          const next = existing ? `${existing}\n\n${c.content || ""}` : (c.content || "");
          acc[c.document_id] = next.trim();
          return acc;
        }, {});
      }

      const mapped: KnowledgeDoc[] = (docs || []).map((d) => ({
        id: d.id,
        title: d.title,
        source: d.source,
        created_at: d.created_at,
        content: contentMap[d.id] || "",
      }));

      setKnowledge(mapped);
    } catch (e: any) {
      console.error("[KnowledgePage] loadKnowledge failed:", e);
      setKbError(e?.message || "Failed to load knowledge base.");
    } finally {
      setKbLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    loadKnowledge();
  }, [clientId, loadKnowledge]);

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

      await loadKnowledge();

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

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Knowledge Base</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Preview, edit, or delete documents you have added.
            </p>
          </div>
          {kbLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          )}
        </div>

        {kbError && (
          <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {kbError}
          </div>
        )}

        {knowledge.length === 0 && !kbLoading && !clientLoading ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">No knowledge documents yet.</div>
        ) : (
          <div className="space-y-4">
            {knowledge.map((doc) => {
              const isEditing = editingId === doc.id;
              return (
                <div
                  key={doc.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-950/50"
                >
                  <div className="flex flex-col gap-3">
                    {isEditing ? (
                      <>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Title</label>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Content</label>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-mono leading-relaxed"
                          />
                        </div>
                        {editError && (
                          <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {editError}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!clientId || !editingId) return;
                              setEditError("");
                              const t = editTitle.trim();
                              const c = editContent.trim();
                              if (!t || !c) {
                                setEditError("Title and content are required.");
                                return;
                              }
                              setEditSaving(true);
                              try {
                                const res = await fetch("/api/kb/update", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    clientId,
                                    documentId: editingId,
                                    title: t,
                                    content: c,
                                    source: doc.source || "manual",
                                  }),
                                });
                                const json = await res.json().catch(() => ({}));
                                if (!res.ok) throw new Error(json?.error || "Update failed");
                                setEditingId(null);
                                setEditTitle("");
                                setEditContent("");
                                await loadKnowledge();
                              } catch (err: any) {
                                console.error(err);
                                setEditError(err?.message || "Update failed");
                              } finally {
                                setEditSaving(false);
                              }
                            }}
                            disabled={editSaving}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60"
                          >
                            {editSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditTitle("");
                              setEditContent("");
                              setEditError("");
                            }}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{doc.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {doc.created_at ? new Date(doc.created_at).toLocaleString() : "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingId(doc.id);
                                setEditTitle(doc.title);
                                setEditContent(doc.content);
                                setEditError("");
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget(doc);
                                setDeleteText("");
                                setDeleteError("");
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {doc.content || "No content stored."}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        Tip: Keep each document focused (e.g., Pricing, Hours, FAQs). Multiple smaller docs usually retrieve better than
        one huge doc.
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => {
                setDeleteTarget(null);
                setDeleteText("");
                setDeleteError("");
              }}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Knowledge Base</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Type <span className="font-semibold">DELETE</span> to confirm deleting “{deleteTarget.title}”.
            </p>

            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
            />

            {deleteError && (
              <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4" />
                {deleteError}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteText("");
                  setDeleteError("");
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={deleteText !== "DELETE" || deleteSaving}
                onClick={async () => {
                  if (!clientId || !deleteTarget) return;
                  if (deleteText !== "DELETE") return;
                  setDeleteError("");
                  setDeleteSaving(true);
                  try {
                    const res = await fetch("/api/kb/delete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ clientId, documentId: deleteTarget.id }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(json?.error || "Delete failed");
                    setDeleteTarget(null);
                    setDeleteText("");
                    await loadKnowledge();
                  } catch (err: any) {
                    console.error(err);
                    setDeleteError(err?.message || "Delete failed");
                  } finally {
                    setDeleteSaving(false);
                  }
                }}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleteSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
