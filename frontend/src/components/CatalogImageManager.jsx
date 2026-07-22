import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { apiDelete, apiPost, extractErrorMessage } from "../lib/api";

const MAX_IMAGES = 4;

export default function CatalogImageManager({ basePath, images, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const image = await apiPost(`${basePath}/images`, formData);
      onChange([...images, image]);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(imageId) {
    setError("");
    setDeletingId(imageId);
    try {
      await apiDelete(`${basePath}/images/${imageId}`);
      onChange(images.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {images.map((image) => (
          <div key={image.id} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-gray-100">
            <img src={image.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={deletingId === image.id}
              onClick={() => handleDelete(image.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500">
            <ImagePlus className="h-4 w-4" />
            <span className="text-[10px]">{uploading ? "…" : "Add"}</span>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
