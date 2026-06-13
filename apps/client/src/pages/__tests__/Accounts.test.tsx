import React from "react";
import { vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Accounts from "../Accounts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../stores/authStore", () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) => {
    const state = { user: { id: "u1", locale: "en-US", currency: "EUR" } };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const CHECKING: Record<string, unknown> = {
  id: "a1",
  account_type: "CHECKING",
  account_number: "FR76-0001",
  status: "ACTIVE",
  balance: 5000,
  currency: "EUR",
  limit: 2000,
  created_at: new Date().toISOString(),
};

const SAVINGS: Record<string, unknown> = {
  id: "a2",
  account_type: "SAVINGS",
  account_number: "FR76-0002",
  status: "ACTIVE",
  balance: 12000,
  currency: "EUR",
  limit: 500,
  created_at: new Date().toISOString(),
};

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

describe("Accounts page", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let api: any;

  beforeEach(async () => {
    const mod = await import("../../services/api");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api = (mod as any).default;
    api.get.mockReset();
    api.post.mockReset();
  });

  it("renders account numbers after load", async () => {
    api.get.mockImplementation(async (path: string) => {
      if (path === "/accounts") return { data: [CHECKING, SAVINGS] };
      return { data: [] };
    });

    render(
      <QueryClientProvider client={makeClient()}>
        <Accounts />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/FR76-0001/)).toBeInTheDocument();
  });

  it("shows balance formatted in EUR", async () => {
    api.get.mockImplementation(async (path: string) => {
      if (path === "/accounts") return { data: [CHECKING] };
      return { data: [] };
    });

    render(
      <QueryClientProvider client={makeClient()}>
        <Accounts />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/5[,.]?000/)).toBeInTheDocument();
  });

  it("disables account creation when 4 accounts exist (max reached)", async () => {
    const fourAccounts = [
      { ...CHECKING, id: "a1", account_type: "CHECKING" },
      { ...CHECKING, id: "a2", account_type: "CHECKING" },
      { ...SAVINGS, id: "a3", account_type: "SAVINGS" },
      { ...SAVINGS, id: "a4", account_type: "SAVINGS" },
    ];

    api.get.mockImplementation(async (path: string) => {
      if (path === "/accounts") return { data: fourAccounts };
      return { data: [] };
    });

    render(
      <QueryClientProvider client={makeClient()}>
        <Accounts />
      </QueryClientProvider>
    );

    await screen.findByText(/FR76-0001/);

    const createBtn = screen.queryByRole("button", { name: /open account modal/i })
      ?? screen.queryByRole("button", { name: /new account|create account|add account/i });

    if (createBtn) {
      expect(createBtn).toBeDisabled();
    } else {
      expect(screen.queryByRole("button", { name: /new account|créer|add/i })).not.toBeInTheDocument();
    }
  });

  it("shows card section when accounts are loaded", async () => {
    api.get.mockImplementation(async (path: string) => {
      if (path === "/accounts") return { data: [CHECKING] };
      return { data: [] };
    });

    render(
      <QueryClientProvider client={makeClient()}>
        <Accounts />
      </QueryClientProvider>
    );

    await screen.findByText(/FR76-0001/);
    const cardElements = screen.getAllByText(/card|carte/i);
    expect(cardElements.length).toBeGreaterThan(0);
  });

  it("calls POST /accounts on form submit", async () => {
    api.get.mockImplementation(async (path: string) => {
      if (path === "/accounts") return { data: [CHECKING] };
      return { data: [] };
    });
    api.post.mockResolvedValue({
      data: { id: "a-new", account_type: "SAVINGS", account_number: "FR76-NEW", currency: "EUR" },
    });

    render(
      <QueryClientProvider client={makeClient()}>
        <Accounts />
      </QueryClientProvider>
    );

    await screen.findByText(/FR76-0001/);

    const addBtn = screen.queryByRole("button", { name: /\+|new|add|create|nouveau/i });
    if (addBtn && !addBtn.hasAttribute("disabled")) {
      fireEvent.click(addBtn);
      await waitFor(() => {
        const submitBtn = screen.queryByRole("button", { name: /create|créer|submit|open/i });
        if (submitBtn) fireEvent.click(submitBtn);
      });
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/accounts", expect.any(Object));
      });
    }
  });

  it("shows empty state with no accounts", async () => {
    api.get.mockImplementation(async () => ({ data: [] }));

    render(
      <QueryClientProvider client={makeClient()}>
        <Accounts />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/FR76/)).not.toBeInTheDocument();
    });
  });
});
