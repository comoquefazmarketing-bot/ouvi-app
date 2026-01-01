import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
