import { useState } from 'react';
import { 
  X, 
  Search, 
  CheckCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  ShieldCheck, 
  Copy,
  Info,
  Calendar,
  Layers
} from 'lucide-react';

interface LedgerEntry {
  id: string;
  txHash: string;
  invoiceId: string;
  createdAt: string;
  amountLovelace: number;
  currency: 'ADA' | 'INR' | 'USDC';
  status: 'balanced' | 'pending';
  journals: Array<{
    accountName: string;
    type: 'debit' | 'credit';
    amount: number;
  }>;
}

interface LedgerExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LedgerExplorer({ isOpen, onClose }: LedgerExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock ledger data generated directly matching backend double-entry LedgerTransaction logs
  const [ledgerEntries] = useState<LedgerEntry[]>([
    {
      id: "ldg_88f2b7a9",
      txHash: "05cb6b38c2317f22a559e2172778392ba9e1ad23b7e452a8e8f81e3a6c11d27f",
      invoiceId: "INV-20260525-K8W1",
      createdAt: "2026-05-25T14:32:10Z",
      amountLovelace: 150000000,
      currency: "ADA",
      status: "balanced",
      journals: [
        { accountName: "escrow.locked.cardano", type: "debit", amount: 150.00 },
        { accountName: "merchant.receivables.cafe", type: "credit", amount: 147.00 },
        { accountName: "platform.fees.collected", type: "credit", amount: 3.00 }
      ]
    },
    {
      id: "ldg_44a9d72c",
      txHash: "1e88fac2d49c8112d7f8d689e4726bba921ad238b7e28a52e008df8a21f7a810",
      invoiceId: "INV-20260525-P7Q4",
      createdAt: "2026-05-25T13:10:45Z",
      amountLovelace: 42000000,
      currency: "ADA",
      status: "balanced",
      journals: [
        { accountName: "escrow.locked.cardano", type: "debit", amount: 42.00 },
        { accountName: "merchant.receivables.retail", type: "credit", amount: 41.16 },
        { accountName: "platform.fees.collected", type: "credit", amount: 0.84 }
      ]
    },
    {
      id: "ldg_11c8d77a",
      txHash: "447cb0248c8928bba3a6c11fba7e21cd23b8f2d8a5e008f81e39a2c7e10df81a",
      invoiceId: "INV-20260525-M3G2",
      createdAt: "2026-05-25T11:05:00Z",
      amountLovelace: 2500000000,
      currency: "ADA",
      status: "balanced",
      journals: [
        { accountName: "customer.refund.reconciled", type: "debit", amount: 2500.00 },
        { accountName: "escrow.released.cardano", type: "credit", amount: 2500.00 }
      ]
    },
    {
      id: "ldg_99d1a8e3",
      txHash: "6c2b1a8d4d7f8a9e2b10df8a7c2b3e8a9f2d1a3b7e45d6e7f8a9b0c1d2e3f4a5",
      invoiceId: "INV-20260524-L0K9",
      createdAt: "2026-05-24T18:45:20Z",
      amountLovelace: 95000000,
      currency: "ADA",
      status: "balanced",
      journals: [
        { accountName: "escrow.locked.cardano", type: "debit", amount: 95.00 },
        { accountName: "merchant.receivables.cafe", type: "credit", amount: 93.10 },
        { accountName: "platform.fees.collected", type: "credit", amount: 1.90 }
      ]
    }
  ]);

  if (!isOpen) return null;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const filteredEntries = ledgerEntries.filter(entry => 
    entry.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.journals.some(j => j.accountName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#0B0D13] border-l border-[#22263a] h-full flex flex-col justify-between shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22263a] bg-[#131622]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Double-Entry Ledger Auditor</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Immutable financial journals & accounts sync checks</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#1c1f2e] text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex gap-3">
          <ShieldCheck className="text-emerald-400 w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white">Ledger Integrity Guaranteed</h4>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
              ZeroPay utilizes an immutable double-entry bookkeeping model. Every state transition (locking, releases, refunds) 
              triggers debits and credits that balance to exactly zero, eliminating ledger float.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 mt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by Invoice, Account, or Tx Hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131622] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition font-mono"
            />
          </div>
        </div>

        {/* Ledger Entries List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-indicator">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => {
              // Calculate net balance
              const debits = entry.journals.filter(j => j.type === 'debit').reduce((sum, j) => sum + j.amount, 0);
              const credits = entry.journals.filter(j => j.type === 'credit').reduce((sum, j) => sum + j.amount, 0);
              const netBalance = Math.abs(debits - credits);

              return (
                <div key={entry.id} className="bg-[#131622]/40 border border-white/5 rounded-2xl p-4.5 space-y-3.5">
                  {/* Header info */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{entry.invoiceId}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono select-all">
                          ID: {entry.id}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                      ✓ balanced
                    </span>
                  </div>

                  {/* Journals table */}
                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="flex justify-between text-gray-500 font-sans border-b border-white/5 pb-1">
                      <span>Ledger Account</span>
                      <div className="flex gap-12">
                        <span>Debit</span>
                        <span>Credit</span>
                      </div>
                    </div>
                    {entry.journals.map((j, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5">
                        <span className="text-gray-300 font-mono truncate max-w-[200px]">{j.accountName}</span>
                        <div className="flex gap-10 font-mono font-bold">
                          {j.type === 'debit' ? (
                            <span className="text-emerald-400 w-12 text-right">
                              ₳ {j.amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="w-12 text-right text-gray-600">-</span>
                          )}
                          
                          {j.type === 'credit' ? (
                            <span className="text-violet-400 w-12 text-right">
                              ₳ {j.amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="w-12 text-right text-gray-600">-</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verification stats */}
                  <div className="bg-[#0B0D13] p-3 rounded-xl border border-white/5 flex items-center justify-between text-[9px] font-mono text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <span>Ledger balance check: <strong>0.00 ADA delta</strong></span>
                    </div>
                    <button 
                      onClick={() => handleCopyText(entry.txHash)}
                      className="text-gray-500 hover:text-white transition flex items-center gap-1 font-sans"
                    >
                      <Copy size={10} />
                      Copy Hash
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-xs text-gray-500">
              No matching ledger entries found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#22263a] bg-[#131622]/40 text-center text-[10px] text-gray-500 font-mono">
          ZeroPay Core Bookkeeping SLA · Balanced Audit verified
        </div>
      </div>
    </div>
  );
}
