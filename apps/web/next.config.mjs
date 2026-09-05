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
  'hashconnect',
];

const nextConfig = {
    transpilePackages: ["@agentbazaar/types", "@agentbazaar/database"],
    staticPageGenerationTimeout: 300,
    experimental: {
      serverComponentsExternalPackages: CDR_EXTERNALS,
    },
    webpack(config, { isServer }) {
      if (isServer) {
        const prev = config.externals || [];
        config.externals = [
          ...(Array.isArray(prev) ? prev : [prev]),
          ({ request }, callback) => {
            const pkg = request?.split('/')[0] ?? '';
            if (CDR_EXTERNALS.some(ext => request?.startsWith(ext) || pkg === ext)) {
              return callback(null, `commonjs ${request}`);
            }
            return callback();
          },
        ];
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
