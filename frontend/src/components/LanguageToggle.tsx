'use client';

import { useLanguage } from '@/lib/i18n';
import clsx from 'clsx';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
      <button
        onClick={() => setLocale('en')}
        className={clsx(
          'px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200',
          locale === 'en'
            ? 'bg-arc-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('vi')}
        className={clsx(
          'px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200',
          locale === 'vi'
            ? 'bg-arc-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
        )}
      >
        VN
      </button>
    </div>
  );
}
