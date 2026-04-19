'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.send': 'Send',
    'nav.receive': 'Receive',
    'nav.history': 'History',
    'nav.dashboard': 'Dashboard',
    'nav.batch': 'Batch',
    'nav.schedule': 'Schedule',
    'nav.contacts': 'Contacts',
    'nav.templates': 'Templates',
    'nav.analytics': 'Analytics',
    'nav.referral': 'Referral',

    // Hero
    'hero.title': 'Send USDC Home in Seconds',
    'hero.subtitle':
      'Cross-border remittance powered by ARC Network. Fast, secure, and nearly free.',
    'hero.cta.send': 'Send Now',
    'hero.cta.receive': 'Receive Funds',

    // Stats
    'stats.finality': 'Sub-second Finality',
    'stats.fee': 'Low Fee',
    'stats.chains': 'Supported Chains',

    // Send
    'send.title': 'Send USDC',
    'send.receiver': 'Receiver Address',
    'send.amount': 'Amount',
    'send.message': 'Message',
    'send.button': 'Send USDC',
    'send.connect': 'Connect Wallet',
    'send.success': 'Funds Sent!',

    // Receive
    'receive.title': 'Receive USDC',
    'receive.pending': 'Pending Remittances',
    'receive.empty': 'No pending remittances',
    'receive.claim': 'Claim',

    // History
    'history.title': 'Transaction History',
    'history.empty': 'No transactions yet',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalSent': 'Total Sent',
    'dashboard.totalReceived': 'Total Received',
    'dashboard.feeSaved': 'Fee Saved',
    'dashboard.active': 'Active',
    'dashboard.activity': 'Monthly Activity',
    'dashboard.balance': 'Wallet Balance',

    // Batch
    'batch.title': 'Batch Send',
    'batch.upload': 'Upload CSV',
    'batch.addRow': 'Add Row',
    'batch.preview': 'Preview',
    'batch.sendAll': 'Send All',
    'batch.recipients': 'Recipients',
    'batch.totalAmount': 'Total Amount',
    'batch.totalFee': 'Total Fee',

    // Schedule
    'schedule.title': 'Recurring Payments',
    'schedule.create': 'Create Schedule',
    'schedule.execute': 'Execute Now',
    'schedule.cancel': 'Cancel',
    'schedule.nextPayment': 'Next Payment',
    'schedule.progress': 'Progress',
    'schedule.frequency': 'Frequency',
    'schedule.weekly': 'Weekly',
    'schedule.monthly': 'Monthly',
    'schedule.custom': 'Custom',

    // Contacts
    'contacts.title': 'Contact Book',
    'contacts.add': 'Add Contact',
    'contacts.search': 'Search contacts...',
    'contacts.send': 'Send',
    'contacts.edit': 'Edit',
    'contacts.delete': 'Delete',
    'contacts.nickname': 'Nickname',
    'contacts.address': 'Wallet Address',

    // Templates
    'templates.title': 'Remittance Templates',
    'templates.create': 'New Template',
    'templates.use': 'Use Template',
    'templates.delete': 'Delete',
    'templates.description': 'Description',
    'templates.receiver': 'Receiver Address',
    'templates.amount': 'Amount',

    // Analytics
    'analytics.title': 'Advanced Analytics',
    'analytics.totalSent': 'Total Sent',
    'analytics.totalReceived': 'Total Received',
    'analytics.feeSaved': 'Fee Saved',
    'analytics.transactions': 'Transactions',
    'analytics.monthlyBreakdown': 'Monthly Breakdown',
    'analytics.topRecipients': 'Top Recipients',
    'analytics.savingsTitle': 'Fee Savings vs Traditional Services',
    'analytics.referralEarnings': 'Referral Earnings',

    // Referral
    'referral.title': 'Referral Program',
    'referral.code': 'Your Referral Code',
    'referral.link': 'Your Referral Link',
    'referral.share': 'Share via',
    'referral.copy': 'Copy Link',
    'referral.qr': 'Show QR Code',
    'referral.terms': 'Terms & Conditions',
    'referral.earnings': 'Earnings',
    'referral.referrals': 'Referrals',
    'referral.discount': 'Fee Discount',
  },
  vi: {
    // Navigation
    'nav.home': 'Trang chu',
    'nav.send': 'Gui tien',
    'nav.receive': 'Nhan tien',
    'nav.history': 'Lich su',
    'nav.dashboard': 'Tong quan',
    'nav.batch': 'Gui nhieu',
    'nav.schedule': 'Dinh ky',
    'nav.contacts': 'Danh ba',
    'nav.templates': 'Mau luu',
    'nav.analytics': 'Thong ke',
    'nav.referral': 'Gioi thieu',

    // Hero
    'hero.title': 'Gui USDC Ve Nha Trong Giay Lat',
    'hero.subtitle':
      'Chuyen tien quoc te hoat dong boi ARC Network. Nhanh, an toan va gan nhu mien phi.',
    'hero.cta.send': 'Gui Ngay',
    'hero.cta.receive': 'Nhan Tien',

    // Stats
    'stats.finality': 'Xac nhan trong giay',
    'stats.fee': 'Phi thap',
    'stats.chains': 'Mang ho tro',

    // Send
    'send.title': 'Gui USDC',
    'send.receiver': 'Dia chi nguoi nhan',
    'send.amount': 'So tien',
    'send.message': 'Tin nhan',
    'send.button': 'Gui USDC',
    'send.connect': 'Ket noi vi',
    'send.success': 'Da gui thanh cong!',

    // Receive
    'receive.title': 'Nhan USDC',
    'receive.pending': 'Cho nhan',
    'receive.empty': 'Khong co khoan cho nhan',
    'receive.claim': 'Nhan',

    // History
    'history.title': 'Lich su giao dich',
    'history.empty': 'Chua co giao dich',

    // Dashboard
    'dashboard.title': 'Tong quan',
    'dashboard.totalSent': 'Tong da gui',
    'dashboard.totalReceived': 'Tong da nhan',
    'dashboard.feeSaved': 'Tien phi tiet kiem',
    'dashboard.active': 'Dang hoat dong',
    'dashboard.activity': 'Hoat dong hang thang',
    'dashboard.balance': 'So du vi',

    // Batch
    'batch.title': 'Gui nhieu nguoi',
    'batch.upload': 'Tai len CSV',
    'batch.addRow': 'Them hang',
    'batch.preview': 'Xem truoc',
    'batch.sendAll': 'Gui tat ca',
    'batch.recipients': 'Nguoi nhan',
    'batch.totalAmount': 'Tong so tien',
    'batch.totalFee': 'Tong phi',

    // Schedule
    'schedule.title': 'Thanh toan dinh ky',
    'schedule.create': 'Tao lich',
    'schedule.execute': 'Thuc hien ngay',
    'schedule.cancel': 'Huy',
    'schedule.nextPayment': 'Thanh toan tiep theo',
    'schedule.progress': 'Tien do',
    'schedule.frequency': 'Tan suat',
    'schedule.weekly': 'Hang tuan',
    'schedule.monthly': 'Hang thang',
    'schedule.custom': 'Tuy chinh',

    // Contacts
    'contacts.title': 'Danh ba',
    'contacts.add': 'Them lien he',
    'contacts.search': 'Tim kiem lien he...',
    'contacts.send': 'Gui',
    'contacts.edit': 'Sua',
    'contacts.delete': 'Xoa',
    'contacts.nickname': 'Ten goi',
    'contacts.address': 'Dia chi vi',

    // Templates
    'templates.title': 'Mau chuyen tien',
    'templates.create': 'Tao mau moi',
    'templates.use': 'Su dung mau',
    'templates.delete': 'Xoa',
    'templates.description': 'Mo ta',
    'templates.receiver': 'Dia chi nguoi nhan',
    'templates.amount': 'So tien',

    // Analytics
    'analytics.title': 'Thong ke nang cao',
    'analytics.totalSent': 'Tong da gui',
    'analytics.totalReceived': 'Tong da nhan',
    'analytics.feeSaved': 'Tien phi tiet kiem',
    'analytics.transactions': 'Giao dich',
    'analytics.monthlyBreakdown': 'Phan tich hang thang',
    'analytics.topRecipients': 'Nguoi nhan hang dau',
    'analytics.savingsTitle': 'Tiet kiem phi so voi dich vu truyen thong',
    'analytics.referralEarnings': 'Thu nhap gioi thieu',

    // Referral
    'referral.title': 'Chuong trinh gioi thieu',
    'referral.code': 'Ma gioi thieu cua ban',
    'referral.link': 'Lien ket gioi thieu',
    'referral.share': 'Chia se qua',
    'referral.copy': 'Sao chep lien ket',
    'referral.qr': 'Hien thi ma QR',
    'referral.terms': 'Dieu khoan va dieu kien',
    'referral.earnings': 'Thu nhap',
    'referral.referrals': 'Gioi thieu',
    'referral.discount': 'Giam phi',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
