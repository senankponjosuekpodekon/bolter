import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Datagrid,
  DateField,
  FunctionField,
  List,
  NumberField,
  Show,
  SimpleShowLayout,
  TextField,
  TextInput,
  TopToolbar,
  Button,
  useNotify,
  useRedirect,
  useRefresh,
} from "react-admin";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField as MuiTextField,
  Typography,
  Chip,
  Box,
  Button as MuiButton,
  MenuItem,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const loanStatusColor = (
  status?: string
): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "APPROVED":
    case "IN_PROGRESS":
    case "PAID":
      return "success";
    case "LATE_PAYMENT":
      return "warning";
    case "REJECTED":
      return "error";
    default:
      return "default";
  }
};

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const loanFilters = [
  <TextInput key="search" source="search" label="Recherche" alwaysOn />,
];

const LoanListActions = () => (
  <TopToolbar>
    <Typography variant="subtitle2" sx={{ px: 2 }}>
      Gestion des prêts
    </Typography>
  </TopToolbar>
);

const LoanStatusChip = ({ status }: { status?: string }) => (
  <Chip
    size="small"
    color={loanStatusColor(status)}
    label={status?.toLowerCase().replace(/_/g, " ") ?? "inconnu"}
    sx={{ textTransform: "uppercase", fontSize: 11, fontWeight: 600 }}
  />
);

interface DecisionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  title: string;
  submitLabel: string;
  children: React.ReactNode;
}

const DecisionDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel,
  children,
}: DecisionDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (value !== "" && value !== null) {
        payload[key] = value;
      }
    });
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Une erreur inattendue est survenue.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          {children}
          {submitError ? (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {submitError}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button label="Annuler" onClick={onClose} disabled={submitting} />
          <Button label={submitLabel} type="submit" disabled={submitting} />
        </DialogActions>
      </Box>
    </Dialog>
  );
};

interface LoanRecord {
  id: string;
  amount?: number;
  interest_rate?: number;
  status?: string;
  user?: { id?: string; email?: string };
  user_id?: string;
  monthly_payment?: number;
  approved_amount?: number;
  duration_months?: number;
  risk_score?: number;
  created_at?: string;
  supporting_documents?: SupportingDocument[];
}

interface LoanDecisionButtonsProps {
  record?: LoanRecord;
}

