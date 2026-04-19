'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { Upload, Plus, Trash2, Send, AlertCircle, Loader2, FileText, Download } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { FeeCalculator } from './FeeCalculator';
import clsx from 'clsx';

interface Recipient {
  id: string;
  address: string;
  amount: string;
  message: string;
  error?: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function BatchSendForm() {
  const { isConnected } = useAccount();
  const { t } = useLanguage();
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: generateId(), address: '', amount: '', message: '' },
  ]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const addRow = () => {
    setRecipients((prev) => [
      ...prev,
      { id: generateId(), address: '', amount: '', message: '' },
    ]);
  };

  const removeRow = (id: string) => {
    if (recipients.length > 1) {
      setRecipients((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof Recipient, value: string) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value, error: undefined } : r))
    );
  };

  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      const newRecipients: Recipient[] = [];

      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          newRecipients.push({
            id: generateId(),
            address: parts[0],
            amount: parts[1],
            message: parts[2] || '',
          });
        }
      }

      if (newRecipients.length > 0) {
        setRecipients(newRecipients);
      }
      setCsvUploading(false);
    };
    reader.readAsText(file);
  }, []);

  const downloadCSVTemplate = () => {
    const csv = '0x1234567890abcdef1234567890abcdef12345678,100,Monthly payment\n0xabcdef1234567890abcdef1234567890abcdef12,50,Bonus';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arcremit_batch_template.csv';
    a.click();
  };

  const validateAll = (): boolean => {
    let valid = true;
    const updated = recipients.map((r) => {
      const errors: string[] = [];
      if (!isAddress(r.address)) errors.push('Invalid address');
      const amt = parseFloat(r.amount);
      if (isNaN(amt) || amt <= 0) errors.push('Invalid amount');
      if (errors.length > 0) {
        valid = false;
        return { ...r, error: errors.join(', ') };
      }
      return { ...r, error: undefined };
    });
    setRecipients(updated);
    return valid;
  };

  const totalAmount = recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalFee = totalAmount * 0.003;
  const validRecipients = recipients.filter(
    (r) => isAddress(r.address) && parseFloat(r.amount) > 0
  );

  const handleSendBatch = async () => {
    if (!validateAll()) return;
    setSending(true);
    setProgress(0);

    for (let i = 0; i < recipients.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProgress(((i + 1) / recipients.length) * 100);
    }

    setSending(false);
    setShowPreview(false);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <Send className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Connect your wallet to use batch send</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSV Upload */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Upload CSV</span>
          <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
        </label>
        <button
          onClick={downloadCSVTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Template</span>
        </button>
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-arc-600/30 border border-arc-500/30 text-arc-400 hover:bg-arc-600/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Row</span>
        </button>
      </div>

      {/* Recipients Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount (USDC)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                  {/* Actions */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {recipients.map((recipient, index) => (
                  <motion.tr
                    key={recipient.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={clsx(recipient.error && 'bg-red-500/5')}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={recipient.address}
                        onChange={(e) => updateRow(recipient.id, 'address', e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-arc-500/50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={recipient.amount}
                        onChange={(e) => updateRow(recipient.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-arc-500/50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={recipient.message}
                        onChange={(e) => updateRow(recipient.id, 'message', e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-arc-500/50"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeRow(recipient.id)}
                        disabled={recipients.length <= 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {recipients.some((r) => r.error) && (
          <div className="px-4 py-2 bg-red-500/5 border-t border-red-500/20">
            {recipients
              .filter((r) => r.error)
              .map((r) => (
                <p key={r.id} className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> Row {recipients.indexOf(r) + 1}: {r.error}
                </p>
              ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{validRecipients.length}</p>
            <p className="text-xs text-gray-400">Recipients</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalAmount.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Total Amount (USDC)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-arc-400">{totalFee.toFixed(4)}</p>
            <p className="text-xs text-gray-400">Total Fee (USDC)</p>
          </div>
        </div>
      </div>

      {totalAmount > 0 && <FeeCalculator amount={totalAmount.toString()} />}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowPreview(true)}
          disabled={validRecipients.length === 0}
          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-semibold text-lg hover:from-arc-500 hover:to-arc-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-neon hover:shadow-neon-lg flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Preview Batch ({validRecipients.length} recipients)
        </button>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !sending && setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-surface-900 border border-white/10 p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Confirm Batch Send</h3>

              {sending && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>Sending...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-arc-600 to-arc-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {validRecipients.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm font-mono text-gray-300">
                        {r.address.slice(0, 6)}...{r.address.slice(-4)}
                      </p>
                      {r.message && <p className="text-xs text-gray-500 mt-0.5">{r.message}</p>}
                    </div>
                    <p className="text-sm font-semibold text-white">{r.amount} USDC</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-arc-500/10 border border-arc-500/20 mb-6">
                <span className="text-gray-300">Total (incl. fees)</span>
                <span className="text-lg font-bold text-white">
                  {(totalAmount + totalFee).toFixed(4)} USDC
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  disabled={sending}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBatch}
                  disabled={sending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-medium hover:from-arc-500 hover:to-arc-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send All
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
