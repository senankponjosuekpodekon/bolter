import React from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "../Dashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface UserSelector {
  (selector?: (state: unknown) => unknown): unknown;
  getState?: () => unknown;
}

vi.mock("../../stores/authStore", () => {
  const mockState = {
    user: { id: "u1", locale: "fr-FR", currency: "EUR" },
    setUser: vi.fn(),
  };
  // create a callable mock that resembles the zustand useStore hook
  const useAuthStoreMock: UserSelector = (
    selector?: (state: unknown) => unknown
  ) => (typeof selector === "function" ? selector(mockState) : mockState);
  // expose getState for callers that use useAuthStore.getState()
  useAuthStoreMock.getState = () => mockState;
  return { useAuthStore: useAuthStoreMock };
});

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

// QuickActions contains modal components that use ToastProvider; mock it to avoid needing the provider in this unit test
vi.mock("../../components/dashboard/QuickActions", () => ({
  default: () => React.createElement("div", { "data-testid": "quick-actions" }),
}));

const q = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("Dashboard localization", () => {
  it("formats balances and amounts according to user locale/currency", async () => {
    const apiModule = await import("../../services/api");
    // Default export is mocked by vitest above
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (apiModule as any).default;
    // accounts response
    api.get.mockImplementation(async (path: string) => {
      if (path === "/accounts")
        return {
          data: [
            {
              id: "a1",
              account_type: "SAVINGS",
              account_number: "AC-1",
              status: "ACTIVE",
              balance: 1234.5,
              currency: "EUR",
              limit: 1000,
              created_at: new Date().toISOString(),
            },
          ],
        };
      if (path === "/transactions")
        return {
          data: [
            {
              id: "t1",
              description: "Salary",
              created_at: new Date().toISOString(),
              amount: "1234.5",
              currency: "EUR",
              type: "DEPOSIT",
              status: "APPROVED",
            },
          ],
        };
      return { data: [] };
    });

    render(
      <QueryClientProvider client={q}>
        <Dashboard />
      </QueryClientProvider>
    );

    // assert localized amounts appear (should include balance and at least one transaction)
    const matches = await screen.findAllByText(/1\s?234[,·]50|1\u202F234,50/);
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
