export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/AppNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role, display_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: org } = await supabase
    .from('organisations')
    .select('name, config')
    .eq('id', profile.organisation_id)
    .single()

  return (
    <div className="flex h-screen flex-col">
      <AppNav
        userName={profile.display_name ?? user.email ?? 'User'}
        orgName={org?.name ?? 'Organisation'}
        role={profile.role}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
