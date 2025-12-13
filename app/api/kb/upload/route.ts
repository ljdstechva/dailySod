import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

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

function chunkText(input: string, maxChars = 900) {
  const clean = input.replace(/\r/g, "").trim();
  const paragraphs = clean.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let buf = "";

  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > maxChars) {
      if (buf.trim()) chunks.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { clientId, title, text } = await req.json();

    if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });
    if (!text || String(text).trim().length < 20) {
      return NextResponse.json({ error: "Text too short" }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const openai = getOpenAI();

    // 1) Create document row
    const { data: doc, error: docErr } = await supabase
      .from("kb_documents")
      .insert({ client_id: clientId, title, source: "manual" })
      .select("id")
      .single();

    if (docErr) throw docErr;

    // 2) Chunk
    const chunks = chunkText(String(text));

    // 3) Embed + insert
    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];

      const emb = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      });

      const vector = emb.data[0].embedding;

      const { error: chunkErr } = await supabase.from("kb_chunks").insert({
        client_id: clientId,
        document_id: doc.id,
        chunk_index: i,
        content,
        embedding: vector,
      });

      if (chunkErr) throw chunkErr;
    }

    return NextResponse.json({ ok: true, chunks: chunks.length });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
