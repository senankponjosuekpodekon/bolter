import React from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Profile from "../Profile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../stores/authStore", () => ({
  useAuthStore: () => ({
    user: {
      id: "u1",
      email: "test@example.com",
      firstName: "Jane",
      lastName: "Doe",
      role: "USER",
      status: "ACTIVE",
      kyc_status: "APPROVED",
      preferences: { theme: "light", widgets: ["dashboard", "transactions"] },
    },
    setUser: vi.fn(),
    updatePreferences: vi.fn(),
  }),
}));

const q = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("Profile page", () => {
  it("renders profile tab by default", () => {
    render(
      <QueryClientProvider client={q}>
        <Profile />
      </QueryClientProvider>
    );

    expect(
      screen.getByRole("heading", { name: /Profile/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/Jane/)).toBeInTheDocument();
    // The KYC tab is a tab role (uses a button element with role="tab")
    expect(screen.getByRole("tab", { name: /KYC/i })).toBeInTheDocument();
  });

  it("switches to KYC tab when clicked", () => {
    render(
      <QueryClientProvider client={q}>
        <Profile />
      </QueryClientProvider>
    );
    // Switch by clicking the tab
    fireEvent.click(screen.getByRole("tab", { name: /KYC/i }));
    // KYC component includes a header with 'Vérification KYC'
    expect(screen.getByText(/Vérification KYC/i)).toBeInTheDocument();
  });

  it("respects hash deep links for 2fa", () => {
    // set hash before mounting
    const oldHash = window.location.hash;
    window.location.hash = "#profile-2fa";
    render(
      <QueryClientProvider client={q}>
        <Profile />
      </QueryClientProvider>
    );
    expect(
      screen.getByText(/Authentification à deux facteurs/i)
    ).toBeInTheDocument();
    window.location.hash = oldHash;
  });
});
