import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfTransaction {
  created_at: string;
  description?: string;
  type: string;
  amount: string | number;
  currency: string;
  status: string;
}

export interface PdfAccount {
  account_number: string;
  account_type: string;
  currency: string;
  balance: string | number;
}

export interface StatementOptions {
  account: PdfAccount;
  transactions: PdfTransaction[];
  userName: string;
  locale?: string;
}

const fmt = (amount: string | number, currency: string, locale = "fr-FR") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    Number(amount)
  );

const fmtDate = (iso: string, locale = "fr-FR") =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const exportAccountStatement = ({
  account,
  transactions,
  userName,
  locale = "fr-FR",
}: StatementOptions): void => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // Header band
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Account Statement", 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${now}`, 14, 22);

  // Account info block
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(userName, 14, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    [
      `Account: ${account.account_number}`,
      `Type: ${account.account_type}`,
      `Balance: ${fmt(account.balance, account.currency, locale)}`,
    ],
    14,
    44
  );

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 62, pageW - 14, 62);

  // Transactions table
  const rows = transactions.map((tx) => [
    fmtDate(tx.created_at, locale),
    tx.description || "—",
    tx.type,
    fmt(tx.amount, tx.currency, locale),
    tx.status,
  ]);

  autoTable(doc, {
    startY: 66,
    head: [["Date", "Description", "Type", "Amount", "Status"]],
    body: rows.length ? rows : [["No transactions", "", "", "", ""]],
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 60 },
      2: { cellWidth: 24 },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} / ${pageCount} — Confidential`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  const filename = `statement_${account.account_number.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
};
