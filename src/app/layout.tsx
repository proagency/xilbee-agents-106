import "./globals.css"
import Link from "next/link"
import { getSession } from "@lib/auth"

export const metadata = {
  title: "Xilbee AI",
  description: "Admin portal",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <html lang="en">
      <body>
        <nav className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={session ? "/dashboard" : "/login"} className="font-semibold">XILBEE AI</Link>
              {session && (
                <div className="flex items-center gap-3 text-sm">
                  <Link href="/dashboard" className="btn">Dashboard</Link>
                  <Link href="/clients" className="btn">Clients</Link>
                  <Link href="/billing" className="btn">Billing</Link>
                </div>
              )}
            </div>
            {session && (
              <form action="/api/auth/logout" method="POST">
                <button className="btn">Logout</button>
              </form>
            )}
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
