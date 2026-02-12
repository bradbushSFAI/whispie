import { createClient } from '@/lib/supabase/server'
import { ScenarioCard } from '@/components/scenarios/scenario-card'
import { CategoryFilter } from './category-filter'
import { NavHeader } from '@/components/layout/nav-header'

export default async function ScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

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

  // Fetch completed scenario IDs for current user
  let completedScenarioIds = new Set<string>()
  if (user) {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('scenario_id')
      .eq('user_id', user.id)
      .not('scenario_id', 'is', null)

    if (conversations) {
      completedScenarioIds = new Set(
        conversations
          .map(c => c.scenario_id)
          .filter((id): id is string => id !== null)
      )
    }
  }

  // Get unique categories for filter
  const categories = ['all', 'feedback', 'negotiation', 'conflict']

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <NavHeader displayName={user?.email?.split('@')[0] || 'User'} />

      {/* Category Filter */}
      <div className="sticky top-[57px] z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <CategoryFilter categories={categories} currentCategory={category || 'all'} />
      </div>

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
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isCompleted={completedScenarioIds.has(scenario.id)}
              />
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
