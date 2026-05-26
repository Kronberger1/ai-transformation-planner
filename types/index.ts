import { z } from 'zod'

export const OrgConfigSchema = z.object({
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).default('#378ADD'),
  logoUrl: z.string().url().nullable().default(null),
  orgType: z.enum(['marketing', 'volunteer', 'enterprise']).default('marketing'),
  customDimensions: z.array(z.string()).optional(),
  customHorizons: z.array(z.string()).optional(),
})

export type OrgConfig = z.infer<typeof OrgConfigSchema>

export type Organisation = {
  id: string
  name: string
  slug: string
  created_at: string
  config: OrgConfig
}

export type UserRole = 'super_admin' | 'org_admin' | 'member'

export type User = {
  id: string
  organisation_id: string
  role: UserRole
  display_name: string | null
  created_at: string
}

export type Dimension = {
  id: string
  organisation_id: string
  name: string
  color: string | null
  sort_order: number
}

export type HorizonType = 'short' | 'mid' | 'long'

export type TimeHorizon = {
  id: string
  organisation_id: string
  label: string
  horizon_type: HorizonType
  sort_order: number
}

export type ActivityStatus =
  | 'not_started'
  | 'in_progress'
  | 'on_track'
  | 'at_risk'
  | 'blocked'
  | 'complete'

export type Activity = {
  id: string
  organisation_id: string
  dimension_id: string
  time_horizon_id: string
  title: string
  description: string | null
  owner_name: string | null
  status: ActivityStatus
  progress_pct: number
  due_date: string | null
  ai_suggested: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type AuditLog = {
  id: string
  organisation_id: string
  user_id: string | null
  table_name: string | null
  record_id: string | null
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

export const AIResponseSchema = z.object({
  score: z.number().min(1).max(5),
  feedback: z.string().max(500),
  risks: z.array(z.string()).max(5),
})

export type AIResponse = z.infer<typeof AIResponseSchema>

export const AISuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().max(100),
      description: z.string().max(300),
    })
  ).max(3),
})

export type AISuggestions = z.infer<typeof AISuggestionsSchema>
