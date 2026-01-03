import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // Forçamos o domínio oficial para evitar redirecionamentos errados
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
      // PAUSA TÁTICA: Dá tempo ao navegador para salvar os cookies de sessão [cite: 2026-01-01]
      await new Promise(resolve => setTimeout(resolve, 800));

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        // Cria o perfil se for o primeiro acesso [cite: 2025-12-29]
        await supabase.from('profiles').upsert({ 
          id: session.user.id,
          updated_at: new Date().toISOString()
        })
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Se já existe, vai direto para o dashboard [cite: 2025-12-30]
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Se houver falha no código ou na sessão, volta para o login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}