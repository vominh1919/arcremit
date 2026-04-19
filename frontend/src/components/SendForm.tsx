'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { Send, AlertCircle, CheckCircle2, Loader2, Wallet, ArrowRight, QrCode, X } from 'lucide-react';
import { useArcRemit } from '@/hooks/useArcRemit';
import { useUSDC, useUSDCBalance, useUSDCAllowance } from '@/hooks/useUSDC';
import { FeeCalculator } from './FeeCalculator';
import { useLanguage } from '@/lib/i18n';
import clsx from 'clsx';
import Link from 'next/link';

interface SendFormProps {
  onSuccess?: (hash: `0x${string}`) => void;
}

type Step = 'input' | 'approve' | 'confirm' | 'pending' | 'success';

export function SendForm({ onSuccess }: SendFormProps) {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();

  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { formattedBalance, isLoading: balanceLoading } = useUSDCBalance(address);
  const { formattedAllowance } = useUSDCAllowance(address);

  const {
    approve,
    isPending: approvePending,
    isConfirming: approveConfirming,
    isConfirmed: approveConfirmed,
    hash: approveHash,
  } = useUSDC();

  const {
    createRemittance,
    isPending: sendPending,
    isConfirming: sendConfirming,
    isConfirmed: sendConfirmed,
    hash: sendHash,
  } = useArcRemit();

  // Validation
  const errors: Record<string, string> = {};
  if (receiver && !isAddress(receiver)) {
    errors.receiver = 'Invalid address';
  }
  const numAmount = parseFloat(amount);
  if (amount && (isNaN(numAmount) || numAmount <= 0)) {
    errors.amount = 'Invalid amount';
  }
  if (numAmount > parseFloat(formattedBalance)) {
    errors.amount = 'Insufficient balance';
  }
  const isValid = isAddress(receiver) && numAmount > 0 && numAmount <= parseFloat(formattedBalance);

  const needsApproval = parseFloat(formattedAllowance) < numAmount;

  const handleApprove = useCallback(() => {
    setStep('approve');
    approve();
  }, [approve]);

  // Move to confirm when approval is done
  if (approveConfirmed && step === 'approve') {
    setStep('confirm');
  }

  const handleSend = useCallback(() => {
    setStep('pending');
    createRemittance(receiver as `0x${string}`, amount, message);
  }, [createRemittance, receiver, amount, message]);

  // Handle success
  if (sendConfirmed && step === 'pending' && sendHash) {
    setTxHash(sendHash);
    setStep('success');
    onSuccess?.(sendHash);
  }

  const resetForm = () => {
    setReceiver('');
    setAmount('');
    setMessage('');
    setStep('input');
    setTxHash(undefined);
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 rounded-2xl bg-arc-500/20 flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-10 h-10 text-arc-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{t('send.connect')}</h3>
        <p className="text-gray-400 mb-6">Connect your wallet to start sending USDC</p>
      </motion.div>
    );
  }

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">{t('send.success')}</h3>
        <p className="text-gray-400 mb-6">
          {amount} USDC has been sent to {receiver.slice(0, 6)}...{receiver.slice(-4)}
        </p>

        {txHash && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
            <p className="text-sm text-arc-400 font-mono break-all">
              {txHash}
            </p>
            <Link
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-arc-400 hover:text-arc-300"
            >
              View on Explorer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        <button
          onClick={resetForm}
          className="px-6 py-3 rounded-xl bg-arc-600 text-white font-semibold hover:bg-arc-500 transition-colors"
        >
          Send Another
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
        <span className="text-gray-400 text-sm">Your Balance</span>
        <span className="text-white font-semibold">
          {balanceLoading ? (
            <span className="inline-block w-20 h-5 bg-white/10 rounded animate-pulse" />
          ) : (
            `${formattedBalance} USDC`
          )}
        </span>
      </div>

      {/* Receiver Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">{t('send.receiver')}</label>
        <div className="relative">
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            placeholder="0x..."
            className={clsx(
              'w-full px-4 py-3.5 rounded-xl bg-white/5 border text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-arc-500/50 transition-all font-mono text-sm',
              errors.receiver ? 'border-red-500/50' : 'border-white/10 focus:border-arc-500/50'
            )}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
            title="Scan QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
        {errors.receiver && (
          <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" /> {errors.receiver}
          </p>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">{t('send.amount')}</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={clsx(
              'w-full px-4 py-3.5 rounded-xl bg-white/5 border text-white placeholder-gray-500 text-2xl font-semibold',
              'focus:outline-none focus:ring-2 focus:ring-arc-500/50 transition-all',
              errors.amount ? 'border-red-500/50' : 'border-white/10 focus:border-arc-500/50'
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => setAmount(formattedBalance)}
              className="px-2 py-1 rounded-md bg-arc-600/30 text-arc-400 text-xs font-medium hover:bg-arc-600/50 transition-colors"
            >
              MAX
            </button>
            <span className="text-gray-400 font-medium">USDC</span>
          </div>
        </div>
        {errors.amount && (
          <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" /> {errors.amount}
          </p>
        )}
      </div>

      {/* Message Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">{t('send.message')}</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a note for the receiver..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-arc-500/50 focus:border-arc-500/50 transition-all resize-none"
        />
      </div>

      {/* Fee Calculator */}
      {numAmount > 0 && <FeeCalculator amount={amount} />}

      {/* Action Buttons */}
      <div className="space-y-3">
        {needsApproval && numAmount > 0 ? (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleApprove}
            disabled={!isValid || approvePending || approveConfirming}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-semibold text-lg
                       hover:from-arc-500 hover:to-arc-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-neon hover:shadow-neon-lg flex items-center justify-center gap-2"
          >
            {(approvePending || approveConfirming) ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {approvePending ? 'Confirm in Wallet...' : 'Approving...'}
              </>
            ) : (
              <>
                Approve USDC <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSend}
            disabled={!isValid || step === 'pending'}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-semibold text-lg
                       hover:from-arc-500 hover:to-arc-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-neon hover:shadow-neon-lg flex items-center justify-center gap-2"
          >
            {step === 'pending' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {sendPending ? 'Confirm in Wallet...' : sendConfirming ? 'Sending...' : 'Processing...'}
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('send.button')}
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
