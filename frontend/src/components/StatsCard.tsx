'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, trend, className }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-glass backdrop-blur-xl p-6',
        'hover:border-arc-500/30 transition-all duration-300 group',
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-arc-500/10 rounded-full blur-2xl group-hover:bg-arc-500/20 transition-colors duration-500" />
      
      <div className="relative">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-arc-500/20 flex items-center justify-center mb-4 text-arc-400">
            {icon}
          </div>
        )}
        
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        
        <div className="flex items-baseline gap-2">
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-bold text-white"
          >
            {value}
          </motion.span>
          
          {trend && (
            <span
              className={clsx(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                trend === 'up' && 'bg-green-500/20 text-green-400',
                trend === 'down' && 'bg-red-500/20 text-red-400',
                trend === 'neutral' && 'bg-gray-500/20 text-gray-400'
              )}
            >
              {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
            </span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
