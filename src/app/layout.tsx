import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { WaveProgress } from "@/components/WaveProgress";
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
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-void text-offwhite antialiased`}
      >
        <div className="min-h-screen">
          <header className="border-b border-white/10 bg-void/90 px-6 py-4">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="relative flex items-center gap-3">
                  <div className="absolute -left-3 -top-2 h-8 w-8 rounded-full bg-accent/20 blur-3xl" />
                  <span className="text-lg font-semibold tracking-[0.25em] text-offwhite">
                    OUVI
                  </span>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Beta
                </span>
              </div>
              <WaveProgress />
            </div>
          </header>
          <AuthProvider>
            <main className="mx-auto w-full max-w-2xl px-6 py-6">
              {children}
            </main>
          </AuthProvider>
          <footer className="border-t border-white/10 px-6 py-6">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
              <span>OUVI © 2025</span>
              <div className="flex flex-wrap gap-4">
                <Link href="/terms" className="transition hover:text-offwhite">
                  Termos
                </Link>
                <Link
                  href="/privacy"
                  className="transition hover:text-offwhite"
                >
                  Privacidade
                </Link>
                <Link href="/data" className="transition hover:text-offwhite">
                  Dados
                </Link>
              </div>
            </div>
          </footer>
        </div>
        <div className="bg-noise" aria-hidden="true" />
      </body>
    </html>
  );
}
