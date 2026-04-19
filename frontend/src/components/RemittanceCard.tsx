'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { RemittanceStatus } from '@/lib/contracts';
import { formatUSDC } from '@/hooks/useArcRemit';
import type { Remittance } from '@/hooks/useArcRemit';
import { useLanguage } from '@/lib/i18n';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import Link from 'next/link';

interface RemittanceCardProps {
  remittance: Remittance;
  currentAddress?: `0x${string}`;
  onClaim?: (id: number) => void;
  isClaiming?: boolean;
  explorerUrl?: string;
}

const statusConfig = {
  [RemittanceStatus.Pending]: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
  },
  [RemittanceStatus.Claimed]: {
    label: 'Claimed',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
  },
  [RemittanceStatus.Refunded]: {
    label: 'Refunded',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
  },
};

export function RemittanceCard({
  remittance,
  currentAddress,
  onClaim,
  isClaiming,
  explorerUrl = 'https://testnet.arcscan.app',
}: RemittanceCardProps) {
  const { t } = useLanguage();
  const isSender = currentAddress?.toLowerCase() === remittance.sender.toLowerCase();
  const isReceiver = currentAddress?.toLowerCase() === remittance.receiver.toLowerCase();
  const status = statusConfig[remittance.status];
  const StatusIcon = status.icon;

  const formattedDate = (() => {
    try {
      const date = new Date(Number(remittance.createdAt) * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  })();

  const truncatedSender = `${remittance.sender.slice(0, 6)}...${remittance.sender.slice(-4)}`;
  const truncatedReceiver = `${remittance.receiver.slice(0, 6)}...${remittance.receiver.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={clsx(
        'rounded-2xl border bg-glass backdrop-blur-xl overflow-hidden transition-all duration-300',
        status.border,
        'hover:shadow-glass'
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                isSender ? 'bg-red-500/20' : 'bg-green-500/20'
              )}
            >
              {isSender ? (
                <ArrowUpRight className="w-5 h-5 text-red-400" />
              ) : (
                <ArrowDownLeft className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div>
              <p className="text-white font-semibold">
                {isSender ? 'Sent' : 'Received'} {formatUSDC(remittance.amount)} USDC
              </p>
              <p className="text-xs text-gray-400">{formattedDate}</p>
            </div>
          </div>

          <div
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              status.bg,
              status.color
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">
              {isSender ? 'To' : 'From'}
            </span>
            <span className="text-gray-300 font-mono">
              {isSender ? truncatedReceiver : truncatedSender}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fee</span>
            <span className="text-gray-300">{formatUSDC(remittance.fee)} USDC</span>
          </div>
          {remittance.message && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
              <p className="text-xs text-gray-400 mb-1">Message</p>
              <p className="text-gray-300 text-sm">{remittance.message}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          {isReceiver && remittance.status === RemittanceStatus.Pending && onClaim && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onClaim(remittance.id)}
              disabled={isClaiming}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-semibold text-sm
                         hover:from-arc-500 hover:to-arc-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-neon hover:shadow-neon-lg"
            >
              {isClaiming ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Claiming...
                </span>
              ) : (
                t('receive.claim')
              )}
            </motion.button>
          )}

          <Link
            href={`${explorerUrl}/tx/${remittance.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm
                       hover:bg-white/10 hover:text-white transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Explorer
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
