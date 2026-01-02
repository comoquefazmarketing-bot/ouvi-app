import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // ESCUDOS BAIXADOS: Ninguém é expulso, o loop acaba aqui.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}