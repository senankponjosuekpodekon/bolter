import React, { useEffect, useState } from "react";
import { useNotify } from "react-admin";
import api from "../services/api";

interface ConfigEntry {
  key: string;
  value: { value: unknown; description?: string };
  updated_at: string;
  updated_by?: string;
}

export const SystemConfigPage: React.FC = () => {
  const notify = useNotify();
  const [entries, setEntries] = useState<ConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/system-config")
      .then((r) => {
        setEntries(r.data);
        const initial: Record<string, string> = {};
        r.data.forEach((e: ConfigEntry) => {
          initial[e.key] = String(e.value.value);
        });
        setEdits(initial);
      })
      .catch(() => notify("Failed to load system config", { type: "error" }))
      .finally(() => setLoading(false));
  }, [notify]);

  const handleSave = async (entry: ConfigEntry) => {
    setSaving(entry.key);
    try {
      const raw = edits[entry.key];
      let parsed: unknown = raw;
      if (raw === "true") parsed = true;
      else if (raw === "false") parsed = false;
      else if (!isNaN(Number(raw)) && raw !== "") parsed = Number(raw);

      await api.put(`/system-config/${entry.key}`, {
        value: parsed,
        description: entry.value.description,
      });
      setEntries((prev) =>
        prev.map((e) =>
          e.key === entry.key
            ? { ...e, value: { ...e.value, value: parsed }, updated_at: new Date().toISOString() }
            : e
        )
      );
      notify(`"${entry.key}" saved`, { type: "success" });
    } catch {
      notify(`Failed to save "${entry.key}"`, { type: "error" });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-slate-600">
        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        Loading system config…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
        <p className="text-slate-500 mt-1 text-sm">
          SUPER_ADMIN only — changes take effect within 30 seconds (cached).
        </p>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.key}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold text-slate-800">{entry.key}</p>
              {entry.value.description && (
                <p className="text-xs text-slate-500 mt-0.5">{entry.value.description}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Last updated: {new Date(entry.updated_at).toLocaleString()}
                {entry.updated_by ? ` by ${entry.updated_by}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {typeof entry.value.value === "boolean" ? (
                <button
                  onClick={() => {
                    const newVal = !( edits[entry.key] === "true");
                    setEdits((prev) => ({ ...prev, [entry.key]: String(newVal) }));
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    edits[entry.key] === "true" ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      edits[entry.key] === "true" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              ) : (
                <input
                  type="text"
                  value={edits[entry.key] ?? ""}
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [entry.key]: e.target.value }))
                  }
                  className="w-32 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              <button
                onClick={() => handleSave(entry)}
                disabled={saving === entry.key}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving === entry.key ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemConfigPage;
