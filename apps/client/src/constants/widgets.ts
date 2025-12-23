export const AVAILABLE_WIDGETS = [
  "dashboard",
  "transactions",
  "accounts",
  "loans",
  "kyc",
  "tontines",
] as const;

export type WidgetKey = typeof AVAILABLE_WIDGETS[number];
