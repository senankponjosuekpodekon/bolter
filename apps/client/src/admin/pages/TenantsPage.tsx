import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton,
  Tooltip, CircularProgress, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useNotify } from "react-admin";
import api from "../../services/api";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  support_email?: string | null;
  plan: string;
  is_active: boolean;
  created_at?: string;
}

const PLANS = ["FREE", "PRO", "ENTERPRISE"];

const emptyForm = {
  name: "",
  slug: "",
  domain: "",
  logo_url: "",
  primary_color: "#2563eb",
  support_email: "",
  plan: "FREE",
};

export const TenantsPage: React.FC = () => {
  const notify = useNotify();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenants");
      setTenants(res.data ?? []);
    } catch {
      setError("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditTarget(t);
    setForm({
      name: t.name,
      slug: t.slug,
      domain: t.domain ?? "",
      logo_url: t.logo_url ?? "",
      primary_color: t.primary_color ?? "#2563eb",
      support_email: t.support_email ?? "",
      plan: t.plan,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/tenants/${editTarget.id}`, form);
        notify("Tenant updated", { type: "success" });
      } else {
        await api.post("/tenants", form);
        notify("Tenant created", { type: "success" });
      }
      setDialogOpen(false);
      load();
    } catch {
      notify("Save failed", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Deactivate this tenant? All its users will lose access.")) return;
    try {
      await api.patch(`/tenants/${id}/deactivate`);
      notify("Tenant deactivated", { type: "success" });
      load();
    } catch {
      notify("Failed to deactivate", { type: "error" });
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    notify("ID copied", { type: "info" });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Tenants</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Tenant
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700 } }}>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {t.primary_color && (
                        <Box
                          sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: t.primary_color, flexShrink: 0 }}
                        />
                      )}
                      <Typography fontWeight={500}>{t.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <code style={{ fontSize: 12 }}>{t.slug}</code>
                      <Tooltip title="Copy ID">
                        <IconButton size="small" onClick={() => copyId(t.id)}>
                          <ContentCopyIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {t.domain ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.plan}
                      size="small"
                      color={t.plan === "ENTERPRISE" ? "primary" : t.plan === "PRO" ? "secondary" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.is_active ? "Active" : "Inactive"}
                      size="small"
                      color={t.is_active ? "success" : "error"}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {t.is_active && (
                      <Tooltip title="Deactivate">
                        <IconButton size="small" color="error" onClick={() => handleDeactivate(t.id)}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>No tenants found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? "Edit Tenant" : "New Tenant"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} required fullWidth helperText="Used in subdomain: slug.bolter.app" disabled={!!editTarget} />
            <TextField label="Domain (optional)" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} fullWidth helperText="e.g. creditafrique.bolter.app" />
            <TextField label="Support Email" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} fullWidth />
            <TextField label="Logo URL" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} fullWidth />
            <Box display="flex" gap={2}>
              <TextField label="Primary Color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} fullWidth />
              <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: form.primary_color, border: "1px solid", borderColor: "divider", flexShrink: 0 }} />
            </Box>
            <TextField select label="Plan" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} fullWidth>
              {PLANS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.slug}>
            {saving ? <CircularProgress size={20} /> : editTarget ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantsPage;
