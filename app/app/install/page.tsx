'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Copy,
  Check,
  Code2,
  Upload,
  Circle,
  Square,
  MessageCircle,
  MessageSquare,
  ImageIcon,
  Palette,
  Save,
  Loader2,
} from 'lucide-react';

type Shape = 'rounded' | 'circle';

type WidgetSettings = {
  position?: 'left' | 'right';
  bubbleShape?: Shape;
  bubbleColor?: string;
  bubbleText?: string;
  bubbleImage?: string | null;
  chatTitle?: string;
  chatHeaderBg?: string;
  chatHeaderText?: string;
  chatPanelBg?: string;
  chatUserBubble?: string;
  chatBotBubble?: string;
};

const DEFAULTS: Required<WidgetSettings> = {
  position: 'right',
  bubbleShape: 'rounded',
  bubbleColor: '#0f172a',
  bubbleText: 'Ask me anything',
  bubbleImage: null,
  chatTitle: 'DailySod Chat',
  chatHeaderBg: '#ffffff',
  chatHeaderText: '#0f172a',
  chatPanelBg: '#f8fafc',
  chatUserBubble: '#0f172a',
  chatBotBubble: '#ffffff',
};

function normalizeSettings(input?: WidgetSettings): Required<WidgetSettings> {
  return {
    position: input?.position ?? DEFAULTS.position,
    bubbleShape: input?.bubbleShape ?? DEFAULTS.bubbleShape,
    bubbleColor: input?.bubbleColor ?? DEFAULTS.bubbleColor,
    bubbleText: input?.bubbleText ?? DEFAULTS.bubbleText,
    bubbleImage: input?.bubbleImage ?? DEFAULTS.bubbleImage,
    chatTitle: input?.chatTitle ?? DEFAULTS.chatTitle,
    chatHeaderBg: input?.chatHeaderBg ?? DEFAULTS.chatHeaderBg,
    chatHeaderText: input?.chatHeaderText ?? DEFAULTS.chatHeaderText,
    chatPanelBg: input?.chatPanelBg ?? DEFAULTS.chatPanelBg,
    chatUserBubble: input?.chatUserBubble ?? DEFAULTS.chatUserBubble,
    chatBotBubble: input?.chatBotBubble ?? DEFAULTS.chatBotBubble,
  };
}

