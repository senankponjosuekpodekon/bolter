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
    // Mock GET calls for profile and 2FA setup
    let twoFactorEnabled = false; // Track state across calls
    const getApiMock = vi.fn();
    (api as unknown as ApiClient).get = getApiMock.mockImplementation(
      (path) => {
        if (path === "/auth/profile") {
          return Promise.resolve({
            data: { two_factor_enabled: twoFactorEnabled },
          });
        }
        if (path === "/auth/2fa/setup") {
          return Promise.resolve({
            data: { qrCodeUrl: "http://example/qrcode.png", secret: "ABC123" },
          });
        }
        return Promise.resolve({ data: {} });
      }
    );
    const postApiMock = vi.fn();
    (api as unknown as ApiClient).post = postApiMock.mockImplementation(
      (path) => {
        if (path === "/auth/2fa/enable") {
          twoFactorEnabled = true; // Update state on enable
        } else if (path === "/auth/2fa/disable") {
          twoFactorEnabled = false; // Update state on disable
        }
        return Promise.resolve({});
      }
    );

    render(
      <QueryClientProvider client={q}>
        <TwoFactorSettings />
      </QueryClientProvider>
    );

    // Wait for profile to load, then click Setup 2FA
    await screen.findByText(/2FA n'est pas encore configuré/i);
    const setupBtn = screen.getByRole("button", { name: /Setup 2FA/i });
    fireEvent.click(setupBtn);

    // Now wait for QR code to appear after setup is initiated
    expect(await screen.findByAltText(/QR Code 2FA/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/123456/);
    fireEvent.change(input, { target: { value: "000000" } });

    // Use an exact (anchored) matcher to avoid matching 'Désactiver 2FA'
    const enableBtn = screen.getByRole("button", { name: /^Activer 2FA$/i });
    fireEvent.click(enableBtn);

    await waitFor(() =>
      expect(postApiMock).toHaveBeenCalledWith("/auth/2fa/enable", {
        token: "000000",
      })
    );

    // After enable succeeds and profile refetches, should show disable button
    // Also need to wait for the input to be reset and form to be ready
    await waitFor(() => {
      const disableForm = screen.getByText(
        /Entrez votre code 2FA pour désactiver/i
      );
      expect(disableForm).toBeInTheDocument();
    });

    // Clear token and re-enter it for disable
    const disableInput = screen.getAllByPlaceholderText(/123456/)[0]; // Get disable input
    fireEvent.change(disableInput, { target: { value: "" } }); // Clear it first
    fireEvent.change(disableInput, { target: { value: "111111" } }); // Enter different token

    const disableBtn = screen.getByRole("button", {
      name: /Désactiver 2FA/i,
    });
    fireEvent.click(disableBtn);

    await waitFor(() =>
      expect(postApiMock).toHaveBeenCalledWith("/auth/2fa/disable", {
        token: "111111",
      })
    );
  });
});
