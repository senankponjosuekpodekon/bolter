import {
  List,
  Datagrid,
  EmailField,
  TextField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  TopToolbar,
  CreateButton,
  ExportButton,
  FunctionField,
  DateField,
  Toolbar,
  SaveButton,
  DeleteButton,
  required,
  email,
  minLength,
  FormDataConsumer,
} from "react-admin";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { StatusChip } from "./components/StatusChip";
import { UserActivity } from "./components/UserActivity";

const roleChoices = [
  { id: "CLIENT", name: "Client" },
  { id: "ADMIN", name: "Admin" },
  { id: "COMPLIANCE", name: "Compliance" },
];

const statusChoices = [
  { id: "ACTIVE", name: "Active" },
  { id: "SUSPENDED", name: "Suspended" },
  { id: "PENDING_VERIFICATION", name: "Pending Verification" },
  { id: "CLOSED", name: "Closed" },
];

const kycChoices = [
  { id: "PENDING", name: "Pending" },
  { id: "SUBMITTED", name: "Submitted" },
  { id: "APPROVED", name: "Approved" },
  { id: "REJECTED", name: "Rejected" },
];

const UserListActions = () => (
  <TopToolbar>
    <CreateButton variant="contained">New user</CreateButton>
    <ExportButton />
  </TopToolbar>
);

const RoleChip = ({ role }: { role?: string }) => {
  if (!role) {
    return <Chip size="small" label="Unknown" variant="outlined" />;
  }
  const color =
    role === "ADMIN" ? "secondary" : role === "COMPLIANCE" ? "info" : "default";
  return (
    <Chip
      size="small"
      label={role.toLowerCase()}
      color={color as any}
      sx={{ textTransform: "capitalize" }}
    />
  );
};

const formSx = {
  maxWidth: 720,
  "& .RaInput-root": {
    marginTop: 1,
    marginBottom: 1.5,
  },
};

const UserFormToolbar = ({ hasDelete = false }: { hasDelete?: boolean }) => (
  <Toolbar sx={{ display: "flex", justifyContent: "space-between", px: 0 }}>
    <SaveButton variant="contained" color="primary" />
    {hasDelete ? <DeleteButton mutationMode="pessimistic" /> : null}
  </Toolbar>
);

const UserForm = ({
  isEdit = false,
  defaultValues,
}: {
  isEdit?: boolean;
  defaultValues?: Record<string, any>;
}) => (
  <SimpleForm
    toolbar={<UserFormToolbar hasDelete={isEdit} />}
    sx={formSx}
    warnWhenUnsavedChanges
    defaultValues={defaultValues}
  >
    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1.5 }}>
      Identity
    </Typography>
    <TextInput
      source="email"
      type="email"
      label="Email"
      fullWidth
      validate={[required(), email()]}
      helperText="Used for login communications"
    />
    {!isEdit && (
      <TextInput
        source="password"
        type="password"
        label="Temporary password"
        fullWidth
        validate={[required(), minLength(8)]}
        helperText="Minimum 8 characters. The user should change it after first login."
      />
    )}
    {isEdit && (
      <TextInput
        source="password"
        type="password"
        label="Reset password"
        fullWidth
        helperText="Leave empty to keep the current password."
      />
    )}
    <Box display="flex" gap={2} flexWrap="wrap">
      <TextInput
        source="firstName"
        label="First name"
        fullWidth
        sx={{ flex: 1, minWidth: 220 }}
      />
      <TextInput
        source="lastName"
        label="Last name"
        fullWidth
        sx={{ flex: 1, minWidth: 220 }}
      />
    </Box>

    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>
      Contact
    </Typography>
    <TextInput
      source="phone"
      label="Phone"
      fullWidth
      helperText="Include country code (e.g. +33...)"
    />
    <TextInput
      source="address"
      label="Mailing address"
      fullWidth
      multiline
      rows={3}
    />

    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>
      Permissions & status
    </Typography>
    <Box display="flex" gap={2} flexWrap="wrap">
      <SelectInput
        source="role"
        label="Role"
        choices={roleChoices}
        fullWidth
        sx={{ flex: 1, minWidth: 220 }}
      />
      <SelectInput
        source="status"
        label="Account status"
        choices={statusChoices}
        fullWidth
        sx={{ flex: 1, minWidth: 220 }}
      />
      <SelectInput
        source="kyc_status"
        label="KYC status"
        choices={kycChoices}
        fullWidth
        sx={{ flex: 1, minWidth: 220 }}
      />
    </Box>

    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>
      Préférences
    </Typography>
    <Box display="flex" gap={2} flexWrap="wrap">
      <TextInput
        source="language"
        label="Langue"
        fullWidth
        sx={{ flex: 1, minWidth: 220 }}
      />
      <SelectInput
        source="notificationsEnabled"
        label="Notifications"
        choices={[
          { id: true, name: "Activées" },
          { id: false, name: "Désactivées" },
        ]}
        fullWidth
        sx={{ flex: 1, minWidth: 220 }}
      />
    </Box>

    {isEdit && (
      <FormDataConsumer>
        {({ formData }) => (
          <>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              Created{" "}
              {formData?.createdAt
                ? new Date(formData.createdAt).toLocaleString()
                : "—"}{" "}
              · Updated{" "}
              {formData?.updatedAt
                ? new Date(formData.updatedAt).toLocaleString()
                : "—"}
            </Typography>
            <UserActivity userId={formData?.id || "me"} />
          </>
        )}
      </FormDataConsumer>
    )}
  </SimpleForm>
);

export const UserList = () => (
  <List
    perPage={25}
    sort={{ field: "createdAt", order: "DESC" }}
    actions={<UserListActions />}
    sx={{ "& .RaList-content": { padding: 2 } }}
  >
    <Datagrid
      rowClick="edit"
      bulkActionButtons={false}
      sx={{
        "& .RaDatagrid-row:hover": {
          backgroundColor: "rgba(30, 58, 138, 0.04)",
        },
      }}
    >
      <EmailField source="email" label="Email" />
      <TextField source="firstName" label="First name" />
      <TextField source="lastName" label="Last name" />
      <FunctionField
        label="Role"
        render={(record: any) => <RoleChip role={record?.role} />}
      />
      <FunctionField
        label="Status"
        render={(record: any) => <StatusChip label={record?.status} />}
      />
      <FunctionField
        label="KYC"
        render={(record: any) => <StatusChip label={record?.kyc_status} />}
      />
      <FunctionField
        label="Password"
        render={(record: any) => (
          <Chip
            size="small"
            label={record?.hasPassword ? "Set" : "Temporary"}
            color={record?.hasPassword ? "success" : "warning"}
          />
        )}
      />
      <TextField source="phone" label="Phone" />
      <DateField source="createdAt" label="Created" showTime />
    </Datagrid>
  </List>
);

export const UserCreate = () => (
  <Create>
    <UserForm
      isEdit={false}
      defaultValues={{
        role: "CLIENT",
        status: "ACTIVE",
        kyc_status: "PENDING",
      }}
    />
  </Create>
);

export const UserEdit = () => (
  <Edit mutationMode="pessimistic">
    <UserForm isEdit />
  </Edit>
);
