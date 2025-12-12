export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <a href="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back
        </a>

        <h1 className="mt-6 text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Auth comes next. For now, this is the skeleton.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 p-6">
          <div>
            <label className="text-sm font-medium">Business name</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder="Example Dental Clinic"
              disabled
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder="you@company.com"
              disabled
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder="Create a password"
              disabled
            />
          </div>

          <button
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white opacity-60"
            disabled
          >
            Create account
          </button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a className="font-medium text-slate-900 hover:underline" href="/login">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
