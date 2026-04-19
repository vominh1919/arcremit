'use client';

import { motion } from 'framer-motion';
import { User, Send, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

export interface Contact {
  id: string;
  address: string;
  nickname: string;
  createdAt: Date;
}

interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-center justify-between p-4 rounded-xl bg-glass backdrop-blur-xl border border-white/10 hover:border-arc-500/20 transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arc-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-arc-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{contact.nickname}</p>
          <p className="text-xs font-mono text-gray-400 truncate">
            {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/send?to=${contact.address}`}
          className="p-2 rounded-lg bg-arc-500/20 text-arc-400 hover:bg-arc-500/30 transition-colors"
          title="Send to this contact"
        >
          <Send className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onEdit?.(contact)}
          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Edit contact"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete?.(contact.id)}
          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete contact"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
