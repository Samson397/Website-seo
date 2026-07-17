export function getDataForSeoCredentials(): { login: string; password: string } | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (login && password) return { login, password };
  return null;
}

export function dataForSeoAuthHeader(creds: { login: string; password: string }): string {
  return `Basic ${Buffer.from(`${creds.login}:${creds.password}`).toString("base64")}`;
}
