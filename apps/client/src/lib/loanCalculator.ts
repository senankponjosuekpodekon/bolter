export interface LoanSimulationInput {
  amount: number
  durationMonths: number
  annualInterestRate: number
}

export interface LoanSimulationResult {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
}

export const simulateAmortizedLoan = ({ amount, durationMonths, annualInterestRate }: LoanSimulationInput): LoanSimulationResult => {
  const monthlyRate = annualInterestRate / 12
  if (monthlyRate === 0) {
    const monthlyPayment = amount / durationMonths
    return {
      monthlyPayment,
      totalPayment: monthlyPayment * durationMonths,
      totalInterest: monthlyPayment * durationMonths - amount,
    }
  }

  const factor = Math.pow(1 + monthlyRate, durationMonths)
  const monthlyPayment = (amount * monthlyRate * factor) / (factor - 1)
  const totalPayment = monthlyPayment * durationMonths

  return {
    monthlyPayment,
    totalPayment,
    totalInterest: totalPayment - amount,
  }
}
