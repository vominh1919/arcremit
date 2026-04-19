'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { Calendar, Plus, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { ScheduleCard, Schedule } from '@/components/ScheduleCard';
import { useLanguage } from '@/lib/i18n';
import clsx from 'clsx';

const mockSchedules: Schedule[] = [
  {
    id: 1,
    receiver: '0x1234567890abcdef1234567890abcdef12345678',
    amount: '100',
    frequency: 'monthly',
    totalCycles: 12,
    completedCycles: 3,
    nextExecution: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: 2,
    receiver: '0xabcdef1234567890abcdef1234567890abcdef12',
    amount: '50',
    frequency: 'weekly',
    totalCycles: 24,
    completedCycles: 8,
    nextExecution: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: 3,
    receiver: '0x9876543210fedcba9876543210fedcba98765432',
    amount: '200',
    frequency: 'custom',
    customDays: 14,
    totalCycles: 6,
    completedCycles: 6,
    nextExecution: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isActive: false,
  },
];

export default function SchedulePage() {
  const { isConnected } = useAccount();
  const { t } = useLanguage();
  const [showCreate, setShowCreate] = useState(false);
  const [schedules] = useState<Schedule[]>(mockSchedules);
  const [executing, setExecuting] = useState<number | null>(null);

  // Create form state
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [customDays, setCustomDays] = useState('');
  const [totalCycles, setTotalCycles] = useState('');

  const handleExecute = async (id: number) => {
    setExecuting(id);
    await new Promise((r) => setTimeout(r, 2000));
    setExecuting(null);
  };

  const handleCancel = async (id: number) => {
    // Would call contract to cancel
  };

  if (!isConnected) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-20 right-0 w-96 h-96 bg-arc-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('schedule.title')}</h1>
          </motion.div>
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Connect your wallet to manage schedules</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-20 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-arc-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('schedule.title')}</h1>
              <p className="text-gray-400">Manage recurring USDC payments</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-arc-600 text-white font-medium hover:bg-arc-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </button>
        </motion.div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6 rounded-2xl bg-glass backdrop-blur-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Create New Schedule</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Receiver Address</label>
                    <input
                      type="text"
                      value={receiver}
                      onChange={(e) => setReceiver(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Amount (USDC)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {frequency === 'custom' && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Days Between</label>
                        <input
                          type="number"
                          value={customDays}
                          onChange={(e) => setCustomDays(e.target.value)}
                          placeholder="14"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Total Cycles</label>
                      <input
                        type="number"
                        value={totalCycles}
                        onChange={(e) => setTotalCycles(e.target.value)}
                        placeholder="12"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                      />
                    </div>
                  </div>
                  <button className="w-full py-3 rounded-xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-semibold hover:from-arc-500 hover:to-arc-400 transition-all shadow-neon">
                    Create Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedules List */}
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No schedules yet. Create your first recurring payment!</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onExecute={handleExecute}
                onCancel={handleCancel}
                executing={executing === schedule.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
