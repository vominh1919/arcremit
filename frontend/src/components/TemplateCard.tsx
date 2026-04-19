'use client';

import { motion } from 'framer-motion';
import { FileText, Trash2, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export interface RemittanceTemplate {
  id: string;
  receiver: string;
  amount: string;
  description: string;
  createdAt: Date;
}

interface TemplateCardProps {
  template: RemittanceTemplate;
  onUse?: (template: RemittanceTemplate) => void;
  onDelete?: (id: string) => void;
}

export function TemplateCard({ template, onUse, onDelete }: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group rounded-2xl bg-glass backdrop-blur-xl border border-white/10 hover:border-arc-500/20 transition-all p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-arc-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-arc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {template.description || 'Untitled Template'}
            </p>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              {template.receiver.slice(0, 6)}...{template.receiver.slice(-4)}
            </p>
          </div>
        </div>
        <p className="text-lg font-bold text-white">{template.amount} USDC</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Clock className="w-3 h-3" />
        Created {template.createdAt.toLocaleDateString()}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/send?to=${template.receiver}&amount=${template.amount}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-arc-600/30 to-arc-500/20 text-arc-400 text-sm font-medium hover:from-arc-600/50 hover:to-arc-500/30 transition-colors border border-arc-500/20"
        >
          <ArrowRight className="w-4 h-4" />
          Use Template
        </Link>
        <button
          onClick={() => onDelete?.(template.id)}
          className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
