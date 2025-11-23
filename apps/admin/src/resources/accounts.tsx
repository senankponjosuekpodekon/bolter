import {
  Datagrid,
  DateField,
  Edit,
  FunctionField,
  List,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  TopToolbar,
  ExportButton,
  required,
  NumberInput,
} from "react-admin";
import Chip from "@mui/material/Chip";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const accountStatusChoices = [
  { id: "ACTIVE", name: "Active" },
  { id: "FROZEN", name: "Frozen" },
  { id: "CLOSED", name: "Closed" },
];

const accountTypeChoices = [
  { id: "CHECKING", name: "Checking" },
  { id: "SAVINGS", name: "Savings" },
];

const accountFilters = [
  <TextInput key="search" source="search" label="Search" alwaysOn />,
  <SelectInput
    key="status"
    source="status"
    label="Status"
    choices={accountStatusChoices}
  />,
];

const AccountListActions = () => (
  <TopToolbar>
    <ExportButton />
  </TopToolbar>
);

export const AccountList = () => (
  <List
    filters={accountFilters}
    sort={{ field: "created_at", order: "DESC" }}
    perPage={25}
    actions={<AccountListActions />}
  >
    <Datagrid
      rowClick="edit"
      sx={{
        "& .RaDatagrid-row:hover": {
          backgroundColor: "rgba(30, 64, 175, 0.04)",
        },
      }}
    >
      <TextField source="account_number" label="IBAN" />
      <FunctionField
        label="Owner"
        render={(record: import("../types/account").AdminAccount) => {
          const fullName =
            `${record?.user?.first_name ?? ""} ${record?.user?.last_name ?? ""}`.trim();
          const email = record?.user?.email;
          const display = fullName || email || record?.user_id;
          return (
            <span>
              {display}
              {email && email !== display ? (
                <span
                  style={{ display: "block", fontSize: 12, color: "#6b7280" }}
                >
                  {email}
                </span>
              ) : null}
            </span>
          );
        }}
      />
      <FunctionField
        label="Type"
        render={(record: import("../types/account").AdminAccount) => (
          <Chip
            size="small"
            label={(record?.account_type ?? "").toLowerCase() || "unknown"}
            sx={{ textTransform: "capitalize" }}
          />
        )}
      />
      <FunctionField
        label="Balance"
        render={(record: import("../types/account").AdminAccount) => {
          const value = record?.balance ? Number(record.balance) : 0;
          return euroFormatter.format(value);
        }}
      />
      <FunctionField
        label="Status"
        render={(record: import("../types/account").AdminAccount) => (
          <Chip
            size="small"
            color={
              record?.status === "ACTIVE"
                ? "success"
                : record?.status === "FROZEN"
                  ? "warning"
                  : "default"
            }
            label={record?.status?.toLowerCase() ?? "unknown"}
            sx={{ textTransform: "uppercase" }}
          />
        )}
      />
      <DateField source="created_at" label="Created" showTime />
      <DateField source="updated_at" label="Updated" showTime />
    </Datagrid>
  </List>
);

export const AccountEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges>
      <TextInput source="id" disabled fullWidth label="Account ID" />
      <TextInput source="user_id" label="User ID" disabled fullWidth />
      <TextInput
        source="account_number"
        label="IBAN"
        fullWidth
        validate={[
          required(),
          (value: string) => {
            if (!/^FR[0-9]{2}[0-9]{10}[A-Z0-9]{11}[0-9]{2}$/.test(value)) {
              return "Invalid French IBAN format (e.g. FR7612345678901234567890123)";
            }
            return undefined;
          },
        ]}
        helperText="French IBAN format: FR76 followed by 25 characters"
      />
      <SelectInput
        source="account_type"
        label="Type"
        fullWidth
        choices={accountTypeChoices}
        validate={[required()]}
      />
      <NumberInput
        source="balance"
        label="Balance (EUR)"
        fullWidth
        step={0.01}
        parse={(value) =>
          value === undefined || value === null ? undefined : Number(value)
        }
        format={(value) =>
          value === undefined || value === null ? undefined : Number(value)
        }
        helperText="Adjust with caution; prefer transactions when available."
      />
      <SelectInput
        source="status"
        label="Status"
        fullWidth
        choices={accountStatusChoices}
        validate={[required()]}
      />
      <FunctionField
        label="Created at"
        render={(record: import("../types/account").AdminAccount) =>
          record?.created_at
            ? new Date(record.created_at).toLocaleString()
            : "N/A"
        }
      />
      <FunctionField
        label="Last update"
        render={(record: import("../types/account").AdminAccount) =>
          record?.updated_at
            ? new Date(record.updated_at).toLocaleString()
            : "N/A"
        }
      />
    </SimpleForm>
  </Edit>
);
