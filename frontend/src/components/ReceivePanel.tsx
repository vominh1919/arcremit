'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Wallet, Inbox, Loader2 } from 'lucide-react';
import { usePendingRemittances, useRemittance, useArcRemit } from '@/hooks/useArcRemit';
import { RemittanceCard } from './RemittanceCard';
import { useLanguage } from '@/lib/i18n';
import clsx from 'clsx';

function PendingRemittanceItem({
  id,
  currentAddress,
  onClaimSuccess,
}: {
  id: number;
  currentAddress: `0x${string}`;
  onClaimSuccess: () => void;
}) {
  const { remittance, isLoading } = useRemittance(id);
  const { claimRemittance, isPending, isConfirming, isConfirmed } = useArcRemit();

  if (isConfirmed) {
    onClaimSuccess();
  }

  if (isLoading || !remittance) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
        <div className="h-5 w-32 bg-white/10 rounded mb-2" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <RemittanceCard
      remittance={remittance}
      currentAddress={currentAddress}
      onClaim={(id) => claimRemittance(id)}
      isClaiming={isPending || isConfirming}
    />
  );
}

export function ReceivePanel() {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const { pendingIds, isLoading, refetch } = usePendingRemittances(address);
  const [refreshKey, setRefreshKey] = useState(0);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimSuccess = () => {
    setTimeout(() => {
      refetch();
      setRefreshKey((k) => k + 1);
    }, 2000);
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
        <h3 className="text-xl font-semibold text-white mb-2">{t('receive.connect')}</h3>
        <p className="text-gray-400">Connect your wallet to receive USDC</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8" key={refreshKey}>
      {/* QR Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h3 className="text-lg font-semibold text-white mb-4">{t('receive.qr')}</h3>

        <div className="inline-block p-6 rounded-2xl bg-white border border-white/20 shadow-lg">
          <QRCodeSVG
            value={address || ''}
            size={200}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>

        {/* Address with copy */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 font-mono text-sm text-gray-300 max-w-xs truncate">
            {address}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyAddress}
            className={clsx(
              'p-2.5 rounded-xl border transition-all',
              copied
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            )}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </motion.button>
        </div>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-green-400 mt-2"
          >
            {t('common.copied')}
          </motion.p>
        )}
      </motion.div>

      {/* Pending Remittances */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-arc-400" />
            {t('receive.pending')}
            {pendingIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-arc-500/20 text-arc-400 text-xs font-medium">
                {pendingIds.length}
              </span>
            )}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-arc-400 animate-spin" />
          </div>
        ) : pendingIds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-white/5"
          >
            <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">{t('receive.empty')}</p>
            <p className="text-xs text-gray-500 mt-1">
              Share your QR code or address to receive USDC
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {pendingIds.map((id) => (
              <PendingRemittanceItem
                key={Number(id)}
                id={Number(id)}
                currentAddress={address!}
                onClaimSuccess={handleClaimSuccess}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
