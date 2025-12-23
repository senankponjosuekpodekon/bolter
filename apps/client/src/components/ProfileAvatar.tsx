import React, { useState } from "react";
import axios from "axios";

export default function ProfileAvatar(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError(null);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Type de fichier non supporté");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Fichier trop volumineux (>2MB)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await axios.post("/profile/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarUrl(data?.url || null);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } } | null;
      setError(error?.response?.data?.message || "Erreur upload");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvatar = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/profile/avatar");
      setAvatarUrl(data?.url || null);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } } | null;
      setError(error?.response?.data?.message || "Erreur récupération");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete("/profile/avatar");
      setAvatarUrl(null);
      setPreview(null);
      setFile(null);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } } | null;
      setError(error?.response?.data?.message || "Erreur suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
        />
        <button
          onClick={upload}
          disabled={!file || loading}
          className="btn btn-primary"
        >
          {loading ? "Envoi…" : "Uploader"}
        </button>
        <button onClick={fetchAvatar} disabled={loading} className="btn">
          Charger avatar
        </button>
        <button onClick={remove} disabled={loading} className="btn btn-danger">
          Supprimer
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-6">
        {preview && (
          <div>
            <p className="text-sm">Preview local</p>
            <img
              src={preview}
              alt="preview"
              className="h-24 w-24 rounded-full object-cover"
            />
          </div>
        )}
        {avatarUrl && (
          <div>
            <p className="text-sm">Avatar (signé)</p>
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-24 w-24 rounded-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
