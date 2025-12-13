'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Copy, Check, Code2 } from 'lucide-react';

export default function InstallPage() {
  const [clientId, setClientId] = useState<string>('LOADING...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function getClientId() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        return;
      }
      if (!user) return;

      // IMPORTANT: owner_user_id is the correct column
      const { data, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (clientErr) {
        console.error(clientErr);
        return;
      }

      if (data?.id) setClientId(data.id);
    }

    getClientId();
  }, []);

  const snippet = useMemo(
    () =>
      `<script src="https://daily-sod.vercel.app/widget.js" data-client-id="${clientId}"></script>`,
    [clientId]
  );

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Install Widget</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Copy and paste the code snippet below into your website&apos;s HTML to activate the assistant.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-500">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Embed Code</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Place this before the closing{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">
                &lt;/body&gt;
              </code>{' '}
              tag.
            </p>
          </div>
        </div>

        <div className="relative group">
          <pre className="bg-slate-950 text-slate-100 p-6 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border border-slate-800">
            {snippet}
          </pre>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={copyToClipboard}
            className={`
              flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all
              ${copied
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
              }
            `}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Snippet
              </>
            )}
          </button>

          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            Need help? Check our documentation or support.
          </div>
        </div>
      </div>
    </div>
  );
}
