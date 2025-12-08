// Withdraw form (UI-only, uses react-hook-form + zod)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { withdrawSchema } from "../../../validation/transactions";
import type { z } from "zod";
import type { Account } from "../../../types/transactions";

type FormData = z.infer<typeof withdrawSchema>;

type Props = {
  accounts?: Account[];
  defaultValues?: Partial<FormData>;
  submitting?: boolean;
  onSubmit: (payload: FormData) => void;
};

export default function WithdrawForm({
  accounts,
  defaultValues,
  submitting,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: defaultValues as Partial<FormData> | undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          From Account
        </label>
        <select
          {...register("accountId")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select account</option>
          {accounts?.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.account_number} - €
              {parseFloat(String(acc.balance)).toFixed(2)}
            </option>
          ))}
        </select>
        {errors.accountId && (
          <p className="text-sm text-red-500 mt-1">
            {errors.accountId.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Amount (EUR)
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          {...register("amount", { valueAsNumber: true })}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        />
        {errors.amount && (
          <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">IBAN</label>
        <input
          {...register("iban")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
          placeholder="FR761234..."
        />
        {errors.iban && (
          <p className="text-sm text-red-500 mt-1">{errors.iban.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Account Holder Name
        </label>
        <input
          {...register("accountHolderName")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        />
        {errors.accountHolderName && (
          <p className="text-sm text-red-500 mt-1">
            {errors.accountHolderName.message}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Create Withdrawal"}
        </button>
      </div>
    </form>
  );
}
