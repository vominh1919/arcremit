'use client';

import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import { ReceivePanel } from '@/components/ReceivePanel';
import { useLanguage } from '@/lib/i18n';

export default function ReceivePage() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen">
      {/* Background effects */}
      <div className="absolute top-32 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-arc-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 mb-4 shadow-lg shadow-green-500/20">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('receive.title')}</h1>
          <p className="text-gray-400">Share your address to receive USDC instantly</p>
        </motion.div>

        {/* Receive Panel Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-3xl bg-glass backdrop-blur-xl border border-white/10 shadow-glass"
        >
          <ReceivePanel />
        </motion.div>
      </div>
    </div>
  );
}
