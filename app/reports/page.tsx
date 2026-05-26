export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsDashboard from '@/components/ReportsDashboard'
import type { Activity, Dimension, TimeHorizon } from '@/types'

export default async function ReportsPage() {
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

  const [{ data: dimensions }, { data: timeHorizons }, { data: activities }] =
    await Promise.all([
      supabase.from('dimensions').select('*').eq('organisation_id', profile.organisation_id).order('sort_order'),
      supabase.from('time_horizons').select('*').eq('organisation_id', profile.organisation_id).order('sort_order'),
      supabase.from('activities').select('*').eq('organisation_id', profile.organisation_id),
    ])

  return (
    <ReportsDashboard
      dimensions={(dimensions as Dimension[]) ?? []}
      timeHorizons={(timeHorizons as TimeHorizon[]) ?? []}
      activities={(activities as Activity[]) ?? []}
    />
  )
}
