import { BarChart3, CalendarDays, Download, Filter, Printer, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/Badge.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useBugStore } from "../store/bugStore.js";
import { BUG_PRIORITIES, BUG_STATUSES } from "../utils/constants.js";
import { formatDate } from "../utils/format.js";
import hasPermission from "../utils/hasPermission.js";

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function toDateInput(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function monthKey(value) {
  return new Date(value).toISOString().slice(0, 7);
}

function monthLabel(key) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(`${key}-01T00:00:00`));
}

function groupBy(items, keyGetter) {
  return items.reduce((groups, item) => {
    const key = keyGetter(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function summarize(items) {
  return {
    total: items.length,
    open: items.filter((bug) => bug.status === "Open").length,
    inProgress: items.filter((bug) => bug.status === "In Progress").length,
    testing: items.filter((bug) => bug.status === "Retest").length,
    resolved: items.filter((bug) => ["Fixed", "Closed"].includes(bug.status)).length,
    critical: items.filter((bug) => bug.priority === "Critical").length,
  };
}

export default function Reports() {
  const bugs = useBugStore((state) => state.bugs);
  const projects = useBugStore((state) => state.projects);
  const user = useAuthStore((state) => state.user);
  const canExportReports = hasPermission(user, "reports.export");
  const availableMonths = useMemo(() => [...new Set(bugs.map((bug) => monthKey(bug.createdAt)))].sort().reverse(), [bugs]);
  const earliest = bugs.length ? toDateInput(Math.min(...bugs.map((bug) => new Date(bug.createdAt).getTime()))) : "";
  const latest = bugs.length ? toDateInput(Math.max(...bugs.map((bug) => new Date(bug.createdAt).getTime()))) : "";
  const [filters, setFilters] = useState({
    project: "",
    month: "",
    startDate: earliest,
    endDate: latest,
  });

  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      const created = toDateInput(bug.createdAt);
      const projectMatch = !filters.project || bug.project === filters.project;
      const monthMatch = !filters.month || monthKey(bug.createdAt) === filters.month;
      const startMatch = !filters.startDate || created >= filters.startDate;
      const endMatch = !filters.endDate || created <= filters.endDate;
      return projectMatch && monthMatch && startMatch && endMatch;
    });
  }, [bugs, filters]);

  const totals = summarize(filteredBugs);
  const projectHealthScore = Math.max(0, 100 - totals.critical * 18 - totals.open * 8 - totals.testing * 5 + totals.resolved * 4);
  const projectRows = useMemo(() => {
    const grouped = groupBy(filteredBugs, (bug) => bug.project);
    return Object.entries(grouped)
      .map(([project, items]) => ({ project, ...summarize(items) }))
      .sort((a, b) => b.total - a.total);
  }, [filteredBugs]);
  const monthRows = useMemo(() => {
    const grouped = groupBy(filteredBugs, (bug) => monthKey(bug.createdAt));
    return Object.entries(grouped)
      .map(([month, items]) => ({ month, ...summarize(items) }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredBugs]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters({ project: "", month: "", startDate: earliest, endDate: latest });
  const exportRows = filteredBugs.map((bug) => ({
    ticketId: bug.ticketId,
    title: bug.title,
    project: bug.project,
    status: bug.status,
    priority: bug.priority,
    severity: bug.severity || bug.priority,
    assignedTo: bug.assignedTo,
    createdAt: bug.createdAt,
  }));
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportCsv = () => {
    if (!canExportReports) return;

    const headers = Object.keys(exportRows[0] || { ticketId: "", title: "", project: "", status: "", priority: "", severity: "", assignedTo: "", createdAt: "" });
    const csv = [headers, ...exportRows.map((row) => headers.map((key) => row[key]))]
      .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    downloadFile(csv, "bug-report.csv", "text/csv;charset=utf-8");
  };
  const exportExcel = () => {
    if (!canExportReports) return;

    const headers = Object.keys(exportRows[0] || { ticketId: "", title: "", project: "", status: "", priority: "", severity: "", assignedTo: "", createdAt: "" });
    const table = `<table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${exportRows
      .map((row) => `<tr>${headers.map((key) => `<td>${row[key] || ""}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
    downloadFile(table, "bug-report.xls", "application/vnd.ms-excel");
  };
  const exportPdf = () => {
    if (!canExportReports) return;
    window.print();
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Filter reports by date, month, and project, then review progress by project and month."
        action={
          canExportReports ? (
            <div className="flex flex-wrap gap-2">
              <button className="btn-muted" type="button" onClick={exportCsv}>
                <Download size={17} />
                CSV
              </button>
              <button className="btn-muted" type="button" onClick={exportExcel}>
                <Download size={17} />
                Excel
              </button>
              <button className="btn-muted" type="button" onClick={exportPdf}>
                <Printer size={17} />
                PDF
              </button>
            </div>
          ) : null
        }
      />

      <section className="surface mb-5 rounded-md p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={18} />
          <h2 className="font-bold">Report filters</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <label className="block">
            <span className="label">Project</span>
            <select className="input mt-1" value={filters.project} onChange={(event) => setFilter("project", event.target.value)}>
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Month</span>
            <select className="input mt-1" value={filters.month} onChange={(event) => setFilter("month", event.target.value)}>
              <option value="">All months</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {monthLabel(month)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Start date</span>
            <input className="input mt-1" type="date" value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} />
          </label>
          <label className="block">
            <span className="label">End date</span>
            <input className="input mt-1" type="date" value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} />
          </label>
          <div className="flex items-end">
            <button className="btn-muted w-full" type="button" onClick={resetFilters}>
              <RotateCcw size={17} />
              Reset
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Filtered Bugs" value={totals.total} icon={BarChart3} helper="Tickets in current report" />
        <StatCard label="Fix Rate" value={`${getPercent(totals.resolved, totals.total)}%`} icon={CalendarDays} tone="emerald" helper={`${totals.resolved} fixed or closed`} />
        <StatCard label="Critical Bugs" value={totals.critical} icon={BarChart3} tone="red" helper="Critical bugs in filter" />
        <StatCard label="Retest Queue" value={totals.testing} icon={BarChart3} tone="amber" helper="Ready for QA verification" />
        <StatCard label="Project Health" value={`${Math.min(projectHealthScore, 100)}%`} icon={BarChart3} tone="emerald" helper="Based on open, critical, retest, fixed" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="surface rounded-md p-5">
          <h2 className="font-bold">Project-wise report</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Project</th>
                  <th className="px-3 py-3 font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Open</th>
                  <th className="px-3 py-3 font-semibold">In Progress</th>
                  <th className="px-3 py-3 font-semibold">Fixed</th>
                  <th className="px-3 py-3 font-semibold">Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {projectRows.map((row) => (
                  <tr key={row.project}>
                    <td className="px-3 py-3 font-semibold">{row.project}</td>
                    <td className="px-3 py-3">{row.total}</td>
                    <td className="px-3 py-3">{row.open}</td>
                    <td className="px-3 py-3">{row.inProgress}</td>
                    <td className="px-3 py-3">{row.resolved}</td>
                    <td className="px-3 py-3">{row.critical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projectRows.length === 0 ? <p className="py-6 text-sm text-slate-500">No project report data for this filter.</p> : null}
          </div>
        </section>

        <section className="surface rounded-md p-5">
          <h2 className="font-bold">Month-wise report</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Month</th>
                  <th className="px-3 py-3 font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Open</th>
                  <th className="px-3 py-3 font-semibold">Retest</th>
                  <th className="px-3 py-3 font-semibold">Fixed</th>
                  <th className="px-3 py-3 font-semibold">Fix Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {monthRows.map((row) => (
                  <tr key={row.month}>
                    <td className="px-3 py-3 font-semibold">{monthLabel(row.month)}</td>
                    <td className="px-3 py-3">{row.total}</td>
                    <td className="px-3 py-3">{row.open}</td>
                    <td className="px-3 py-3">{row.testing}</td>
                    <td className="px-3 py-3">{row.resolved}</td>
                    <td className="px-3 py-3">{getPercent(row.resolved, row.total)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {monthRows.length === 0 ? <p className="py-6 text-sm text-slate-500">No monthly report data for this filter.</p> : null}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="surface rounded-md p-5">
          <h2 className="font-bold">Status breakdown</h2>
          <div className="mt-5 space-y-4">
            {BUG_STATUSES.map((status) => {
              const count = filteredBugs.filter((bug) => bug.status === status).length;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold">{status}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${getPercent(count, totals.total)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface rounded-md p-5">
          <h2 className="font-bold">Priority breakdown</h2>
          <div className="mt-5 space-y-4">
            {BUG_PRIORITIES.map((priority) => {
              const count = filteredBugs.filter((bug) => bug.priority === priority).length;
              return (
                <div key={priority}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold">{priority}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-mint" style={{ width: `${getPercent(count, totals.total)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="surface mt-6 rounded-md p-5">
        <h2 className="font-bold">Severity-wise bugs</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {BUG_PRIORITIES.map((priority) => {
            const count = filteredBugs.filter((bug) => (bug.severity || bug.priority) === priority).length;
            return (
              <article key={priority} className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-sm font-semibold text-slate-500">{priority}</p>
                <p className="mt-2 text-3xl font-bold">{count}</p>
                <p className="mt-1 text-xs text-slate-500">{getPercent(count, totals.total)}% of filtered bugs</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface mt-6 overflow-hidden rounded-md">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-bold">Filtered bug records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Bug</th>
                <th className="px-4 py-3 font-semibold">Project</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Assigned To</th>
                <th className="px-4 py-3 font-semibold">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredBugs.map((bug) => (
                <tr key={bug.id}>
                  <td className="px-4 py-4">
                    <Link className="font-semibold text-brand" to={`/bugs/${bug.id}`}>
                      {bug.ticketId}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{bug.title}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{bug.project}</td>
                  <td className="px-4 py-4">
                    <Badge value={bug.status} />
                  </td>
                  <td className="px-4 py-4">
                    <Badge value={bug.priority} type="priority" />
                  </td>
                  <td className="px-4 py-4 text-slate-600">{bug.assignedTo}</td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(bug.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBugs.length === 0 ? <div className="px-5 py-8 text-sm text-slate-500">No bugs found for the selected report filters.</div> : null}
      </section>
    </>
  );
}
