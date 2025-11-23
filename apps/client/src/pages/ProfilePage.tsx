import { useProfile } from "../lib/useProfile";

export function ProfilePage() {
  const { user, preferences } = useProfile();

  return (
    <div>
      <h2>Mon Profil</h2>
      <div>Email: {user?.email}</div>
      <div>Prénom: {user?.firstName}</div>
      <div>Nom: {user?.lastName}</div>
      <div>Langue: {preferences?.language}</div>
      <div>
        Notifications:{" "}
        {preferences?.notificationsEnabled ? "Activées" : "Désactivées"}
      </div>
      {/* Formulaires et boutons pour updateProfile et updatePreferences */}
      <h3>Historique d&apos;activité</h3>
      {/* Affichage de l'historique via getProfileActivity() */}
    </div>
  );
}
