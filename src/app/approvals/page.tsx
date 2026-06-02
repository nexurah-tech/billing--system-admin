'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Send,
  Power,
  Menu,
  Clock,
  Check,
  X,
  Trash2,
  BarChart3,
  Bell,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Building2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

interface Owner {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'active' | 'blocked' | 'inactive';
}

interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  owner: Owner | null;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Custom styled confirmation modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApproveShopId, setSelectedApproveShopId] = useState('');
  const [approvePassword, setApprovePassword] = useState('');
  const [approveError, setApproveError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteShopId, setSelectedDeleteShopId] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Track previous pending count for new-registration alert popup
  const prevPendingCount = useRef<number | null>(null);
  const [newRegistrationAlert, setNewRegistrationAlert] = useState<Shop | null>(null);

  const pendingShops = shops.filter((s) => s.owner && s.owner.status === 'pending');
  const pendingCount = pendingShops.length;

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops');
      const data = await response.json();
      if (data.success) {
        const newShops: Shop[] = data.shops;
        const newPendingCount = newShops.filter((s) => s.owner && s.owner.status === 'pending').length;

        // Detect newly added pending shop and show popup notification
        if (prevPendingCount.current !== null && newPendingCount > prevPendingCount.current) {
          const prevIds = shops.filter((s) => s.owner?.status === 'pending').map((s) => s.id);
          const newOnes = newShops.filter(
            (s) => s.owner?.status === 'pending' && !prevIds.includes(s.id)
          );
          if (newOnes.length > 0) {
            setNewRegistrationAlert(newOnes[0]);
            // Browser notification if permission granted
            if (Notification && Notification.permission === 'granted') {
              new Notification('🔔 New Terminal Registration', {
                body: `${newOnes[0].owner?.name} registered "${newOnes[0].name}" — waiting for approval.`,
                icon: '/logo.png',
              });
            }
          }
        }

        prevPendingCount.current = newPendingCount;
        setShops(newShops);
      }
    } catch (err) {
      console.error('Fetch shops error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
    // Poll every 15 seconds for new registrations
    const interval = setInterval(fetchShops, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleAction = async (shopId: string, action: 'approve' | 'delete') => {
    setActionLoading(shopId + action);
    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, shopId }),
      });
      const data = await response.json();
      if (data.success) {
        showToast(
          'success',
          action === 'approve'
            ? 'Terminal approved! WhatsApp notification dispatched to the owner.'
            : 'Registration rejected and deleted.'
        );
        fetchShops();
      } else {
        showToast('error', data.error || 'Action failed. Please try again.');
      }
    } catch (err) {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col xl:flex-row relative">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/[0.015] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/[0.015] rounded-full blur-[150px] pointer-events-none" />

      {/* ── New Registration Alert Popup ── */}
      {newRegistrationAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Glowing header bar */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/20 px-6 py-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Bell size={18} className="text-amber-400 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-400 uppercase tracking-wider">New Registration Alert</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">A new shop has just registered and is awaiting your approval</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-indigo-400 shrink-0" />
                  <p className="text-sm font-black text-white">{newRegistrationAlert.name}</p>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users size={11} className="shrink-0 text-slate-500" />
                    <span>Owner: <span className="text-slate-200 font-semibold">{newRegistrationAlert.owner?.name}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={11} className="shrink-0 text-slate-500" />
                    <span className="font-mono text-slate-300">{newRegistrationAlert.owner?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={11} className="shrink-0 text-slate-500" />
                    <span className="text-indigo-400 font-bold">{newRegistrationAlert.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={11} className="shrink-0 text-slate-500" />
                    <span>{newRegistrationAlert.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleAction(newRegistrationAlert.id, 'approve');
                    setNewRegistrationAlert(null);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check size={13} strokeWidth={3} />
                  Approve Now
                </button>
                <button
                  onClick={() => setNewRegistrationAlert(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ChevronRight size={13} />
                  Review Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-xs font-semibold max-w-sm animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success'
            ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-300 backdrop-blur-md'
            : 'bg-red-900/80 border-red-500/30 text-red-300 backdrop-blur-md'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-current opacity-60 hover:opacity-100 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="w-full xl:w-64 bg-slate-900 border-b xl:border-b-0 xl:border-r border-slate-800/80 shrink-0 select-none z-30 relative xl:flex xl:flex-col">
        <div className="h-16 border-b border-slate-800/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="NexBill Logo" className="h-7 w-auto object-contain" />
            <div>
              <h1 className="text-xs font-black tracking-tight leading-none text-white">
                Nex<span className="text-indigo-500 font-extrabold">Bill</span> Admin
              </h1>
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider mt-1 block leading-none">Super Control Panel</span>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="xl:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <Menu size={18} />
          </button>
        </div>

        <nav className={`px-4 py-4 space-y-1.5 flex-1 ${mobileMenuOpen ? 'block' : 'hidden'} xl:block`}>
          <Link href="/" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <Users size={15} className="text-slate-400" />
            Installations Manager
          </Link>

          <Link href="/approvals" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 font-extrabold shadow-sm ring-1 ring-amber-500/10 text-xs transition-all duration-200 cursor-pointer relative"
          >
            <UserCheck size={15} className="text-amber-400" />
            Pending Approvals
            {pendingCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white shrink-0">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link href="/analytics" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <BarChart3 size={15} className="text-slate-400" />
            Analytics & Diagnostics
          </Link>

          <Link href="/" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <Send size={15} className="text-slate-400" />
            System Broadcasts
          </Link>

          <div className="pt-6 border-t border-slate-800/60 mt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.02] text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs font-extrabold transition-all duration-200 cursor-pointer"
            >
              <Power size={15} />
              Terminate Session
            </button>
          </div>
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 flex flex-col z-10">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/60 px-6 sm:px-8 flex items-center justify-between shrink-0 select-none bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <UserCheck size={16} className="text-amber-400" />
            <span className="text-sm font-black text-white">Pending Approvals</span>
            {pendingCount > 0 && (
              <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg ml-1">
                {pendingCount} WAITING
              </span>
            )}
          </div>
          <button
            onClick={() => { setLoading(true); fetchShops(); }}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </header>

        <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">

          {/* Empty state */}
          {!loading && pendingShops.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 text-center select-none animate-in fade-in duration-300">
              <div className="size-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 shadow-sm">
                <ShieldCheck size={36} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-black text-white">All Clear!</h2>
              <p className="text-xs text-slate-400 font-semibold mt-2 max-w-xs leading-relaxed">
                No pending terminal registrations at this time. New registrations will appear here automatically and notify you instantly.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500 font-semibold bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl">
                <RefreshCw size={11} className="animate-spin" />
                Auto-refreshing every 15 seconds
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded-lg w-2/3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-800 rounded w-4/5" />
                    <div className="h-3 bg-slate-800 rounded w-3/5" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-9 bg-slate-800 rounded-xl flex-1" />
                    <div className="h-9 w-12 bg-slate-800 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending approvals grid */}
          {!loading && pendingShops.length > 0 && (
            <>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest select-none">
                {pendingShops.length} registration{pendingShops.length !== 1 ? 's' : ''} waiting for your approval · Auto-refreshes every 15s
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pendingShops.map((shop, idx) => (
                  <div
                    key={shop.id}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-amber-500/30 transition-all shadow-sm relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Ambient glow */}
                    <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/[0.04] rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/[0.08] transition-colors" />

                    {/* Shop info */}
                    <div className="space-y-3 z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Building2 size={15} className="text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-white leading-tight">{shop.name}</h3>
                            <span className="text-[8.5px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 mt-0.5 inline-block">
                              PENDING
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">
                          {new Date(shop.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>

                      <div className="space-y-2 bg-slate-950/60 rounded-xl p-3 border border-slate-900">
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <Users size={11} className="text-slate-500 shrink-0" />
                          <span className="text-slate-400 font-semibold">Owner:</span>
                          <span className="text-white font-extrabold truncate">{shop.owner?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <Mail size={11} className="text-slate-500 shrink-0" />
                          <span className="text-slate-400 font-mono truncate">{shop.owner?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <Phone size={11} className="text-slate-500 shrink-0" />
                          <span className="text-indigo-400 font-bold tracking-wider">{shop.phone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-[10.5px]">
                          <MapPin size={11} className="text-slate-500 shrink-0 mt-0.5" />
                          <span className="text-slate-400 leading-relaxed">{shop.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2.5 z-10 pt-1 border-t border-slate-800/60">
                      <button
                        onClick={() => handleAction(shop.id, 'approve')}
                        disabled={actionLoading === shop.id + 'approve'}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10.5px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                      >
                        {actionLoading === shop.id + 'approve' ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <Check size={11} strokeWidth={3} />
                        )}
                        Approve & Activate
                      </button>
                      <button
                        onClick={() => handleAction(shop.id, 'delete')}
                        disabled={actionLoading === shop.id + 'delete'}
                        className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-red-500/5 hover:border-red-500/25 hover:text-red-400 text-slate-500 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-98"
                        title="Reject & delete registration"
                      >
                        {actionLoading === shop.id + 'delete' ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12.5} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
