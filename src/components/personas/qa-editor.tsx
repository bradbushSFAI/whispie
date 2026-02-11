'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CustomQA } from '@/types/database'

const CATEGORIES: { value: CustomQA['category']; label: string }[] = [
  { value: 'redirect', label: 'Redirect' },
  { value: 'escalate', label: 'Escalate' },
  { value: 'boundary', label: 'Boundary' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'custom', label: 'Custom' },
]

type QAEditorProps = {
  value: CustomQA[]
  onChange: (qa: CustomQA[]) => void
  readOnly?: boolean
}

export function QAEditor({ value, onChange, readOnly = false }: QAEditorProps) {
  const addRule = () => {
    onChange([...value, { trigger: '', response: '', category: 'custom' }])
  }

  const removeRule = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const updateRule = (index: number, field: keyof CustomQA, fieldValue: string) => {
    const updated = value.map((qa, i) =>
      i === index ? { ...qa, [field]: fieldValue } : qa
    )
    onChange(updated)
  }

  if (readOnly && value.length === 0) {
    return (
      <p className="text-sm text-slate-400">No behavioral rules defined.</p>
    )
  }

  return (
    <div className="space-y-4">
      {value.map((qa, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Rule {index + 1}
            </span>
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRule(index)}
                className="text-slate-400 hover:text-red-400 h-7 px-2"
              >
                Remove
              </Button>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              When the user...
            </label>
            <Input
              value={qa.trigger}
              onChange={(e) => updateRule(index, 'trigger', e.target.value)}
              placeholder="e.g. stalls or goes silent"
              disabled={readOnly}
              className="bg-slate-900 border-slate-600 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Respond by...
            </label>
            <Textarea
              value={qa.response}
              onChange={(e) => updateRule(index, 'response', e.target.value)}
              placeholder='e.g. Tap your pen impatiently and say "I don&#39;t have all day"'
              disabled={readOnly}
              rows={2}
              className="bg-slate-900 border-slate-600 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Category
            </label>
            <select
              value={qa.category}
              onChange={(e) => updateRule(index, 'category', e.target.value)}
              disabled={readOnly}
              className="flex h-9 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-sm text-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={addRule}
          className="w-full border-dashed border-slate-600 text-slate-300 hover:text-slate-100"
        >
          + Add Behavioral Rule
        </Button>
      )}
    </div>
  )
}
