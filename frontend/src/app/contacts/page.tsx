'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { Users, Plus, Search, Wallet, X, AlertCircle } from 'lucide-react';
import { ContactCard, Contact } from '@/components/ContactCard';
import { useLanguage } from '@/lib/i18n';
import clsx from 'clsx';

const mockContacts: Contact[] = [
  {
    id: '1',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    nickname: 'Mom',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    nickname: 'John - Freelancer',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    address: '0x9876543210fedcba9876543210fedcba98765432',
    nickname: 'Supplier ABC',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

export default function ContactsPage() {
  const { isConnected } = useAccount();
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Add form state
  const [newAddress, setNewAddress] = useState('');
  const [newNickname, setNewNickname] = useState('');

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.nickname.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const handleAdd = () => {
    if (!isAddress(newAddress) || !newNickname.trim()) return;
    const newContact: Contact = {
      id: Date.now().toString(),
      address: newAddress,
      nickname: newNickname,
      createdAt: new Date(),
    };
    setContacts((prev) => [newContact, ...prev]);
    setNewAddress('');
    setNewNickname('');
    setShowAdd(false);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setNewAddress(contact.address);
    setNewNickname(contact.nickname);
    setShowAdd(true);
  };

  const handleUpdate = () => {
    if (!editingContact || !isAddress(newAddress) || !newNickname.trim()) return;
    setContacts((prev) =>
      prev.map((c) =>
        c.id === editingContact.id
          ? { ...c, address: newAddress, nickname: newNickname }
          : c
      )
    );
    setEditingContact(null);
    setNewAddress('');
    setNewNickname('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingContact(null);
    setNewAddress('');
    setNewNickname('');
  };

  if (!isConnected) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-20 right-0 w-96 h-96 bg-arc-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-700 mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('contacts.title')}</h1>
          </motion.div>
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Connect your wallet to manage contacts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-20 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-arc-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-700 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('contacts.title')}</h1>
              <p className="text-gray-400">{contacts.length} contacts saved</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-arc-600 text-white font-medium hover:bg-arc-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-6 rounded-2xl bg-glass backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                  </h3>
                  <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nickname</label>
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      placeholder="e.g., Mom, Freelancer Bob"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Wallet Address</label>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arc-500/50"
                    />
                    {newAddress && !isAddress(newAddress) && (
                      <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
                        <AlertCircle className="w-3 h-3" /> Invalid address
                      </p>
                    )}
                  </div>
                  <button
                    onClick={editingContact ? handleUpdate : handleAdd}
                    disabled={!isAddress(newAddress) || !newNickname.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-arc-600 to-arc-500 text-white font-semibold hover:from-arc-500 hover:to-arc-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-neon"
                  >
                    {editingContact ? 'Update Contact' : 'Add Contact'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredContacts.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {search ? 'No contacts match your search' : 'No contacts yet. Add your first contact!'}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={handleEdit}
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
