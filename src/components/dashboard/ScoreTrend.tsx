interface ScanPoint {
  createdAt: string;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  securityScore: number;
  criticalCount: number;
}

function avgScore(scan: ScanPoint) {
  return Math.round(
    (scan.seoScore + scan.performanceScore + scan.accessibilityScore + scan.securityScore) / 4
  );
}

export function ScoreTrend({ scans }: { scans: ScanPoint[] }) {
  if (scans.length === 0) {
    return (
      <p className="text-sm text-slate-500">Run your first scan to start tracking scores over time.</p>
    );
  }

  const chronological = [...scans].reverse();
  const latest = scans[0];
  const previous = scans[1];
  const latestAvg = avgScore(latest);
  const prevAvg = previous ? avgScore(previous) : null;
  const delta = prevAvg !== null ? latestAvg - prevAvg : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-sm text-slate-500">Overall score</p>
          <p className="text-3xl font-bold text-slate-900">{latestAvg}</p>
        </div>
        {delta !== null && (
          <p
            className={`text-sm font-medium ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {delta >= 0 ? "+" : ""}
            {delta} vs last scan
          </p>
        )}
        <div className="text-sm text-slate-500">
          {latest.criticalCount} critical · last scan{" "}
          {new Date(latest.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Overall</th>
              <th className="pb-2 pr-4 font-medium">SEO</th>
              <th className="pb-2 pr-4 font-medium">Perf</th>
              <th className="pb-2 pr-4 font-medium">A11y</th>
              <th className="pb-2 pr-4 font-medium">Security</th>
              <th className="pb-2 font-medium">Critical</th>
            </tr>
          </thead>
          <tbody>
            {chronological.map((scan) => (
              <tr key={scan.createdAt} className="border-b border-slate-100">
                <td className="py-2 pr-4">{new Date(scan.createdAt).toLocaleDateString()}</td>
                <td className="py-2 pr-4 font-medium">{avgScore(scan)}</td>
                <td className="py-2 pr-4">{scan.seoScore}</td>
                <td className="py-2 pr-4">{scan.performanceScore}</td>
                <td className="py-2 pr-4">{scan.accessibilityScore}</td>
                <td className="py-2 pr-4">{scan.securityScore}</td>
                <td className="py-2">{scan.criticalCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
