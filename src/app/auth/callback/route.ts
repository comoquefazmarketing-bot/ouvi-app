import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies() // Ajuste assíncrono para Next.js 15
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
    
    // Troca o código pela sessão real do usuário
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Sintonização concluída, segue para o Onboarding [cite: 2026-01-01]
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  // Em caso de falha de sintonização, retorna ao login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}