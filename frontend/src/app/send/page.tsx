'use client';

import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { SendForm } from '@/components/SendForm';
import { useLanguage } from '@/lib/i18n';

export default function SendPage() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen">
      {/* Background effects */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-arc-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-arc-500 to-arc-700 mb-4 shadow-neon">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('send.title')}</h1>
          <p className="text-gray-400">Send USDC to anyone, anywhere in seconds</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-3xl bg-glass backdrop-blur-xl border border-white/10 shadow-glass"
        >
          <SendForm />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl bg-arc-500/5 border border-arc-500/10"
        >
          <p className="text-sm text-gray-400 text-center">
            Transactions on ARC Network confirm in under 1 second with only 0.3% fees.
            Your recipient can claim funds immediately.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
