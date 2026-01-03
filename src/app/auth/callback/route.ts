import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // Forçamos o domínio oficial para blindar a sessão
  const origin = 'https://ouvi.ia.br'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Troca o código pela sessão real
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      // PAUSA TÁTICA: Essencial para estabilizar os cookies no navegador [cite: 2026-01-01]
      await new Promise(resolve => setTimeout(resolve, 800));

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

      // Se o perfil não existe ou o onboarding não foi feito, manda para /onboarding
      if (!profile || !profile.onboarding_completed) {
        await supabase.from('profiles').upsert({ 
          id: session.user.id,
          updated_at: new Date().toISOString()
        })
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Usuário antigo e completo vai para o dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Se o código falhar, volta para o login com aviso
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}