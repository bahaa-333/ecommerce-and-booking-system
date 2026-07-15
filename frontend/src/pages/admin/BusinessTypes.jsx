import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost, extractErrorMessage } from "../../lib/api";

function snakify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function BusinessTypes() {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    apiGet("admin/business-types", { signal: controller.signal })
      .then((data) => {
        setBusinessTypes(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    setCreating(true);
    try {
      const created = await apiPost("admin/business-types", {
        name: newName.trim(),
        slug: snakify(newName),
      });
      setBusinessTypes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function startEdit(businessType) {
    setEditingId(businessType.id);
    setEditName(businessType.name);
    setEditSlug(businessType.slug);
  }

  async function saveEdit(id) {
    setError("");
    setSavingId(id);
    try {
      const updated = await apiPatch(`admin/business-types/${id}`, { name: editName, slug: editSlug });
      setBusinessTypes((prev) => prev.map((bt) => (bt.id === id ? updated : bt)));
      setEditingId(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this business type?")) return;
    setError("");
    setDeletingId(id);
    try {
      await apiDelete(`admin/business-types/${id}`);
      setBusinessTypes((prev) => prev.filter((bt) => bt.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Business Types</h1>
      <p className="mt-1 text-sm text-gray-400">The business models tenants can register under.</p>

      <form onSubmit={handleCreate} className="mt-6 flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New business type name"
          className="w-72 rounded-full border border-gray-200 px-5 py-2.5 text-sm placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="flex items-center gap-2 rounded-full bg-[#f5a623] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e6981a] disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && businessTypes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-gray-400">
                  No business types yet.
                </td>
              </tr>
            )}
            {businessTypes.map((businessType) => (
              <tr key={businessType.id} className="border-b border-gray-50 last:border-0">
                {editingId === businessType.id ? (
                  <>
                    <td className="px-5 py-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={savingId === businessType.id}
                          onClick={() => saveEdit(businessType.id)}
                          className="rounded-full bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 disabled:opacity-60"
                          aria-label="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
                          aria-label="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-4 font-medium text-gray-900">{businessType.name}</td>
                    <td className="px-5 py-4 text-gray-400">{businessType.slug}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(businessType)}
                          className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === businessType.id}
                          onClick={() => handleDelete(businessType.id)}
                          className="rounded-full bg-red-50 p-1.5 text-red-500 hover:bg-red-100 disabled:opacity-60"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}