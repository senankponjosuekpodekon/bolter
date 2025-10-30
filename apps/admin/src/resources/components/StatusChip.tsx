import Chip from "@mui/material/Chip";

type StatusVariant = "default" | "success" | "warning" | "error" | "info";

const palette: Record<string, StatusVariant> = {
  ACTIVE: "success",
  SUSPENDED: "error",
  PENDING_VERIFICATION: "warning",
  CLOSED: "default",
  APPROVED: "success",
  REJECTED: "error",
  SUBMITTED: "warning",
  PENDING: "warning",
};

interface StatusChipProps {
  label?: string | null;
}

export const StatusChip = ({ label }: StatusChipProps) => {
  if (!label) {
    return (
      <Chip size="small" label="Unknown" variant="outlined" color="default" />
    );
  }
  const variant = palette[label.toUpperCase()] || "info";
  const formatted = label.toLowerCase().replace(/_/g, " ");
  const chipVariant = variant === "default" ? "outlined" : "filled";
  return (
    <Chip
      size="small"
      label={formatted}
      color={variant}
      variant={chipVariant}
      sx={{ textTransform: "capitalize" }}
    />
  );
};
