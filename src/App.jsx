import React, { useMemo, useState } from "react";
import { TrendingUp, Download, RefreshCw, ChevronUp, ChevronDown, LineChart as LineChartIcon, Filter, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from "@/components/ui/pagination";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

/**
 * NOTE ON FIX
 *  - Converted TS/TSX-specific type annotations to plain JS to avoid JSX parser errors in non-TS builds.
 *  - Ensured all JSX tags (especially <Select/>) are properly nested and closed.
 *  - Removed unused imports.
 *  - Escaped/contained any text that might be mis-parsed by JSX.
 *  - Added small console.assert test cases for helper utilities.
 */

// -----------------------------
// Test Data (deterministic)
// -----------------------------

const seedRand = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const owners = ["A. Patel", "J. Chen", "M. Singh", "R. Kapoor", "L. Martin", "S. Gupta"]; 
const attributes = [
  "Account_ID",
  "Account_Open_Date",
  "Client_ID",
  "Client_DOB",
  "LEI",
  "Country_Of_Risk",
  "Booking_Center",
  "Currency",
  "Balance",
  "Txn_Count",
  "KYC_Status",
  "Tax_Residency",
  "ISIN",
  "Instrument_Type",
];
const ruleTypes = ["Completeness", "Uniqueness", "Validity", "Range", "Referential", "Consistency", "Timeliness"];
const severities = ["Critical", "High", "Medium", "Low"];

function makeItem(idx, rnd) {
  const attribute = attributes[idx % attributes.length];
  const ruleType = ruleTypes[idx % ruleTypes.length];
  const severity = severities[(idx + 1) % severities.length];
  const total = 5000 + Math.floor(rnd() * 5000);
  const basePass = 0.92 - (severity === "Critical" ? 0.06 : severity === "High" ? 0.04 : severity === "Medium" ? 0.02 : 0);
  const noise = (rnd() - 0.5) * 0.04; // +/- 2%
  const passRate = Math.max(0.75, Math.min(0.995, basePass + noise));
  const passed = Math.floor(total * passRate);
  const failed = total - passed;
  const owner = owners[idx % owners.length];
  const report = ["24C Liquidity Coverage", "DGSD Disclosures", "CRR II Capital", "Large Exposures", "MiFID II Reports"][idx % 5];
  const ruleMap = {
    Completeness: ["Not Null", "Mandatory Present", "No Blanks"],
    Uniqueness: ["Primary Key Unique", "No Duplicate IDs"],
    Validity: ["Value In Domain", "ISO Currency Code", "LEI Format"],
    Range: ["Balance >= 0", "Txn Count >= 0", "Date <= Today"],
    Referential: ["Client_ID exists in KYC", "ISIN in Security Master"],
    Consistency: ["Country matches Booking Center", "Currency matches Instrument"],
    Timeliness: ["Loaded by T+1 09:00", "No Stale Records > 30d"],
  };
  const rlist = ruleMap[ruleType];
  const rule = rlist[Math.floor(rnd() * rlist.length)];

  const days = 14;
  const trend = Array.from({ length: days }, () =>
    Math.max(0.7, Math.min(0.999, passRate + (rnd() - 0.5) * 0.02))
  );

  const sampleIssues = Array.from({ length: Math.min(6, Math.max(1, Math.floor(failed / 250))) }, (_, i) => ({
    recordId: `RID-${idx}${i}${Math.floor(rnd() * 9999).toString().padStart(4, "0")}`,
    value: rnd() > 0.5 ? "" : rnd() > 0.5 ? null : Math.floor(rnd() * 100000),
    expected: rule,
    details: rnd() > 0.5 ? "Out of domain value" : "Missing mandatory field",
  }));

  const lastRun = new Date(Date.now() - Math.floor(rnd() * 36) * 60 * 60 * 1000).toISOString();

  return {
    id: `dq-${idx}`,
    report,
    attribute,
    rule,
    ruleType,
    severity,
    total,
    passed,
    failed,
    passRate,
    lastRun,
    owner,
    details: `${attribute} • ${ruleType} • ${rule}`,
    trend,
    sampleIssues,
  };
}

const TEST_DATA = (() => {
  const rnd = seedRand(42);
  return Array.from({ length: 28 }, (_, i) => makeItem(i, rnd));
})();

// -----------------------------
// Utilities
// -----------------------------

const SEVERITY_COLORS = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const RULE_COLORS = {
  Completeness: "bg-sky-100 text-sky-700 border-sky-200",
  Uniqueness: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  Validity: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Range: "bg-teal-100 text-teal-700 border-teal-200",
  Referential: "bg-violet-100 text-violet-700 border-violet-200",
  Consistency: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Timeliness: "bg-lime-100 text-lime-700 border-lime-200",
};

function formatPct(p) {
  return `${(p * 100).toFixed(1)}%`;
}

function toCSVString(rows) {
  const headers = [
    "Report",
    "Attribute",
    "Rule",
    "Rule Type",
    "Severity",
    "Passed",
    "Failed",
    "Total",
    "Pass %",
    "Last Run",
    "Owner",
  ];
  const body = rows
    .map((r) =>
      [
        r.report,
        r.attribute,
        r.rule,
        r.ruleType,
        r.severity,
        r.passed,
        r.failed,
        r.total,
        (r.passRate * 100).toFixed(2),
        new Date(r.lastRun).toLocaleString(),
        r.owner,
      ]
        .map((v) => (typeof v === "string" ? `\"${v.replace(/\"/g, '\"\"')}\"` : v))
        .join(",")
    )
    .join("\\n");
  return `${headers.join(",")}\\n${body}`;
}

function exportCSV(rows, filename = "dq_results.csv") {
  const csv = toCSVString(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function weightedDQScore(rows) {
  if (!rows.length) return 0;
  const w = { Critical: 3, High: 2, Medium: 1, Low: 0.5 };
  let num = 0;
  let den = 0;
  rows.forEach((r) => {
    num += r.passRate * w[r.severity];
    den += w[r.severity];
  });
  return den ? num / den : 0;
}

// -----------------------------
// Basic utility tests (run once in dev)
// -----------------------------
try {
  if (typeof process === "undefined" || process.env.NODE_ENV !== "production") {
    console.assert(formatPct(0.923) === "92.3%", "formatPct failed");

    const rowsSample = [
      { passRate: 0.9, severity: "High" },
      { passRate: 0.8, severity: "Critical" },
      { passRate: 0.95, severity: "Low" },
    ];
    const s = weightedDQScore(rowsSample);
    console.assert(s > 0.84 && s < 0.9, "weightedDQScore out of expected range", s);

    const csv = toCSVString([
      {
        report: "Test Rpt",
        attribute: "Client_ID",
        rule: "Not Null",
        ruleType: "Completeness",
        severity: "High",
        passed: 90,
        failed: 10,
        total: 100,
        passRate: 0.9,
        lastRun: new Date("2024-01-01T00:00:00Z").toISOString(),
        owner: "A. Patel",
      },
    ]);
    console.assert(csv.includes("Test Rpt") && csv.includes("Client_ID"), "CSV content missing fields");
  }
} catch (e) {
  // Swallow test errors so the UI still renders
  console.warn("DQ screen self-tests failed:", e);
}

// -----------------------------
// Main Component
// -----------------------------

export default function DataQualityResults() {
  const [report, setReport] = useState("24C Liquidity Coverage");
  const [search, setSearch] = useState("");
  const [onlyFailing, setOnlyFailing] = useState(false);
  const [sevFilter, setSevFilter] = useState([]);
  const [ruleFilter, setRuleFilter] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sortKey, setSortKey] = useState("passRate");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [openRow, setOpenRow] = useState(null);

  const reports = Array.from(new Set(TEST_DATA.map((d) => d.report)));
  const ownersAll = Array.from(new Set(TEST_DATA.map((d) => d.owner)));

  const filtered = useMemo(() => {
    let rows = TEST_DATA.filter((r) => r.report === report);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.attribute.toLowerCase().includes(q) ||
          r.rule.toLowerCase().includes(q) ||
          r.ruleType.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q)
      );
    }
    if (onlyFailing) rows = rows.filter((r) => r.failed > 0);
    if (sevFilter.length) rows = rows.filter((r) => sevFilter.includes(r.severity));
    if (ruleFilter.length) rows = rows.filter((r) => ruleFilter.includes(r.ruleType));
    if (ownerFilter !== "all") rows = rows.filter((r) => r.owner === ownerFilter);

    rows = rows.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      const va = a[sortKey];
      const vb = b[sortKey];
      if (sortKey === "lastRun") return (new Date(va).getTime() - new Date(vb).getTime()) * dir;
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir;
      return (va - vb) * dir;
    });
    return rows;
  }, [report, search, onlyFailing, sevFilter, ruleFilter, ownerFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const overallScore = useMemo(() => weightedDQScore(filtered), [filtered]);
  const totalFailedRules = filtered.filter((r) => r.failed > 0).length;
  const totalAttributes = new Set(filtered.map((r) => r.attribute)).size;

  const agg = useMemo(() => {
    const pass = filtered.reduce((s, r) => s + r.passed, 0);
    const fail = filtered.reduce((s, r) => s + r.failed, 0);
    const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    filtered.forEach((r) => (bySeverity[r.severity] += r.failed));
    return { pass, fail, bySeverity };
  }, [filtered]);

  const scoreTrend = useMemo(() => {
    const days = filtered[0]?.trend.length ?? 10;
    return Array.from({ length: days }, (_, i) => {
      const avg = filtered.reduce((s, r) => s + (r.trend[i] ?? r.passRate), 0) / (filtered.length || 1);
      return { day: `D-${days - i}`, score: +(avg * 100).toFixed(2) };
    });
  }, [filtered]);

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1", "#06b6d4"]; // green, red, amber, indigo, cyan

  function toggleArrayFilter(arr, value, set) {
    if (arr.includes(value)) set(arr.filter((x) => x !== value));
    else set([...arr, value]);
    setPage(1);
  }

  function SortableHeader({ label, k }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => {
          if (active) setSortAsc(!sortAsc);
          else {
            setSortKey(k);
            setSortAsc(false);
          }
        }}
        className="px-3 py-2 text-left text-sm font-medium text-zinc-600 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {active ? (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
        </div>
      </th>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Quality Results</h1>
          <p className="text-sm text-zinc-500">Attribute-level checks for regulatory report data (test data)</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Select block must be properly closed */}
          <Select value={report} onValueChange={(v) => { setReport(v); setPage(1); }}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select report" />
            </SelectTrigger>
            <SelectContent>
              {reports.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => exportCSV(filtered)}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="secondary" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Run Checks
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Overall DQ Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-semibold">{(overallScore * 100).toFixed(1)}%</div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-3 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-emerald-500"
                style={{ width: `${Math.max(0, Math.min(100, overallScore * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">Weighted by severity</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Total Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalAttributes}</div>
            <p className="mt-2 text-xs text-zinc-500">Distinct attributes checked</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Failing Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalFailedRules}</div>
            <p className="text-xs text-zinc-500 mt-2">Rules with &gt;0 failures</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Pass vs Fail</CardTitle>
          </CardHeader>
          <CardContent className="h-[92px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={[{ name: "Passed", value: agg.pass }, { name: "Failed", value: agg.fail }]} innerRadius={26} outerRadius={40}>
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 items-end">
            <div className="lg:col-span-2">
              <Label className="text-xs text-zinc-500">Search</Label>
              <div className="flex items-center gap-2">
                <Input placeholder="Attribute / Rule / Owner" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                <Button variant="outline" className="gap-2" onClick={() => { setSearch(""); setSevFilter([]); setRuleFilter([]); setOwnerFilter("all"); setOnlyFailing(false); setPage(1); }}>
                  <Filter className="w-4 h-4" /> Reset
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-zinc-500">Owner</Label>
              <Select value={ownerFilter} onValueChange={(v) => { setOwnerFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ownersAll.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Label className="text-xs text-zinc-500">Severity</Label>
              <div className="flex flex-wrap gap-2">
                {severities.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleArrayFilter(sevFilter, s, setSevFilter)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition ${SEVERITY_COLORS[s]} ${sevFilter.includes(s) ? "ring-2 ring-offset-1 ring-zinc-300" : "opacity-80"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-zinc-500">Rule Type</Label>
              <div className="flex flex-wrap gap-2">
                {ruleTypes.map((rt) => (
                  <button
                    key={rt}
                    onClick={() => toggleArrayFilter(ruleFilter, rt, setRuleFilter)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition ${RULE_COLORS[rt]} ${ruleFilter.includes(rt) ? "ring-2 ring-offset-1 ring-zinc-300" : "opacity-80"}`}
                  >
                    {rt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="onlyFailing" checked={onlyFailing} onCheckedChange={(v) => { setOnlyFailing(Boolean(v)); setPage(1); }} />
              <Label htmlFor="onlyFailing">Only failing</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500 flex items-center gap-2"><LineChartIcon className="w-4 h-4"/>DQ Score Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrend} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <XAxis dataKey="day" hide />
                <YAxis domain={[70, 100]} hide />
                <RTooltip formatter={(v) => `${v}%`} labelFormatter={(l) => `Day ${l}`} />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-500">Failures by Severity</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severities.map((s) => ({ name: s, value: agg.bySeverity[s] }))} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <RTooltip />
                <Bar dataKey="value">
                  <Cell fill="#ef4444" />
                  <Cell fill="#fb923c" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-zinc-500">Attribute-level Rules</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-zinc-50">
                  <SortableHeader label="Attribute" k="attribute" />
                  <SortableHeader label="Rule" k="rule" />
                  <SortableHeader label="Rule Type" k="ruleType" />
                  <SortableHeader label="Severity" k="severity" />
                  <SortableHeader label="Passed" k="passed" />
                  <SortableHeader label="Failed" k="failed" />
                  <SortableHeader label="Total" k="total" />
                  <SortableHeader label="Pass %" k="passRate" />
                  <SortableHeader label="Last Run" k="lastRun" />
                  <th className="px-3 py-2 text-left text-sm font-medium text-zinc-600">Owner</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-zinc-600">Trend</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, idx) => (
                  <tr key={r.id} className={idx % 2 ? "bg-white" : "bg-zinc-50/40"}>
                    <td className="px-3 py-2 text-sm font-medium text-zinc-800">{r.attribute}</td>
                    <td className="px-3 py-2 text-sm text-zinc-700">{r.rule}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${RULE_COLORS[r.ruleType]}`}>{r.ruleType}</span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>
                    </td>
                    <td className="px-3 py-2 text-sm text-emerald-700 font-medium">{r.passed.toLocaleString()}</td>
                    <td className={`px-3 py-2 text-sm font-medium ${r.failed ? "text-red-600" : "text-zinc-700"}`}>{r.failed.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-zinc-700">{r.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <div className={`h-2 ${r.passRate > 0.95 ? "bg-emerald-500" : r.passRate > 0.9 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${r.passRate * 100}%` }} />
                        </div>
                        <span className="min-w-[48px] text-right">{formatPct(r.passRate)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-zinc-600">{new Date(r.lastRun).toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-zinc-700">{r.owner}</td>
                    <td className="px-3 py-2">
                      <div className="w-28 h-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={r.trend.map((v, i) => ({ i, v: v * 100 }))}>
                            <XAxis dataKey="i" hide />
                            <YAxis domain={[70, 100]} hide />
                            <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setOpenRow(r)} className="h-8">Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious aria-disabled={page === 1} className={page === 1 ? "pointer-events-none opacity-50" : ""} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                </PaginationItem>
                {Array.from({ length: totalPages }).slice(0, 6).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext aria-disabled={page === totalPages} className={page === totalPages ? "pointer-events-none opacity-50" : ""} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Row Details Dialog */}
      <Dialog open={!!openRow} onOpenChange={(o) => !o && setOpenRow(null)}>
        {openRow && (
          <DialogContent className="max-w-3xl">
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Info className="w-4 h-4" /> {openRow.attribute} — <span className="text-zinc-500 text-sm">{openRow.rule}</span>
                </DialogTitle>
              </DialogHeader>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <DetailKV k="Rule Type" v={openRow.ruleType} badgeClass={RULE_COLORS[openRow.ruleType]} />
                <DetailKV k="Severity" v={openRow.severity} badgeClass={SEVERITY_COLORS[openRow.severity]} />
                <DetailKV k="Owner" v={openRow.owner} />
                <DetailKV k="Last Run" v={new Date(openRow.lastRun).toLocaleString()} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-500">Pass % Trend</CardTitle></CardHeader>
                  <CardContent className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={openRow.trend.map((v, i) => ({ day: i + 1, score: v * 100 }))}>
                        <XAxis dataKey="day" />
                        <YAxis domain={[70, 100]} />
                        <RTooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-500">Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ name: "Passed", v: openRow.passed }, { name: "Failed", v: openRow.failed }]}> 
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RTooltip />
                        <Bar dataKey="v">
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-500">Sample Issues</CardTitle></CardHeader>
                <CardContent>
                  {openRow.sampleIssues && openRow.sampleIssues.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs text-zinc-500">
                            <th className="py-2 pr-3">Record ID</th>
                            <th className="py-2 pr-3">Offending Value</th>
                            <th className="py-2 pr-3">Expected</th>
                            <th className="py-2 pr-3">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openRow.sampleIssues.map((s, i) => (
                            <tr key={i} className={i % 2 ? "bg-zinc-50" : "bg-white"}>
                              <td className="py-1.5 pr-3 text-sm font-mono">{s.recordId}</td>
                              <td className="py-1.5 pr-3 text-sm">{String(s.value)}</td>
                              <td className="py-1.5 pr-3 text-sm">{s.expected}</td>
                              <td className="py-1.5 pr-3 text-sm text-zinc-600">{s.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">No sample issues captured for this rule.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function DetailKV({ k, v, badgeClass }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{k}</div>
      {badgeClass ? (
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-xs ${badgeClass}`}>{v}</span>
      ) : (
        <div className="mt-1 text-sm text-zinc-800">{v}</div>
      )}
    </div>
  );
}
