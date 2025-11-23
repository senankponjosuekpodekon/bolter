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
} from "react-admin";
import { AdminKYCDocument } from "../types/kycDocument";
import { useState } from "react";

export const KYCDocumentList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="user_id" />
      <TextField source="document_type" />
      <TextField source="file_path" />
      <TextField source="status" />
      <DateField source="created_at" showTime />
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
      // eslint-disable-next-line no-console
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
