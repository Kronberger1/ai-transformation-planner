// Run with: npx tsx scripts/seed.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '../lib/supabase/admin'

const MARKETING_ORG_ID = '00000000-0000-0000-0000-000000000001'
const VOLUNTEER_ORG_ID = '00000000-0000-0000-0000-000000000002'

const dimensions = [
  { name: 'Culture & Organisation', color: '#7F77DD', sort_order: 0 },
  { name: 'Environment/Customers', color: '#D85A30', sort_order: 1 },
  { name: 'Operations', color: '#BA7517', sort_order: 2 },
  { name: 'Data & Technology', color: '#1D9E75', sort_order: 3 },
]

const horizons = [
  { label: 'Q1', horizon_type: 'short' as const, sort_order: 0 },
  { label: 'Q2', horizon_type: 'short' as const, sort_order: 1 },
  { label: 'Q3', horizon_type: 'short' as const, sort_order: 2 },
  { label: 'Q4', horizon_type: 'short' as const, sort_order: 3 },
  { label: '2027', horizon_type: 'mid' as const, sort_order: 4 },
  { label: 'Desired State', horizon_type: 'long' as const, sort_order: 5 },
]

async function seed() {
  const supabase = createAdminClient()

  const { error: orgError } = await supabase.from('organisations').upsert(
    [
      {
        id: MARKETING_ORG_ID,
        name: 'Marketing Team',
        slug: 'marketing-team',
        config: { accentColor: '#378ADD', orgType: 'marketing', logoUrl: null },
      },
      {
        id: VOLUNTEER_ORG_ID,
        name: 'Volunteer Organisation',
        slug: 'volunteer-org',
        config: { accentColor: '#1D9E75', orgType: 'volunteer', logoUrl: null },
      },
    ],
    { onConflict: 'slug' }
  )

  if (orgError) {
    console.error('Organisations upsert failed:', orgError.message)
    process.exit(1)
  }
  console.log('✓ Organisations seeded')

  for (const orgId of [MARKETING_ORG_ID, VOLUNTEER_ORG_ID]) {
    const { error: dimError } = await supabase.from('dimensions').upsert(
      dimensions.map((d) => ({ ...d, organisation_id: orgId })),
      { onConflict: 'organisation_id,sort_order' }
    )
    if (dimError) {
      console.error(`Dimensions upsert failed for org ${orgId}:`, dimError.message)
      process.exit(1)
    }

    const { error: horizonError } = await supabase.from('time_horizons').upsert(
      horizons.map((h) => ({ ...h, organisation_id: orgId })),
      { onConflict: 'organisation_id,sort_order' }
    )
    if (horizonError) {
      console.error(`Horizons upsert failed for org ${orgId}:`, horizonError.message)
      process.exit(1)
    }
  }

  console.log('✓ Dimensions and time horizons seeded')
  console.log('Seed complete.')
}

seed().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
