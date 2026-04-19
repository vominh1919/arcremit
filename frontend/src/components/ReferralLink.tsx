'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2, Twitter, MessageCircle, Link2, QrCode, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/lib/i18n';
import clsx from 'clsx';

interface ReferralLinkProps {
  referralCode: string;
  baseUrl?: string;
  referredCount?: number;
  totalEarnings?: string;
  feeDiscount?: number;
}

export function ReferralLink({
  referralCode,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
  referredCount = 0,
  totalEarnings = '0.00',
  feeDiscount = 10,
}: ReferralLinkProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const referralLink = `${baseUrl}/?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `Send money instantly with near-zero fees using ArcRemit! Use my referral link to get started: ${referralLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `Send money instantly with near-zero fees using ArcRemit! Use my referral link: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <Users className="w-5 h-5 text-arc-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{referredCount}</p>
          <p className="text-xs text-gray-400">Referrals</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-2xl font-bold text-white">{totalEarnings}</p>
          <p className="text-xs text-gray-400">Earnings (USDC)</p>
        </div>
        <div className="p-4 rounded-xl bg-arc-500/10 border border-arc-500/20 text-center">
          <p className="text-2xl font-bold text-arc-400">{feeDiscount}%</p>
          <p className="text-xs text-gray-400">Fee Discount</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-sm text-gray-400 mb-2">Your Referral Link</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-lg bg-surface-950 border border-white/10 text-sm font-mono text-arc-400 truncate">
            {referralLink}
          </div>
          <button
            onClick={copyToClipboard}
            className={clsx(
              'p-3 rounded-lg transition-all',
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-arc-600/30 text-arc-400 hover:bg-arc-600/50 border border-arc-500/30'
            )}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Referral Code */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-lg bg-surface-950 border border-white/10 text-center">
            <span className="text-2xl font-bold tracking-widest text-white font-mono">
              {referralCode}
            </span>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="text-center">
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          {showQR ? 'Hide' : 'Show'} QR Code
        </button>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 inline-block p-4 bg-white rounded-xl"
          >
            <QRCodeSVG value={referralLink} size={180} level="H" />
          </motion.div>
        )}
      </div>

      {/* Share Buttons */}
      <div>
        <p className="text-sm text-gray-400 mb-3">Share via</p>
        <div className="flex gap-3">
          <button
            onClick={shareOnTwitter}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/30 transition-colors"
          >
            <Twitter className="w-4 h-4" />
            <span className="text-sm font-medium">Twitter</span>
          </button>
          <button
            onClick={shareOnWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/30 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">WhatsApp</span>
          </button>
          <button
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Link2 className="w-4 h-4" />
            <span className="text-sm font-medium">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
}
