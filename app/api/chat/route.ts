import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const reply =
    `Got your message.\n\n` +
    `clientId: ${clientId}\n` +
    `message: ${message}\n\n` +
    `Next: we’ll replace this with OpenAI + knowledge base.`;

  // Log to Supabase (server-side)
  try {
    const supabaseAdmin = getAdminSupabase();

    // Ensure conversation exists for (client_id, session_id)
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

    // Insert user message
    const { error: msgErr1 } = await supabaseAdmin.from("messages").insert({
      conversation_id: convo.id,
      sender: "user",
      content: message,
    });
    if (msgErr1) throw msgErr1;

    // Insert assistant message
    const { error: msgErr2 } = await supabaseAdmin.from("messages").insert({
      conversation_id: convo.id,
      sender: "assistant",
      content: reply,
    });
    if (msgErr2) throw msgErr2;
  } catch (e) {
    // Don’t break chat if logging fails; just return reply
    console.error("[/api/chat] logging failed:", e);
  }

  return NextResponse.json(
    { reply, sessionId, receivedAt: new Date().toISOString() },
    { headers: corsHeaders() }
  );
}
