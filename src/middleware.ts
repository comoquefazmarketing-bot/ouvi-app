import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Criamos a resposta base
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 1. ZONA LIVRE: Definimos rotas que o middleware NUNCA deve bloquear [cite: 2025-12-29]
  // Adicionamos /onboarding aqui para que ele nunca te expulse dessa página
  const bypassRoutes = ['/login', '/auth', '/onboarding', '/_next', '/favicon.ico']
  
  const isBypassRoute = bypassRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isBypassRoute) {
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

  // Verificamos o usuário apenas para rotas protegidas (como o dashboard) [cite: 2025-12-29]
  const { data: { user } } = await supabase.auth.getUser()

  // 2. PROTEÇÃO DO DASHBOARD: Só redireciona se tentar entrar no dashboard sem estar logado
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  // Mantemos o matcher para interceptar as rotas do app [cite: 2025-12-28]
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}