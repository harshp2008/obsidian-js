/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add raw-loader for markdown files
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });

    // Allow importing from parent directory for library development
    config.resolve.symlinks = true;

    // Handle CSS imports from node_modules
    config.module.rules.push({
      test: /\.css$/,
      use: ["style-loader", "css-loader"],
    });

    return config;
  },
  // Transpile the obsidian-js module to avoid ES module issues
  transpilePackages: ["obsidian-js"],
};

module.exports = nextConfig;
