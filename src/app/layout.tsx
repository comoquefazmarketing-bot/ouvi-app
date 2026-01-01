import type { Metadata, Viewport } from "next";
import "./globals.css";

// Configuração do Manifesto e Identidade Visual (PWA)
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
    apple: "/icon-192.png",
  },
};

// Configuração da Tela (Evita que o usuário dê zoom e quebre a experiência)
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
        {children}
      </body>
    </html>
  );
}