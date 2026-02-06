import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-background-dark flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <h1 className="text-xl font-bold text-whispie-primary">Whispie</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-whispie-primary text-background-dark font-bold px-4 py-2 rounded-lg hover:brightness-110 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          Practice difficult workplace conversations
        </h2>
        <p className="text-lg text-slate-300 mb-8 max-w-md">
          Your flight simulator for tough talks. Roleplay with AI personas and get real-time feedback on your communication skills.
        </p>
        <Link
          href="/signup"
          className="bg-whispie-primary text-background-dark font-bold px-8 py-4 rounded-xl text-lg hover:brightness-110 transition-all shadow-lg shadow-whispie-primary/25"
        >
          Start Practicing Free
        </Link>
        <p className="text-sm text-slate-400 mt-4">
          3 free scenarios per month. No credit card required.
        </p>
      </div>

      {/* Features */}
      <div className="px-4 py-12 max-w-4xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-surface-dark rounded-2xl p-6 border border-white/5">
            <div className="w-12 h-12 bg-whispie-primary/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-whispie-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-2">Realistic Scenarios</h3>
            <p className="text-slate-300 text-sm">
              Practice salary negotiations, giving feedback, handling conflict, and more.
            </p>
          </div>
          <div className="bg-surface-dark rounded-2xl p-6 border border-white/5">
            <div className="w-12 h-12 bg-whispie-primary/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-whispie-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-2">Instant Feedback</h3>
            <p className="text-slate-300 text-sm">
              Get scored on clarity, empathy, assertiveness, and professionalism.
            </p>
          </div>
          <div className="bg-surface-dark rounded-2xl p-6 border border-white/5">
            <div className="w-12 h-12 bg-whispie-primary/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-whispie-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-2">AI-Powered</h3>
            <p className="text-slate-300 text-sm">
              Challenging AI personas that adapt to your responses.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-slate-400 text-sm">
        <p>&copy; 2024 Whispie. All rights reserved.</p>
      </footer>
    </main>
  )
}
