import { Card } from "../../types";
import { useTranslation } from "react-i18next";
import { CreditCard, Lock, Trash2 } from "lucide-react";

interface CardsListProps {
  accountId: string;
  cards?: Card[];
  isLoading?: boolean;
  onDelete?: (cardId: string) => void;
  onBlock?: (cardId: string, blocked: boolean) => void;
}

export default function CardsList({
  cards,
  isLoading,
  onDelete,
  onBlock,
}: CardsListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="text-sm text-gray-500">{t("common.loading")}</div>;
  }

  if (!cards || cards.length === 0) {
    return <p className="text-sm text-gray-400">{t("accounts.no_cards")}</p>;
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-lg p-4 shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <CreditCard size={20} className="text-slate-300 mt-1" />
              <div>
                <p className="text-sm font-medium">
                  {card.type === "VIRTUAL" ? "💻" : "🏦"} {card.type}
                </p>
                <p className="text-lg font-mono font-bold mt-1">
                  {`****${card.card_number.slice(-4)}`}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
                  <span>Exp: {card.expiry_date}</span>
                  <span>CVV: {card.cvv}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  card.status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : card.status === "BLOCKED"
                      ? "bg-red-500/20 text-red-200"
                      : "bg-yellow-500/20 text-yellow-200"
                }`}
              >
                {card.status}
              </span>

              <div className="flex gap-2 mt-3">
                {onBlock && (
                  <button
                    onClick={() => onBlock(card.id, card.status === "ACTIVE")}
                    className="text-slate-300 hover:text-slate-100 transition"
                    title={
                      card.status === "ACTIVE" ? "Block card" : "Unblock card"
                    }
                  >
                    <Lock size={16} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(card.id)}
                    className="text-slate-400 hover:text-red-400 transition"
                    title="Delete card"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
