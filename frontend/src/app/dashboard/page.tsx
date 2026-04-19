'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { LayoutDashboard, Send, Receipt, PiggyBank, Activity, TrendingUp, ArrowUpRight, Wallet, BarChart3 } from 'lucide-react';
import { usePendingRemittances, useSentRemittances, useRemittance, formatUSDC } from '@/hooks/useArcRemit';
import { useUSDCBalance } from '@/hooks/useUSDC';
import { StatsCard } from '@/components/StatsCard';
import { RemittanceCard } from '@/components/RemittanceCard';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import clsx from 'clsx';

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((value, index) => (
        <motion.div
          key={index}
          initial={{ height: 0 }}
          animate={{ height: `${(value / max) * 100}%` }}
          transition={{ delay: index * 0.05, duration: 0.5 }}
          className="flex-1 bg-gradient-to-t from-arc-600 to-arc-400 rounded-t-md min-h-[4px]"
          title={`${value} USDC`}
        />
      ))}
    </div>
  );
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();

  const { formattedBalance } = useUSDCBalance(address);
  const { pendingIds } = usePendingRemittances(address);
  const { sentIds } = useSentRemittances(address);

  // Calculate stats from sent remittances
  const { totalSent, totalReceived, monthlyData } = useMemo(() => {
    // In a real app, we'd fetch all remittances and calculate
    // For now, use mock data based on IDs
    const mockMonthly = [120, 450, 280, 680, 340, 520, 780, 420, 650, 890, 560, 720];
    return {
      totalSent: sentIds.length > 0 ? (sentIds.length * 150.5).toFixed(2) : '0.00',
      totalReceived: pendingIds.length > 0 ? (pendingIds.length * 200.75).toFixed(2) : '0.00',
      monthlyData: mockMonthly,
    };
  }, [sentIds, pendingIds]);

  // Calculate fee savings (vs 6.5% traditional)
  const feeSaved = useMemo(() => {
    const sent = parseFloat(totalSent);
    const traditionalFee = sent * 0.065;
    const arcFee = sent * 0.003;
    return (traditionalFee - arcFee).toFixed(2);
  }, [totalSent]);

  if (!isConnected) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-40 left-20 w-96 h-96 bg-arc-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 mb-4">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard.title')}</h1>
          </motion.div>
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Connect your wallet to view your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-40 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-20 w-80 h-80 bg-arc-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('dashboard.title')}</h1>
              <p className="text-gray-400">Your remittance overview and analytics</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatsCard
              title={t('dashboard.totalSent')}
              value={`${totalSent} USDC`}
              icon={<Send className="w-5 h-5" />}
              subtitle={`${sentIds.length} transactions`}
              trend="up"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <StatsCard
              title={t('dashboard.totalReceived')}
              value={`${totalReceived} USDC`}
              icon={<Receipt className="w-5 h-5" />}
              subtitle={`${pendingIds.length} pending`}
              trend="up"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatsCard
              title={t('dashboard.feeSaved')}
              value={`${feeSaved} USDC`}
              icon={<PiggyBank className="w-5 h-5" />}
              subtitle="vs traditional (6.5%)"
              trend="up"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <StatsCard
              title={t('dashboard.active')}
              value={pendingIds.length}
              icon={<Activity className="w-5 h-5" />}
              subtitle="Awaiting claim"
            />
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl bg-glass backdrop-blur-xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-arc-400" />
                  {t('dashboard.activity')}
                </h3>
                <p className="text-sm text-gray-400">USDC sent per month</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">+12.5%</span>
              </div>
            </div>

            <MiniBarChart data={monthlyData} />

            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              {months.map((month) => (
                <span key={month} className="flex-1 text-center">{month}</span>
              ))}
            </div>
          </motion.div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl bg-gradient-to-br from-arc-600/20 to-arc-800/20 backdrop-blur-xl border border-arc-500/30 p-6"
          >
            <h3 className="text-sm text-gray-400 mb-2">Wallet Balance</h3>
            <p className="text-4xl font-bold text-white mb-1">{formattedBalance}</p>
            <p className="text-lg text-arc-400 font-medium mb-6">USDC</p>

            <div className="space-y-3">
              <Link
                href="/send"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-arc-600/30 text-white font-medium
                           hover:bg-arc-600/50 transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send USDC
                </span>
                <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="/receive"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 text-white font-medium
                           hover:bg-white/10 transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Receive USDC
                </span>
                <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        {pendingIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Pending Remittances</h3>
              <Link href="/history" className="text-sm text-arc-400 hover:text-arc-300 flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {pendingIds.slice(0, 4).map((id) => (
                <PendingCard key={Number(id)} id={Number(id)} currentAddress={address!} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PendingCard({ id, currentAddress }: { id: number; currentAddress: `0x${string}` }) {
  const { remittance, isLoading } = useRemittance(id);

  if (isLoading || !remittance) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
        <div className="h-5 w-32 bg-white/10 rounded mb-2" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <RemittanceCard remittance={remittance} currentAddress={currentAddress} />
  );
}
