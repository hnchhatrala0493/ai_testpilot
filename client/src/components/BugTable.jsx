import { Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "./Badge.jsx";
import { BUG_STATUSES } from "../utils/constants.js";
import { formatDate } from "../utils/format.js";

export default function BugTable({ bugs, loading = false, onStatusChange, canUpdate = false }) {
  return (
    <div className="surface overflow-hidden rounded-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Bug Title</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Assigned To</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Created Date</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan="7">
                  Loading bugs...
                </td>
              </tr>
            ) : null}
            {!loading && bugs.map((bug) => (
              <tr key={bug.id} className="bg-white">
                <td className="px-4 py-4">
                  <p className="font-semibold text-ink">{bug.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{bug.ticketId}</p>
                </td>
                <td className="px-4 py-4 text-slate-600">{bug.project}</td>
                <td className="px-4 py-4 text-slate-600">{bug.assignedTo}</td>
                <td className="px-4 py-4">
                  {onStatusChange && canUpdate ? (
                    <select className="input w-36" value={bug.status} onChange={(event) => onStatusChange(bug.id, event.target.value)}>
                      {BUG_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge value={bug.status} />
                  )}
                </td>
                <td className="px-4 py-4">
                  <Badge value={bug.priority} type="priority" />
                </td>
                <td className="px-4 py-4 text-slate-600">{formatDate(bug.createdAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Link className="btn-muted h-9 w-9 p-0" to={`/bugs/${bug.id}`} aria-label={`View ${bug.ticketId}`}>
                      <Eye size={16} />
                    </Link>
                    {canUpdate ? (
                      <Link className="btn-muted h-9 w-9 p-0" to={`/bugs/${bug.id}`} aria-label={`Edit ${bug.ticketId}`}>
                        <Pencil size={16} />
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && bugs.length === 0 ? <div className="px-4 py-10 text-center text-sm text-slate-500">No bugs match the current filters.</div> : null}
    </div>
  );
}
