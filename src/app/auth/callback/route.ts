import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
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

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        // Usa upsert para evitar erro de duplicidade se o perfil ja existir parcialmente
        await supabase.from('profiles').upsert({ id: session.user.id })
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}