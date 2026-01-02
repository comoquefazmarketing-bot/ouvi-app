/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // DERRUBANDO A LANDING PAGE: Redireciona a raiz e o manifesto para o Login
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/manifesto',
        destination: '/login',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;