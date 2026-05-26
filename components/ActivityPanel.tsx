'use client'

import { useState, useEffect } from 'react'
import type { Activity, ActivityStatus } from '@/types'
import { X, Trash2 } from 'lucide-react'

const STATUSES: { value: ActivityStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
]

interface Props {
  activity: Activity | null
  onSave: (data: Partial<Activity>) => void
  onDelete?: () => void
  onClose: () => void
}

export default function ActivityPanel({ activity, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(activity?.title ?? '')
  const [description, setDescription] = useState(activity?.description ?? '')
  const [owner, setOwner] = useState(activity?.owner_name ?? '')
  const [status, setStatus] = useState<ActivityStatus>(activity?.status ?? 'not_started')
  const [progress, setProgress] = useState(activity?.progress_pct ?? 0)
  const [dueDate, setDueDate] = useState(activity?.due_date ?? '')

  useEffect(() => {
    setTitle(activity?.title ?? '')
    setDescription(activity?.description ?? '')
    setOwner(activity?.owner_name ?? '')
    setStatus(activity?.status ?? 'not_started')
    setProgress(activity?.progress_pct ?? 0)
    setDueDate(activity?.due_date ?? '')
  }, [activity])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...(activity ?? {}),
      title,
      description: description || null,
      owner_name: owner || null,
      status,
      progress_pct: progress,
      due_date: dueDate || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {activity ? 'Edit Activity' : 'New Activity'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ActivityStatus)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {activity ? 'Save changes' : 'Create'}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border border-red-200 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
