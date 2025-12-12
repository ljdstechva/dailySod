export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold">
            DailySod
          </a>
          <div className="text-sm text-slate-600">App</div>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4">
            <nav className="space-y-1 text-sm">
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/dashboard">
                Dashboard
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/chatbot">
                Chatbot
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/knowledge">
                Knowledge
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/install">
                Install widget
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/integrations">
                Integrations
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/app/account">
                Account
              </a>
            </nav>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
