import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("impact");
  const [sortDir, setSortDir] = useState("desc");

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

  const impactOrder = {
    critical: 4,
    serious: 3,
    moderate: 2,
    minor: 1,
    unknown: 0,
  };

  const scoreMeta = (score) => {
    if (score >= 90) return { label: "Excellent", ring: "ring-emerald-500/30", bg: "bg-emerald-500/15", text: "text-emerald-200" };
    if (score >= 75) return { label: "Good", ring: "ring-sky-500/30", bg: "bg-sky-500/15", text: "text-sky-200" };
    if (score >= 60) return { label: "Needs work", ring: "ring-amber-500/30", bg: "bg-amber-500/15", text: "text-amber-200" };
    return { label: "Poor", ring: "ring-rose-500/30", bg: "bg-rose-500/15", text: "text-rose-200" };
  };

  const impactPill = (impact) => {
    const key = (impact || "unknown").toLowerCase();
    if (key === "critical") return "bg-rose-500/15 text-rose-200 ring-rose-500/30";
    if (key === "serious") return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
    if (key === "moderate") return "bg-sky-500/15 text-sky-200 ring-sky-500/30";
    if (key === "minor") return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30";
    return "bg-white/5 text-slate-200 ring-white/10";
  };

  const normalizeUrl = (raw) => {
    const v = raw.trim();
    if (!v) return "";
    if (v.startsWith("http://") || v.startsWith("https://")) return v;
    return `https://${v}`;
  };

  const analyzeWebsite = async () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });

      if (!res.ok) {
        let details = "";
        try {
          const body = await res.json();
          details = body?.error ? ` - ${body.error}` : "";
        } catch {
          // ignore non-JSON error bodies
        }
        throw new Error(`Backend ${res.status}${details}`);
      }

      const data = await res.json();

      // 🔒 SAFETY CHECK
      if (!data || !Array.isArray(data.issues)) {
        throw new Error("Invalid response");
      }

      setReport(data);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Analysis failed. Backend error.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "nodesAffected" ? "desc" : "asc");
  };

  return (
    <div className="min-h-screen text-slate-100 bg-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-600/20 via-indigo-500/10 to-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-48 right-[-6rem] h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-6">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            WCAG checks powered by axe-core
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Web Accessibility Analyzer
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Paste a public URL and get a quick accessibility score plus a list of actionable issues.
          </p>
        </header>

        <main className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Analyze a website</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Tip: you can paste <span className="font-mono text-slate-200">wikipedia.org</span> and we’ll auto-add <span className="font-mono text-slate-200">https://</span>.
                </p>
              </div>
              <div className="hidden sm:block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                POST <span className="font-mono text-slate-200">/api/analyze</span>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-medium text-slate-300">Website URL</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner outline-none ring-0 transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") analyzeWebsite();
                  }}
                />
                <button
                  onClick={analyzeWebsite}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Analyzing…
                    </>
                  ) : (
                    "Analyze"
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <div className="font-semibold">Analysis failed</div>
                <div className="mt-1 break-words text-rose-100/90">{error}</div>
              </div>
            )}

            {!report && !error && (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Enter a URL and click <span className="font-semibold text-slate-100">Analyze</span> to generate a report.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur sm:p-6">
            <h2 className="text-base font-semibold">Report</h2>
            <p className="mt-1 text-sm text-slate-300">
              We summarize key issues and compute a simple score.
            </p>

            {!report ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-300">
                No report yet.
              </div>
            ) : (
              (() => {
                const meta = scoreMeta(report.score);
                const pct = Math.max(0, Math.min(100, Number(report.score) || 0));
                const impactCounts = report.impactCounts || {};
                const severityKeys = ["critical", "serious", "moderate", "minor", "unknown"];
                const totalViolations = (report.violations || []).length;
                const chartTotal =
                  severityKeys.reduce((sum, k) => sum + (Number(impactCounts?.[k]) || 0), 0) || totalViolations;

                const violationsSorted = [...(report.violations || [])].sort((a, b) => {
                  const dir = sortDir === "asc" ? 1 : -1;
                  if (sortKey === "impact") {
                    const av = impactOrder[(a.impact || "unknown").toLowerCase()] ?? 0;
                    const bv = impactOrder[(b.impact || "unknown").toLowerCase()] ?? 0;
                    return (av - bv) * dir;
                  }
                  if (sortKey === "nodesAffected") {
                    return ((Number(a.nodesAffected) || 0) - (Number(b.nodesAffected) || 0)) * dir;
                  }
                  const as = String(a[sortKey] || "").toLowerCase();
                  const bs = String(b[sortKey] || "").toLowerCase();
                  return as.localeCompare(bs) * dir;
                });

                return (
                  <div className="mt-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-400">Target</div>
                        <div className="truncate text-sm font-semibold text-slate-100">{report.url}</div>
                      </div>
                      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}>
                        <span className="text-sm">{report.score}/100</span>
                        <span className="text-slate-100/40">•</span>
                        <span>{meta.label}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Score</span>
                        <span className="font-semibold text-slate-100">{pct}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        This is a simplified score based on the number of detected issues.
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Issues</h3>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300 ring-1 ring-white/10">
                          {totalViolations}
                        </span>
                      </div>

                      {/* Severity chart */}
                      <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/30 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Severity breakdown</span>
                          <span className="text-slate-400">{chartTotal} total</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="flex h-full w-full">
                            {severityKeys.map((k) => {
                              const v = Number(impactCounts?.[k]) || 0;
                              const w = chartTotal ? (v / chartTotal) * 100 : 0;
                              const cls =
                                k === "critical"
                                  ? "bg-rose-500"
                                  : k === "serious"
                                  ? "bg-amber-500"
                                  : k === "moderate"
                                  ? "bg-sky-500"
                                  : k === "minor"
                                  ? "bg-emerald-500"
                                  : "bg-slate-500";
                              return <div key={k} className={cls} style={{ width: `${w}%` }} />;
                            })}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {severityKeys.map((k) => (
                            <span
                              key={k}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${impactPill(k)}`}
                            >
                              <span className="capitalize">{k}</span>
                              <span className="text-slate-100/40">•</span>
                              <span className="font-semibold text-slate-100">
                                {Number(impactCounts?.[k]) || 0}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {totalViolations === 0 ? (
                        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                          No issues found by this scan.
                        </div>
                      ) : (
                        <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                          <div className="grid grid-cols-12 gap-0 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300">
                            <button
                              type="button"
                              onClick={() => toggleSort("impact")}
                              className="col-span-3 text-left hover:text-slate-100"
                            >
                              Impact
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSort("help")}
                              className="col-span-6 text-left hover:text-slate-100"
                            >
                              Issue
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSort("nodesAffected")}
                              className="col-span-3 text-right hover:text-slate-100"
                            >
                              Affected
                            </button>
                          </div>

                          <div className="max-h-80 overflow-auto bg-slate-950/20">
                            {violationsSorted.map((v, i) => {
                              const impact = (v.impact || "unknown").toLowerCase();
                              return (
                                <div
                                  key={`${v.id || "rule"}-${i}`}
                                  className="grid grid-cols-12 gap-0 border-t border-white/10 px-3 py-3 text-sm text-slate-200"
                                >
                                  <div className="col-span-3 pr-2">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${impactPill(impact)}`}>
                                      {impact}
                                    </span>
                                    {v.id ? (
                                      <div className="mt-1 font-mono text-[11px] text-slate-400">{v.id}</div>
                                    ) : null}
                                  </div>

                                  <div className="col-span-6 pr-2">
                                    <div className="font-semibold text-slate-100">{v.help || "Accessibility issue"}</div>
                                    {v.description ? (
                                      <div className="mt-0.5 text-xs text-slate-400">{v.description}</div>
                                    ) : null}
                                    {v.helpUrl ? (
                                      <a
                                        className="mt-1 inline-block text-xs text-sky-300 hover:text-sky-200 underline underline-offset-2"
                                        href={v.helpUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Learn how to fix
                                      </a>
                                    ) : null}
                                  </div>

                                  <div className="col-span-3 text-right">
                                    <div className="text-sm font-semibold text-slate-100">{Number(v.nodesAffected) || 0}</div>
                                    <div className="text-xs text-slate-400">nodes</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </section>
        </main>

        <footer className="mt-10 text-xs text-slate-500">
          Backend: <span className="font-mono text-slate-400">{API_BASE_URL}</span>
        </footer>
      </div>
    </div>
  );
}

export default App;