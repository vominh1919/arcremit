'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import clsx from 'clsx';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsChartProps {
  title: string;
  subtitle?: string;
  type: 'bar' | 'pie' | 'line';
  data: ChartDataPoint[];
  trend?: { value: number; label: string };
  className?: string;
}

export function AnalyticsChart({
  title,
  subtitle,
  type,
  data,
  trend,
  className,
}: AnalyticsChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const defaultColors = [
    'from-arc-600 to-arc-400',
    'from-purple-600 to-purple-400',
    'from-cyan-600 to-cyan-400',
    'from-green-600 to-green-400',
    'from-orange-600 to-orange-400',
    'from-pink-600 to-pink-400',
  ];

  return (
    <div className={clsx('rounded-2xl bg-glass backdrop-blur-xl border border-white/10 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {type === 'bar' && <BarChart3 className="w-5 h-5 text-arc-400" />}
            {type === 'pie' && <PieChart className="w-5 h-5 text-arc-400" />}
            {type === 'line' && <BarChart3 className="w-5 h-5 text-arc-400" />}
            {title}
          </h3>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm">
            {trend.value >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span
              className={clsx(
                'font-medium',
                trend.value >= 0 ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      {type === 'bar' && (
        <div>
          <div className="flex items-end gap-2 h-40">
            {data.map((point, index) => (
              <motion.div
                key={point.label}
                initial={{ height: 0 }}
                animate={{ height: `${(point.value / maxValue) * 100}%` }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className={clsx(
                  'flex-1 rounded-t-lg min-h-[4px] bg-gradient-to-t',
                  point.color || defaultColors[index % defaultColors.length]
                )}
                title={`${point.label}: ${point.value}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            {data.map((point) => (
              <span key={point.label} className="flex-1 text-center truncate">
                {point.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pie Chart (CSS-based donut) */}
      {type === 'pie' && (
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {data.reduce(
                (acc, point, index) => {
                  const percent = totalValue > 0 ? (point.value / totalValue) * 100 : 0;
                  const strokeDasharray = `${percent} ${100 - percent}`;
                  const strokeDashoffset = -acc.offset;
                  acc.offset += percent;
                  acc.elements.push(
                    <circle
                      key={point.label}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={point.color ? `var(--${point.color})` : undefined}
                      strokeWidth="3"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className={clsx(
                        !point.color && 'stroke-current',
                        !point.color && [
                          'text-arc-500',
                          'text-purple-500',
                          'text-cyan-500',
                          'text-green-500',
                          'text-orange-500',
                        ][index % 5]
                      )}
                    />
                  );
                  return acc;
                },
                { offset: 0, elements: [] as JSX.Element[] }
              ).elements}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{data.length}</p>
                <p className="text-xs text-gray-400">items</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((point, index) => (
              <div key={point.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      'w-3 h-3 rounded-full',
                      [
                        'bg-arc-500',
                        'bg-purple-500',
                        'bg-cyan-500',
                        'bg-green-500',
                        'bg-orange-500',
                      ][index % 5]
                    )}
                  />
                  <span className="text-sm text-gray-300">{point.label}</span>
                </div>
                <span className="text-sm font-medium text-white">{point.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line Chart (simplified bar representation) */}
      {type === 'line' && (
        <div>
          <div className="relative h-32 flex items-end gap-1">
            {data.map((point, index) => (
              <motion.div
                key={point.label}
                initial={{ height: 0 }}
                animate={{ height: `${(point.value / maxValue) * 100}%` }}
                transition={{ delay: index * 0.03, duration: 0.4 }}
                className="flex-1 rounded-t-sm min-h-[2px] bg-gradient-to-t from-arc-600 to-arc-400 opacity-70 hover:opacity-100 transition-opacity"
                title={`${point.label}: ${point.value}`}
              />
            ))}
            <motion.div
              className="absolute inset-x-0 bottom-0 h-px bg-arc-500/30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            {data.map((point) => (
              <span key={point.label} className="flex-1 text-center truncate">
                {point.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
