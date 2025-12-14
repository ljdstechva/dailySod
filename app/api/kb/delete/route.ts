// app/api/kb/delete/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DeleteBody = {
  clientId?: string;
  documentId?: string;
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
  let body: DeleteBody;

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

  try {
    const supabaseAdmin = getAdminSupabase();

    // Ensure document belongs to client
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

    const { error: chunkErr } = await supabaseAdmin
      .from("kb_chunks")
      .delete()
      .eq("document_id", documentId);

    if (chunkErr) throw chunkErr;

    const { error: docDeleteErr } = await supabaseAdmin
      .from("kb_documents")
      .delete()
      .eq("id", documentId);

    if (docDeleteErr) throw docDeleteErr;

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  } catch (e: any) {
    console.error("[/api/kb/delete] failed:", e);
    return NextResponse.json(
      { error: e?.message || "Delete failed" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
