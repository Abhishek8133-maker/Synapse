/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
    LITELLM_PROXY_URL: process.env.LITELLM_PROXY_URL || 'http://localhost:4000',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://synapse:synapse_dev_password@localhost:5432/synapse',
  },
}

module.exports = nextConfig