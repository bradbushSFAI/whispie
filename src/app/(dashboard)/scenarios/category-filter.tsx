'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function CategoryFilter({
  categories,
  currentCategory,
}: {
  categories: string[]
  currentCategory: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleCategoryChange(category: string) {
    const params = new URLSearchParams(searchParams)
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    router.push(`/scenarios?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
      {categories.map((cat) => {
        const isActive = cat === currentCategory
        return (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`flex shrink-0 items-center justify-center gap-x-1.5 rounded-full py-1.5 px-4 transition-colors ${
              isActive
                ? 'bg-whispie-primary shadow-sm shadow-whispie-primary/20'
                : 'bg-white dark:bg-subtle-dark ring-1 ring-gray-200 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <p
              className={`text-sm font-medium capitalize ${
                isActive
                  ? 'text-black font-bold'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat}
            </p>
          </button>
        )
      })}
    </div>
  )
}
