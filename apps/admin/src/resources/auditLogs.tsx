import {
  DateField,
  FunctionField,
  List,
  Datagrid,
  TextField,
  TextInput,
} from "react-admin";
import { useMemo } from "react";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { AdminAuditLog } from "../types/auditLog";

const auditFilters = [
  <TextInput key="action" source="action" label="Action" alwaysOn />,
  <TextInput key="entityType" source="entityType" label="Entity type" />,
  <TextInput key="entityId" source="entityId" label="Entity ID" />,
  <TextInput key="performedBy" source="performedBy" label="Performed by" />,
  <TextInput key="userId" source="userId" label="Target user" />,
];

const truncate = (value: string, max = 140) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const AuditLogList = () => {
  const currentAdminId = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        return undefined;
      }
      const parsed = JSON.parse(raw);
      return parsed?.id;
    } catch (error) {
      console.warn("Unable to parse user from storage", error);
      return undefined;
    }
  }, []);

  return (
    <List
      perPage={25}
      sort={{ field: "created_at", order: "DESC" }}
      filters={auditFilters}
      filterDefaultValues={
        currentAdminId ? { performedBy: currentAdminId } : undefined
      }
    >
      <Datagrid rowClick={false} bulkActionButtons={false}>
        <FunctionField
          label="Action"
          render={(record: AdminAuditLog) => (
            <Chip
              size="small"
              color={
                record?.action?.includes("REJECT")
                  ? "error"
                  : record?.action?.includes("APPROVE")
                    ? "success"
                    : "default"
              }
              label={record?.action ?? "UNKNOWN"}
            />
          )}
        />
        <TextField source="resource_type" label="Entity" />
        <TextField source="resource_id" label="Entity ID" />
        <FunctionField
          label="Performed by"
          render={(record: AdminAuditLog) => record?.performedBy ?? "N/A"}
        />
        <TextField source="user_id" label="Target user" />
        <FunctionField
          label="Changes"
          render={(record: AdminAuditLog) => (
            <Box
              component="pre"
              sx={{ m: 0, fontSize: 12, whiteSpace: "pre-wrap" }}
            >
              {truncate(JSON.stringify(record?.changes ?? {}, null, 2))}
            </Box>
          )}
        />
        <DateField source="created_at" label="Date" showTime />
      </Datagrid>
    </List>
  );
};

export { AuditLogList };
export default AuditLogList;
