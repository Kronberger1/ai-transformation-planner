export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransformationCanvas from '@/components/TransformationCanvas'
import type { Activity, Dimension, TimeHorizon } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { organisation_id } = profile

  const [{ data: dimensions }, { data: timeHorizons }, { data: activities }] =
    await Promise.all([
      supabase
        .from('dimensions')
        .select('*')
        .eq('organisation_id', organisation_id)
        .order('sort_order'),
      supabase
        .from('time_horizons')
        .select('*')
        .eq('organisation_id', organisation_id)
        .order('sort_order'),
      supabase
        .from('activities')
        .select('*')
        .eq('organisation_id', organisation_id)
        .order('created_at'),
    ])

  return (
    <TransformationCanvas
      initialDimensions={(dimensions as Dimension[]) ?? []}
      initialTimeHorizons={(timeHorizons as TimeHorizon[]) ?? []}
      initialActivities={(activities as Activity[]) ?? []}
      organisationId={organisation_id}
      userId={user.id}
    />
  )
}
