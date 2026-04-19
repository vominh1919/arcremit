'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { FileText, Plus, Wallet, X, AlertCircle } from 'lucide-react';
import { TemplateCard, RemittanceTemplate } from '@/components/TemplateCard';
import { useLanguage } from '@/lib/i18n';

const mockTemplates: RemittanceTemplate[] = [
  {
    id: '1',
    receiver: '0x1234567890abcdef1234567890abcdef12345678',
    amount: '100',
    description: 'Monthly rent payment',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    receiver: '0xabcdef1234567890abcdef1234567890abcdef12',
    amount: '250',
    description: 'Weekly freelancer payment',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    receiver: '0x9876543210fedcba9876543210fedcba98765432',
    amount: '50',
    description: 'Subscription service',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

export default function TemplatesPage() {
  const { isConnected } = useAccount();
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<RemittanceTemplate[]>(mockTemplates);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!isAddress(receiver) || !amount || parseFloat(amount) <= 0) return;
    const newTemplate: RemittanceTemplate = {
      id: Date.now().toString(),
      receiver,
      amount,
      description,
      createdAt: new Date(),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const resetForm = () => {
    setReceiver('');
    setAmount('');
    setDescription('');
    setShowCreate(false);
  };

  if (!isConnected) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-20 right-0 w-96 h-96 bg-arc-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-700 mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('templates.title')}</h1>
          </motion.div>
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Connect your wallet to manage templates</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-20 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-arc-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('templates.title')}</h1>
              <p className="text-gray-400">Save and reuse common payment setups</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-arc-600 text-white font-medium hover:bg-arc-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </motion.div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6 rounded-2xl bg-glass backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Create Template</h3>
                  <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Monthly rent payment"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Receiver Address</label>
                    <input
                      type="text"
                      value={receiver}
                      onChange={(e) => setReceiver(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                    />
                    {receiver && !isAddress(receiver) && (
                      <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
                        <AlertCircle className="w-3 h-3" /> Invalid address
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount (USDC)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                    />
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={!isAddress(receiver) || !amount || parseFloat(amount) <= 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-semibold hover:from-arc-500 hover:to-arc-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-neon"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Templates Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {templates.length === 0 ? (
              <div className="sm:col-span-2 text-center py-16">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No templates yet. Save your first template!</p>
              </div>
            ) : (
              templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
