// app/api/kb/update/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

type UpdateBody = {
  clientId?: string;
  documentId?: string;
  title?: string;
  content?: string;
  source?: string;
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, { auth: { persistSession: false } });
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey: key });
}

// Simple chunker: ~900 chars with overlap.
function chunkText(input: string, chunkSize = 900, overlap = 120) {
  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(text.length, start + chunkSize);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  let body: UpdateBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const clientId = (body.clientId || "").trim();
  const documentId = (body.documentId || "").trim();
  const title = (body.title || "").trim();
  const content = (body.content || "").trim();
  const source = (body.source || "manual").trim();

  if (!clientId) {
    return NextResponse.json(
      { error: "Missing clientId" },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (!documentId) {
    return NextResponse.json(
      { error: "Missing documentId" },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (!title) {
    return NextResponse.json(
      { error: "Missing title" },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (!content) {
    return NextResponse.json(
      { error: "Missing content" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const chunks = chunkText(content, 900, 120);
  if (chunks.length === 0) {
    return NextResponse.json(
      { error: "No chunks produced" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const supabaseAdmin = getAdminSupabase();
  const openai = getOpenAI();

  // We'll keep the previous chunks so we can restore if something fails mid-way.
  let previousChunks:
    | {
        client_id: string;
        document_id: string;
        chunk_index: number;
        content: string;
        embedding: number[];
      }[]
    | null = null;

  try {
    // 1) Ensure document belongs to client
    const { data: doc, error: docErr } = await supabaseAdmin
      .from("kb_documents")
      .select("id, client_id")
      .eq("id", documentId)
      .single();

    if (docErr) throw docErr;

    if (!doc || doc.client_id !== clientId) {
      return NextResponse.json(
        { error: "Document not found for this client" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // 2) Load existing chunks (backup for rollback)
    const { data: oldChunks, error: oldErr } = await supabaseAdmin
      .from("kb_chunks")
      .select("client_id, document_id, chunk_index, content, embedding")
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true });

    if (oldErr) throw oldErr;
    previousChunks = (oldChunks || []) as any[];

    // 3) Delete previous chunks first (so we don't show outdated context)
    const { error: delErr } = await supabaseAdmin
      .from("kb_chunks")
      .delete()
      .eq("document_id", documentId);

    if (delErr) throw delErr;

    // 4) Embed + insert new chunks
    const rows: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];

      const embRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: ch,
      });

      const embedding = embRes.data[0].embedding;

      rows.push({
        client_id: clientId,
        document_id: documentId,
        chunk_index: i,
        content: ch,
        embedding,
      });
    }

    const { error: insErr } = await supabaseAdmin.from("kb_chunks").insert(rows);
    if (insErr) throw insErr;

    // 5) Update document metadata LAST (so the doc only "changes" once chunks are valid)
    const { error: updateErr } = await supabaseAdmin
      .from("kb_documents")
      .update({ title, source })
      .eq("id", documentId);

    if (updateErr) throw updateErr;

    return NextResponse.json(
      { ok: true, documentId, chunksInserted: rows.length },
      { headers: corsHeaders() }
    );
  } catch (e: any) {
    console.error("[/api/kb/update] failed:", e);

    // Best-effort rollback: if we deleted chunks but couldn't insert new ones, restore old chunks.
    try {
      if (previousChunks && previousChunks.length > 0) {
        const { error: restoreErr } = await supabaseAdmin
          .from("kb_chunks")
          .insert(previousChunks);
        if (restoreErr) {
          console.error("[/api/kb/update] rollback restore failed:", restoreErr);
        }
      }
    } catch (rollbackErr) {
      console.error("[/api/kb/update] rollback exception:", rollbackErr);
    }

    return NextResponse.json(
      { error: e?.message || "Update failed" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
