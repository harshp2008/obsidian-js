/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add markdown file support
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
