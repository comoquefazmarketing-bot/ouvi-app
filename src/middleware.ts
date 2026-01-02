/**
 * PROJETO OUVI – Middleware de Segurança (Sequência Ativada)
 * Local: src/middleware.ts
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Recupera o usuário atual
  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // 2. BLOQUEIO DE SEGURANÇA: Se não estiver logado, não entra no Dash nem no Onboarding [cite: 2025-12-30]
  if (!user && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. REGRA SENSORIAL: Se logado, garante que passou pelo Onboarding antes do Feed [cite: 2026-01-01]
  if (user && url.pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return response
}

export const config = {
  // ATIVADO: Agora o middleware vigia as rotas centrais do app [cite: 2025-12-30]
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}