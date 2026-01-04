import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Detecta se está em localhost ou produção
  const origin = request.nextUrl.origin
  const isLocal = origin.includes('localhost')
  const officialOrigin = isLocal ? origin : 'https://ouvi.ia.br'

  if (code) {
    const response = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

      // Se não tem perfil, cria um inicial
      if (!profile) {
        await supabase.from('profiles').upsert({ 
          id: session.user.id,
          email: session.user.email,
          display_name: session.user.user_metadata.full_name,
          updated_at: new Date().toISOString()
        })
      }

      const targetPath = (!profile || !profile.onboarding_completed) ? '/onboarding' : '/dashboard'
      const finalResponse = NextResponse.redirect(`${officialOrigin}${targetPath}`)
      
      // Copia os cookies da sessão para o redirecionamento final
      response.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      
      return finalResponse
    }
  }

  return NextResponse.redirect(`${officialOrigin}/login?error=auth_failed`)
}