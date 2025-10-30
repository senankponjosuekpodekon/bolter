import React from "react";
import {
  BooleanInput,
  Button,
  Create,
  Datagrid,
  DateField,
  Edit,
  FormDataConsumer,
  FunctionField,
  List,
  Loading,
  NumberInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  TopToolbar,
  ExportButton,
  required,
  useGetList,
  useNotify,
  useRecordContext,
  useRedirect,
} from "react-admin";
import { useEffect, useMemo, useState } from "react";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const transactionTypeChoices = [
  { id: "TRANSFER", name: "Transfer" },
  { id: "DEPOSIT", name: "Deposit" },
  { id: "WITHDRAWAL", name: "Withdrawal" },
];

const transactionStatusChoices = [
  { id: "PENDING", name: "Pending" },
  { id: "APPROVED", name: "Approved" },
  { id: "REJECTED", name: "Rejected" },
  { id: "COMPLETED", name: "Completed" },
  { id: "CANCELLED", name: "Cancelled" },
];

const paymentMethodChoices = [
  { id: "BANK_TRANSFER", name: "Bank transfer" },
  { id: "CARD", name: "Card" },
  { id: "CASH", name: "Cash" },
  { id: "CHECK", name: "Check" },
];

const historyFilters = [
  <SelectInput
    key="type"
    source="type"
    label="Type"
    choices={transactionTypeChoices}
    alwaysOn
  />,
  <SelectInput
    key="status"
    source="status"
    label="Status"
    choices={transactionStatusChoices}
  />,
  <TextInput key="account" source="accountId" label="Account ID" />,
  <TextInput key="user" source="userId" label="User ID" />,
  <TextInput key="search" source="search" label="Search" />,
  <SelectInput
    key="autoApproved"
    source="autoApproved"
    label="Auto approved"
    choices={[
      { id: "true", name: "Yes" },
      { id: "false", name: "No" },
    ]}
  />,
];

const TransactionListActions = () => (
  <TopToolbar>
    <ExportButton />
  </TopToolbar>
);

const renderAccount = (account: any, fallback?: string) => {
  if (!account) {
    return fallback ?? "N/A";
  }
  const ownerName =
    `${account.user?.first_name ?? ""} ${account.user?.last_name ?? ""}`.trim();
  const owner = ownerName || account.user?.email || account.user_id;
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", flexDirection: "column" }}
    >
      <strong>{account.account_number}</strong>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{owner}</span>
    </Box>
  );
};

const TransactionHistoryList: React.FC = () => (
  <List
    filters={historyFilters}
    sort={{ field: "created_at", order: "DESC" }}
    perPage={25}
    actions={<TransactionListActions />}
  >
    <Datagrid rowClick={false} bulkActionButtons={false}>
      <FunctionField
        label="Type"
        render={(record: any) => (
          <Chip
            size="small"
            color={
              record?.type === "DEPOSIT"
                ? "primary"
                : record?.type === "WITHDRAWAL"
                  ? "warning"
                  : "default"
            }
            label={record?.type?.toLowerCase() ?? "unknown"}
            sx={{ textTransform: "uppercase" }}
          />
        )}
      />
      <FunctionField
        label="Amount"
        render={(record: any) =>
          euroFormatter.format(Number(record?.amount ?? 0))
        }
      />
      <FunctionField
        label="From"
        render={(record: any) =>
          record?.fromAccount
            ? renderAccount(record.fromAccount)
            : record?.iban_external
              ? `External (${record.iban_external})`
              : "N/A"
        }
      />
      <FunctionField
        label="To"
        render={(record: any) => {
          if (record?.toAccount) {
            return renderAccount(record.toAccount);
          }
          if (record?.type === "WITHDRAWAL") {
            return `External (${record?.iban_external ?? "N/A"})`;
          }
          if (record?.iban_external && record?.type !== "WITHDRAWAL") {
            return `External (${record.iban_external})`;
          }
          return "N/A";
        }}
      />
      <FunctionField
        label="Status"
        render={(record: any) => (
          <Chip
            size="small"
            color={
              record?.status === "APPROVED"
                ? "success"
                : record?.status === "REJECTED"
                  ? "error"
                  : "default"
            }
            label={record?.status?.toLowerCase() ?? "unknown"}
            sx={{ textTransform: "uppercase" }}
          />
        )}
      />
      <FunctionField
        label="Validator"
        render={(record: any) =>
          record?.validator?.email ?? record?.validated_by ?? "N/A"
        }
      />
      <TextField source="description" label="Description" />
      <DateField source="created_at" label="Created" showTime />
      <DateField source="validated_at" label="Validated" showTime />
    </Datagrid>
  </List>
);

const PendingTransactionList: React.FC = () => (
  <List sort={{ field: "created_at", order: "ASC" }} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="ID" />
      <TextField source="type" label="Type" />
      <TextField source="from_account_id" label="From" />
      <TextField source="to_account_id" label="To" />
      <TextField source="iban_external" label="External IBAN" />
      <TextField source="description" label="Description" />
      <TextField source="amount" label="Amount" />
      <TextField source="currency" label="Currency" />
      <DateField source="created_at" label="Created" showTime />
    </Datagrid>
  </List>
);

const TransactionValidation: React.FC = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={false}>
      <TransactionValidationContent />
    </SimpleForm>
  </Edit>
);

