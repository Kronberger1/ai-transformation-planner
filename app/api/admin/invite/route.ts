import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role')
    .eq('id', user.id)
    .single()
  if (!profile)
    return Response.json({ error: 'Profile not found' }, { status: 403 })

  if (!['org_admin', 'super_admin'].includes(profile.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, role: inviteRole } = body

  if (typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  const allowedRoles = ['member', 'org_admin']
  if (profile.role !== 'super_admin' && !allowedRoles.includes(inviteRole)) {
    return Response.json({ error: 'Cannot assign this role' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      organisation_id: profile.organisation_id,
      role: inviteRole ?? 'member',
      display_name: email,
    },
  })

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ success: true })
}
