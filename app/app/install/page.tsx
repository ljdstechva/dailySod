"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateClient, ClientRow } from "@/lib/client";

export default function InstallWidgetPage() {
  const router = useRouter();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      const c = await getOrCreateClient();
      setClient(c);
    };

    run().catch(() => router.push("/login"));
  }, [router]);

  const snippet = useMemo(() => {
    const clientId = client?.id || "CLIENT_ID";
    return `<script src="https://YOUR_DOMAIN/widget.js" data-client-id="${clientId}"></script>`;
  }, [client]);

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Install widget</h1>
        <p className="mt-1 text-sm text-slate-600">
          Copy and paste this snippet into your website.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="text-sm font-semibold">Your install code</div>
        <p className="mt-2 text-sm text-slate-600">
          Paste it into your site’s header/footer, or a custom HTML block.
        </p>

        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-white">
          {snippet}
        </pre>

        <div className="mt-4 flex gap-3">
          <button
            onClick={copy}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {copied ? "Copied!" : "Copy code"}
          </button>

          <a
            href="/app/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to dashboard
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="text-sm font-semibold">Next</div>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-600 space-y-1">
          <li>We’ll host widget.js on your domain.</li>
          <li>We’ll make the chat bubble appear on any site that includes this snippet.</li>
          <li>Then we’ll connect it to your AI backend.</li>
        </ul>
      </div>
    </div>
  );
}
