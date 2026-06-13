import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Stack,
} from "@mui/material";
import { useNotify } from "react-admin";

interface BulkOperationsDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  action: "approve" | "reject" | "delete" | "flag";
  selectedIds: string[];
  resourceType: "kyc_documents" | "transactions";
  onSuccess?: () => void;
}

export const BulkOperationsDialog: React.FC<BulkOperationsDialogProps> = ({
  open,
  onClose,
  title,
  action,
  selectedIds,
  resourceType,
  onSuccess,
}) => {
  const notify = useNotify();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async () => {
    if (!reason.trim() && ["reject", "flag"].includes(action)) {
      notify("Please provide a reason", { type: "warning" });
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const token = localStorage.getItem("token");
      const endpoint =
        resourceType === "kyc_documents"
          ? `/api/admin/bulk-operations/kyc/${action}`
          : `/api/admin/bulk-operations/transactions/${action}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ids: selectedIds,
          action,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform bulk operation");
      }

      const result = await response.json();

      // Simulate progress
      for (let i = progress; i <= 100; i += 10) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      notify(
        `Successfully processed ${result.success} items${result.failed > 0 ? ` (${result.failed} failed)` : ""}`,
        { type: "success" }
      );

      setReason("");
      setProgress(0);
      onClose();
      onSuccess?.();
    } catch (error) {
      notify(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        { type: "error" }
      );
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getActionLabel = (): string => {
    switch (action) {
      case "approve":
        return "Approve Selected";
      case "reject":
        return "Reject Selected";
      case "flag":
        return "Flag for Review";
      case "delete":
        return "Delete Selected";
      default:
        return "Perform Action";
    }
  };

  const getActionColor = (): "success" | "error" | "warning" | "info" => {
    switch (action) {
      case "approve":
        return "success";
      case "reject":
      case "delete":
        return "error";
      case "flag":
        return "warning";
      default:
        return "info";
    }
  };

  const requiresReason = ["reject", "flag"].includes(action);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          You are about to <strong>{getActionLabel().toLowerCase()}</strong>{" "}
          {selectedIds.length} item(s)
        </Alert>

        {loading && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2">Processing...</Typography>
              <Typography variant="body2">{progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {requiresReason && (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={action === "reject" ? "Rejection Reason" : "Flag Reason"}
            placeholder={
              action === "reject"
                ? "Explain why these items are being rejected..."
                : "Explain why these items need manual review..."
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />
        )}

        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              Selected Items ({selectedIds.length}):
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                maxHeight: 150,
                overflow: "auto",
              }}
            >
              {selectedIds.slice(0, 10).map((id) => (
                <Chip key={id} label={id} size="small" variant="outlined" />
              ))}
              {selectedIds.length > 10 && (
                <Chip
                  label={`+${selectedIds.length - 10} more`}
                  size="small"
                  variant="filled"
                />
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={getActionColor()}
          disabled={
            loading ||
            (requiresReason && !reason.trim()) ||
            selectedIds.length === 0
          }
        >
          {loading ? "Processing..." : getActionLabel()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
