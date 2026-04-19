'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { History, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, ExternalLink, Loader2, Filter, Wallet } from 'lucide-react';
import { usePendingRemittances, useSentRemittances, useRemittance, formatUSDC } from '@/hooks/useArcRemit';
import { RemittanceStatus } from '@/lib/contracts';
import { useLanguage } from '@/lib/i18n';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import Link from 'next/link';

type FilterType = 'all' | 'sent' | 'received' | 'pending';

const statusConfig = {
  [RemittanceStatus.Pending]: { label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  [RemittanceStatus.Claimed]: { label: 'Claimed', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
  [RemittanceStatus.Refunded]: { label: 'Refunded', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
};

function TransactionRow({ id, currentAddress }: { id: number; currentAddress: `0x${string}` }) {
  const { remittance, isLoading } = useRemittance(id);

  if (isLoading || !remittance) {
    return (
      <tr className="border-b border-white/5">
        <td className="py-4 px-4"><div className="h-4 w-24 bg-white/10 rounded animate-pulse" /></td>
        <td className="py-4 px-4"><div className="h-4 w-16 bg-white/10 rounded animate-pulse" /></td>
        <td className="py-4 px-4"><div className="h-4 w-20 bg-white/10 rounded animate-pulse" /></td>
        <td className="py-4 px-4"><div className="h-4 w-16 bg-white/10 rounded animate-pulse" /></td>
        <td className="py-4 px-4"><div className="h-4 w-32 bg-white/10 rounded animate-pulse" /></td>
      </tr>
    );
  }

  const isSender = currentAddress.toLowerCase() === remittance.sender.toLowerCase();
  const status = statusConfig[remittance.status];
  const StatusIcon = status.icon;

  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(Number(remittance.createdAt) * 1000), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  })();

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-white/5 hover:bg-white/5 transition-colors"
    >
      <td className="py-4 px-4 text-sm text-gray-300">{formattedDate}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', isSender ? 'bg-red-500/20' : 'bg-green-500/20')}>
            {isSender ? <ArrowUpRight className="w-4 h-4 text-red-400" /> : <ArrowDownLeft className="w-4 h-4 text-green-400" />}
          </div>
          <span className="text-sm text-white font-medium">{isSender ? 'Sent' : 'Received'}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-sm text-white font-semibold">{formatUSDC(remittance.amount)} USDC</td>
      <td className="py-4 px-4">
        <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', status.bg, status.color)}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </td>
      <td className="py-4 px-4 text-sm text-gray-400 max-w-[200px] truncate">
        {remittance.message || '-'}
      </td>
      <td className="py-4 px-4">
        <Link
          href={`https://testnet.arcscan.app/tx/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-arc-400 hover:text-arc-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </td>
    </motion.tr>
  );
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>('all');

  const { pendingIds } = usePendingRemittances(address);
  const { sentIds } = useSentRemittances(address);

  // Combine and deduplicate all IDs
  const allIds = useMemo(() => {
    const idSet = new Set<number>();
    const all = [
      ...pendingIds.map((id) => ({ id: Number(id), type: 'pending' as const })),
      ...sentIds.map((id) => ({ id: Number(id), type: 'sent' as const })),
    ];
    all.forEach((item) => idSet.add(item.id));
    return Array.from(idSet).sort((a, b) => b - a);
  }, [pendingIds, sentIds]);

  const pendingIdSet = new Set(pendingIds.map(Number));

  const filteredIds = useMemo(() => {
    if (filter === 'all') return allIds;
    if (filter === 'pending') return allIds.filter((id) => pendingIdSet.has(id));
    if (filter === 'sent') return sentIds.map(Number);
    if (filter === 'received') return allIds.filter((id) => !sentIds.map(Number).includes(id));
    return allIds;
  }, [allIds, filter, pendingIdSet, sentIds]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('history.all') },
    { key: 'sent', label: t('history.sent') },
    { key: 'received', label: t('history.received') },
    { key: 'pending', label: t('history.pending') },
  ];

  if (!isConnected) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-32 right-20 w-72 h-72 bg-arc-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 mb-4">
              <History className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('history.title')}</h1>
          </motion.div>
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Connect your wallet to view transaction history</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-32 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-arc-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('history.title')}</h1>
              <p className="text-gray-400">View all your remittance transactions</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-2"
        >
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                filter === f.key
                  ? 'bg-arc-600/30 text-arc-300 border border-arc-500/30'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-glass backdrop-blur-xl border border-white/10 overflow-hidden"
        >
          {filteredIds.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No transactions found</p>
              <Link href="/send" className="inline-flex items-center gap-2 mt-4 text-arc-400 hover:text-arc-300 text-sm">
                Send your first remittance <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wider">{t('history.date')}</th>
                    <th className="py-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wider">{t('history.direction')}</th>
                    <th className="py-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wider">{t('history.amount')}</th>
                    <th className="py-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wider">{t('history.status')}</th>
                    <th className="py-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wider">{t('history.message')}</th>
                    <th className="py-3 px-4 text-xs text-gray-400 font-medium uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredIds.map((id) => (
                      <TransactionRow key={id} id={id} currentAddress={address!} />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
