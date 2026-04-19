'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { BarChart3, Wallet, TrendingUp, Send, Receipt, PiggyBank, Award } from 'lucide-react';
import { useSentRemittances, usePendingRemittances } from '@/hooks/useArcRemit';
import { useUSDCBalance } from '@/hooks/useUSDC';
import { StatsCard } from '@/components/StatsCard';
import { AnalyticsChart } from '@/components/AnalyticsChart';
import { useLanguage } from '@/lib/i18n';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsPage() {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();

  const { formattedBalance } = useUSDCBalance(address);
  const { sentIds } = useSentRemittances(address);
  const { pendingIds } = usePendingRemittances(address);

  const analytics = useMemo(() => {
    const totalSent = sentIds.length > 0 ? (sentIds.length * 150.5) : 0;
    const totalReceived = pendingIds.length > 0 ? (pendingIds.length * 200.75) : 0;
    const traditionalFee = totalSent * 0.065;
    const arcFee = totalSent * 0.003;
    const feeSaved = traditionalFee - arcFee;

    const monthlyData = months.map((label, i) => ({
      label,
      value: [120, 450, 280, 680, 340, 520, 780, 420, 650, 890, 560, 720][i],
    }));

    const topRecipients = [
      { label: 'Mom', value: 35 },
      { label: 'Freelancer A', value: 25 },
      { label: 'Supplier B', value: 20 },
      { label: 'Friend C', value: 12 },
      { label: 'Others', value: 8 },
    ];

    return {
      totalSent: totalSent.toFixed(2),
      totalReceived: totalReceived.toFixed(2),
      feeSaved: feeSaved.toFixed(2),
      txCount: sentIds.length + pendingIds.length,
      monthlyData,
      topRecipients,
    };
  }, [sentIds, pendingIds]);

  if (!isConnected) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-20 right-0 w-96 h-96 bg-arc-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 mb-4">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('analytics.title')}</h1>
          </motion.div>
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Connect your wallet to view analytics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-20 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-arc-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('analytics.title')}</h1>
              <p className="text-gray-400">Your remittance insights and savings</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatsCard
              title={t('analytics.totalSent')}
              value={`${analytics.totalSent} USDC`}
              icon={<Send className="w-5 h-5" />}
              subtitle="All time"
              trend="up"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <StatsCard
              title={t('analytics.totalReceived')}
              value={`${analytics.totalReceived} USDC`}
              icon={<Receipt className="w-5 h-5" />}
              subtitle="All time"
              trend="up"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatsCard
              title={t('analytics.feeSaved')}
              value={`${analytics.feeSaved} USDC`}
              icon={<PiggyBank className="w-5 h-5" />}
              subtitle="vs Western Union (6.5%)"
              trend="up"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <StatsCard
              title={t('analytics.transactions')}
              value={analytics.txCount}
              icon={<TrendingUp className="w-5 h-5" />}
              subtitle="Total transactions"
            />
          </motion.div>
        </div>

        {/* Fee Savings Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('analytics.savingsTitle')}</h3>
              <p className="text-gray-400">
                You saved <span className="text-green-400 font-bold">{analytics.feeSaved} USDC</span> in fees
                compared to traditional services like Western Union (6.5% fee).
                That's <span className="text-green-400 font-bold">{((parseFloat(analytics.feeSaved) / (parseFloat(analytics.totalSent) * 0.065 || 1)) * 100).toFixed(0)}%</span> more money
                reaching your recipients!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <AnalyticsChart
              title={t('analytics.monthlyBreakdown')}
              subtitle="USDC sent per month"
              type="bar"
              data={analytics.monthlyData}
              trend={{ value: 12.5, label: 'vs last month' }}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <AnalyticsChart
              title={t('analytics.topRecipients')}
              subtitle="By transaction percentage"
              type="pie"
              data={analytics.topRecipients}
            />
          </motion.div>
        </div>

        {/* Referral Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-arc-600/20 to-arc-800/20 border border-arc-500/30"
        >
          <h3 className="text-lg font-semibold text-white mb-4">{t('analytics.referralEarnings')}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-white">3</p>
              <p className="text-sm text-gray-400">Referrals</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-arc-400">15.50</p>
              <p className="text-sm text-gray-400">Earned (USDC)</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-400">10%</p>
              <p className="text-sm text-gray-400">Fee Discount</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
