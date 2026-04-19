'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Play, XCircle, Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export interface Schedule {
  id: number;
  receiver: string;
  amount: string;
  frequency: 'weekly' | 'monthly' | 'custom';
  customDays?: number;
  totalCycles: number;
  completedCycles: number;
  nextExecution: Date;
  isActive: boolean;
}

interface ScheduleCardProps {
  schedule: Schedule;
  onExecute?: (id: number) => void;
  onCancel?: (id: number) => void;
  executing?: boolean;
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

const frequencyColors: Record<string, string> = {
  weekly: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  monthly: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  custom: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export function ScheduleCard({ schedule, onExecute, onCancel, executing }: ScheduleCardProps) {
  const progress = schedule.totalCycles > 0
    ? (schedule.completedCycles / schedule.totalCycles) * 100
    : 0;

  const daysUntilNext = Math.ceil(
    (schedule.nextExecution.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'rounded-2xl border backdrop-blur-xl p-5 transition-all',
        schedule.isActive
          ? 'bg-glass border-white/10 hover:border-arc-500/20'
          : 'bg-white/5 border-white/5 opacity-60'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-arc-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-arc-400" />
          </div>
          <div>
            <p className="text-sm font-mono text-gray-300">
              {schedule.receiver.slice(0, 6)}...{schedule.receiver.slice(-4)}
            </p>
            <span
              className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mt-1',
                frequencyColors[schedule.frequency]
              )}
            >
              {frequencyLabels[schedule.frequency]}
              {schedule.frequency === 'custom' && schedule.customDays
                ? ` (${schedule.customDays}d)`
                : ''}
            </span>
          </div>
        </div>
        <p className="text-lg font-bold text-white">{schedule.amount} USDC</p>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>Progress</span>
          <span>
            {schedule.completedCycles} / {schedule.totalCycles} cycles
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-arc-600 to-arc-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Next Payment */}
      {schedule.isActive && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 mb-4">
          <Clock className="w-4 h-4 text-arc-400" />
          <span className="text-sm text-gray-300">
            Next payment in{' '}
            <span className="text-white font-medium">
              {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''}
            </span>
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {schedule.isActive && (
          <>
            <button
              onClick={() => onExecute?.(schedule.id)}
              disabled={executing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-arc-600/30 text-arc-400 text-sm font-medium hover:bg-arc-600/50 transition-colors disabled:opacity-50"
            >
              {executing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Execute Now
            </button>
            <button
              onClick={() => onCancel?.(schedule.id)}
              disabled={executing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          </>
        )}
        {!schedule.isActive && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <XCircle className="w-4 h-4" />
            Schedule cancelled
          </div>
        )}
      </div>
    </motion.div>
  );
}