const TransactionValidationContent: React.FC = () => {
  const record = useRecordContext<any>();
  const notify = useNotify();
  const redirect = useRedirect();
  const [approved, setApproved] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    setApproved(true);
    setRejectionReason("");
  }, [record?.id]);

  if (!record) {
    return <Loading />;
  }

  const handleValidate = async () => {
    if (!token) {
      notify("Session expired, please log in again", { type: "warning" });
      redirect("/login");
      return;
    }

    if (!approved && !rejectionReason.trim()) {
      notify("Provide a rejection reason when rejecting a transaction", {
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/transactions/${record.id}/validate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approved,
          rejectionReason: rejectionReason.trim() || undefined,
        }),
      });

      if (response.ok) {
        notify(approved ? "Transaction approved" : "Transaction rejected", {
          type: "success",
        });
        redirect("/transactions/pending");
      } else {
        const errorBody = await response.json().catch(() => null);
        const message = Array.isArray(errorBody?.message)
          ? errorBody.message.join("\n")
          : errorBody?.message ||
            response.statusText ||
            "Error validating transaction";
        notify(message, { type: "error" });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error validating transaction";
      notify(message, { type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6">Transaction Details</Typography>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)" }}
        gap={2}
      >
        <TextField source="id" label="ID" />
        <TextField source="type" label="Type" />
        <TextField source="from_account_id" label="From account" />
        <TextField source="to_account_id" label="To account" />
        <TextField source="iban_external" label="External IBAN" />
        <TextField source="amount" label="Amount" />
        <TextField source="currency" label="Currency" />
        <DateField source="created_at" label="Created" showTime />
        <TextField source="description" label="Description" />
      </Box>

      <Divider sx={{ my: 1 }} />
      <Typography variant="h6">Validation</Typography>
      <Box display="flex" gap={4}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="radio"
            checked={approved}
            onChange={() => setApproved(true)}
          />
          Approve
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="radio"
            checked={!approved}
            onChange={() => setApproved(false)}
          />
          Reject
        </label>
      </Box>

      {!approved ? (
        <Box display="flex" flexDirection="column" gap={1}>
          <label htmlFor="rejection-reason">Rejection reason</label>
          <textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={3}
            style={{ width: "100%", padding: 12, fontFamily: "inherit" }}
          />
        </Box>
      ) : null}

      <Button
        label={approved ? "Approve transaction" : "Reject transaction"}
        onClick={handleValidate}
        disabled={isSubmitting}
      />
    </Box>
  );
};

const useAccountChoices = () => {
  const { data, isLoading } = useGetList("accounts", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "created_at", order: "DESC" },
  });

  const choices = useMemo(
    () =>
      (data ?? []).map((account: any) => {
        const ownerName =
          `${account.user?.first_name ?? ""} ${account.user?.last_name ?? ""}`.trim();
        const label = `${account.account_number} - ${ownerName || account.user?.email || account.user_id}`;
        return { id: account.id, name: label };
      }),
    [data]
  );

  return { choices, isLoading };
};

const TransactionCreateForm: React.FC = () => {
  const { choices, isLoading } = useAccountChoices();

  return (
    <SimpleForm
      defaultValues={{ type: "TRANSFER", autoApprove: true }}
      warnWhenUnsavedChanges
    >
      <SelectInput
        source="type"
        label="Transaction type"
        choices={transactionTypeChoices}
        validate={[required()]}
        fullWidth
      />
      <NumberInput
        source="amount"
        label="Amount"
        min={0.01}
        step={0.01}
        validate={[
          required(),
          (value: number) =>
            value && value > 0 ? undefined : "Amount must be greater than zero",
        ]}
        fullWidth
      />
      <BooleanInput source="autoApprove" label="Approve immediately" />
      <TextInput source="description" label="Description" fullWidth />

      <FormDataConsumer>
        {({ formData }) =>
          formData?.type === "TRANSFER" ? (
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)" }}
              gap={2}
            >
              <SelectInput
                source="fromAccountId"
                label="From account"
                choices={choices}
                disabled={isLoading}
                validate={[required()]}
              />
              <SelectInput
                source="toAccountId"
                label="To account"
                choices={choices}
                disabled={isLoading}
              />
              <TextInput
                source="ibanExternal"
                label="External IBAN"
                helperText="Provide an external IBAN when transferring outside the platform."
                fullWidth
              />
            </Box>
          ) : null
        }
      </FormDataConsumer>

      <FormDataConsumer>
        {({ formData }) =>
          formData?.type === "DEPOSIT" ? (
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)" }}
              gap={2}
            >
              <SelectInput
                source="toAccountId"
                label="Destination account"
                choices={choices}
                disabled={isLoading}
                validate={[required()]}
              />
              <SelectInput
                source="paymentMethod"
                label="Payment method"
                choices={paymentMethodChoices}
                validate={[required()]}
              />
              <TextInput
                source="reference"
                label="Payment reference"
                fullWidth
              />
            </Box>
          ) : null
        }
      </FormDataConsumer>

      <FormDataConsumer>
        {({ formData }) =>
          formData?.type === "WITHDRAWAL" ? (
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)" }}
              gap={2}
            >
              <SelectInput
                source="fromAccountId"
                label="Source account"
                choices={choices}
                disabled={isLoading}
                validate={[required()]}
              />
              <TextInput
                source="bankDetails.iban"
                label="Beneficiary IBAN"
                validate={[required()]}
              />
              <TextInput source="bankDetails.bic" label="BIC" />
              <TextInput
                source="bankDetails.accountHolderName"
                label="Account holder"
                validate={[required()]}
              />
            </Box>
          ) : null
        }
      </FormDataConsumer>
    </SimpleForm>
  );
};

const TransactionCreate: React.FC = () => (
  <Create redirect="list">
    <TransactionCreateForm />
  </Create>
);

export {
  TransactionHistoryList,
  PendingTransactionList,
  TransactionValidation,
  TransactionCreate,
};

export default {
  TransactionHistoryList,
  PendingTransactionList,
  TransactionValidation,
  TransactionCreate,
};
