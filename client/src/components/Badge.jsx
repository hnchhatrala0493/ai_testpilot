import { priorityColor, statusColor } from "../utils/constants.js";

export default function Badge({ value, type = "status" }) {
  const colors = type === "priority" ? priorityColor : statusColor;
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold ${colors[value] || "border-line bg-white text-slate-600"}`}>
      {value}
    </span>
  );
}
