import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Store, Upload } from "lucide-react";
import { apiGet, apiPatch, apiPost, extractErrorMessage } from "../../lib/api";

export default function Storefront() {
  const { tenant } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [introText, setIntroText] = useState("");
  const [savingText, setSavingText] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!tenant) return;
    const controller = new AbortController();
    apiGet(`tenants/${tenant.slug}`, { signal: controller.signal })
      .then((data) => {
        setProfile(data);
        setIntroText(data.intro_text ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tenant]);

  async function handleSaveText(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingText(true);
    try {
      const updated = await apiPatch(`tenants/${tenant.slug}/profile`, { intro_text: introText });
      setProfile((prev) => ({ ...prev, ...updated }));
      setSuccess("Saved.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingText(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const updated = await apiPost(`tenants/${tenant.slug}/profile/photo`, formData);
      setProfile((prev) => ({ ...prev, ...updated }));
      setSuccess("Cover photo updated.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return <div className="py-24 text-center text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Storefront</h1>
      <p className="mt-1 text-sm text-gray-400">What customers see when they visit your business page.</p>

      {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {success && <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex h-48 items-center justify-center bg-gray-50">
          {profile?.cover_image_url ? (
            <img src={profile.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-10 w-10 text-gray-300" />
          )}
        </div>
        <div className="p-5">
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            <Upload className="h-4 w-4" />
            {uploadingPhoto ? "Uploading…" : "Change cover photo"}
            <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
          </label>
        </div>
      </div>

      <form onSubmit={handleSaveText} className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <label className="text-sm font-medium text-gray-900">Intro text</label>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Tell customers what your business is about…"
          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={savingText}
          className="mt-3 rounded-full bg-[#f5a623] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e6981a] disabled:opacity-60"
        >
          {savingText ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
