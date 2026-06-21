import { ClipboardList, Download, Filter, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useAuditStore } from "../store/auditStore.js";
import { formatDate } from "../utils/format.js";
import hasPermission from "../utils/hasPermission.js";

const severityClass = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  High: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

function toDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function AuditLogs() {
  const logs = useAuditStore((state) => state.logs);
  const clearLogs = useAuditStore((state) => state.clearLogs);
  const user = useAuthStore((state) => state.user);
  const canExportLogs = hasPermission(user, "settings.export");
  const canClearLogs = hasPermission(user, "settings.delete");
  const [filters, setFilters] = useState({ module: "", severity: "", search: "", startDate: "", endDate: "" });
  const modules = useMemo(() => [...new Set(logs.map((log) => log.module))].sort(), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const created = toDate(log.createdAt);
      const moduleMatch = !filters.module || log.module === filters.module;
      const severityMatch = !filters.severity || log.severity === filters.severity;
      const searchText = `${log.actor} ${log.action} ${log.target} ${log.details}`.toLowerCase();
      const searchMatch = !filters.search || searchText.includes(filters.search.toLowerCase());
      const startMatch = !filters.startDate || created >= filters.startDate;
      const endMatch = !filters.endDate || created <= filters.endDate;
      return moduleMatch && severityMatch && searchMatch && startMatch && endMatch;
    });
  }, [logs, filters]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters({ module: "", severity: "", search: "", startDate: "", endDate: "" });

  const exportCsv = () => {
    if (!canExportLogs) return;

    const header = ["Date", "Actor", "Action", "Module", "Target", "Severity", "Details"];
    const rows = filteredLogs.map((log) => [
      log.createdAt,
      log.actor,
      log.action,
      log.module,
      log.target,
      log.severity,
      log.details,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Track user actions, admin changes, automation events, and important system activity."
        action={
          <div className="flex flex-wrap gap-2">
            {canExportLogs ? (
              <button className="btn-muted" type="button" onClick={exportCsv}>
                <Download size={17} />
                Export
              </button>
            ) : null}
            {canClearLogs ? (
              <button className="btn-muted text-red-600 dark:text-red-300" type="button" onClick={clearLogs}>
                <Trash2 size={17} />
                Clear
              </button>
            ) : null}
          </div>
        }
      />

      <section className="surface mb-5 rounded-md p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={18} />
          <h2 className="font-bold">Filters</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-6">
          <label className="block lg:col-span-2">
            <span className="label">Search</span>
            <input className="input mt-1" placeholder="Actor, action, target, details" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} />
          </label>
          <label className="block">
            <span className="label">Module</span>
            <select className="input mt-1" value={filters.module} onChange={(event) => setFilter("module", event.target.value)}>
              <option value="">All modules</option>
              {modules.map((module) => (
                <option key={module}>{module}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Severity</span>
            <select className="input mt-1" value={filters.severity} onChange={(event) => setFilter("severity", event.target.value)}>
              <option value="">All severities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
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
        </div>
        <button className="btn-muted mt-3" type="button" onClick={resetFilters}>
          <RotateCcw size={17} />
          Reset filters
        </button>
      </section>

      <section className="surface overflow-hidden rounded-md">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4 dark:border-slate-700">
          <ClipboardList size={18} />
          <h2 className="font-bold">{filteredLogs.length} audit records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Target</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-4 font-semibold">{log.actor}</td>
                  <td className="px-4 py-4">{log.action}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{log.module}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{log.target}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${severityClass[log.severity]}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 ? <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">No audit logs match the current filters.</div> : null}
      </section>
    </>
  );
}
