import { useEffect, useState } from "react";
import api from "../../services/api";

interface ActivityLog {
  timestamp: string;
  type: string;
  details: string;
}

export function UserActivity({ userId }: { userId?: string }) {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  useEffect(() => {
    if (!userId) return;
    api
      .get(
        userId === "me" ? "/auth/profile/activity" : `/users/${userId}/activity`
      )
      .then((res: { data: ActivityLog[] }) => setActivity(res.data));
  }, [userId]);
  return (
    <div>
      <h3>Historique d&apos;activité</h3>
      <ul>
        {activity.map((log) => (
          <li key={log.timestamp}>
            {log.type} - {log.details} -{" "}
            {new Date(log.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
