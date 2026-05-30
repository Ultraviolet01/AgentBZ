/** @type {import('next').NextConfig} */
const CDR_EXTERNALS = [
  'helia',
  '@helia/unixfs',
  '@piplabs/cdr-sdk',
  'multiformats',
  'libp2p',
  '@libp2p/http',
  'undici',
];

const nextConfig = {
    transpilePackages: ["@agentbazaar/types", "@agentbazaar/database"],
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
    env: {
    // Note: Secrets removed for security. 
    // Manage these via Vercel / VPS Environment Variables.
    OG_RPC_URL: "https://evmrpc.0g.ai",
    OG_INDEXER_URL: "https://indexer-storage-mainnet-standard.0g.ai",
    OG_CONTRACT_ADDRESS: "0x02DF8a5934dA46859962bd4962668d109d544457",
    OG_NETWORK: "mainnet",
  },
  optimizeFonts: false,
  async rewrites() {
      return {
        fallback: [
          {
            source: '/api/:path*',
            destination: process.env.NODE_ENV === 'production' 
              ? '/api/:path*' // Point to the same origin in production
              : 'http://localhost:3006/:path*', // Local dev
          },
        ],
      };
    },
};

export default nextConfig;
