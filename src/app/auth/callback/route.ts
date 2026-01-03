import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  const code = searchParams.get('code')
  // Usamos a origem da requisição para evitar conflitos de domínio entre Vercel e ouvi.ia.br
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
            // No Next.js 15, o set de cookies em rotas GET precisa ser tratado com cuidado
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Se o middleware já setou, ele ignora o erro aqui
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.delete({ name, ...options })
            } catch (error) {
              // Se o middleware já deletou, ele ignora o erro aqui
            }
          },
        },
      }
    )
    
    // Troca o código pela sessão real
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session?.user) {
      // Verificamos o perfil para decidir o destino
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

      // Se não houver perfil ou houver erro de busca, cria o perfil e manda para o onboarding
      if (!profile || profileError) {
        await supabase.from('profiles').upsert({ 
          id: session.user.id,
          updated_at: new Date().toISOString()
        })
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Se já completou ou já existe, vai para o dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Se algo der errado no código ou na troca de sessão
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}