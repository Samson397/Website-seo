const PLATFORM_SUFFIXES = [
  ".vercel.app",
  ".netlify.app",
  ".github.io",
  ".pages.dev",
  ".web.app",
  ".firebaseapp.com",
  ".cloudfront.net",
  ".herokuapp.com",
];

/** Hosted on a platform subdomain where custom email DNS (SPF/DMARC/DKIM) is not applicable. */
export function isPlatformHosted(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return PLATFORM_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export function supportsEmailDnsChecks(hostname: string): boolean {
  return !isPlatformHosted(hostname);
}
