import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Forçamos o domínio oficial para blindar a sessão [cite: 2025-12-29]
  const officialOrigin = 'https://ouvi.ia.br'

  if (code) {
    // Criamos a resposta ANTES para poder injetar os cookies nela [cite: 2025-12-29]
    const response = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            // Injetamos o cookie tanto na request quanto na response [cite: 2025-12-29]
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

    // Troca o código pela sessão real
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      // 1. Verificamos o perfil sem pressa [cite: 2026-01-01]
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

      let targetUrl = `${officialOrigin}/onboarding`

      if (!profile || !profile.onboarding_completed) {
        // Upsert preventivo para garantir que o ID exista no banco [cite: 2025-12-29]
        await supabase.from('profiles').upsert({ 
          id: session.user.id,
          updated_at: new Date().toISOString()
        })
      } else {
        targetUrl = `${officialOrigin}/dashboard`
      }

      // 2. REDIRECIONAMENTO FINAL: Criamos uma nova resposta de redirect 
      // mas COPIAMOS os cookies que o Supabase injetou na nossa 'response' [cite: 2025-12-29]
      const finalResponse = NextResponse.redirect(targetUrl)
      response.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      
      return finalResponse
    }
  }

  return NextResponse.redirect(`${officialOrigin}/login?error=auth_failed`)
}