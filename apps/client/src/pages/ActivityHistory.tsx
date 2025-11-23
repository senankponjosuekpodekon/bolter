import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export default function ActivityHistory() {
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
      <h1 className="text-2xl font-bold mb-4">
        Historique des connexions et actions
      </h1>
      {isLoading && <div>Chargement...</div>}
      {error && <div className="text-red-600">Erreur lors du chargement</div>}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Date</th>
            <th className="p-2">Action</th>
            <th className="p-2">IP</th>
            <th className="p-2">Device</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((log: ActivityLog) => (
            <tr key={log.id} className="border-t">
              <td className="p-2">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="p-2">{log.action}</td>
              <td className="p-2">{log.ip}</td>
              <td className="p-2">{log.device || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 text-gray-700 text-xs">
        <p>
          Les actions sensibles (connexion, modification, virements, activation
          2FA) sont journalisées pour la sécurité et la conformité.
        </p>
      </div>
    </div>
  );
}
