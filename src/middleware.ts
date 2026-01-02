import { NextResponse, type NextRequest } from 'next/server'

/**
 * MODO DE EMERGÊNCIA: LIBERAÇÃO TOTAL
 * Desativamos a verificação de sessão para permitir que a equipe
 * acesse o Dashboard enquanto o motor de auth sintoniza.
 */
export async function middleware(request: NextRequest) {
  // Apenas deixa passar, sem perguntar quem é ou se está logado.
  return NextResponse.next()
}

export const config = {
  // Mantém a estrutura para não dar erro no Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}