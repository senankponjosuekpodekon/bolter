import { describe, expect, it } from "vitest";

// Widget filtering logic (mimics Dashboard.tsx)
type UserPreferences = { preferences?: { widgets?: string[] } };

function enabledWidgets(user: UserPreferences) {
  const widgets = user?.preferences?.widgets || [
    "dashboard",
    "transactions",
    "accounts",
    "loans",
    "kyc",
  ];
  return {
    dashboard: widgets.includes("dashboard"),
    transactions: widgets.includes("transactions"),
    accounts: widgets.includes("accounts"),
    loans: widgets.includes("loans"),
    kyc: widgets.includes("kyc"),
  };
}

describe("enabledWidgets", () => {
  it("enables all widgets when user opts in", () => {
    const user = {
      preferences: {
        widgets: ["dashboard", "transactions", "accounts", "loans", "kyc"],
      },
    };

    expect(enabledWidgets(user)).toEqual({
      dashboard: true,
      transactions: true,
      accounts: true,
      loans: true,
      kyc: true,
    });
  });

  it("respects disabled widgets", () => {
    const user = {
      preferences: {
        widgets: ["dashboard", "transactions", "kyc"],
      },
    };

    expect(enabledWidgets(user)).toEqual({
      dashboard: true,
      transactions: true,
      accounts: false,
      loans: false,
      kyc: true,
    });
  });

  it("falls back to defaults when no preferences provided", () => {
    const user = { preferences: {} };
    expect(enabledWidgets(user)).toEqual({
      dashboard: true,
      transactions: true,
      accounts: true,
      loans: true,
      kyc: true,
    });
  });
});
