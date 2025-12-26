import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OUVI",
  description: "OUVI - rede social visual com interações em áudio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}
      >
        <div className="min-h-screen">
          <header className="border-b border-zinc-900/80 bg-zinc-950/90 px-6 py-4">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
              <span className="text-lg font-semibold tracking-[0.25em] text-zinc-100">
                OUVI
              </span>
              <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Beta
              </span>
            </div>
          </header>
          <AuthProvider>
            <main className="mx-auto w-full max-w-2xl px-6 py-6">
              {children}
            </main>
          </AuthProvider>
          <footer className="border-t border-zinc-900/80 px-6 py-6">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
              <span>OUVI © 2025</span>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/terms"
                  className="transition hover:text-zinc-200"
                >
                  Termos
                </Link>
                <Link
                  href="/privacy"
                  className="transition hover:text-zinc-200"
                >
                  Privacidade
                </Link>
                <Link href="/data" className="transition hover:text-zinc-200">
                  Dados
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
