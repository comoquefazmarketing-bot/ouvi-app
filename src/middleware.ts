import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const { pathname } = request.nextUrl

  // 1. ZONA DE ESCAPE (Bypass Total)
  // Adicionamos /onboarding aqui para o Middleware não interferir na sintonização
  const isAuth = pathname.startsWith('/auth')
  const isOnboarding = pathname.startsWith('/onboarding')
  const isLogin = pathname === '/login'
  const isStatic = pathname.match(/\.(png|jpg|ico|svg|json|js|css)$/)
  
  if (isAuth || isStatic || isOnboarding || isLogin) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Busca o usuário apenas para proteger o Dashboard
  const { data: { user } } = await supabase.auth.getUser()

  // 2. PROTEÇÃO RESTRITA AO DASHBOARD
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}