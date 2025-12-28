/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! ATENÇÃO !!
    // Isso permite que o deploy termine mesmo com erros de TypeScript.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Também ignora erros de "limpeza" de código (linting)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;