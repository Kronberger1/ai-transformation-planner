import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function createLimiters() {
  const redis = Redis.fromEnv()
  return {
    userRatelimit: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'rl:user',
      analytics: true,
    }),
    orgRatelimit: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '1 h'),
      prefix: 'rl:org',
      analytics: true,
    }),
    globalRatelimit: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(500, '1 d'),
      prefix: 'rl:global',
      analytics: true,
    }),
  }
}

let _limiters: ReturnType<typeof createLimiters> | null = null

function getLimiters() {
  if (!_limiters) _limiters = createLimiters()
  return _limiters
}

export const userRatelimit = {
  limit: (id: string) => getLimiters().userRatelimit.limit(id),
}

export const orgRatelimit = {
  limit: (id: string) => getLimiters().orgRatelimit.limit(id),
}

export const globalRatelimit = {
  limit: (id: string) => getLimiters().globalRatelimit.limit(id),
}
