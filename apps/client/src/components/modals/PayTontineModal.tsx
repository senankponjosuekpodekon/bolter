import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

interface PayTontineModalProps {
  isOpen: boolean;
  onClose: () => void;
  tontineId: string;
  tontineName: string;
  contributionAmount: number;
  currency: string;
  cycleId: string;
}

type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'WALLET' | 'CASH';

interface PayTontineData {
  amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  proof?: string;
  cycle_id: string;
}

export default function PayTontineModal({
  isOpen,
  onClose,
  tontineId,
  tontineName,
  contributionAmount,
  currency,
  cycleId,
}: PayTontineModalProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [proof, setProof] = useState('');
  const [error, setError] = useState('');

  const payMutation = useMutation({
    mutationFn: async (data: PayTontineData) => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(
        `${API_BASE_URL}/tontines/${tontineId}/pay`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontine', tontineId] });
      queryClient.invalidateQueries({ queryKey: ['tontines'] });
      onClose();
      // TODO: Show success toast
      alert('Payment successful! ✅');
    },
    onError: (err: unknown) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Payment failed';
      setError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cycleId) {
      setError('No active cycle found');
      return;
    }

    payMutation.mutate({
      amount: contributionAmount,
      payment_method: paymentMethod,
      payment_reference: paymentReference || undefined,
      proof: proof || undefined,
      cycle_id: cycleId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Pay Contribution
        </h2>
        
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Tontine</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{tontineName}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {contributionAmount.toFixed(2)} {currency}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={payMutation.isPending}
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Card Payment</option>
              <option value="WALLET">Wallet</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Payment Reference (Optional)
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Transaction ID or reference number"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={payMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Proof/Notes (Optional)
            </label>
            <textarea
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="Any additional notes or proof"
              rows={3}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={payMutation.isPending}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={payMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={payMutation.isPending}
            >
              {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
