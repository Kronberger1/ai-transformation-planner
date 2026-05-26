'use client'

import { useDraggable } from '@dnd-kit/core'
import type { Activity, ActivityStatus } from '@/types'
import { Sparkles } from 'lucide-react'

interface Props {
  activity: Activity
  statusColors: Record<ActivityStatus, string>
  onClick: () => void
  isDragging?: boolean
}

export default function ActivityCard({ activity, statusColors, onClick, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: activity.id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`
        cursor-grab rounded border px-2 py-1.5 text-xs leading-tight select-none
        ${statusColors[activity.status]}
        ${isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-sm'}
        transition-shadow
      `}
    >
      <div className="flex items-start gap-1">
        <span className="flex-1 font-medium line-clamp-2">{activity.title}</span>
        {activity.ai_suggested && (
          <Sparkles className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
        )}
      </div>
      {activity.owner_name && (
        <div className="mt-0.5 opacity-70">{activity.owner_name}</div>
      )}
      {activity.progress_pct > 0 && (
        <div className="mt-1 h-1 rounded-full bg-black/10">
          <div
            className="h-1 rounded-full bg-current opacity-50"
            style={{ width: `${activity.progress_pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
