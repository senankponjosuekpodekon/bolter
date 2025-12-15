import React from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import KYC from "../KYC";
import api from "../../services/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ApiClient {
  get?: (url: string) => Promise<{ data: unknown }>;
  post?: (url: string, data: unknown) => Promise<{ data: unknown }>;
}

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const q = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("KYC page", () => {
  beforeEach(() => {
    // reset mocks
    (api as unknown as ApiClient).get?.mockReset?.();
    (api as unknown as ApiClient).post?.mockReset?.();
  });

  it("shows uploaded documents when api returns a list", async () => {
    (api as unknown as ApiClient).get = vi.fn().mockResolvedValue({
      data: [
        {
          id: "d1",
          document_type: "ID_CARD",
          status: "APPROVED",
          created_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        },
      ],
    });

    render(
      <QueryClientProvider client={q}>
        <KYC />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Historique des documents/i)).toBeInTheDocument();
    expect(screen.getByText(/ID_CARD/)).toBeInTheDocument();
  });

  it("uploads a file through api.post when user picks a file", async () => {
    (api as unknown as ApiClient).get = vi.fn().mockResolvedValue({ data: [] });
    (api as unknown as ApiClient).post = vi
      .fn()
      .mockResolvedValue({ data: { id: "uploaded" } });

    render(
      <QueryClientProvider client={q}>
        <KYC />
      </QueryClientProvider>
    );

    // find the first file input
    // The component renders a native file input (not role textbox); query by selector
    const inputs = document.querySelectorAll("input[type=file]");
    expect(inputs.length).toBeGreaterThan(0);

    const file = new File(["hello"], "hello.png", { type: "image/png" });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() =>
      expect((api as unknown as ApiClient).post).toHaveBeenCalled()
    );
  });
});
