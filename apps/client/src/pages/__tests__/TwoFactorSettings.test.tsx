import React from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TwoFactorSettings from "../TwoFactorSettings";
import api from "../../services/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ApiClient {
  get?: (url: string) => Promise<Record<string, unknown>>;
  post?: (
    url: string,
    data: Record<string, unknown>
  ) => Promise<Record<string, unknown>>;
}

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const q = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("TwoFactorSettings", () => {
  beforeEach(() => {
    // reset mocks
    (api as unknown as ApiClient).get?.mockReset?.();
    (api as unknown as ApiClient).post?.mockReset?.();
  });

  it("renders setup and allows enabling/disabling 2FA", async () => {
    (api as unknown as ApiClient).get = vi.fn().mockResolvedValue({
      data: { qrCodeUrl: "http://example/qrcode.png", secret: "ABC123" },
    });
    (api as unknown as ApiClient).post = vi.fn().mockResolvedValue({});

    render(
      <QueryClientProvider client={q}>
        <TwoFactorSettings />
      </QueryClientProvider>
    );

    expect(await screen.findByAltText(/QR Code 2FA/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/123456/);
    fireEvent.change(input, { target: { value: "000000" } });

    // Use an exact (anchored) matcher to avoid matching 'Désactiver 2FA'
    const enableBtn = screen.getByRole("button", { name: /^Activer 2FA$/i });
    fireEvent.click(enableBtn);

    await waitFor(() =>
      expect((api as unknown as ApiClient).post).toHaveBeenCalledWith(
        "/auth/2fa/enable",
        {
          token: "000000",
        }
      )
    );

    const disableBtn = screen.getByRole("button", { name: /Désactiver 2FA/i });
    fireEvent.click(disableBtn);

    await waitFor(() =>
      expect((api as unknown as ApiClient).post).toHaveBeenCalledWith(
        "/auth/2fa/disable",
        {
          token: "000000",
        }
      )
    );
  });
});
