import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    // Valida o login e cria a sessão no navegador
    await supabase.auth.exchangeCodeForSession(code);
  }

  // AQUI: Redireciona para o Onboarding para elas escolherem o Nick e Avatar
  return NextResponse.redirect(new URL('/onboarding', request.url));
}