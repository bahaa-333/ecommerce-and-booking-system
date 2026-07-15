import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Trash2, UserPlus } from "lucide-react";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import { apiDelete, apiGet, apiPatch, apiPost, extractErrorMessage } from "../../lib/api";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/Skeleton";

const ROLES = ["staff", "admin"];
const STATUSES = ["active", "inactive"];

export default function Team() {
  const { tenant } = useOutletContext();
  const path = tenant ? `tenants/${tenant.slug}/staff` : null;
  const { data: staff, setData: setStaff, meta, loading, setPage, reload } = usePaginatedFetch(path);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLookupError("");
    setAdding(true);
    try {
      const user = await apiGet(`tenants/${tenant.slug}/staff/lookup?email=${encodeURIComponent(email.trim())}`);
      await apiPost(`tenants/${tenant.slug}/staff`, { user_id: user.id, role: "staff" });
      setEmail("");
      setShowForm(false);
      reload();
    } catch (err) {
      setLookupError(extractErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function updateMember(member, changes) {
    setError("");
    setBusyId(member.id);
    try {
      const updated = await apiPatch(`tenants/${tenant.slug}/staff/${member.id}`, changes);
      setStaff((prev) => prev.map((m) => (m.id === member.id ? { ...m, ...updated } : m)));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(member) {
    if (!confirm(`Remove ${member.user?.name} from the team?`)) return;
    setError("");
    setBusyId(member.id);
    try {
      await apiDelete(`tenants/${tenant.slug}/staff/${member.id}`);
      reload();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-400">Everyone with access to {tenant?.name}.</p>
        </div>
        {tenant?.is_admin && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-[#f5a623] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e6981a]"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Email of an existing account</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="w-64 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add"}
          </button>
          {lookupError && <p className="w-full text-sm text-red-600">{lookupError}</p>}
        </form>
      )}

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {tenant?.is_admin && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={4} columns={tenant?.is_admin ? 5 : 4} />}
              {!loading && staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No teammates yet.
                  </td>
                </tr>
              )}
              {!loading &&
                staff.map((member) => (
                  <tr key={member.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-4 font-medium text-gray-900">{member.user?.name}</td>
                    <td className="px-5 py-4 text-gray-500">{member.user?.email}</td>
                    <td className="px-5 py-4">
                      {tenant?.is_admin ? (
                        <select
                          value={member.role}
                          disabled={busyId === member.id}
                          onChange={(e) => updateMember(member, { role: e.target.value })}
                          className="rounded-full border border-gray-200 px-3 py-1.5 text-xs capitalize focus:outline-none"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize text-gray-500">{member.role}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {tenant?.is_admin ? (
                        <select
                          value={member.status}
                          disabled={busyId === member.id}
                          onChange={(e) => updateMember(member, { status: e.target.value })}
                          className="rounded-full border border-gray-200 px-3 py-1.5 text-xs capitalize focus:outline-none"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={member.status} />
                      )}
                    </td>
                    {tenant?.is_admin && (
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          disabled={busyId === member.id}
                          onClick={() => handleRemove(member)}
                          className="rounded-full bg-red-50 p-1.5 text-red-500 hover:bg-red-100 disabled:opacity-60"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}