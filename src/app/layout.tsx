import "./globals.css";

export const metadata = {
  title: "OUVI",
  description: "Rede Social de Ressonâncias",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className="antialiased">{children}</body>
    </html>
  );
}