import { Fragment, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, Image, Pencil, Plus, Trash2, X } from "lucide-react";
import { usePaginatedFetch } from "../../lib/usePaginatedFetch";
import { apiDelete, apiPatch, apiPost, extractErrorMessage } from "../../lib/api";
import { slugify } from "../../lib/slugify";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import CatalogImageManager from "../../components/CatalogImageManager";
import { TableSkeleton } from "../../components/Skeleton";

const STATUSES = ["active", "inactive", "archived"];

export default function Products() {
  const { tenant } = useOutletContext();
  const path = tenant ? `tenants/${tenant.slug}/products` : null;
  const { data: products, setData: setProducts, meta, loading, setPage, reload } = usePaginatedFetch(path);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [imagesOpenId, setImagesOpenId] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setError("");
    setCreating(true);
    try {
      await apiPost(`tenants/${tenant.slug}/products`, {
        name: name.trim(),
        slug: slugify(name),
        price: Number(price),
        stock_quantity: stock === "" ? null : Number(stock),
      });
      setName("");
      setPrice("");
      setStock("");
      setShowForm(false);
      reload();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price);
    setEditStock(product.stock_quantity ?? "");
    setEditStatus(product.status);
  }

  async function saveEdit(id) {
    setError("");
    setSavingId(id);
    try {
      const updated = await apiPatch(`tenants/${tenant.slug}/products/${id}`, {
        name: editName,
        price: Number(editPrice),
        stock_quantity: editStock === "" ? null : Number(editStock),
        status: editStatus,
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Archive this product?")) return;
    setError("");
    setDeletingId(id);
    try {
      await apiDelete(`tenants/${tenant.slug}/products/${id}`);
      reload();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-400">Buy-now items in your catalog.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-[#f5a623] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e6981a]"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-48 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Stock (optional)</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-28 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
          >
            {creating ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <TableSkeleton rows={5} columns={5} />}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                  No products yet.
                </td>
              </tr>
            )}
            {!loading &&
              products.map((product) => (
                <Fragment key={product.id}>
                {editingId === product.id ? (
                  <tr className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-24 rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min="0"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="w-20 rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="rounded-full border border-gray-200 px-3 py-1.5 text-xs capitalize focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={savingId === product.id}
                          onClick={() => saveEdit(product.id)}
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
                  </tr>
                ) : (
                  <tr className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="px-5 py-4 text-gray-500">${Number(product.price).toFixed(2)}</td>
                    <td className="px-5 py-4 text-gray-500">{product.stock_quantity ?? "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setImagesOpenId((id) => (id === product.id ? null : product.id))}
                          className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
                          aria-label="Manage images"
                        >
                          <Image className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => handleDelete(product.id)}
                          className="rounded-full bg-red-50 p-1.5 text-red-500 hover:bg-red-100 disabled:opacity-60"
                          aria-label="Archive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {imagesOpenId === product.id && (
                  <tr className="border-b border-gray-50 bg-gray-50/60 last:border-0">
                    <td colSpan={5} className="px-5 py-4">
                      <CatalogImageManager
                        basePath={`tenants/${tenant.slug}/products/${product.id}`}
                        images={product.images ?? []}
                        onChange={(images) =>
                          setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, images } : p)))
                        }
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
          </tbody>
        </table>
        </div>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}