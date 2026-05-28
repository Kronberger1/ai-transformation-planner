import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('Middleware running for path:', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(cookie => {
            if (cookie.value.startsWith('base64-')) {
              return {
                ...cookie,
                value: Buffer.from(cookie.value.slice(7), 'base64').toString('utf-8')
              }
            }
            return cookie
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('getUser result:', user?.email ?? 'no user', 'cookies:', request.cookies.getAll().filter(c => c.name.includes('sb')).map(c => c.name))

  console.log('User found:', user?.email ?? 'none')
  console.log('Cookies present:', request.cookies.getAll().map(c => c.name).join(', '))

  const { pathname } = request.nextUrl

  if (
    !user &&
    (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/:path*'],
}
