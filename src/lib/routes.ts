/** App routes — single source of truth for pages and nav */
export const routes = {
  home: "/",
  competitors: "/competitors",
  dashboard: "/dashboard",
  login: "/login",
  register: "/register",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export const mainNav = [
  { href: routes.home, label: "Scan a site", description: "Audit one URL for SEO, security & speed" },
  { href: routes.competitors, label: "Compare competitors", description: "Audit up to 10 sites side by side" },
  { href: routes.dashboard, label: "My sites", description: "Saved scans & monitoring" },
] as const;
