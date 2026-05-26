/**
 * Run database migrations against Supabase.
 *
 * Requires DATABASE_URL in .env.local:
 *   postgresql://postgres:[DB_PASSWORD]@db.hcmjwebksozrcebmxiax.supabase.co:5432/postgres
 *
 * Find your DB password in: Supabase dashboard → Project Settings → Database → Connection String
 *
 * Run with: npx tsx scripts/migrate.ts
 */
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('\n❌ DATABASE_URL is not set in .env.local')
  console.error(
    '\nFind it in: Supabase Dashboard → Project Settings → Database → Connection String'
  )
  console.error('Then add to .env.local:')
  console.error(
    'DATABASE_URL=postgresql://postgres:[PASSWORD]@db.hcmjwebksozrcebmxiax.supabase.co:5432/postgres\n'
  )
  process.exit(1)
}

const MIGRATIONS = [
  resolve(process.cwd(), 'supabase/migrations/001_schema.sql'),
  resolve(process.cwd(), 'supabase/migrations/002_rls_policies.sql'),
]

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('✓ Connected to database')

  for (const file of MIGRATIONS) {
    const sql = readFileSync(file, 'utf-8')
    const name = file.split(/[\\/]/).pop()
    console.log(`\nRunning ${name}…`)
    try {
      await client.query(sql)
      console.log(`✓ ${name} applied`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // Ignore "already exists" errors so migrations are idempotent
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate') ||
        msg.includes('already exists')
      ) {
        console.log(`  ↳ skipped (already applied)`)
      } else {
        console.error(`❌ Error in ${name}:`, msg)
        await client.end()
        process.exit(1)
      }
    }
  }

  await client.end()
  console.log('\n✅ All migrations complete.')
}

migrate().catch((err) => {
  console.error('Migration error:', err)
  process.exit(1)
})
