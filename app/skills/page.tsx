export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgConfigSchema } from '@/types'
import SkillsPath from '@/components/SkillsPath'

export default async function SkillsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: org } = await supabase
    .from('organisations')
    .select('config')
    .eq('id', profile.organisation_id)
    .single()

  const config = OrgConfigSchema.parse(org?.config ?? {})

  return <SkillsPath orgType={config.orgType} userId={user.id} />
}
