export default function LoginPage({ searchParams }: { searchParams: Record<string,string|undefined> }) {
  const error = searchParams?.error
  const expired = searchParams?.expired
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Admin Login</h1>
      {(error || expired) && (
        <div className="card border-red-300 bg-red-50 text-red-700 mb-4">
          {expired ? "Session expired, please login again." : "Invalid email or password."}
        </div>
      )}
      <form className="card space-y-3" method="POST" action="/api/auth/login">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input name="email" type="email" className="input" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input name="password" type="password" className="input" required />
        </div>

        {/* NEW: preserve the destination */}
        <input type="hidden" name="next" value={searchParams?.next || "/dashboard"} />

        <button className="btn btn-primary">Login</button>
      </form>
    </div>
  )
}