const LoanDecisionButtons = ({ record }: LoanDecisionButtonsProps) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  interface Account {
    id: string;
    account_number?: string;
    balance?: number;
  }
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accountsLoading, setAccountsLoading] = useState(false);

  const loanUserId = useMemo(
    () => record?.user?.id ?? record?.user_id ?? null,
    [record?.user?.id, record?.user_id]
  );

  useEffect(() => {
    if (!loanUserId) {
      setAccounts([]);
      setSelectedAccountId("");
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const fetchAccounts = async () => {
      setAccountsLoading(true);
      setAccountsError(null);
      try {
        const response = await fetch(
          `${API_URL}/accounts?scope=admin&take=100&userId=${encodeURIComponent(loanUserId)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error?.message || "Impossible de charger les comptes du client"
          );
        }

        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : (payload?.data ?? []);
        if (!Array.isArray(items)) {
          throw new Error("Réponse inattendue du serveur pour les comptes");
        }

        if (isMounted) {
          setAccounts(items);
          setSelectedAccountId(items[0]?.id ?? "");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Impossible de récupérer les comptes";
        if (isMounted) {
          setAccounts([]);
          setSelectedAccountId("");
          setAccountsError(message);
        }
        notify(message, { type: "warning" });
      } finally {
        if (isMounted) {
          setAccountsLoading(false);
        }
      }
    };

    fetchAccounts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [loanUserId, notify]);

  const toNumber = (value: unknown) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const cleanString = (value: unknown) => {
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  };

  const handleApprove = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!record) throw new Error("Loan record is undefined");

      const sanitizedDisbursementAccountId = cleanString(
        payload.disbursementAccountId
      );
      const accountIdPattern = /^[0-9a-fA-F-]{36}$/;
      if (
        sanitizedDisbursementAccountId &&
        !accountIdPattern.test(sanitizedDisbursementAccountId)
      ) {
        notify("Identifiant de compte non valide", { type: "warning" });
        throw new Error("Invalid disbursement account id");
      }

      const requestBody: Record<string, unknown> = {
        interestRate: toNumber(payload.interestRate),
        approvedAmount: toNumber(payload.approvedAmount),
        approvalNotes: cleanString(payload.approvalNotes),
      };

      if (sanitizedDisbursementAccountId) {
        requestBody.disbursementAccountId = sanitizedDisbursementAccountId;
      }

      const response = await fetch(`${API_URL}/loans/${record.id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = error?.message || "Impossible d'approuver le prêt";
        notify(errorMessage, { type: "warning" });
        throw new Error(errorMessage);
      }
      notify("Prêt approuvé", { type: "info" });
      refresh();
      redirect("list", "loans");
    },
    [notify, refresh, redirect, record?.id]
  );

  const handleReject = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!record) throw new Error("Loan record is undefined");

      const response = await fetch(`${API_URL}/loans/${record.id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({ reason: cleanString(payload.reason) }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = error?.message || "Impossible de rejeter le prêt";
        notify(errorMessage, { type: "warning" });
        throw new Error(errorMessage);
      }
      notify("Prêt rejeté", { type: "warning" });
      refresh();
      redirect("list", "loans");
    },
    [notify, refresh, redirect, record?.id]
  );

  // Fix: ensure 'disabled' is always boolean
  const disabled = !!record && record.status !== "PENDING_REVIEW";

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      <Button
        label="Approuver"
        onClick={() => setApproveOpen(true)}
        disabled={!!disabled}
        startIcon={<CheckCircleIcon />}
      />
      <Button
        label="Rejeter"
        color="error"
        onClick={() => setRejectOpen(true)}
        disabled={!!disabled}
        startIcon={<CancelIcon />}
      />

      <DecisionDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onSubmit={handleApprove}
        title="Approuver le prêt"
        submitLabel="Approuver"
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Ajuster les paramètres avant l&apos;approbation.
          </Typography>
          <MuiTextField
            name="approvedAmount"
            label="Montant approuvé"
            type="number"
            defaultValue={record?.amount}
            inputProps={{ min: 0, step: 100 }}
            fullWidth
          />
          <MuiTextField
            name="interestRate"
            label="Taux d'intérêt (ex: 0.07)"
            type="number"
            defaultValue={record?.interest_rate ?? 0.07}
            inputProps={{ min: 0, max: 1, step: 0.005 }}
            fullWidth
          />
          {accountsLoading ? (
            <Typography variant="body2" color="text.secondary">
              Chargement des comptes disponibles...
            </Typography>
          ) : accounts.length ? (
            <MuiTextField
              select
              name="disbursementAccountId"
              label="Compte de décaissement"
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
              helperText={
                selectedAccountId
                  ? "Les fonds seront versés sur le compte sélectionné"
                  : "Laisser vide pour utiliser le compte principal du client"
              }
              fullWidth
            >
              <MenuItem value="">Sélection automatique</MenuItem>
              {accounts.map((account) => (
                <MenuItem value={account.id} key={account.id}>
                  {(account.account_number as string | undefined) ??
                    account.id.slice(0, 8)}{" "}
                  – {euro.format(Number(account.balance ?? 0))}
                </MenuItem>
              ))}
            </MuiTextField>
          ) : (
            <MuiTextField
              name="disbursementAccountId"
              label="Compte de décaissement"
              placeholder="Identifiant du compte"
              helperText="Saisir un identifiant précis ou laisser vide pour la sélection automatique"
              fullWidth
            />
          )}
          {accountsError ? (
            <Typography variant="body2" color="error">
              {accountsError}
            </Typography>
          ) : null}
          <MuiTextField
            name="approvalNotes"
            label="Note interne"
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </DecisionDialog>

      <DecisionDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
        title="Rejeter le prêt"
        submitLabel="Rejeter"
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Merci d&apos;expliquer la raison du refus.
          </Typography>
          <MuiTextField
            required
            name="reason"
            label="Motif"
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DecisionDialog>
    </Stack>
  );
};

export const LoanList = () => (
  <List
    filters={loanFilters}
    actions={<LoanListActions />}
    perPage={25}
    sort={{ field: "created_at", order: "DESC" }}
  >
    <Datagrid rowClick="show">
      <TextField source="user.email" label="Client" />
      <NumberField
        source="amount"
        label="Montant"
        options={{ style: "currency", currency: "EUR" }}
      />
      <NumberField source="duration_months" label="Durée (mois)" />
      <FunctionField
        label="Mensualité"
        render={(record: LoanRecord) =>
          record?.monthly_payment ? euro.format(record.monthly_payment) : "-"
        }
      />
      <FunctionField
        label="Statut"
        render={(record: LoanRecord) => (
          <LoanStatusChip status={record.status} />
        )}
      />
      <NumberField source="risk_score" label="Score risque" />
      <DateField source="created_at" label="Créé le" showTime />
    </Datagrid>
  </List>
);

interface SupportingDocument {
  url?: string;
}

export const LoanShow = () => (
  <Show
    actions={
      <TopToolbar>
        <Button label="Retour" to="/loans" />
      </TopToolbar>
    }
  >
    <SimpleShowLayout>
      <TextField source="id" label="Identifiant du prêt" />
      <FunctionField
        label="Statut"
        render={(record: LoanRecord) => (
          <LoanStatusChip status={record.status} />
        )}
      />
      <TextField source="user.email" label="Client" />
      <NumberField
        source="amount"
        label="Montant demandé"
        options={{ style: "currency", currency: "EUR" }}
      />
      <NumberField
        source="approved_amount"
        label="Montant approuvé"
        options={{ style: "currency", currency: "EUR" }}
      />
      <NumberField source="duration_months" label="Durée (mois)" />
      <NumberField
        source="monthly_income"
        label="Revenu mensuel"
        options={{ style: "currency", currency: "EUR" }}
      />
      <NumberField
        source="monthly_payment"
        label="Mensualité"
        options={{ style: "currency", currency: "EUR" }}
      />
      <NumberField
        source="total_cost"
        label="Coût total"
        options={{ style: "currency", currency: "EUR" }}
      />
      <NumberField
        source="outstanding_balance"
        label="Solde restant"
        options={{ style: "currency", currency: "EUR" }}
      />
      <NumberField
        source="interest_rate"
        label="Taux"
        options={{ style: "percent", minimumFractionDigits: 2 }}
      />
      <DateField source="approved_at" label="Approuvé le" showTime />
      <DateField
        source="next_payment_due_at"
        label="Prochaine échéance"
        showTime
      />
      <TextField source="purpose" label="Objet" />
      <TextField source="notes" label="Notes" />
      <FunctionField
        label="Documents"
        render={(
          record: LoanRecord & { supporting_documents?: SupportingDocument[] }
        ) => {
          if (!record?.supporting_documents?.length) {
            return (
              <Typography variant="body2">Aucun document fourni</Typography>
            );
          }
          return (
            <Stack spacing={1}>
              {record.supporting_documents.map(
                (doc: SupportingDocument, index: number) => (
                  <Box key={index} display="flex" gap={1} alignItems="center">
                    {doc.url ? (
                      <MuiButton
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                      >
                        Ouvrir
                      </MuiButton>
                    ) : null}
                  </Box>
                )
              )}
            </Stack>
          );
        }}
      />
      <FunctionField
        label="Décision"
        render={(record: LoanRecord) => <LoanDecisionButtons record={record} />}
      />
    </SimpleShowLayout>
  </Show>
);
