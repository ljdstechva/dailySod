export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Skeleton view. Next step: Supabase auth + real data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Leads (7d)", value: "0" },
          { label: "Conversations (7d)", value: "0" },
          { label: "Booked (7d)", value: "0" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 p-5">
            <div className="text-sm text-slate-600">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="text-sm font-semibold">Recent leads</div>
        <div className="mt-3 text-sm text-slate-600">No leads yet.</div>
      </div>
    </div>
  );
}
