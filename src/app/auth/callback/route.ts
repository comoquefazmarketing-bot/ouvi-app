import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Resposta padrão caso falhe
  const loginErrorUrl = `${origin}/login?error=auth_failed`

  if (code) {
    const cookieStore = await cookies()
    
    // Criamos a resposta de redirecionamento para o Onboarding
    const response = NextResponse.redirect(`${origin}/onboarding`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            // Persistência dupla: no store assíncrono e no header da resposta
            cookieStore.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Troca o código pela sessão real
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return response // Retorna o redirecionamento com os cookies carimbados
    }
  }

  return NextResponse.redirect(loginErrorUrl)
}