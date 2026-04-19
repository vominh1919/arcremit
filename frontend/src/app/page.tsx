'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Send, Receipt, Zap, Shield, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stats = [
  { icon: Zap, value: '<1s', label: 'stats.finality' },
  { icon: Shield, value: '0.3%', label: 'stats.fee' },
  { icon: Globe, value: '15+', label: 'stats.chains' },
];

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Sub-second transaction finality on ARC Network means your money arrives almost instantly.',
  },
  {
    icon: Shield,
    title: 'Secure & Trustless',
    desc: 'Smart contracts ensure your funds are safe. No intermediaries, no counterparty risk.',
  },
  {
    icon: Globe,
    title: 'Cross-Chain',
    desc: 'Send USDC across 15+ blockchain networks with ARC\'s cross-chain infrastructure.',
  },
];

export default function HomePage() {
  const { t } = useLanguage();
  const { isConnected } = useAccount();

  return (
    <div className="relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arc-500/10 border border-arc-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-arc-400" />
            <span className="text-sm text-arc-300">Powered by ARC Network</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={item}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              {t('hero.title')}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/send"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-arc-600 to-arc-500
                         text-white font-semibold text-lg shadow-neon hover:shadow-neon-lg transition-all duration-300
                         hover:from-arc-500 hover:to-arc-400 w-full sm:w-auto justify-center"
            >
              <Send className="w-5 h-5" />
              {t('hero.cta.send')}
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>

            <Link
              href="/receive"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10
                         text-white font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300
                         w-full sm:w-auto justify-center"
            >
              <Receipt className="w-5 h-5" />
              {t('hero.cta.receive')}
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-arc-500/20 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-arc-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{t(stat.label)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why ArcRemit?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Traditional remittance services charge 6.5% fees and take days. ArcRemit is different.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="group p-8 rounded-2xl bg-glass backdrop-blur-xl border border-white/10
                           hover:border-arc-500/30 transition-all duration-300 hover:shadow-glass"
              >
                <div className="w-14 h-14 rounded-2xl bg-arc-500/20 flex items-center justify-center mb-6
                                group-hover:bg-arc-500/30 transition-colors">
                  <feature.icon className="w-7 h-7 text-arc-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-transparent to-arc-950/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400">Three simple steps to send money anywhere</p>
          </motion.div>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Connect Wallet', desc: 'Link your crypto wallet in one click' },
              { step: '02', title: 'Enter Details', desc: 'Input the receiver address and USDC amount' },
              { step: '03', title: 'Send Instantly', desc: 'Confirm the transaction and funds arrive in under a second' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-arc-500/20 transition-all"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-arc-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-arc-400">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-arc-600/20 to-arc-800/20
                     border border-arc-500/30 backdrop-blur-xl"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to send?
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Start sending USDC across borders with near-zero fees today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isConnected ? (
              <Link
                href="/send"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-semibold
                           text-lg shadow-neon hover:shadow-neon-lg transition-all hover:from-arc-500 hover:to-arc-400"
              >
                Go to Send
              </Link>
            ) : (
              <ConnectButton />
            )}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arc-500 to-arc-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-sm text-gray-400">ArcRemit</span>
          </div>
          <p className="text-xs text-gray-500">
            Built on ARC Network. For demonstration purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
