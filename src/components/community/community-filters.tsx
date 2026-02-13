'use client'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'conflict', label: 'Conflict' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'other', label: 'Other' },
]

const SORTS = [
  { key: 'upvotes', label: 'Most Popular' },
  { key: 'use_count', label: 'Most Used' },
  { key: 'newest', label: 'Newest' },
]

type CommunityFiltersProps = {
  currentCategory: string
  currentSort: string
  onCategoryChange: (category: string) => void
  onSortChange: (sort: string) => void
}

export function CommunityFilters({
  currentCategory,
  currentSort,
  onCategoryChange,
  onSortChange,
}: CommunityFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center">
        {CATEGORIES.map(category => (
          <button
            key={category.key}
            onClick={() => onCategoryChange(category.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              currentCategory === category.key
                ? 'bg-whispie-primary text-background-dark'
                : 'bg-surface-dark text-slate-300 border border-white/10 hover:border-white/20'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Sort by:</span>
        <select
          value={currentSort}
          onChange={e => onSortChange(e.target.value)}
          className="text-xs rounded-md border border-white/10 bg-surface-dark px-2 py-1 text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {SORTS.map(sort => (
            <option key={sort.key} value={sort.key}>{sort.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
