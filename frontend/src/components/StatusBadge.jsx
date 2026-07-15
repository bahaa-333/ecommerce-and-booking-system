const STYLES = {
  pending: "bg-amber-50 text-amber-600",
  active: "bg-emerald-50 text-emerald-600",
  suspended: "bg-red-50 text-red-600",
  inactive: "bg-gray-100 text-gray-500",
  archived: "bg-gray-100 text-gray-500",
  confirmed: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-red-50 text-red-600",
  paid: "bg-emerald-50 text-emerald-600",
  unpaid: "bg-amber-50 text-amber-600",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${
        STYLES[status] ?? "bg-gray-100 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}