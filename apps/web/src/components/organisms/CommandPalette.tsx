import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Terminal, 
  Settings, 
  LayoutDashboard, 
  MessageSquare, 
  User, 
  Key, 
  Radio, 
  Activity, 
  FileText, 
  AlertOctagon,
  Sparkles,
  HelpCircle,
  Play
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Navigation' | 'Actions' | 'Telemetry' | 'Developer';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'View merchant analytics, stats, and recent orders',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-teal-400" />,
      action: () => { navigate('/merchant/dashboard'); onClose(); }
    },
    {
      id: 'nav-chats',
      title: 'Go to Chats',
      description: 'Open customer communication & AI negotiations',
      category: 'Navigation',
      icon: <MessageSquare className="w-4 h-4 text-teal-400" />,
      action: () => { navigate('/customer/chats'); onClose(); }
    },
    {
      id: 'nav-profile',
      title: 'Go to Profile',
      description: 'Manage user identity, wallets, and credentials',
      category: 'Navigation',
      icon: <User className="w-4 h-4 text-teal-400" />,
      action: () => { navigate('/profile'); onClose(); }
    },
    {
      id: 'nav-apikeys',
      title: 'Manage API Keys',
      description: 'View and generate API credentials',
      category: 'Navigation',
      icon: <Key className="w-4 h-4 text-teal-400" />,
      action: () => { navigate('/developer/keys'); onClose(); }
    },
    {
      id: 'nav-webhooks',
      title: 'Manage Webhooks',
      description: 'Register callback URLs and view logs',
      category: 'Navigation',
      icon: <Radio className="w-4 h-4 text-teal-400" />,
      action: () => { navigate('/developer/webhooks'); onClose(); }
    },
    {
      id: 'nav-storefront',
      title: 'Storefront Setup',
      description: 'Configure public storefront listings',
      category: 'Navigation',
      icon: <Settings className="w-4 h-4 text-teal-400" />,
      action: () => { navigate('/merchant/storefront'); onClose(); }
    },

    // Actions
    {
      id: 'action-ai-invoice',
      title: 'AI Invoice Generation',
      description: 'Trigger Gemini AI negotiation draft or quote creation',
      category: 'Actions',
      icon: <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />,
      action: () => {
        // Open checkouts page or trigger the creation FAB
        navigate('/merchant/dashboard');
        setTimeout(() => {
          const fab = document.getElementById('create-invoice-fab');
          if (fab) fab.click();
        }, 300);
        onClose();
      }
    },
    {
      id: 'action-dispute',
      title: 'Open Dispute Center',
      description: 'Flag transaction and open mediation room',
      category: 'Actions',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
      action: () => {
        // Open chats list or specific instructions
        navigate('/customer/chats');
        onClose();
      }
    },
    {
      id: 'action-scan',
      title: 'Scan payment QR',
      description: 'Approve checkout invoices via mobile scanner layout',
      category: 'Actions',
      icon: <Search className="w-4 h-4 text-teal-400" />,
      action: () => { navigate('/customer/scan'); onClose(); }
    },

    // Telemetry
    {
      id: 'telemetry-dashboard',
      title: 'Open System Health panel',
      description: 'Inspect live WebSockets, worker queues, and Blockfrost SLA latency',
      category: 'Telemetry',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      action: () => {
        // Trigger opening health drawer
        const drawerBtn = document.getElementById('system-health-toggle-btn');
        if (drawerBtn) drawerBtn.click();
        onClose();
      }
    },
    
    // Developer
    {
      id: 'dev-debug-toggle',
      title: 'Toggle Debug Mode Overlay',
      description: 'Turn on/off inline observability diagnostics',
      category: 'Developer',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
      action: () => {
        const current = localStorage.getItem('zeropay_debug_mode') === 'true';
        localStorage.setItem('zeropay_debug_mode', (!current).toString());
        window.dispatchEvent(new Event('storage'));
        window.location.reload();
        onClose();
      }
    }
  ];

  // Filtering
  const filtered = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  // Click outside closure
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Grouped commands
  const categories = ['Navigation', 'Actions', 'Telemetry', 'Developer'] as const;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-md pt-20 px-4 animate-fade-in"
      onClick={handleOutsideClick}
    >
      <div 
        ref={containerRef}
        className="w-full max-w-xl bg-[#0B0D13] border border-[#22263a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-slide-up"
      >
        {/* Search Input bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#22263a] bg-[#131622]/30">
          <Search className="w-5 h-5 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, entities, or jump to dashboard..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
          <kbd className="text-[10px] bg-[#1a1d27] border border-[#2d3248] text-text-secondary px-2 py-0.5 rounded-md font-mono select-none">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scroll-indicator">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-text-muted text-xs">
              No matching commands or navigation routes found.
            </div>
          ) : (
            categories.map(cat => {
              const catCmds = filtered.filter(c => c.category === cat);
              if (catCmds.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {cat}
                  </div>
                  {catCmds.map((cmd) => {
                    // Absolute index calculation in the flattened list
                    const absIndex = filtered.indexOf(cmd);
                    const isSelected = absIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(absIndex)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
                          isSelected 
                            ? 'bg-teal-600/10 border border-teal-500/20 text-text-primary' 
                            : 'border border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-950/30' : 'bg-[#131622]'}`}>
                            {cmd.icon}
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{cmd.title}</p>
                            <p className="text-[10px] text-text-muted mt-0.5">{cmd.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-mono bg-teal-500/15 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">
                            ↵ Enter
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-[#22263a] bg-[#131622]/40 flex items-center justify-between text-[10px] text-text-muted">
          <div className="flex items-center gap-4">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono">ZeroPay OS Command Console</span>
          </div>
        </div>
      </div>
    </div>
  );
}
