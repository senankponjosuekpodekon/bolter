import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  SimpleForm,
  useRecordContext,
  useNotify,
  useRedirect,
  Button,
  SelectInput,
  TextInput,
} from "react-admin";
import { AdminKYCDocument } from "../types/kycDocument";
import { useState } from "react";
import {
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const kycStatusChoices = [
  { id: "PENDING", name: "Pending" },
  { id: "APPROVED", name: "Approved" },
  { id: "REJECTED", name: "Rejected" },
  { id: "UNDER_REVIEW", name: "Under Review" },
];

const documentTypeChoices = [
  { id: "ID_CARD", name: "ID Card" },
  { id: "PASSPORT", name: "Passport" },
  { id: "SELFIE", name: "Selfie" },
  { id: "PROOF_ADDRESS", name: "Proof of Address" },
];

// Enhanced filter component for KYC documents
const AdvancedKYCFilters = () => (
  <Card sx={{ mb: 2, backgroundColor: "#f5f5f5" }}>
    <CardContent>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">🔍 Advanced KYC Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {/* Status Filter */}
            <SelectInput
              source="status"
              label="Document Status"
              choices={kycStatusChoices}
              alwaysOn
            />

            {/* Document Type Filter */}
            <SelectInput
              source="documentType"
              label="Document Type"
              choices={documentTypeChoices}
              helperText="Filter by document type"
            />

            {/* Date Range */}
            <TextInput
              source="submittedFrom"
              label="Submitted From"
              type="date"
              helperText="Start date for submission"
              inputProps={{ type: "date" }}
            />
            <TextInput
              source="submittedTo"
              label="Submitted To"
              type="date"
              helperText="End date for submission"
              inputProps={{ type: "date" }}
            />

            {/* User & ID Filters */}
            <TextInput
              source="userId"
              label="User ID"
              helperText="Filter by specific user"
            />
            <TextInput
              source="reviewedBy"
              label="Reviewed By"
              helperText="Filter by reviewer admin ID"
            />

            {/* Overdue Filter */}
            <SelectInput
              source="isOverdue"
              label="Overdue (>48h)"
              choices={[
                { id: "true", name: "Yes - Overdue" },
                { id: "false", name: "No - On Time" },
              ]}
              helperText="Filter by review time"
            />

            {/* Quality Rating */}
            <SelectInput
              source="qualityRating"
              label="Quality Rating"
              choices={[
                { id: "EXCELLENT", name: "Excellent" },
                { id: "GOOD", name: "Good" },
                { id: "FAIR", name: "Fair" },
                { id: "POOR", name: "Poor" },
              ]}
              helperText="Filter by document quality"
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </CardContent>
  </Card>
);

export const KYCDocumentList = () => (
  <List
    filters={[<AdvancedKYCFilters key="advanced" />]}
    sort={{ field: "created_at", order: "DESC" }}
    perPage={25}
  >
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="user_id" label="User ID" />
      <TextField source="document_type" label="Type" />
      <TextField source="status" label="Status" />
      <DateField source="created_at" showTime label="Submitted" />
    </Datagrid>
  </List>
);

export const KYCDocumentReview = () => {
  const record = useRecordContext<AdminKYCDocument>();
  const notify = useNotify();
  const redirect = useRedirect();
  const [approved, setApproved] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReview = async () => {
    if (!record) {
      notify("Record not found", { type: "warning" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/kyc/documents/${record.id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved, rejectionReason }),
      });

      if (response.ok) {
        notify(approved ? "Document approved" : "Document rejected", {
          type: "success",
        });
        redirect("/kyc/documents/pending");
      } else {
        notify("Error reviewing document", { type: "error" });
      }
    } catch (error) {
      // keep the error for debugging
       
      console.error("KYC review failed", error);
      notify("Error reviewing document", { type: "error" });
    }
  };

  return (
    <Edit>
      <SimpleForm toolbar={false}>
        <TextField source="id" />
        <TextField source="user_id" />
        <TextField source="document_type" />
        <TextField source="file_path" />
        <TextField source="mime_type" />
        <DateField source="created_at" showTime />

        <div style={{ marginTop: 20 }}>
          <h3>Document Preview</h3>
          {record && record.mime_type?.startsWith("image/") ? (
            <img
              src={record.file_path}
              alt="Document"
              style={{ maxWidth: "100%", maxHeight: 400 }}
            />
          ) : (
            false
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <h3>Review</h3>
          <label>
            <input
              type="radio"
              checked={approved}
              onChange={() => setApproved(true)}
            />
            Approve
          </label>
          <label style={{ marginLeft: 20 }}>
            <input
              type="radio"
              checked={!approved}
              onChange={() => setApproved(false)}
            />
            Reject
          </label>

          {!approved ? (
            <div style={{ marginTop: 10 }}>
              <label>Rejection Reason:</label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 5 }}
              />
            </div>
          ) : (
            false
          )}

          <Button
            label={approved ? "Approve Document" : "Reject Document"}
            onClick={handleReview}
            style={{ marginTop: 20 }}
          />
        </div>
      </SimpleForm>
    </Edit>
  );
};
