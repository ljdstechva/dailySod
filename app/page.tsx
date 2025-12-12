export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-xl font-semibold">DailySod</div>
          <div className="flex gap-3">
            <a
              href="/login"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Log in
            </a>
            <a
              href="/register"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Get started
            </a>
          </div>
        </header>

        <section className="py-20">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Done-for-you AI chat, funnels, and dashboards—built for businesses.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            DailySod helps turn website visitors into leads with an installable chat widget,
            a proven funnel setup, and a simple dashboard to track results.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create an account
            </a>
            <a
              href="/app/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium hover:bg-slate-50"
            >
              View demo dashboard
            </a>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { title: "AI Chat Widget", desc: "Copy-paste install. Capture leads 24/7." },
              { title: "DFY Funnel Template", desc: "A proven flow you can deploy fast." },
              { title: "Simple Dashboard", desc: "See leads and activity in one place." },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 p-6">
                <div className="text-base font-semibold">{card.title}</div>
                <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-200 py-8 text-sm text-slate-500">
          © {new Date().getFullYear()} DailySod
        </footer>
      </div>
    </main>
  );
}
