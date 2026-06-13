import React from "react";
import { vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../Dashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface UserSelector {
  (selector?: (state: unknown) => unknown): unknown;
  getState?: () => unknown;
}

vi.mock("../../stores/authStore", () => {
  const mockState = {
    user: { id: "u1", locale: "fr-FR", currency: "EUR", kyc_status: "APPROVED" },
    setUser: vi.fn(),
  };
  const useAuthStoreMock: UserSelector = (
    selector?: (state: unknown) => unknown
  ) => (typeof selector === "function" ? selector(mockState) : mockState);
  useAuthStoreMock.getState = () => mockState;
  return { useAuthStore: useAuthStoreMock };
});

vi.mock("../../services/api", () => ({
  default: { get: vi.fn() },
}));

vi.mock("../../services/loanService", () => ({
  createLoan: vi.fn(),
}));


const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const ACCOUNT = {
  id: "a1",
  account_type: "SAVINGS",
  account_number: "AC-001",
  status: "ACTIVE",
  balance: 1234.5,
  currency: "EUR",
  limit: 1000,
  created_at: new Date().toISOString(),
};

const TRANSACTION = {
  id: "t1",
  description: "Salary",
  created_at: new Date().toISOString(),
  amount: "1234.5",
  currency: "EUR",
  type: "DEPOSIT",
  status: "APPROVED",
};

const mockApi = async (path: string) => {
  if (path === "/accounts") return { data: [ACCOUNT] };
  if (path === "/transactions") return { data: [TRANSACTION] };
  if (path === "/auth/profile") return { data: { id: "u1", locale: "fr-FR" } };
  return { data: [] };
};

describe("Dashboard", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let api: any;

  beforeEach(async () => {
    const mod = await import("../../services/api");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api = (mod as any).default;
    api.get.mockReset();
  });

  it("formats balances and amounts according to user locale/currency", async () => {
    api.get.mockImplementation(mockApi);

    render(
      <QueryClientProvider client={makeClient()}>
        <Dashboard />
      </QueryClientProvider>
    );

    const matches = await screen.findAllByText(/1\s?234[,·]50|1\u202F234,50/);
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("shows account number when accounts load", async () => {
    api.get.mockImplementation(mockApi);

    render(
      <QueryClientProvider client={makeClient()}>
        <Dashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/AC-001/)).toBeInTheDocument();
  });

  it("renders the deposit action button", async () => {
    api.get.mockImplementation(mockApi);

    render(
      <QueryClientProvider client={makeClient()}>
        <Dashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByRole("button", { name: /deposit/i })).toBeInTheDocument();
  });

  it("shows empty state when no accounts returned", async () => {
    api.get.mockImplementation(async (path: string) => {
      if (path === "/auth/profile") return { data: { id: "u1" } };
      return { data: [] };
    });

    render(
      <QueryClientProvider client={makeClient()}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/AC-001/)).not.toBeInTheDocument();
    });
  });

  it("shows transaction description in activity feed", async () => {
    api.get.mockImplementation(mockApi);

    render(
      <QueryClientProvider client={makeClient()}>
        <Dashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Salary/i)).toBeInTheDocument();
  });
});
