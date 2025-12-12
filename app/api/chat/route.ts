import { NextResponse } from "next/server";

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
    // For now, allow all origins so your DFY widget works anywhere.
    // Later we’ll restrict this by client settings.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Handle CORS preflight
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

  return NextResponse.json(
    {
      reply,
      sessionId: body.sessionId || makeSessionId(),
      receivedAt: new Date().toISOString(),
    },
    { headers: corsHeaders() }
  );
}
