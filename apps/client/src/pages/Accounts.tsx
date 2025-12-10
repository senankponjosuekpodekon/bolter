import { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";
import { useAuthStore } from "../stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useFormatting } from "../hooks";
import { useToast } from "../hooks/useToast";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Share2,
  X,
  Plus,
  Building,
} from "lucide-react";

export default function Accounts() {
  type Account = {
    id: string;
    account_type: "CHECKING" | "SAVINGS";
    account_number: string;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    balance: number | string;
    currency: "EUR" | "USD" | "GBP";
    limit: number;
    created_at?: string;
  };
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { currency: currencyFormatter } = useFormatting({
    locale: user?.locale ?? "en-US",
  });
  const toast = useToast();

  useEffect(() => {
    const l =
      user?.locale ??
      (typeof navigator !== "undefined"
        ? navigator.language || "en-US"
        : "en-US");
    loadLocale(l);
  }, [user?.locale]);
  const [accountType, setAccountType] = useState<"CHECKING" | "SAVINGS">(
    "SAVINGS"
  );
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP">("EUR");
  const [limit, setLimit] = useState<number>(1000);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cardType, setCardType] = useState<"VIRTUAL" | "PHYSICAL">("VIRTUAL");
  const [cardAccountId, setCardAccountId] = useState<string>("");
  const [cardSuccess, setCardSuccess] = useState("");
  const [cardError, setCardError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardSlideIndex, setCardSlideIndex] = useState(0);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/accounts");
      return response.data;
    },
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const response = await api.get("/cards");
      return Array.isArray(response.data)
        ? response.data
        : (response.data?.data ?? []);
    },
    enabled: !!accounts?.length,
  });

  const createAccount = useMutation({
    mutationFn: async (payload: {
      accountType?: "CHECKING" | "SAVINGS";
      currency?: "EUR" | "USD" | "GBP";
      limit?: number;
    }) => {
      const response = await api.post("/accounts", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setAccountType("SAVINGS");
      setCurrency("EUR");
      setLimit(1000);
      setErrorMessage("");
      if (data?.account_number) {
        setSuccessMessage(
          t("accounts.success_created_with_number", {
            type: data.account_type,
            number: data.account_number,
          })
        );
      } else {
        setSuccessMessage(t("accounts.success_created"));
      }
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: unknown) => {
      let accountErrorMessage1 = "Failed to create account";
      type ErrorResponse = {
        response?: { data?: { message?: string | string[] } };
      };
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as ErrorResponse).response === "object" &&
        (error as ErrorResponse).response?.data?.message
      ) {
        const msg = (error as ErrorResponse).response!.data!.message;
        accountErrorMessage1 = Array.isArray(msg)
          ? msg.join(", ")
          : msg || accountErrorMessage1;
      }
      setSuccessMessage("");
      setErrorMessage(
        Array.isArray(accountErrorMessage1)
          ? accountErrorMessage1.join(", ")
          : accountErrorMessage1
      );
    },
  });

  const createCard = useMutation({
    mutationFn: async (payload: {
      accountId: string;
      type: "VIRTUAL" | "PHYSICAL";
    }) => {
      const response = await api.post("/cards", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setCardSuccess(
        t("accounts.card_created", {
          type: data.type,
          number: data.card_number,
        })
      );
      setCardError("");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (error: unknown) => {
      let cardErrorMessage1 = "Erreur création carte";
      type CardErrorResponse = {
        response?: {
          status?: number;
          data?: { message?: string | string[] };
        };
      };

      console.error("Card creation error full:", error);

      if (typeof error === "object" && error !== null) {
        if ("response" in error) {
          const response = (error as CardErrorResponse).response;
          console.error("Response status:", response?.status);
          console.error("Response data:", response?.data);

          if (response?.data?.message) {
            const msg = response.data.message;
            cardErrorMessage1 = Array.isArray(msg)
              ? msg.join(", ")
              : msg || cardErrorMessage1;
          }
        }
      }
      setCardSuccess("");
      setCardError(cardErrorMessage1);
    },
  });

  const handleCreateAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    createAccount.mutate({ accountType, currency, limit });
  };

  const handleCreateCard = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCardError("");
    setCardSuccess("");

    if (!cardAccountId) {
      setCardError(
        t("accounts.card.error_select_account", {
          defaultValue: "Please select an account",
        })
      );
      return;
    }

    console.log("Creating card with payload:", {
      accountId: cardAccountId,
      type: cardType,
    });
    createCard.mutate({ accountId: cardAccountId, type: cardType });
  };

  const accountsCount = accounts?.length ?? 0;
  const activeAccount = useMemo(() => {
    if (!accountsCount) return null;
    const safeIndex =
      ((activeIndex % accountsCount) + accountsCount) % accountsCount;
    return accounts?.[safeIndex] ?? null;
  }, [accounts, activeIndex, accountsCount]);

  // Check if user has already created maximum CHECKING and SAVINGS accounts
  const checkingAccountCount =
    accounts?.filter((acc: Account) => acc.account_type === "CHECKING")
      .length ?? 0;
  const savingsAccountCount =
    accounts?.filter((acc: Account) => acc.account_type === "SAVINGS").length ??
    0;
  const canCreateChecking = checkingAccountCount < 2;
  const canCreateSavings = savingsAccountCount < 2;
  const canCreateMoreAccounts =
    accountsCount < 4 && (canCreateChecking || canCreateSavings);

  // Count virtual cards
  const virtualCardCount =
    cards?.filter((card: Card) => card.type === "VIRTUAL").length ?? 0;
  const canCreateMoreVirtualCards = virtualCardCount < 6;

  const slidePrev = useCallback(() => {
    if (!accountsCount) return;
    setActiveIndex((prev) => (prev - 1 + accountsCount) % accountsCount);
  }, [accountsCount]);

  const slideNext = useCallback(() => {
    if (!accountsCount) return;
    setActiveIndex((prev) => (prev + 1) % accountsCount);
  }, [accountsCount]);

  const formatAccountDetails = useCallback(
    (account: Account) =>
      [
        `${t("accounts.types." + account.account_type.toLowerCase())} (${account.currency})`,
        `${t("accounts.account_number_label", { defaultValue: "Account" })}: ${account.account_number}`,
        `${t("accounts.status") ?? "Status"}: ${account.status}`,
        `${t("accounts.limit_label")}: ${account.limit} ${account.currency}`,
      ].join("\n"),
    [t]
  );

  const handleCopyDetails = useCallback(
    async (account: Account | null) => {
      if (!account) return;
      const details = formatAccountDetails(account);
      try {
        await navigator.clipboard.writeText(details);
        toast.success(t("accounts.copied", { defaultValue: "Details copied" }));
      } catch (err) {
        console.error("Copy failed", err);
        toast.error(
          t("accounts.copy_error", { defaultValue: "Unable to copy" })
        );
      }
    },
    [formatAccountDetails, toast, t]
  );

  const handleShareDetails = useCallback(
    async (account: Account | null) => {
      if (!account) return;
      const details = formatAccountDetails(account);
      if (navigator.share) {
        try {
          await navigator.share({ title: t("accounts.title"), text: details });
          return;
        } catch (err) {
          console.warn("Share cancelled or failed", err);
        }
      }
      await handleCopyDetails(account);
      toast.info(
        t("accounts.shared_fallback", { defaultValue: "Link copied to share" })
      );
    },
    [formatAccountDetails, handleCopyDetails, toast, t]
  );

  type Card = {
    id: string;
    account_id: string;
    card_number: string;
    type: "VIRTUAL" | "PHYSICAL";
    status: "ACTIVE" | "BLOCKED" | "EXPIRED";
    cvv: string;
    expiry_date: string;
    cardholder_name?: string;
    created_at?: string;
  };

  const formatCardDetails = useCallback(
    (card: Card) =>
      [
        `${t("accounts.card.number", { defaultValue: "Card Number" })}: ${card.card_number}`,
        `${t("accounts.card.type", { defaultValue: "Type" })}: ${card.type}`,
        `${t("accounts.card.cvv", { defaultValue: "CVV" })}: ${card.cvv}`,
        `${t("accounts.card.expiry", { defaultValue: "Expiry" })}: ${card.expiry_date}`,
        `${t("accounts.card.status", { defaultValue: "Status" })}: ${card.status}`,
      ].join("\n"),
    [t]
  );

  const maskCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(\d{4})(?=\d{4})/g, "****-").slice(-16);
  };

  const handleCopyCard = useCallback(
    async (card: Card) => {
      const details = formatCardDetails(card);
      try {
        await navigator.clipboard.writeText(details);
        toast.success(
          t("accounts.copied", { defaultValue: "Card details copied" })
        );
      } catch (err) {
        console.error("Copy failed", err);
        toast.error(
          t("accounts.copy_error", { defaultValue: "Unable to copy" })
        );
      }
    },
    [formatCardDetails, toast, t]
  );

  const cardsCount = cards?.length ?? 0;
  const activeCard = useMemo(() => {
    if (!cardsCount) return null;
    const safeIndex = ((cardSlideIndex % cardsCount) + cardsCount) % cardsCount;
    return cards?.[safeIndex] ?? null;
  }, [cards, cardSlideIndex, cardsCount]);

  const cardSlidePrev = useCallback(() => {
    if (!cardsCount) return;
    setCardSlideIndex((prev) => (prev - 1 + cardsCount) % cardsCount);
  }, [cardsCount]);

  const cardSlideNext = useCallback(() => {
    if (!cardsCount) return;
    setCardSlideIndex((prev) => (prev + 1) % cardsCount);
  }, [cardsCount]);

  if (isLoading) return <div>{t("common.loading")}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("accounts.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("accounts.subtitle", {
              defaultValue: "Manage your wallets and cards",
            })}
          </p>
        </div>
        {accountsCount > 1 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
            <span>{activeIndex + 1}</span>
            <span className="text-gray-400 dark:text-gray-500">/</span>
            <span>{accountsCount}</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            aria-hidden
          >
            <div className="absolute -left-32 -top-32 w-64 h-64 bg-white/10 blur-3xl" />
            <div className="absolute right-0 -bottom-24 w-72 h-72 bg-emerald-400/20 blur-3xl" />
          </div>

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80 mb-2">
                {activeAccount
                  ? t(
                      `accounts.types.${activeAccount.account_type.toLowerCase()}`
                    )
                  : t("accounts.no_account", { defaultValue: "No account" })}
              </p>
              <h2 className="text-3xl font-semibold">
                {activeAccount
                  ? currencyFormatter.format(
                      Number(activeAccount.balance || 0),
                      activeAccount.currency || "EUR"
                    )
                  : t("accounts.empty_balance", {
                      defaultValue: "Add an account",
                    })}
              </h2>
              {activeAccount && (
                <p className="text-sm text-emerald-100/90 mt-2">
                  {t("accounts.limit_text", {
                    limit: activeAccount.limit,
                    currency: activeAccount.currency,
                  })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyDetails(activeAccount)}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20 transition"
              >
                <Copy size={14} />
                {t("accounts.copy", { defaultValue: "Copy" })}
              </button>
              <button
                onClick={() => handleShareDetails(activeAccount)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/80 px-3 py-2 text-xs font-semibold hover:bg-emerald-500 transition"
              >
                <Share2 size={14} />
                {t("accounts.share", { defaultValue: "Share" })}
              </button>
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-200/80">
                {t("accounts.account_number_label", {
                  defaultValue: "Account",
                })}
              </p>
              <p className="text-base font-semibold tracking-wide mt-1">
                {activeAccount?.account_number ?? "-"}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-200/80">{t("accounts.status")}</p>
              <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold">
                <span
                  className={`h-2 w-2 rounded-full ${activeAccount?.status === "ACTIVE" ? "bg-emerald-400" : "bg-amber-400"}`}
                />
                {activeAccount?.status ?? "-"}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-200/80">
                {t("accounts.opened_on", { defaultValue: "Opened on" })}
              </p>
              <p className="text-sm font-semibold mt-1">
                {activeAccount?.created_at
                  ? new Date(activeAccount.created_at).toLocaleDateString(
                      user?.locale ?? "en-US"
                    )
                  : t("common.na")}
              </p>
            </div>
          </div>

          {accountsCount > 1 && (
            <div className="relative mt-6 flex items-center justify-between">
              <button
                onClick={slidePrev}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                aria-label={t("common.previous", { defaultValue: "Previous" })}
              >
                <ChevronLeft />
              </button>
              <div className="flex gap-2">
                {accounts?.map((acc: Account, idx: number) => (
                  <span
                    key={acc.id}
                    className={`h-2 w-6 rounded-full transition ${idx === activeIndex ? "bg-white" : "bg-white/30"}`}
                  />
                ))}
              </div>
              <button
                onClick={slideNext}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                aria-label={t("common.next", { defaultValue: "Next" })}
              >
                <ChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canCreateMoreAccounts ? (
          <div
            className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl shadow-sm border border-blue-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer"
            onClick={() => setShowAccountModal(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-slate-700 rounded-lg">
                  <Building
                    className="text-blue-600 dark:text-blue-300"
                    size={24}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("accounts.open_account_title")}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("accounts.open_account_description")}
                  </p>
                </div>
              </div>
              <div className="text-blue-600 dark:text-blue-300">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t("accounts.account_limit_reached", {
                defaultValue: "Account Limit Reached",
              })}
            </h2>
            <p className="text-sm text-gray-600">
              {t("accounts.max_accounts_message", {
                defaultValue:
                  "You can have a maximum of 2 CHECKING accounts and 2 SAVINGS accounts.",
              })}
            </p>
          </div>
        )}

        <div
          className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl shadow-sm border border-emerald-100 hover:shadow-md transition cursor-pointer"
          onClick={() => setShowCardModal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Plus className="text-emerald-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("accounts.manage_cards")}
                </h2>
                <p className="text-sm text-gray-500">
                  {t("accounts.card.subtitle", {
                    defaultValue: "Create and manage your cards",
                  })}
                </p>
              </div>
            </div>
            <div className="text-emerald-600">
              <ChevronRight size={24} />
            </div>
          </div>
        </div>
      </div>

      {!cardsLoading && cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("accounts.my_cards", { defaultValue: "My Cards" })}
            </h2>
            {cardsCount > 1 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{cardSlideIndex + 1}</span>
                <span className="text-gray-400">/</span>
                <span>{cardsCount}</span>
              </div>
            )}
          </div>

          <div className="relative">
            {activeCard && (
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white rounded-xl shadow-lg p-6 overflow-hidden">
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  aria-hidden
                >
                  <div className="absolute -left-16 -top-16 w-32 h-32 bg-white/10 blur-2xl" />
                  <div className="absolute right-0 -bottom-12 w-40 h-40 bg-emerald-400/20 blur-3xl" />
                </div>

                <div className="relative space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-emerald-200/80">
                        {activeCard.type === "VIRTUAL"
                          ? t("accounts.card.types.virtual")
                          : t("accounts.card.types.physical")}
                      </p>
                      <p className="text-xl font-mono font-semibold mt-2 tracking-wider">
                        {maskCardNumber(activeCard.card_number)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        activeCard.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : activeCard.status === "BLOCKED"
                            ? "bg-red-500/20 text-red-200"
                            : "bg-gray-500/20 text-gray-200"
                      }`}
                    >
                      {activeCard.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-300/80 text-xs">
                        {t("accounts.card.expiry", { defaultValue: "Expires" })}
                      </p>
                      <p className="font-semibold font-mono">
                        {activeCard.expiry_date}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300/80 text-xs">
                        {t("accounts.card.cvv", { defaultValue: "CVV" })}
                      </p>
                      <p className="font-semibold font-mono">***</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleCopyCard(activeCard)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold transition"
                    >
                      <Copy size={14} />
                      {t("accounts.copy", { defaultValue: "Copy" })}
                    </button>
                  </div>

                  {activeCard.cardholder_name && (
                    <p className="text-xs text-gray-300/80 pt-2 border-t border-white/10">
                      {activeCard.cardholder_name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {cardsCount > 1 && (
              <div className="relative mt-4 flex items-center justify-between">
                <button
                  onClick={cardSlidePrev}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
                  aria-label={t("common.previous", {
                    defaultValue: "Previous",
                  })}
                >
                  <ChevronLeft className="text-gray-900" />
                </button>
                <div className="flex gap-2">
                  {cards?.map((_: Card, idx: number) => (
                    <span
                      key={idx}
                      className={`h-2 w-6 rounded-full transition ${idx === cardSlideIndex ? "bg-slate-900" : "bg-slate-300"}`}
                    />
                  ))}
                </div>
                <button
                  onClick={cardSlideNext}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
                  aria-label={t("common.next", { defaultValue: "Next" })}
                >
                  <ChevronRight className="text-gray-900" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Management Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("accounts.manage_cards")}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t("accounts.card.subtitle", {
                    defaultValue: "Create and manage your cards",
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowCardModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label={t("common.close", { defaultValue: "Close" })}
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {canCreateMoreVirtualCards ? (
                <div className="space-y-6">
                  {/* Card Creation Form */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      ✨{" "}
                      {t("accounts.card.create_new", {
                        defaultValue: "Create New Card",
                      })}
                    </h3>
                    <form onSubmit={handleCreateCard} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("accounts.card.account_label")}
                        </label>
                        <select
                          value={cardAccountId}
                          onChange={(e) => setCardAccountId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        >
                          <option value="">
                            {t("accounts.card.choose_account")}
                          </option>
                          {accounts?.map((acc: Account) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.account_type} - {acc.account_number} (
                              {acc.currency})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("accounts.card.card_type_label")}
                        </label>
                        <select
                          value={cardType}
                          onChange={(e) =>
                            setCardType(
                              e.target.value as "VIRTUAL" | "PHYSICAL"
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="VIRTUAL">
                            {t("accounts.card.types.virtual")}
                          </option>
                          <option value="PHYSICAL">
                            {t("accounts.card.types.physical")}
                          </option>
                        </select>
                      </div>
                      {cardError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                          {cardError}
                        </div>
                      )}
                      {cardSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                          {cardSuccess}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={createCard.isPending}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-60"
                      >
                        {createCard.isPending ? (
                          t("accounts.creating")
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Plus size={18} />
                            {t("accounts.card.create")}
                          </div>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Existing Cards */}
                  {cards.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📇{" "}
                        {t("accounts.my_cards", { defaultValue: "Your Cards" })}{" "}
                        ({cards.length}/6)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cards.map((card: Card) => (
                          <div
                            key={card.id}
                            className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white rounded-xl p-5 overflow-hidden group hover:shadow-lg transition"
                          >
                            <div className="absolute inset-0 pointer-events-none opacity-30">
                              <div className="absolute -left-16 -top-16 w-32 h-32 bg-white/10 blur-2xl" />
                              <div className="absolute right-0 -bottom-12 w-40 h-40 bg-emerald-400/20 blur-3xl" />
                            </div>

                            <div className="relative space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs uppercase tracking-widest text-emerald-200/80">
                                    {card.type === "VIRTUAL"
                                      ? t("accounts.card.types.virtual")
                                      : t("accounts.card.types.physical")}
                                  </p>
                                  <p className="text-lg font-mono font-semibold mt-2 tracking-wider">
                                    {maskCardNumber(card.card_number)}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                                    card.status === "ACTIVE"
                                      ? "bg-emerald-500/20 text-emerald-200"
                                      : card.status === "BLOCKED"
                                        ? "bg-red-500/20 text-red-200"
                                        : "bg-gray-500/20 text-gray-200"
                                  }`}
                                >
                                  {card.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <p className="text-gray-300/80">
                                    {t("accounts.card.expiry", {
                                      defaultValue: "Expires",
                                    })}
                                  </p>
                                  <p className="font-semibold font-mono mt-1">
                                    {card.expiry_date}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-300/80">
                                    {t("accounts.card.cvv", {
                                      defaultValue: "CVV",
                                    })}
                                  </p>
                                  <p className="font-semibold font-mono mt-1">
                                    ***
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleCopyCard(card)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold transition mt-2"
                              >
                                <Copy size={14} />
                                {t("accounts.copy", { defaultValue: "Copy" })}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("accounts.card_limit_reached", {
                      defaultValue: "Virtual Card Limit Reached",
                    })}
                  </h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    {t("accounts.max_virtual_cards_message", {
                      defaultValue: `You have reached the maximum limit of 6 virtual cards (${virtualCardCount}/6). Delete unused cards to create new ones.`,
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowCardModal(false)}
                className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
              >
                {t("accounts.card.cancel", { defaultValue: "Close" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Creation Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("accounts.open_account_title")}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t("accounts.open_account_description")}
                </p>
              </div>
              <button
                onClick={() => setShowAccountModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label={t("common.close", { defaultValue: "Close" })}
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={handleCreateAccount} className="space-y-6">
                {/* Account Type Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    🏦 {t("accounts.account_type")}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {canCreateChecking && (
                      <label className="relative">
                        <input
                          type="radio"
                          value="CHECKING"
                          checked={accountType === "CHECKING"}
                          onChange={(e) =>
                            setAccountType(
                              e.target.value as "CHECKING" | "SAVINGS"
                            )
                          }
                          className="sr-only"
                          disabled={createAccount.isPending}
                        />
                        <div
                          className="p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition flex items-center gap-3"
                          style={{
                            borderColor:
                              accountType === "CHECKING"
                                ? "rgb(59, 130, 246)"
                                : "",
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-full border-2 border-gray-300"
                            style={{
                              borderColor:
                                accountType === "CHECKING"
                                  ? "rgb(59, 130, 246)"
                                  : "",
                            }}
                          >
                            {accountType === "CHECKING" && (
                              <div className="w-full h-full rounded-full bg-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {t("accounts.types.checking")}
                            </p>
                            <p className="text-xs text-gray-500">
                              Daily transactions & payments
                            </p>
                          </div>
                        </div>
                      </label>
                    )}
                    {canCreateSavings && (
                      <label className="relative">
                        <input
                          type="radio"
                          value="SAVINGS"
                          checked={accountType === "SAVINGS"}
                          onChange={(e) =>
                            setAccountType(
                              e.target.value as "CHECKING" | "SAVINGS"
                            )
                          }
                          className="sr-only"
                          disabled={createAccount.isPending}
                        />
                        <div
                          className="p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition flex items-center gap-3"
                          style={{
                            borderColor:
                              accountType === "SAVINGS"
                                ? "rgb(16, 185, 129)"
                                : "",
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-full border-2 border-gray-300"
                            style={{
                              borderColor:
                                accountType === "SAVINGS"
                                  ? "rgb(16, 185, 129)"
                                  : "",
                            }}
                          >
                            {accountType === "SAVINGS" && (
                              <div className="w-full h-full rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {t("accounts.types.savings")}
                            </p>
                            <p className="text-xs text-gray-500">
                              Save & grow your money
                            </p>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Currency Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    💱 {t("accounts.currency")}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["EUR", "USD", "GBP"].map((curr) => (
                      <label key={curr} className="relative">
                        <input
                          type="radio"
                          value={curr}
                          checked={currency === curr}
                          onChange={(e) =>
                            setCurrency(e.target.value as "EUR" | "USD" | "GBP")
                          }
                          className="sr-only"
                          disabled={createAccount.isPending}
                        />
                        <div
                          className="p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition text-center"
                          style={{
                            borderColor:
                              currency === curr ? "rgb(59, 130, 246)" : "",
                          }}
                        >
                          <p className="font-semibold text-gray-900">{curr}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {curr === "EUR" ? "€" : curr === "USD" ? "$" : "£"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Limit Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    💰 {t("accounts.limit_label")}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      value={limit}
                      min={100}
                      max={10000}
                      step={100}
                      onChange={(event) => setLimit(Number(event.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      disabled={createAccount.isPending}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">€100</span>
                      <span className="text-lg font-bold text-blue-600">
                        €{limit.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">€10,000</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {successMessage}
                  </div>
                )}

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">
                      ✨ {t("accounts.instant", { defaultValue: "Instant" })}{" "}
                      •{" "}
                    </span>
                    <span>
                      Your account will be created immediately and ready to use
                    </span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    className="flex-1 px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                  >
                    {t("accounts.card.cancel", { defaultValue: "Cancel" })}
                  </button>
                  <button
                    type="submit"
                    disabled={createAccount.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {createAccount.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("accounts.creating")}
                      </>
                    ) : (
                      <>
                        <Building size={18} />
                        {t("accounts.create_account")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
