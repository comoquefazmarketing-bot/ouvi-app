import type { Metadata, Viewport } from "next";
import "./globals.css";
// Importamos o cérebro que gerencia a entrada e permanência do usuário
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "OUVI",
  description: "Experiência Sensorial de Áudio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OUVI",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
    shortcut: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className="bg-black">
      <body className="bg-black text-white antialiased">
        {/* O AuthProvider envolve todo o app. 
            Ele garante que o usuário seja reconhecido antes de qualquer decisão de expulsão.
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}