import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ArcRemit - Send USDC Home in Seconds',
  description: 'Cross-border remittance powered by ARC Network. Fast, secure, and nearly free.',
  keywords: ['remittance', 'USDC', 'ARC', 'crypto', 'cross-border', 'payments'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-surface-950 text-white antialiased`}>
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
