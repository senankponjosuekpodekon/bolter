// Transfer form (UI-only, uses react-hook-form + zod)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema } from "../../../validation/transactions";
import type { z } from "zod";
import type { Account } from "../../../types/transactions";

type FormData = z.infer<typeof transferSchema>;

type Props = {
  accounts?: Account[];
  defaultValues?: Partial<FormData>;
  submitting?: boolean;
  onSubmit: (payload: FormData) => void;
};

export default function TransferForm({
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
    resolver: zodResolver(transferSchema),
    defaultValues: defaultValues as Partial<FormData> | undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          From Account
        </label>
        <select
          {...register("fromAccountId")}
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
        {errors.fromAccountId && (
          <p className="text-sm text-red-500 mt-1">
            {errors.fromAccountId.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          To Account (internal)
        </label>
        <select
          {...register("toAccountId")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        >
          <option value="">Internal account or use IBAN below</option>
          {accounts?.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.account_number}
            </option>
          ))}
        </select>
        {errors.toAccountId && (
          <p className="text-sm text-red-500 mt-1">
            {errors.toAccountId.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Or External IBAN
        </label>
        <input
          {...register("ibanExternal")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
          placeholder="FR7612345678901234567890123"
        />
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
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          {...register("description")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Create Transfer"}
        </button>
      </div>
    </form>
  );
}
