import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

type ChatRequest = {
  clientId?: string;
  message?: string;
  sessionId?: string;
  pageUrl?: string;
};

function makeSessionId() {
  return "ds_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  let body: ChatRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders() });
  }

  const clientId = (body.clientId || "").trim();
  const message = (body.message || "").trim();
  const sessionId = (body.sessionId || makeSessionId()).trim();

  if (!clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400, headers: corsHeaders() });
  }

  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400, headers: corsHeaders() });
  }

  // ---- OpenAI reply (RAG enabled) ----
let reply = "Sorry — I couldn’t generate a reply.";
try {
  const openai = getOpenAI();
  const supabaseAdmin = getAdminSupabase();

  // 1) Embed the user query
  const qEmb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const queryEmbedding = qEmb.data[0].embedding;

  // 2) Retrieve top KB chunks for this client
  const { data: matches, error: matchErr } = await supabaseAdmin.rpc("match_kb_chunks", {
    p_client_id: clientId,
    p_query_embedding: queryEmbedding,
    p_match_count: 5,
  });

  if (matchErr) throw matchErr;

  const contextBlocks = (matches || [])
    .map((m: any, idx: number) => `Source ${idx + 1}:\n${m.content}`)
    .join("\n\n---\n\n");

  const system = [
    "You are DailySod, an assistant embedded on a business website.",
    "Be concise, helpful, and business-friendly.",
    "Use the provided Knowledge Base context when relevant.",
    "If the answer is not in the Knowledge Base, say you’re not sure and suggest contacting the business.",
    "Do not invent facts or policies.",
  ].join(" ");

  const userPrompt = contextBlocks
    ? `Knowledge Base Context:\n\n${contextBlocks}\n\nUser message:\n${message}`
    : `User message:\n${message}`;

  const result = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });

  reply = result.choices[0]?.message?.content?.trim() || reply;
} catch (e) {
  console.error("[/api/chat] OpenAI/RAG failed:", e);
  reply = "Sorry — I’m having trouble right now. Please try again in a moment.";
}


  // ---- Logging (same as before) ----
  try {
    const supabaseAdmin = getAdminSupabase();

    const { data: convo, error: convoErr } = await supabaseAdmin
      .from("conversations")
      .upsert(
        {
          client_id: clientId,
          session_id: sessionId,
          page_url: body.pageUrl || null,
          user_agent: req.headers.get("user-agent") || null,
          last_message_at: new Date().toISOString(),
        },
        { onConflict: "client_id,session_id" }
      )
      .select("id")
      .single();

    if (convoErr) throw convoErr;

    const { error: msgErr1 } = await supabaseAdmin.from("messages").insert({
      conversation_id: convo.id,
      sender: "user",
      content: message,
    });
    if (msgErr1) throw msgErr1;

    const { error: msgErr2 } = await supabaseAdmin.from("messages").insert({
      conversation_id: convo.id,
      sender: "assistant",
      content: reply,
    });
    if (msgErr2) throw msgErr2;
  } catch (e) {
    console.error("[/api/chat] logging failed:", e);
  }

  return NextResponse.json(
    { reply, sessionId, receivedAt: new Date().toISOString() },
    { headers: corsHeaders() }
  );
}
