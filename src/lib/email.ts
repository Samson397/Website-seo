interface AlertEmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendAlertEmail(params: AlertEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "SEOScan <alerts@seoscan.app>";

  if (!apiKey) {
    console.info("[email] RESEND_API_KEY not set — skipping alert", params.subject);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      text: params.body,
    }),
  });

  if (!response.ok) {
    console.error("[email] Resend error", await response.text());
    return false;
  }

  return true;
}

interface MonitorAlertEmailParams {
  to: string;
  projectName: string;
  projectUrl: string;
  alerts: { message: string }[];
  dashboardUrl: string;
}

export async function sendMonitorAlertEmail(params: MonitorAlertEmailParams): Promise<boolean> {
  const alertList = params.alerts.map((a) => `• ${a.message}`).join("\n");

  return sendAlertEmail({
    to: params.to,
    subject: `SEOScan alert: ${params.projectName}`,
    body: `We detected changes on ${params.projectUrl}:\n\n${alertList}\n\nView details: ${params.dashboardUrl}`,
  });
}
