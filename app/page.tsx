import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="text-center">
        <div className="space-x-4">
          <Link
            href="/login"
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-semibold transition inline-block"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition inline-block"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}


