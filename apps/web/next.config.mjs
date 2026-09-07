import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load the monorepo-root .env so a single root env file also feeds the web app
// (Next.js only reads .env files inside apps/web by default). This makes
// NEXT_PUBLIC_* vars available for build-time inlining and server routes.
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

/** @type {import('next').NextConfig} */
const CDR_EXTERNALS = [
  'helia',
  '@helia/unixfs',
  '@piplabs/cdr-sdk',
  'multiformats',
  'libp2p',
  '@libp2p/http',
  'undici',
  '@hashgraph/sdk',
  '@hashgraph/proto',
];

const nextConfig = {
    transpilePackages: ["@agentbazaar/types", "@agentbazaar/database"],
    staticPageGenerationTimeout: 300,
    experimental: {
      serverComponentsExternalPackages: CDR_EXTERNALS,
    },
    webpack(config, { isServer }) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
        'react-native': false,
      };

      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          stream: false,
          http: false,
          https: false,
          zlib: false,
        };
      }
      return config;
    },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  optimizeFonts: false,
  async rewrites() {
      return {
        fallback: [
          {
            source: '/api/:path*',
            destination: process.env.NODE_ENV === 'production' 
              ? '/api/:path*' // Point to the same origin in production
              : 'http://localhost:3001/:path*', // Local dev
          },
        ],
      };
    },
};

export default nextConfig;
