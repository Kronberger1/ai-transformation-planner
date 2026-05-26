'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { ErrorBoundary } from 'react-error-boundary'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Dimension, TimeHorizon, ActivityStatus } from '@/types'
import ActivityCard from './ActivityCard'
import ActivityPanel from './ActivityPanel'
import AISuggestModal from './AISuggestModal'
import CanvasCell from './CanvasCell'
import { Plus } from 'lucide-react'

const STATUS_COLORS: Record<ActivityStatus, string> = {
  not_started: 'bg-gray-100 border-gray-300 text-gray-700',
  in_progress: 'bg-blue-50 border-blue-300 text-blue-700',
  on_track: 'bg-green-50 border-green-300 text-green-700',
  at_risk: 'bg-amber-50 border-amber-300 text-amber-700',
  blocked: 'bg-red-50 border-red-300 text-red-700',
  complete: 'bg-teal-50 border-teal-300 text-teal-700',
}

interface Props {
  initialDimensions: Dimension[]
  initialTimeHorizons: TimeHorizon[]
  initialActivities: Activity[]
  organisationId: string
  userId: string
}

export default function TransformationCanvas({
  initialDimensions,
  initialTimeHorizons,
  initialActivities,
  organisationId,
  userId,
}: Props) {
  const supabase = createClient()
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [dimensions] = useState<Dimension[]>(initialDimensions)
  const [timeHorizons] = useState<TimeHorizon[]>(initialTimeHorizons)

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [addingToCell, setAddingToCell] = useState<{ dimId: string; horizId: string } | null>(null)
  const [suggestCell, setSuggestCell] = useState<{
    dimId: string
    horizId: string
    dimName: string
    horizLabel: string
  } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const orgDimensionIds = useMemo(() => new Set(dimensions.map((d) => d.id)), [dimensions])
  const orgHorizonIds = useMemo(() => new Set(timeHorizons.map((h) => h.id)), [timeHorizons])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activityId = active.id as string
    const [targetDimId, targetHorizonId] = (over.id as string).split('__')

    // Step 1 — client-side org validation (fast path)
    const dimBelongsToOrg = orgDimensionIds.has(targetDimId)
    const horizonBelongsToOrg = orgHorizonIds.has(targetHorizonId)
    if (!dimBelongsToOrg || !horizonBelongsToOrg) return

    // Step 2 — optimistic UI update
    const previousActivities = structuredClone(activities)
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? { ...a, dimension_id: targetDimId, time_horizon_id: targetHorizonId }
          : a
      )
    )

    // Step 3 — server mutation (RLS validates again server-side)
    const { error } = await supabase
      .from('activities')
      .update({
        dimension_id: targetDimId,
        time_horizon_id: targetHorizonId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activityId)

    // Step 4 — rollback on failure
    if (error) {
      setActivities(previousActivities)
      showToast('Could not move activity. Please try again.')
    }
  }

  async function handleCreateActivity(data: Partial<Activity>) {
    if (!addingToCell) return
    const { data: created, error } = await supabase
      .from('activities')
      .insert({
        organisation_id: organisationId,
        dimension_id: addingToCell.dimId,
        time_horizon_id: addingToCell.horizId,
        title: data.title ?? 'New Activity',
        description: data.description ?? null,
        owner_name: data.owner_name ?? null,
        status: data.status ?? 'not_started',
        progress_pct: data.progress_pct ?? 0,
        due_date: data.due_date ?? null,
        created_by: userId,
        ai_suggested: data.ai_suggested ?? false,
      })
      .select()
      .single()

    if (!error && created) {
      setActivities((prev) => [...prev, created as Activity])
    }
    setAddingToCell(null)
  }

  async function handleUpdateActivity(updated: Partial<Activity>) {
    if (!updated.id) return
    const { error } = await supabase
      .from('activities')
      .update({
        title: updated.title,
        description: updated.description,
        owner_name: updated.owner_name,
        status: updated.status,
        progress_pct: updated.progress_pct,
        due_date: updated.due_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updated.id)

    if (!error) {
      setActivities((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
      )
    }
    setSelectedActivity(null)
  }

  async function handleDeleteActivity(id: string | undefined) {
    if (!id) return
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (!error) {
      setActivities((prev) => prev.filter((a) => a.id !== id))
    }
    setSelectedActivity(null)
  }

  function handleAISuggestions(suggestions: { title: string; description: string }[]) {
    if (!suggestCell) return
    suggestions.forEach((s) => {
      handleCreateActivity({
        ...s,
        dimension_id: suggestCell.dimId,
        time_horizon_id: suggestCell.horizId,
        ai_suggested: true,
      })
    })
    setSuggestCell(null)
  }

  // Stats
  const total = activities.length
  const complete = activities.filter((a) => a.status === 'complete').length
  const pctComplete = total > 0 ? Math.round((complete / total) * 100) : 0
  const byStatus = activities.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const activeActivity = activeId ? activities.find((a) => a.id === activeId) : null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="flex items-center gap-6 border-b border-gray-200 bg-white px-4 py-2 text-sm">
        <span className="font-medium text-gray-700">{total} activities</span>
        <span className="text-gray-500">{pctComplete}% complete</span>
        {Object.entries(byStatus).map(([status, count]) => (
          <span key={status} className="text-gray-500">
            {count} {status.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Canvas grid */}
      <div className="flex-1 overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div
            className="inline-grid gap-px bg-gray-200 rounded-lg overflow-hidden shadow"
            style={{
              gridTemplateColumns: `160px repeat(${timeHorizons.length}, minmax(180px, 1fr))`,
              minWidth: 'max-content',
            }}
          >
            {/* Header row */}
            <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide" />
            {timeHorizons.map((h) => (
              <div
                key={h.id}
                className={`bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center ${
                  h.horizon_type === 'long'
                    ? 'bg-purple-50 text-purple-700'
                    : h.horizon_type === 'mid'
                    ? 'bg-indigo-50 text-indigo-700'
                    : ''
                }`}
              >
                {h.label}
              </div>
            ))}

            {/* Data rows */}
            {dimensions.map((dim) => (
              <>
                <div
                  key={`label-${dim.id}`}
                  className="bg-white px-3 py-3 text-xs font-semibold leading-tight"
                  style={{ borderLeft: `4px solid ${dim.color ?? '#94a3b8'}` }}
                >
                  {dim.name}
                </div>
                {timeHorizons.map((h) => {
                  const cellId = `${dim.id}__${h.id}`
                  const cellActivities = activities.filter(
                    (a) => a.dimension_id === dim.id && a.time_horizon_id === h.id
                  )
                  return (
                    <CanvasCell key={cellId} id={cellId}>
                      <div className="flex flex-col gap-1.5 min-h-[100px] p-2">
                        {cellActivities.map((activity) => (
                          <ErrorBoundary
                            key={activity.id}
                            fallback={
                              <div className="text-xs text-red-500 p-1">Error loading card</div>
                            }
                          >
                            <ActivityCard
                              activity={activity}
                              statusColors={STATUS_COLORS}
                              onClick={() => setSelectedActivity(activity)}
                            />
                          </ErrorBoundary>
                        ))}
                        <div className="flex gap-1 mt-auto pt-1">
                          <button
                            onClick={() => setAddingToCell({ dimId: dim.id, horizId: h.id })}
                            className="flex items-center gap-0.5 rounded text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                          <button
                            onClick={() =>
                              setSuggestCell({
                                dimId: dim.id,
                                horizId: h.id,
                                dimName: dim.name,
                                horizLabel: h.label,
                              })
                            }
                            className="rounded text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50 px-1.5 py-0.5"
                          >
                            AI suggest
                          </button>
                        </div>
                      </div>
                    </CanvasCell>
                  )
                })}
              </>
            ))}
          </div>

          <DragOverlay>
            {activeActivity ? (
              <ActivityCard
                activity={activeActivity}
                statusColors={STATUS_COLORS}
                onClick={() => {}}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Activity panel */}
      {(selectedActivity || addingToCell) && (
        <ActivityPanel
          activity={selectedActivity}
          onSave={selectedActivity ? handleUpdateActivity : handleCreateActivity}
          onDelete={selectedActivity ? () => handleDeleteActivity(selectedActivity?.id) : undefined}
          onClose={() => {
            setSelectedActivity(null)
            setAddingToCell(null)
          }}
        />
      )}

      {/* AI suggest modal */}
      {suggestCell && (
        <AISuggestModal
          dimensionName={suggestCell.dimName}
          horizonLabel={suggestCell.horizLabel}
          onAccept={handleAISuggestions}
          onClose={() => setSuggestCell(null)}
        />
      )}
    </div>
  )
}
