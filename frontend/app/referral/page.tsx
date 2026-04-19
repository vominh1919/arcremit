'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Gift, Wallet, Sparkles, Users, DollarSign, Percent } from 'lucide-react';
import { ReferralLink } from '@/components/ReferralLink';
import { useLanguage } from '@/lib/i18n';

export default function ReferralPage() {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();

  // Generate a mock referral code from address
  const referralCode = address
    ? `ARC${address.slice(2, 6).toUpperCase()}`
    : 'ARCXXXX';

  if (!isConnected) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-20 right-0 w-96 h-96 bg-arc-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('referral.title')}</h1>
          </motion.div>
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Connect your wallet to view your referral program</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-20 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-arc-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 mb-4 shadow-neon">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('referral.title')}</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Invite friends to ArcRemit and earn rewards! You both get fee discounts and
            you earn a percentage of their fees.
          </p>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-3 gap-4"
        >
          {[
            { icon: Users, title: 'Share Link', desc: 'Send your unique referral link to friends' },
            { icon: Sparkles, title: 'They Sign Up', desc: 'Friends create an account using your link' },
            { icon: DollarSign, title: 'Earn Rewards', desc: 'Get 10% of their fees as USDC rewards' },
          ].map((step, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-white/5 border border-white/10 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-arc-500/20 flex items-center justify-center mx-auto mb-3">
                <step.icon className="w-5 h-5 text-arc-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
              <p className="text-xs text-gray-400">{step.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Referral Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl bg-glass backdrop-blur-xl border border-white/10 shadow-glass"
        >
          <ReferralLink
            referralCode={referralCode}
            referredCount={3}
            totalEarnings="15.50"
            feeDiscount={10}
          />
        </motion.div>

        {/* Terms */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <h3 className="text-sm font-semibold text-white mb-2">{t('referral.terms')}</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Referral rewards are paid in USDC directly to your wallet</li>
            <li>• You earn 10% of the platform fees from your referrals' transactions</li>
            <li>• Referred users get a 10% discount on their first 5 transactions</li>
            <li>• No limit on the number of referrals you can invite</li>
            <li>• Rewards are claimable once they reach 1 USDC minimum</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
