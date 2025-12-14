import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = (searchParams.get("clientId") || "").trim();

  if (!clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400, headers: corsHeaders() });
  }

  try {
    const supabaseAdmin = getAdminSupabase();

    const { data, error } = await supabaseAdmin
      .from("widget_settings")
      .select("settings, updated_at")
      .eq("client_id", clientId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        settings: data?.settings || {},
        updatedAt: data?.updated_at || null,
      },
      { headers: corsHeaders() }
    );
  } catch (e: any) {
    console.error("[/api/widget/config] failed:", e);
    return NextResponse.json({ error: e?.message || "Fetch failed" }, { status: 500, headers: corsHeaders() });
  }
}
