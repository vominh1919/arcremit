'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X, Send, Receipt, History, LayoutDashboard, Home } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { LanguageToggle } from './LanguageToggle';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'nav.home', icon: Home },
  { href: '/send', label: 'nav.send', icon: Send },
  { href: '/receive', label: 'nav.receive', icon: Receipt },
  { href: '/history', label: 'nav.history', icon: History },
  { href: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-surface-900/80 backdrop-blur-xl border-b border-white/10" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-arc-500 to-arc-700 flex items-center justify-center shadow-neon group-hover:shadow-neon-lg transition-shadow duration-300">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-arc-400 to-arc-300 bg-clip-text text-transparent">
              ArcRemit
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-gradient-to-r from-arc-600/30 to-arc-500/20 rounded-lg border border-arc-500/30"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {t(item.label)}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="hidden sm:block">
              <ConnectButton
                chainStatus="icon"
                showBalance={false}
                accountStatus="avatar"
              />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden relative bg-surface-900/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-arc-600/20 text-arc-400 border border-arc-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {t(item.label)}
                  </Link>
                );
              })}
              <div className="pt-2 sm:hidden">
                <ConnectButton
                  chainStatus="icon"
                  showBalance={false}
                  accountStatus="full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
