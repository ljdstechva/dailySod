import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  clientId?: string;
  settings?: Record<string, any>;
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders() });
  }

  const clientId = (body.clientId || "").trim();
  const settings = body.settings || {};

  if (!clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400, headers: corsHeaders() });
  }

  // Light validation / allowlist (prevents random junk in JSON)
  const allowedKeys = new Set([
    "bubbleShape",
    "bubbleColor",
    "bubbleText",
    "bubbleImage",
    "chatTitle",
    "chatHeaderBg",
    "chatHeaderText",
    "chatPanelBg",
    "chatUserBubble",
    "chatBotBubble",
    "position",
  ]);

  const safeSettings: Record<string, any> = {};
  for (const [k, v] of Object.entries(settings)) {
    if (allowedKeys.has(k)) safeSettings[k] = v;
  }

  try {
    const supabaseAdmin = getAdminSupabase();

    // Ensure client exists
    const { data: c, error: cErr } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (cErr) throw cErr;
    if (!c) return NextResponse.json({ error: "Client not found" }, { status: 404, headers: corsHeaders() });

    const { error: upsertErr } = await supabaseAdmin
      .from("widget_settings")
      .upsert(
        { client_id: clientId, settings: safeSettings, updated_at: new Date().toISOString() },
        { onConflict: "client_id" }
      );

    if (upsertErr) throw upsertErr;

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  } catch (e: any) {
    console.error("[/api/widget/settings] failed:", e);
    return NextResponse.json({ error: e?.message || "Save failed" }, { status: 500, headers: corsHeaders() });
  }
}
