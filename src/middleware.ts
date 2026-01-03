import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 1. Ampliamos as rotas para evitar loops e bloqueios de convite [cite: 2025-12-29]
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/auth',
  '/onboarding',
  '/invite',
  '/manifesto',
  '/waitlist',
  '/api',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 2. Bypass imediato: Se for público, nem processa cookies [cite: 2025-12-29]
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Criamos uma ÚNICA resposta para não perder estado [cite: 2025-12-29]
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        // Corrigido: Apenas response.cookies.set() para manter a mutabilidade correta [cite: 2025-12-29]
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Verificação minimalista: Só barra se não houver sessão [cite: 2025-12-29]
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redireciona para o login apenas rotas privadas (como /dashboard) [cite: 2025-12-30]
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}