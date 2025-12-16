import { useState, createElement } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Shield,
  Camera,
  FileCheck,
  Info,
} from "lucide-react";
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

  const getDocIcon = (docType: string) => {
    switch (docType) {
      case "ID_CARD":
        return FileText;
      case "SELFIE":
        return Camera;
      case "PROOF_ADDRESS":
        return FileCheck;
      default:
        return FileText;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return CheckCircle2;
      case "PENDING":
        return Clock;
      case "REJECTED":
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  return (
    <div className="space-y-3 md:space-y-6 max-w-6xl mx-auto px-2 sm:px-4 md:px-0">
      {/* Header moderne avec gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 dark:from-indigo-700 dark:via-purple-800 dark:to-pink-900 rounded-lg md:rounded-2xl p-3 sm:p-6 md:p-8 shadow-lg md:shadow-xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl">
              <Shield className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white dark:text-gray-100">
                {tx("documents.title", "Vérification KYC")}
              </h1>
              <p className="text-purple-100 dark:text-purple-200 mt-0.5 sm:mt-1 text-xs sm:text-sm hidden sm:block">
                Complétez votre profil pour débloquer toutes les fonctionnalités
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-3 border-blue-500 dark:border-blue-400 rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex items-start gap-2 sm:gap-3">
        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-0.5 sm:mb-1 text-xs sm:text-base">
            Documents requis
          </h3>
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-tight sm:leading-normal">
            {tx(
              "documents.instructions",
              "Veuillez télécharger les documents requis pour vérifier votre identité. Formats acceptés: JPG, PNG, PDF"
            )}
          </p>
        </div>
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {requiredDocs.map((docType) => {
          const existing = documents?.find(
            (d: any) => d.document_type === docType
          );
          const DocIcon = getDocIcon(docType);
          const StatusIcon = existing ? getStatusIcon(existing.status) : Upload;

          return (
            <div
              key={docType}
              className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow duration-200"
            >
              {/* Card Header */}
              <div
                className={`p-3 sm:p-4 border-b ${
                  existing?.status === "APPROVED"
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800"
                    : existing?.status === "PENDING"
                      ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-100 dark:border-amber-800"
                      : existing?.status === "REJECTED"
                        ? "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-100 dark:border-red-800"
                        : "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-600 border-gray-100 dark:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`p-1.5 sm:p-2 rounded-lg ${
                      existing?.status === "APPROVED"
                        ? "bg-green-500"
                        : existing?.status === "PENDING"
                          ? "bg-amber-500"
                          : existing?.status === "REJECTED"
                            ? "bg-red-500"
                            : "bg-gray-400"
                    }`}
                  >
                    <DocIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      {tx(
                        `documents.types.${docType.toLowerCase()}`,
                        docType.replace(/_/g, " ")
                      )}
                    </h3>
                  </div>
                  {existing && (
                    <StatusIcon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        existing.status === "APPROVED"
                          ? "text-green-600"
                          : existing.status === "PENDING"
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-6">
                {existing ? (
                  <div className="space-y-3">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full ${
                        existing.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : existing.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          existing.status === "APPROVED"
                            ? "bg-green-500"
                            : existing.status === "PENDING"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      ></span>
                      {t(`status.${existing.status.toLowerCase()}`)}
                    </span>

                    {existing.rejection_reason && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {existing.rejection_reason}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {t("uploaded_date")}:{" "}
                        {dateFormatter.format(
                          new Date(existing.created_at),
                          "long"
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="cursor-pointer group">
                      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group-hover:shadow-md">
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500 mx-auto mb-1.5 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-transform" />
                        <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          Cliquez pour télécharger
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                          JPG, PNG ou PDF (max 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType, file);
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Document History Table */}
      {documents && documents.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-slate-600">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {tx("documents.history_title", "Historique des documents")}
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {tx("documents.headers.type", "Type")}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {tx("documents.headers.status", "Statut")}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {tx("documents.headers.uploaded", "Téléchargé")}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {tx("documents.headers.reviewed", "Vérifié")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {documents.map((doc: any) => {
                  const StatusIcon = getStatusIcon(doc.status);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {createElement(getDocIcon(doc.document_type), {
                            className:
                              "w-4 h-4 text-gray-500 dark:text-gray-400",
                          })}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {tx(
                              `documents.types.${doc.document_type.toLowerCase()}`,
                              doc.document_type
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
                            doc.status === "APPROVED"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : doc.status === "PENDING"
                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          }`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {t(`status.${doc.status.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {dateFormatter.format(
                          new Date(doc.created_at),
                          "short"
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {doc.reviewed_at
                          ? dateFormatter.format(
                              new Date(doc.reviewed_at),
                              "short"
                            )
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
