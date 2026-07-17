/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// Baseline from SEOHub audit recommendations; extended for Next.js + Vercel Analytics + AdSense.
const contentSecurityPolicy = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://partner.googleadservices.com https://www.googletagservices.com https://adservice.google.com https://www.google.com https://www.gstatic.com"
    : "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://www.googletagservices.com https://adservice.google.com https://www.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googlesyndication.com https://*.google.com https://*.googleusercontent.com https://pagead2.googlesyndication.com https://*.g.doubleclick.net",
  "font-src 'self'",
  "connect-src 'self' https://vitals.vercel-insights.com https://pagead2.googlesyndication.com https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net https://*.g.doubleclick.net",
  "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://*.googlesyndication.com",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
