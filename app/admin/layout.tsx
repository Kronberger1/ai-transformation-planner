export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/AppNav'

export default async function AdminLayout({
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

  if (!profile || !['org_admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: org } = await supabase
    .from('organisations')
    .select('name')
    .eq('id', profile.organisation_id)
    .single()

  return (
    <div className="flex h-screen flex-col">
      <AppNav
        userName={profile.display_name ?? user.email ?? 'User'}
        orgName={org?.name ?? 'Organisation'}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
