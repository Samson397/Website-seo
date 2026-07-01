"use client";

interface UptimeCheck {
  status: string;
  httpStatus: number | null;
  responseMs: number | null;
  error: string | null;
  createdAt: string;
}

interface UptimePanelProps {
  uptimeEnabled: boolean;
  lastUptimeStatus: string | null;
  lastUptimeAt: string | null;
  lastUptimeMs: number | null;
  lastUptimeHttpStatus: number | null;
  lastSslExpiryDays: number | null;
  checks: UptimeCheck[];
  onToggle: (enabled: boolean) => void;
  onCheckNow: () => void;
  checking: boolean;
}

export function UptimePanel({
  uptimeEnabled,
  lastUptimeStatus,
  lastUptimeAt,
  lastUptimeMs,
  lastUptimeHttpStatus,
  lastSslExpiryDays,
  checks,
  onToggle,
  onCheckNow,
  checking,
}: UptimePanelProps) {
  const isUp = lastUptimeStatus === "up";
  const isDown = lastUptimeStatus === "down";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Uptime &amp; SSL</h2>
          <p className="mt-1 text-sm text-slate-500">
            We ping your site every 15 minutes and email you if it goes down or SSL is expiring.
          </p>
        </div>
        <button
          type="button"
          onClick={onCheckNow}
          disabled={checking}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {checking ? "Checking…" : "Check now"}
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={uptimeEnabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        Uptime monitoring (every 15 minutes)
      </label>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
          {!lastUptimeStatus ? (
            <p className="mt-2 text-sm text-slate-500">Not checked yet</p>
          ) : (
            <p
              className={`mt-2 text-xl font-bold ${
                isUp ? "text-emerald-600" : isDown ? "text-red-600" : "text-slate-700"
              }`}
            >
              {isUp ? "Online" : isDown ? "Down" : lastUptimeStatus}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Response</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {lastUptimeMs != null ? `${lastUptimeMs}ms` : "—"}
          </p>
          {lastUptimeHttpStatus != null && (
            <p className="text-xs text-slate-500">HTTP {lastUptimeHttpStatus}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">SSL expires</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {lastSslExpiryDays != null ? `${lastSslExpiryDays} days` : "—"}
          </p>
        </div>
      </div>

      {lastUptimeAt && (
        <p className="mt-3 text-xs text-slate-400">
          Last checked {new Date(lastUptimeAt).toLocaleString()}
        </p>
      )}

      {checks.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Response</th>
                <th className="pb-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.createdAt} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-600">
                    {new Date(check.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        check.status === "up"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {check.status === "up" ? "Online" : "Down"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">
                    {check.responseMs != null ? `${check.responseMs}ms` : "—"}
                  </td>
                  <td className="py-2 text-slate-500">
                    {check.error ||
                      (check.httpStatus != null ? `HTTP ${check.httpStatus}` : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function UptimeBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const isUp = status === "up";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isUp ? "bg-emerald-500" : "bg-red-500"}`}
        aria-hidden
      />
      {isUp ? "Online" : "Down"}
    </span>
  );
}
