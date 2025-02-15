import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "pdfjs-dist/build/pdf.worker.js":
          "commonjs pdfjs-dist/build/pdf.worker.js",
      });
    }

    // Fix OpenTelemetry dependency warning
    config.module.exprContextCritical = false;

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: "personal-3ek",
  project: "onecarbon",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
