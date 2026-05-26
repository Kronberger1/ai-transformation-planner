export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
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

  if (!profile || !['org_admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: orgUsers } = await supabase
    .from('users')
    .select('id, display_name, role, created_at')
    .eq('organisation_id', profile.organisation_id)
    .order('created_at')

  const { data: org } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', profile.organisation_id)
    .single()

  let allOrgs = null
  if (profile.role === 'super_admin') {
    const { data } = await supabase
      .from('organisations')
      .select('id, name, slug, created_at')
      .order('created_at')
    allOrgs = data
  }

  return (
    <AdminPanel
      orgUsers={orgUsers ?? []}
      currentOrg={org}
      allOrgs={allOrgs}
      currentUserId={user.id}
      role={profile.role}
      organisationId={profile.organisation_id}
    />
  )
}
