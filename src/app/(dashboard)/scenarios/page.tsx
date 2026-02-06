import { createClient } from '@/lib/supabase/server'
import { ScenarioCard } from '@/components/scenarios/scenario-card'
import { CategoryFilter } from './category-filter'

export default async function ScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  // Fetch scenarios with their personas
  let query = supabase
    .from('scenarios')
    .select(`
      *,
      persona:personas(*)
    `)
    .eq('is_active', true)
    .order('difficulty', { ascending: true })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: scenarios, error } = await query

  if (error) {
    console.error('Error fetching scenarios:', error)
  }

  // Get unique categories for filter
  const categories = ['all', 'feedback', 'negotiation', 'conflict']

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <a href="/dashboard" className="flex items-center justify-center p-2 -ml-2 rounded-full text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Scenario Library
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Category Filter */}
        <CategoryFilter categories={categories} currentCategory={category || 'all'} />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-5 pb-24">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900 dark:text-white text-lg font-bold">
            {category && category !== 'all' ? `${category.charAt(0).toUpperCase() + category.slice(1)} Scenarios` : 'All Scenarios'}
          </h2>
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {scenarios?.length || 0} scenarios
          </span>
        </div>

        {/* Scenario Cards */}
        {scenarios && scenarios.length > 0 ? (
          <div className="flex flex-col gap-4">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No scenarios found</p>
            <p className="text-sm text-gray-400 dark:text-gray-300 mt-1">
              Try selecting a different category
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
