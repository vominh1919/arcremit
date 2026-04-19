'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, Zap } from 'lucide-react';
import { FEE_PERCENTAGE, FEE_DENOMINATOR } from '@/lib/contracts';
import clsx from 'clsx';

interface FeeCalculatorProps {
  amount: string;
  className?: string;
}

export function FeeCalculator({ amount, className }: FeeCalculatorProps) {
  const { fee, total, feePercent, savings } = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const feeAmount = (numAmount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
    const traditionalFee = numAmount * 0.065; // 6.5% traditional remittance fee
    const feeSavings = traditionalFee - feeAmount;

    return {
      fee: feeAmount.toFixed(2),
      total: (numAmount + feeAmount).toFixed(2),
      feePercent: `${(FEE_PERCENTAGE / 100).toFixed(1)}%`,
      savings: feeSavings.toFixed(2),
    };
  }, [amount]);

  const hasAmount = parseFloat(amount) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden',
        className
      )}
    >
      <div className="p-4 space-y-3">
        {/* Fee row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Info className="w-4 h-4" />
            <span>Network Fee ({feePercent})</span>
          </div>
          <span className="text-white font-medium">
            {hasAmount ? `${fee} USDC` : '0.00 USDC'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Total row */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300 font-medium">Total</span>
          <motion.span
            key={total}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold text-white"
          >
            {hasAmount ? `${total} USDC` : '0.00 USDC'}
          </motion.span>
        </div>

        {/* Savings badge */}
        {hasAmount && parseFloat(savings) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">
              You save <span className="font-bold">${savings}</span> vs traditional remittance (6.5%)
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
