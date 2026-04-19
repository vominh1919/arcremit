'use client';

import { ReactNode } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface WalletConnectProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireConnection?: boolean;
}

export function WalletConnect({ children, fallback, requireConnection = true }: WalletConnectProps) {
  const { isConnected } = useAccount();

  if (requireConnection && !isConnected) {
    if (fallback) return <>{fallback}</>;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-arc-500/20 flex items-center justify-center mb-6">
          <Wallet className="w-10 h-10 text-arc-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400 mb-6">Please connect your wallet to continue</p>
        <ConnectButton />
      </motion.div>
    );
  }

  return <>{children}</>;
}
