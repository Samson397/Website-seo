/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// AdSense + Funding Choices + Vercel Analytics.
// Keep Google ad/consent hosts explicit — host allowlists (e.g. www.google.com)
// do not cover fundingchoicesmessages.google.com or csi.gstatic.com.
const googleAdScriptSrc = [
  "https://pagead2.googlesyndication.com",
  "https://partner.googleadservices.com",
  "https://www.googletagservices.com",
  "https://adservice.google.com",
  "https://www.google.com",
  "https://www.gstatic.com",
  "https://fundingchoicesmessages.google.com",
  "https://ep1.adtrafficquality.google",
  "https://ep2.adtrafficquality.google",
  "https://tpc.googlesyndication.com",
  "https://www.googletagmanager.com",
].join(" ");

const googleAdConnectSrc = [
  "https://pagead2.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.google.com",
  "https://*.gstatic.com",
  "https://csi.gstatic.com",
  "https://*.doubleclick.net",
  "https://*.g.doubleclick.net",
  "https://googleads.g.doubleclick.net",
  "https://fundingchoicesmessages.google.com",
  "https://ep1.adtrafficquality.google",
  "https://ep2.adtrafficquality.google",
  "https://adtrafficquality.google",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
].join(" ");

const googleAdImgSrc = [
  "https://*.googlesyndication.com",
  "https://pagead2.googlesyndication.com",
  "https://*.google.com",
  "https://*.gstatic.com",
  "https://*.googleusercontent.com",
  "https://*.g.doubleclick.net",
  "https://*.doubleclick.net",
  // AdSense sodar / traffic-quality beacons (not covered by *.google.com)
  "https://ep1.adtrafficquality.google",
  "https://ep2.adtrafficquality.google",
  "https://adtrafficquality.google",
  "https://*.adtrafficquality.google",
].join(" ");

const googleAdFrameSrc = [
  "https://googleads.g.doubleclick.net",
  "https://tpc.googlesyndication.com",
  "https://www.google.com",
  "https://*.googlesyndication.com",
  "https://fundingchoicesmessages.google.com",
  "https://ep1.adtrafficquality.google",
  "https://ep2.adtrafficquality.google",
  "https://*.doubleclick.net",
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  isDev
    ? `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com ${googleAdScriptSrc}`
    : `script-src 'self' 'unsafe-inline' ${googleAdScriptSrc}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
  `img-src 'self' data: blob: ${googleAdImgSrc}`,
  "font-src 'self' https://fonts.gstatic.com https://www.gstatic.com",
  `connect-src 'self' https://vitals.vercel-insights.com ${googleAdConnectSrc}`,
  `frame-src 'self' ${googleAdFrameSrc}`,
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
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  async rewrites() {
    // Prefer the brand logo over the legacy gear-only favicon.ico.
    return [{ source: "/favicon.ico", destination: "/logo.png" }];
  },
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
