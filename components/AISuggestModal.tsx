'use client'

import { useState } from 'react'
import { X, Sparkles, CheckCircle } from 'lucide-react'
import type { AISuggestions } from '@/types'

interface Props {
  dimensionName: string
  horizonLabel: string
  onAccept: (suggestions: { title: string; description: string }[]) => void
  onClose: () => void
}

export default function AISuggestModal({ dimensionName, horizonLabel, onAccept, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestions['suggestions']>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())

  async function fetchSuggestions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimensionName, horizonLabel }),
      })
      if (res.status === 429) {
        const data = await res.json()
        setError(data.error ?? 'Rate limit reached.')
        return
      }
      if (!res.ok) throw new Error('Request failed')
      const data: AISuggestions = await res.json()
      setSuggestions(data.suggestions)
      setSelected(new Set(data.suggestions.map((_, i) => i)))
    } catch {
      setError('Could not reach AI service. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900">AI Suggestions</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          For <strong>{dimensionName}</strong> / <strong>{horizonLabel}</strong>
        </p>

        {suggestions.length === 0 && !loading && !error && (
          <button
            onClick={fetchSuggestions}
            className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Generate suggestions
          </button>
        )}

        {loading && (
          <div className="text-center py-8 text-sm text-gray-500">Thinking…</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {suggestions.length > 0 && (
          <>
            <div className="space-y-3 mb-5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selected.has(i)
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        selected.has(i) ? 'text-purple-600' : 'text-gray-300'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAccept(suggestions.filter((_, i) => selected.has(i)))}
                disabled={selected.size === 0}
                className="flex-1 rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Add {selected.size} {selected.size === 1 ? 'activity' : 'activities'}
              </button>
              <button
                onClick={fetchSuggestions}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
