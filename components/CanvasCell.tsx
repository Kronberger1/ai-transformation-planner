'use client'

import { useDroppable } from '@dnd-kit/core'

interface Props {
  id: string
  children: React.ReactNode
}

export default function CanvasCell({ id, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white transition-colors ${isOver ? 'bg-blue-50' : ''}`}
    >
      {children}
    </div>
  )
}
