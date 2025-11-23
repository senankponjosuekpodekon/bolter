import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";

export default function Profile() {
  const { user, setUser, updatePreferences } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [theme, setTheme] = useState(user?.preferences?.theme || "light");
  const [widgets, setWidgets] = useState(
    user?.preferences?.widgets || ["dashboard", "transactions"]
  );

  const updateProfile = useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      phone: string;
      address: string;
    }) => {
      const response = await api.patch("/users/profile", data);
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
    setIsEditing(false);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "light" | "dark" | "auto";
    setTheme(value);
    updatePreferences({ theme: value });
  };

  const handleWidgetToggle = (widget: string) => {
    // compute new value first to avoid calling store updates inside a setState updater
    const updated = widgets.includes(widget)
      ? widgets.filter((w) => w !== widget)
      : [...widgets, widget];
    setWidgets(updated);
    // call updatePreferences outside of the setState updater to prevent synchronous
    // cross-component updates while React is rendering
    updatePreferences({ widgets: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                First Name
              </label>
              <p className="mt-1 text-gray-900">{user?.firstName || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Last Name
              </label>
              <p className="mt-1 text-gray-900">{user?.lastName || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-1 text-gray-900">{user?.phone || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Address
              </label>
              <p className="mt-1 text-gray-900">{user?.address || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    user?.role === "ADMIN"
                      ? "bg-red-100 text-red-800"
                      : user?.role === "COMPLIANCE"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user?.role}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Account Status
              </label>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    user?.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : user?.status === "SUSPENDED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user?.status}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                KYC Status
              </label>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    user?.kyc_status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : user?.kyc_status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : user?.kyc_status === "SUBMITTED"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user?.kyc_status}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+33 6 12 34 56 78"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
                placeholder="123 Rue Example, 75001 Paris, France"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>

            {updateProfile.isError && (
              <p className="text-sm text-red-600">
                Failed to update profile. Please try again.
              </p>
            )}
          </form>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">
            Personnalisation de l’interface
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium">Thème</label>
            <select
              value={theme}
              onChange={handleThemeChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Widgets affichés
            </label>
            <div className="flex gap-4">
              {["dashboard", "transactions", "accounts", "loans", "kyc"].map(
                (widget) => (
                  <label key={widget} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={widgets.includes(widget)}
                      onChange={() => handleWidgetToggle(widget)}
                      className="mr-2"
                    />
                    {widget.charAt(0).toUpperCase() + widget.slice(1)}
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
