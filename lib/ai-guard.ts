import { userRatelimit, orgRatelimit, globalRatelimit } from './ratelimit'

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfter: number }

export async function checkAIRateLimit(
  userId: string,
  orgId: string
): Promise<RateLimitResult> {
  const [u, o, g] = await Promise.all([
    userRatelimit.limit(userId),
    orgRatelimit.limit(orgId),
    globalRatelimit.limit('global'),
  ])

  if (!g.success)
    return {
      allowed: false,
      reason: 'Service temporarily unavailable. Try again tomorrow.',
      retryAfter: g.reset,
    }
  if (!o.success)
    return {
      allowed: false,
      reason: 'Your organisation has reached its hourly AI limit.',
      retryAfter: o.reset,
    }
  if (!u.success)
    return {
      allowed: false,
      reason: 'Too many requests. Please wait a moment.',
      retryAfter: u.reset,
    }
  return { allowed: true }
}
