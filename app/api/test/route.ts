import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('organisations').select('name')
    return NextResponse.json({
      status: 'connected',
      organisations: data,
      error: error?.message ?? null
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'failed',
      error: e.message
    })
  }
}
