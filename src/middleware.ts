import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  // 1. ISOLAMENTO TOTAL: Bypass para auth e arquivos estáticos (Evita Loops)
  const isAuth = request.nextUrl.pathname.startsWith('/auth')
  const isStatic = request.nextUrl.pathname.match(/\.(png|jpg|ico|svg|json|js|css)$/)
  
  if (isAuth || isStatic) {
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

  // Busca o usuário atual de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPath = request.nextUrl.pathname === '/login'
  const isOnboardingPath = request.nextUrl.pathname === '/onboarding'
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || isOnboardingPath

  // 2. REDIRECIONAMENTOS INTELIGENTES
  
  // Caso 1: Não logado tentando acessar área restrita -> Login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Caso 2: Logado no Login -> Vai para Onboarding (triagem)
  if (user && isLoginPath) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Nota: O próprio Onboarding decidirá se manda para o Dashboard 
  // baseado no perfil salvo no banco, como fizemos no código anterior.

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}