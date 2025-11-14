import { useEffect, useState } from "react";
import api from "../../services/api";

export function UserActivity({ userId }: { userId?: string }) {
  const [activity, setActivity] = useState([]);
  useEffect(() => {
    if (!userId) return;
    api
      .get(
        userId === "me" ? "/auth/profile/activity" : `/users/${userId}/activity`
      )
      .then((res: any) => setActivity(res.data));
  }, [userId]);
  return (
    <div>
      <h3>Historique d'activité</h3>
      <ul>
        {activity.map((log: any) => (
          <li key={log.timestamp}>
            {log.type} - {log.details} -{" "}
            {new Date(log.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
