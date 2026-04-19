'use client';

import { ReactNode, useState, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arcTestnet } from '@/lib/chains';
import { LanguageProvider } from '@/lib/i18n';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'ArcRemit',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'arcremit-default',
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#5c7cfa',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <LanguageProvider>
            {mounted && children}
            {!mounted && (
              <div className="min-h-screen bg-surface-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-arc-500/30 border-t-arc-500 rounded-full animate-spin" />
              </div>
            )}
          </LanguageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
