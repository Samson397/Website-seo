interface ScanPoint {
  id: string;
  createdAt: string;
  trigger?: string;
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

function triggerLabel(trigger?: string) {
  if (trigger === "scheduled") return "Weekly";
  return "Manual";
}

export function ScoreTrend({
  scans,
  selectedScanId,
  onSelectScan,
}: {
  scans: ScanPoint[];
  selectedScanId?: string;
  onSelectScan?: (scanId: string) => void;
}) {
  if (scans.length === 0) {
    return (
      <p className="text-sm text-slate-500">Run your first scan to start tracking scores over time.</p>
    );
  }

  const chronological = [...scans].reverse();
  const selectedId = selectedScanId ?? scans[0].id;
  const selected = scans.find((s) => s.id === selectedId) ?? scans[0];
  const selectedIndex = scans.findIndex((s) => s.id === selected.id);
  const previous = scans[selectedIndex + 1];
  const selectedAvg = avgScore(selected);
  const prevAvg = previous ? avgScore(previous) : null;
  const delta = prevAvg !== null ? selectedAvg - prevAvg : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-sm text-slate-500">Overall score</p>
          <p className="text-3xl font-bold text-slate-900">{selectedAvg}</p>
        </div>
        {delta !== null && (
          <p
            className={`text-sm font-medium ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {delta >= 0 ? "+" : ""}
            {delta} vs previous scan
          </p>
        )}
        <div className="text-sm text-slate-500">
          {selected.criticalCount} critical · {triggerLabel(selected.trigger)} ·{" "}
          {new Date(selected.createdAt).toLocaleDateString()}
        </div>
      </div>

      {onSelectScan && scans.length > 1 && (
        <p className="text-xs text-slate-500">Click a row to view that scan&apos;s full report.</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Overall</th>
              <th className="pb-2 pr-4 font-medium">SEO</th>
              <th className="pb-2 pr-4 font-medium">Perf</th>
              <th className="pb-2 pr-4 font-medium">A11y</th>
              <th className="pb-2 pr-4 font-medium">Security</th>
              <th className="pb-2 font-medium">Critical</th>
            </tr>
          </thead>
          <tbody>
            {chronological.map((scan) => {
              const isSelected = scan.id === selectedId;
              return (
                <tr
                  key={scan.id}
                  onClick={onSelectScan ? () => onSelectScan(scan.id) : undefined}
                  className={`border-b border-slate-100 ${
                    onSelectScan ? "cursor-pointer hover:bg-slate-50" : ""
                  } ${isSelected ? "bg-blue-50" : ""}`}
                >
                  <td className="py-2 pr-4">{new Date(scan.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-4 text-slate-500">{triggerLabel(scan.trigger)}</td>
                  <td className="py-2 pr-4 font-medium">{avgScore(scan)}</td>
                  <td className="py-2 pr-4">{scan.seoScore}</td>
                  <td className="py-2 pr-4">{scan.performanceScore}</td>
                  <td className="py-2 pr-4">{scan.accessibilityScore}</td>
                  <td className="py-2 pr-4">{scan.securityScore}</td>
                  <td className="py-2">{scan.criticalCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
