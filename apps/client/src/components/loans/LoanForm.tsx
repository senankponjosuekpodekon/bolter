// LoanForm (UI-only, react-hook-form + zod)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loanRequestSchema } from "../../validation/loans";
import type { z } from "zod";

type FormData = z.infer<typeof loanRequestSchema>;

type Props = {
  defaultValues?: Partial<FormData>;
  submitting?: boolean;
  onSubmit: (payload: FormData) => void;
};

export default function LoanForm({
  defaultValues,
  submitting,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: defaultValues as Partial<FormData> | undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Montant (EUR)
        </label>
        <input
          {...register("amount", { valueAsNumber: true })}
          type="number"
          min={100}
          step={10}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        />
        {errors.amount && (
          <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Durée (mois)
        </label>
        <select
          {...register("durationMonths", { valueAsNumber: true })}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        >
          <option value="">Sélectionnez la durée</option>
          <option value={3}>3 mois</option>
          <option value={6}>6 mois</option>
          <option value={12}>12 mois</option>
          <option value={18}>18 mois</option>
          <option value={24}>24 mois</option>
        </select>
        {errors.durationMonths && (
          <p className="text-sm text-red-500 mt-1">
            {errors.durationMonths.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          But / Description
        </label>
        <input
          {...register("purpose")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Revenu mensuel (€)
        </label>
        <input
          {...register("monthlyIncome", { valueAsNumber: true })}
          type="number"
          min={1}
          step={1}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        />
        {errors.monthlyIncome && (
          <p className="text-sm text-red-500 mt-1">
            {errors.monthlyIncome.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Employeur (optionnel)
        </label>
        <input
          {...register("employer")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes (optionnel)
        </label>
        <textarea
          {...register("notes")}
          className="mt-1 w-full px-3 py-2 border rounded-md"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Envoi..." : "Demander le prêt"}
        </button>
      </div>
    </form>
  );
}
