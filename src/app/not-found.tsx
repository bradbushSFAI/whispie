import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-whispie-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 mb-6 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-whispie-primary text-background-dark font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
