import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileAvatar from "../ProfileAvatar";

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock("axios", () => ({
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

function renderAvatar() {
  const utils = render(<ProfileAvatar />);
  return {
    ...utils,
    fileInput: () =>
      document.querySelector('input[type="file"]') as HTMLInputElement,
  };
}

function makeFile({
  type = "image/png",
  size = 10,
}: {
  type?: string;
  size?: number;
}) {
  const blob = new File(["x".repeat(size)], "avatar.png", { type });
  return blob;
}

describe("ProfileAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom does not implement createObjectURL; stub it for preview logic
    (global as unknown as { URL: typeof URL }).URL.createObjectURL = vi.fn(() => "blob:preview");
  });

  it("shows validation error for unsupported mime", async () => {
    const { fileInput } = renderAvatar();
    const input = fileInput();
    const file = makeFile({ type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /Uploader/i }));

    expect(
      await screen.findByText(/Type de fichier non supporté/i)
    ).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("blocks oversize file >2MB", async () => {
    const { fileInput } = renderAvatar();
    const input = fileInput();
    const big = makeFile({ type: "image/png", size: 3 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [big] } });
    fireEvent.click(screen.getByRole("button", { name: /Uploader/i }));

    expect(
      await screen.findByText(/Fichier trop volumineux/i)
    ).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("uploads and displays signed avatar", async () => {
    mockPost.mockResolvedValue({ data: { url: "https://signed/avatar.png" } });

    const { fileInput } = renderAvatar();
    const input = fileInput();
    const file = makeFile({ type: "image/png", size: 1024 });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /Uploader/i }));

    expect(mockPost).toHaveBeenCalledWith(
      "/profile/avatar",
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": expect.stringContaining("multipart"),
        }),
      })
    );
    expect(await screen.findByAltText(/avatar/i)).toBeInTheDocument();
  });

  it("fetches existing avatar", async () => {
    mockGet.mockResolvedValue({ data: { url: "https://signed/existing.png" } });

    renderAvatar();
    fireEvent.click(screen.getByRole("button", { name: /Charger avatar/i }));

    expect(mockGet).toHaveBeenCalledWith("/profile/avatar");
    expect(await screen.findByAltText(/avatar/i)).toBeInTheDocument();
  });

  it("deletes avatar and clears preview", async () => {
    mockGet.mockResolvedValue({ data: { url: "https://signed/existing.png" } });
    mockDelete.mockResolvedValue({});

    renderAvatar();
    fireEvent.click(screen.getByRole("button", { name: /Charger avatar/i }));
    await screen.findByAltText(/avatar/i);

    fireEvent.click(screen.getByRole("button", { name: /Supprimer/i }));
    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("/profile/avatar")
    );
    expect(screen.queryByAltText(/avatar/i)).not.toBeInTheDocument();
  });
});
