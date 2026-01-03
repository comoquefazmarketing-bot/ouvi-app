import type { Metadata, Viewport } from "next";
import "./globals.css";
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
    // Ajustado para o seu arquivo real. 
    // Se for PNG, mude para .png. Se for SVG, deixe .svg
    icon: "/logo-ouvi.svg", 
    apple: "/logo-ouvi.svg",
    shortcut: "/logo-ouvi.svg",
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}