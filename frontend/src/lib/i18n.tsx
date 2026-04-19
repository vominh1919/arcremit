'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Locale = 'en' | 'vi';

interface Translations {
  [key: string]: { en: string; vi: string };
}

const translations: Translations = {
  // Nav
  'nav.home': { en: 'Home', vi: 'Trang chu' },
  'nav.send': { en: 'Send', vi: 'Gui tien' },
  'nav.receive': { en: 'Receive', vi: 'Nhan tien' },
  'nav.history': { en: 'History', vi: 'Lich su' },
  'nav.dashboard': { en: 'Dashboard', vi: 'Tong quan' },
  
  // Hero
  'hero.title': { en: 'Send USDC Home in Seconds', vi: 'Gui USDC ve nha trong giay' },
  'hero.subtitle': { en: 'Cross-border remittance powered by ARC Network. Fast, secure, and nearly free.', vi: 'Chuyen tien quoc te hoat dong boi ARC Network. Nhanh, an toan, va gan nhu mien phi.' },
  'hero.cta.send': { en: 'Send Money', vi: 'Gui tien' },
  'hero.cta.receive': { en: 'Receive Money', vi: 'Nhan tien' },
  
  // Stats
  'stats.finality': { en: 'Sub-second finality', vi: 'Xac thuc duoi giay' },
  'stats.fee': { en: '0.3% fee', vi: 'Phi 0.3%' },
  'stats.chains': { en: '15+ chains', vi: '15+ mang' },
  
  // Send page
  'send.title': { en: 'Send USDC', vi: 'Gui USDC' },
  'send.connect': { en: 'Connect Wallet to Send', vi: 'Ket vi de gui tien' },
  'send.receiver': { en: 'Receiver Address', vi: 'Dia chi nguoi nhan' },
  'send.amount': { en: 'Amount (USDC)', vi: 'So luong (USDC)' },
  'send.message': { en: 'Message (optional)', vi: 'Tin nhan (tuy chon)' },
  'send.fee': { en: 'Fee', vi: 'Phi' },
  'send.total': { en: 'Total', vi: 'Tong' },
  'send.button': { en: 'Send Now', vi: 'Gui ngay' },
  'send.success': { en: 'Remittance Sent!', vi: 'Da gui thanh cong!' },
  'send.confirm': { en: 'Confirm Send', vi: 'Xac nhan gui' },
  
  // Receive page
  'receive.title': { en: 'Receive USDC', vi: 'Nhan USDC' },
  'receive.qr': { en: 'Your QR Code', vi: 'Ma QR cua ban' },
  'receive.pending': { en: 'Pending Remittances', vi: 'Cho nhan' },
  'receive.claim': { en: 'Claim', vi: 'Nhan' },
  'receive.claimed': { en: 'Claimed!', vi: 'Da nhan!' },
  'receive.empty': { en: 'No pending remittances', vi: 'Khong co khoan cho nhan' },
  
  // History
  'history.title': { en: 'Transaction History', vi: 'Lich su giao dich' },
  'history.all': { en: 'All', vi: 'Tat ca' },
  'history.sent': { en: 'Sent', vi: 'Da gui' },
  'history.received': { en: 'Received', vi: 'Da nhan' },
  'history.pending': { en: 'Pending', vi: 'Dang cho' },
  'history.date': { en: 'Date', vi: 'Ngay' },
  'history.direction': { en: 'Direction', vi: 'Huong' },
  'history.amount': { en: 'Amount', vi: 'So luong' },
  'history.status': { en: 'Status', vi: 'Trang thai' },
  'history.message': { en: 'Message', vi: 'Tin nhan' },
  
  // Dashboard
  'dashboard.title': { en: 'Dashboard', vi: 'Tong quan' },
  'dashboard.totalSent': { en: 'Total Sent', vi: 'Tong da gui' },
  'dashboard.totalReceived': { en: 'Total Received', vi: 'Tong da nhan' },
  'dashboard.feeSaved': { en: 'Fee Savings', vi: 'Tiet kiem phi' },
  'dashboard.active': { en: 'Active Remittances', vi: 'Giao dich dang hoat dong' },
  'dashboard.activity': { en: 'Monthly Activity', vi: 'Hoat dong hang thang' },
  
  // Common
  'common.connect': { en: 'Connect Wallet', vi: 'Ket vi' },
  'common.disconnect': { en: 'Disconnect', vi: 'Ngat ket noi' },
  'common.loading': { en: 'Loading...', vi: 'Dang tai...' },
  'common.error': { en: 'Error', vi: 'Loi' },
  'common.success': { en: 'Success', vi: 'Thanh cong' },
  'common.cancel': { en: 'Cancel', vi: 'Huy' },
  'common.confirm': { en: 'Confirm', vi: 'Xac nhan' },
  'common.viewExplorer': { en: 'View on Explorer', vi: 'Xem tren Explorer' },
  'common.copied': { en: 'Copied!', vi: 'Da sao chep!' },
  'common.noWallet': { en: 'No wallet connected', vi: 'Chua ket noi vi' },
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[locale] || entry.en || key;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
