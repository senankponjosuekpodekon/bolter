import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useFormatting } from "../hooks";

export default function KYC() {
  const { t } = useTranslation("kyc");
  const { date: dateFormatter } = useFormatting();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: documents } = useQuery({
    queryKey: ["kyc-documents"],
    queryFn: async () => {
      const response = await api.get("/kyc/documents");
      return response.data;
    },
  });

  type KycDocumentUpload = {
    documentType: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  };
  const uploadDocument = useMutation({
    mutationFn: async (data: KycDocumentUpload) => {
      const response = await api.post("/kyc/documents", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-documents"] });
    },
  });

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploading(true);
    const filePath = `/uploads/${file.name}`;

    await uploadDocument.mutateAsync({
      documentType,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
    });

    setUploading(false);
  };

  const requiredDocs = ["ID_CARD", "SELFIE", "PROOF_ADDRESS"];
  const tx = (key: string, fallback: string) =>
    t(key, { defaultValue: fallback });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {tx("documents.title", "KYC Documents")}
      </h1>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          {tx(
            "documents.instructions",
            "Please upload the required documents to verify your identity."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {requiredDocs.map((docType) => {
          const existing = documents?.find(
            (d: import("../types/kyc").KycDocument) =>
              d.document_type === docType
          );
          return (
            <div key={docType} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {tx(
                  `documents.types.${docType.toLowerCase()}`,
                  docType.replace(/_/g, " ")
                )}
              </h3>
              {existing ? (
                <div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      existing.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : existing.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {t(`status.${existing.status.toLowerCase()}`)}
                  </span>
                  {existing.rejection_reason && (
                    <p className="mt-2 text-sm text-red-600">
                      {existing.rejection_reason}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    {t("uploaded_date")}:{" "}
                    {dateFormatter.format(
                      new Date(existing.created_at),
                      "long"
                    )}
                  </p>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(docType, file);
                    }}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploading}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {documents && documents.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {tx("documents.history_title", "Document History")}
            </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {tx("documents.headers.type", "Type")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {tx("documents.headers.status", "Status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {tx("documents.headers.uploaded", "Uploaded")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {tx("documents.headers.reviewed", "Reviewed")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc: import("../types/kyc").KycDocument) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tx(
                      `documents.types.${doc.document_type.toLowerCase()}`,
                      doc.document_type
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t(`status.${doc.status.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dateFormatter.format(new Date(doc.created_at), "short")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.reviewed_at
                      ? dateFormatter.format(new Date(doc.reviewed_at), "short")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