function WidgetPreview({
  shape,
  color,
  text,
  image,
  chatTitle,
  headerBg,
  headerText,
  panelBg,
  userBubble,
  botBubble,
}: {
  shape: Shape;
  color: string;
  text: string;
  image: string | null;
  chatTitle: string;
  headerBg: string;
  headerText: string;
  panelBg: string;
  userBubble: string;
  botBubble: string;
}) {
  const [open, setOpen] = useState(true);

  const bubbleStyle: React.CSSProperties =
    shape === 'circle'
      ? {
          backgroundColor: color,
          width: 58,
          height: 58,
          borderRadius: 9999,
          padding: 0,
        }
      : {
          backgroundColor: color,
          height: 44,
          minWidth: 170,
          padding: '0 14px',
          borderRadius: 14,
        };

  // ✅ FIX: circle content must be centered
  const bubbleClassName =
    shape === 'circle'
      ? 'relative inline-flex items-center justify-center text-white font-semibold shadow-lg border border-white/20 active:scale-[0.98] transition'
      : 'relative inline-flex items-center gap-2 justify-start text-white font-semibold shadow-lg border border-white/20 active:scale-[0.98] transition';

  return (
    <div className="relative w-full min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 shadow-inner overflow-hidden">
      <div className="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.06),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.06),transparent_35%)]" />
      <div className="absolute inset-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl pointer-events-none" />

      <div className="absolute bottom-5 right-5 flex flex-col items-end gap-3">
        {open && (
          <div
            className="w-[320px] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2"
            style={{ backgroundColor: panelBg }}
          >
            <div
              className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between"
              style={{ backgroundColor: headerBg, color: headerText }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                {chatTitle || 'DailySod Chat'}
              </div>
              <div className="text-[10px] uppercase tracking-wide opacity-70">Preview</div>
            </div>
            <div className="p-4 space-y-3 text-sm" style={{ backgroundColor: panelBg }}>
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-3 py-2 shadow-lg border" style={{ backgroundColor: botBubble, borderColor: botBubble }}>
                  Hi! I&apos;m the DailySod widget.
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] text-white rounded-lg px-3 py-2 shadow-lg border" style={{ backgroundColor: userBubble, borderColor: userBubble }}>
                  Ask me anything.
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-3 py-2 shadow-lg border" style={{ backgroundColor: botBubble, borderColor: botBubble }}>
                  I&apos;ll apply your saved settings automatically.
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className={bubbleClassName}
          style={bubbleStyle}
          aria-label="Toggle preview chat"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/25 overflow-hidden border-2 border-white/60">
            {image ? (
              <img src={image} alt="icon preview" className="w-full h-full object-cover" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
          </span>

          {shape === 'rounded' && <span className="text-sm font-bold whitespace-nowrap">{text || 'Ask me anything'}</span>}
        </button>
      </div>
    </div>
  );
}

export default function InstallPage() {
  const [clientId, setClientId] = useState<string>('LOADING...');
  const [copied, setCopied] = useState(false);

  // Draft settings (editable)
  const [bubbleShape, setBubbleShape] = useState<Shape>(DEFAULTS.bubbleShape);
  const [bubbleColor, setBubbleColor] = useState(DEFAULTS.bubbleColor);
  const [bubbleText, setBubbleText] = useState(DEFAULTS.bubbleText);
  const [bubbleImage, setBubbleImage] = useState<string | null>(DEFAULTS.bubbleImage);

  const [chatTitle, setChatTitle] = useState(DEFAULTS.chatTitle);
  const [chatHeaderBg, setChatHeaderBg] = useState(DEFAULTS.chatHeaderBg);
  const [chatHeaderText, setChatHeaderText] = useState(DEFAULTS.chatHeaderText);
  const [chatPanelBg, setChatPanelBg] = useState(DEFAULTS.chatPanelBg);
  const [chatUserBubble, setChatUserBubble] = useState(DEFAULTS.chatUserBubble);
  const [chatBotBubble, setChatBotBubble] = useState(DEFAULTS.chatBotBubble);

  // Baseline (last applied from DB)
  const [baseline, setBaseline] = useState<Required<WidgetSettings> | null>(null);

  // Apply state
  const [applying, setApplying] = useState(false);
  const [applyOk, setApplyOk] = useState(false);
  const [applyErr, setApplyErr] = useState<string>('');

  useEffect(() => {
    async function init() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return console.error(error);
      if (!user) return;

      const { data, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (clientErr) return console.error(clientErr);
      if (!data?.id) return;

      setClientId(data.id);

      // ✅ Load saved widget config and set baseline + draft
      try {
        const res = await fetch(`/api/widget/config?clientId=${encodeURIComponent(data.id)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Failed to load widget config');

        const loaded = normalizeSettings(json?.settings || {});
        setBaseline(loaded);

        // Populate draft with saved settings
        setBubbleShape(loaded.bubbleShape);
        setBubbleColor(loaded.bubbleColor);
        setBubbleText(loaded.bubbleText);
        setBubbleImage(loaded.bubbleImage);

        setChatTitle(loaded.chatTitle);
        setChatHeaderBg(loaded.chatHeaderBg);
        setChatHeaderText(loaded.chatHeaderText);
        setChatPanelBg(loaded.chatPanelBg);
        setChatUserBubble(loaded.chatUserBubble);
        setChatBotBubble(loaded.chatBotBubble);
      } catch (e) {
        // If fetch fails, baseline stays null; user can still apply defaults
        console.warn(e);
        setBaseline(normalizeSettings({}));
      }
    }

    init();
  }, []);

  // ✅ Minimal snippet only
  const snippet = useMemo(() => {
    return `<script src="https://daily-sod.vercel.app/widget.js" data-client-id="${clientId}"></script>`;
  }, [clientId]);

  const draftSettings = useMemo((): Required<WidgetSettings> => {
    return normalizeSettings({
      position: 'right',
      bubbleShape,
      bubbleColor,
      bubbleText,
      bubbleImage,
      chatTitle,
      chatHeaderBg,
      chatHeaderText,
      chatPanelBg,
      chatUserBubble,
      chatBotBubble,
    });
  }, [
    bubbleShape,
    bubbleColor,
    bubbleText,
    bubbleImage,
    chatTitle,
    chatHeaderBg,
    chatHeaderText,
    chatPanelBg,
    chatUserBubble,
    chatBotBubble,
  ]);

  // ✅ Dirty check: only enable Apply when draft differs from baseline
  const isDirty = useMemo(() => {
    if (!baseline) return false;
    return JSON.stringify(draftSettings) !== JSON.stringify(baseline);
  }, [draftSettings, baseline]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  async function applySettings() {
    setApplyErr('');
    setApplyOk(false);

    const cid = (clientId || '').trim();
    if (!cid || cid === 'LOADING...') {
      setApplyErr('Client ID not ready yet.');
      return;
    }

    try {
      setApplying(true);

      const res = await fetch('/api/widget/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: cid,
          settings: draftSettings,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Apply failed');

      // ✅ update baseline so button greys out again
      setBaseline(draftSettings);

      setApplyOk(true);
      setTimeout(() => setApplyOk(false), 2500);
    } catch (e: any) {
      console.error(e);
      setApplyErr(e?.message || 'Apply failed');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Install Widget</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Copy and paste the snippet below before your site&apos;s{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">&lt;/body&gt;</code>. Customisation is applied server-side after you click Apply.
        </p>
      </div>

      {/* Embed Code Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-500">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Embed Code</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">This stays minimal. Styling is pulled automatically.</p>
          </div>
        </div>

        <pre className="bg-slate-950 text-slate-100 p-6 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border border-slate-800">
          {snippet}
        </pre>

        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Client ID: <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{clientId}</code>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={copyToClipboard}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all ${
              copied ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
            }`}
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

          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Need help? Check our documentation or support.
          </div>
        </div>
      </div>

      {/* Customise Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-orange-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customise widget</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Edit your design here. Apply will be enabled only when you make changes.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setBubbleShape('rounded')}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                  bubbleShape === 'rounded'
                    ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Square className="w-4 h-4" />
                Rounded rectangle
              </button>
              <button
                onClick={() => setBubbleShape('circle')}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                  bubbleShape === 'circle'
                    ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Circle className="w-4 h-4" />
                Circular
              </button>
            </div>

            {bubbleShape === 'circle' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bubble colour (hex)</label>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: bubbleColor }} />
                    <input
                      type="text"
                      value={bubbleColor}
                      onChange={(e) => setBubbleColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                      placeholder="#0f172a"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Center image (png, jpg, gif)</label>
                  <div className="flex flex-wrap gap-3 items-center">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <Upload className="w-4 h-4" />
                      Upload
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setBubbleImage(typeof ev.target?.result === 'string' ? ev.target.result : null);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>

                    {bubbleImage ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 overflow-hidden">
                          <img src={bubbleImage} alt="icon preview" className="w-full h-full object-cover" />
                        </span>
                        <button
                          onClick={() => setBubbleImage(null)}
                          className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" /> Optional
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {bubbleShape === 'rounded' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bubble text</label>
                  <input
                    type="text"
                    value={bubbleText}
                    onChange={(e) => setBubbleText(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bubble colour (hex)</label>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: bubbleColor }} />
                    <input
                      type="text"
                      value={bubbleColor}
                      onChange={(e) => setBubbleColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Chat window styling</h3>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chat name</label>
                <input
                  type="text"
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Header background</label>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: chatHeaderBg }} />
                    <input
                      type="text"
                      value={chatHeaderBg}
                      onChange={(e) => setChatHeaderBg(e.target.value)}
                      className="flex-1 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Header text</label>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: chatHeaderText }} />
                    <input
                      type="text"
                      value={chatHeaderText}
                      onChange={(e) => setChatHeaderText(e.target.value)}
                      className="flex-1 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Panel background</label>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: chatPanelBg }} />
                    <input
                      type="text"
                      value={chatPanelBg}
                      onChange={(e) => setChatPanelBg(e.target.value)}
                      className="flex-1 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bot bubble</label>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: chatBotBubble }} />
                    <input
                      type="text"
                      value={chatBotBubble}
                      onChange={(e) => setChatBotBubble(e.target.value)}
                      className="flex-1 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">User bubble</label>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: chatUserBubble }} />
                  <input
                    type="text"
                    value={chatUserBubble}
                    onChange={(e) => setChatUserBubble(e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <WidgetPreview
              shape={bubbleShape}
              color={bubbleColor}
              text={bubbleText}
              image={bubbleImage}
              chatTitle={chatTitle}
              headerBg={chatHeaderBg}
              headerText={chatHeaderText}
              panelBg={chatPanelBg}
              userBubble={chatUserBubble}
              botBubble={chatBotBubble}
            />
          </div>
        </div>

        {/* ✅ Bottom-right Apply button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-sm">
            {applyOk && <span className="text-green-600 font-semibold">Applied. Live widget will update automatically.</span>}
            {!applyOk && applyErr && <span className="text-red-600 font-semibold">{applyErr}</span>}
            {!applyOk && !applyErr && (
              <span className="text-slate-500 dark:text-slate-400">
                {isDirty ? 'Unsaved changes.' : 'No changes to apply.'}
              </span>
            )}
          </div>

          <button
            onClick={applySettings}
            disabled={!isDirty || applying || clientId === 'LOADING...'}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
              !isDirty || applying || clientId === 'LOADING...'
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {applying ? 'Applying…' : 'Apply to Live Widget'}
          </button>
        </div>
      </div>
    </div>
  );
}
