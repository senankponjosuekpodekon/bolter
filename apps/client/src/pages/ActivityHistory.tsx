import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { useFormatting } from "../hooks";

export default function ActivityHistory() {
  const { t } = useTranslation("common");
  const { date: dateFormatter } = useFormatting();
  type ActivityLog = {
    id: string;
    timestamp: string;
    action: string;
    ip: string;
    device?: string;
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ["activity-log"],
    queryFn: async () => (await api.get("/auth/activity-log")).data,
  });

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">{t("activityHistory.title")}</h1>
      {isLoading && <div>{t("common.loading")}</div>}
      {error && (
        <div className="text-red-600">{t("activityHistory.loadError")}</div>
      )}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">{t("activityHistory.headers.date")}</th>
            <th className="p-2">{t("activityHistory.headers.action")}</th>
            <th className="p-2">{t("activityHistory.headers.ip")}</th>
            <th className="p-2">{t("activityHistory.headers.device")}</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((log: ActivityLog) => (
            <tr key={log.id} className="border-t">
              <td className="p-2">
                {dateFormatter.format(new Date(log.timestamp), "long")}
              </td>
              <td className="p-2">{log.action}</td>
              <td className="p-2">{log.ip}</td>
              <td className="p-2">{log.device || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 text-gray-700 text-xs">
        <p>{t("activityHistory.disclaimer")}</p>
      </div>
    </div>
  );
}
