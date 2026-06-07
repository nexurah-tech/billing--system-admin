'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Send,
  Power,
  Menu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Laptop,
  BarChart3,
  IndianRupee,
  Search,
  CreditCard,
  UserCheck,
  Building2,
  Calendar,
  Phone,
  Mail,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  TrendingUp,
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
  subscriptionStatus: string;
  subscriptionExpiresAt: string;
  lastPaymentDate: string | null;
  lastActiveAt: string;
  isExpired: boolean;
  isGracePeriod: boolean;
  isSuspended: boolean;
  graceDaysLeft: number;
  owner: Owner | null;
}

interface AdminStats {
  totalShops: number;
  active: number;
  pending: number;
  blocked: number;
  paid: number;
  grace: number;
  overdue: number;
}

export default function BillingLedgerPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({ totalShops: 0, active: 0, pending: 0, blocked: 0, paid: 0, grace: 0, overdue: 0 });
  const [shops, setShops] = useState<Shop[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [billingFilter, setBillingFilter] = useState<'all' | 'paid' | 'grace' | 'unpaid'>('all');

  // Manual payment recording modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentShopId, setSelectedPaymentShopId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('199');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'card' | 'bank_transfer' | 'manual'>('upi');
  const [paymentRefId, setPaymentRefId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentPassword, setPaymentPassword] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/shops');
      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch shops error:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments');
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchBillingData(), fetchPayments()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_AUTH_PASSWORD || 'nexurah123@';
    if (paymentPassword !== correctPassword) {
      setPaymentError('Invalid admin verification password.');
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-payment',
          shopId: selectedPaymentShopId,
          amount: Number(paymentAmount) || 199,
          paymentMethod,
          referenceId: paymentRefId,
          notes: paymentNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowPaymentModal(false);
        setPaymentPassword('');
        setPaymentError('');
        setPaymentRefId('');
        setPaymentNotes('');
        setSuccessToast('Payment logged and subscription extended successfully!');
        setTimeout(() => setSuccessToast(''), 5000);
        loadAllData();
      } else {
        setPaymentError(data.error || 'Failed to record payment.');
      }
    } catch (err) {
      setPaymentError('Network error. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Calculations
  const totalRevenue = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const getRemainingDaysText = (shop: Shop) => {
    if (!shop.subscriptionExpiresAt) return 'No Subscription';
    const now = new Date();
    const expiresAt = new Date(shop.subscriptionExpiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} days to pay`;
    } else {
      const elapsedDays = Math.abs(diffDays);
      if (elapsedDays <= 3) {
        return `Expired (Grace: ${3 - elapsedDays} days left)`;
      } else {
        return `Locked (${elapsedDays} days overdue)`;
      }
    }
  };

  // Filters
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.phone.includes(searchQuery) ||
      (shop.owner?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isPaid = !shop.isExpired;
    const isGrace = shop.isGracePeriod;
    const isUnpaid = shop.isExpired;

    if (billingFilter === 'paid') return matchesSearch && isPaid;
    if (billingFilter === 'grace') return matchesSearch && isGrace;
    if (billingFilter === 'unpaid') return matchesSearch && isUnpaid;

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col xl:flex-row relative">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/[0.015] rounded-full blur-[150px] pointer-events-none" />

      {/* Toast alert */}
      {successToast && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 backdrop-blur-md text-xs font-semibold shadow-xl animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast('')} className="ml-2 text-current opacity-60 hover:opacity-100 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Sidebar Navigation ── */}
      <aside className="w-full xl:w-64 bg-slate-900 border-b xl:border-b-0 xl:border-r border-slate-800/80 shrink-0 select-none z-30 relative xl:flex xl:flex-col">
        <div className="h-16 border-b border-slate-800/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="NexBill Logo" className="h-7 w-auto object-contain select-none" />
            <div>
              <h1 className="text-xs font-black tracking-tight leading-none text-white">
                Nex<span className="text-indigo-500 font-extrabold">Bill</span> Admin
              </h1>
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider mt-1 block leading-none">Super Control Panel</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
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

          <Link href="/billing" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-500 bg-indigo-500/10 text-white font-extrabold shadow-sm ring-1 ring-indigo-500/10 text-xs transition-all duration-200 cursor-pointer"
          >
            <CreditCard size={15} className="text-indigo-400" />
            Subscription Ledger
          </Link>

          <Link href="/approvals" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer relative"
          >
            <UserCheck size={15} className="text-slate-400" />
            Pending Approvals
            {stats.pending > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white shrink-0">
                {stats.pending}
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
        <header className="h-16 border-b border-slate-800/60 px-6 sm:px-8 flex items-center justify-between shrink-0 select-none bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <CreditCard size={16} className="text-indigo-400" />
            <span className="text-sm font-black text-white">Subscription Ledger</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">/ Accounts Receivable</span>
          </div>
          <button
            onClick={() => loadAllData()}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh Ledger
          </button>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">

          {/* ── Summary KPI Panel ── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
            <div className="p-4 border border-emerald-500/20 rounded-2xl bg-slate-900/40 backdrop-blur-md shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[9px] font-black uppercase tracking-wider">Total Revenue</span>
                <IndianRupee size={15} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                ₹{loading ? '--' : totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] text-slate-500 font-semibold">Total payments collected</p>
            </div>

            <div className="p-4 border border-indigo-500/20 rounded-2xl bg-slate-900/40 backdrop-blur-md shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[9px] font-black uppercase tracking-wider">Paid Terminals</span>
                <CheckCircle2 size={15} className="text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight font-mono">
                {loading ? '--' : stats.paid}
              </p>
              <p className="text-[9px] text-slate-500 font-semibold">Subscriptions active & current</p>
            </div>

            <div className="p-4 border border-amber-500/20 rounded-2xl bg-slate-900/40 backdrop-blur-md shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[9px] font-black uppercase tracking-wider">Grace Period</span>
                <Clock size={15} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight font-mono">
                {loading ? '--' : stats.grace}
              </p>
              <p className="text-[9px] text-slate-500 font-semibold">Expired but warning state</p>
            </div>

            <div className="p-4 border border-red-500/20 rounded-2xl bg-slate-900/40 backdrop-blur-md shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[9px] font-black uppercase tracking-wider">Suspended</span>
                <AlertCircle size={15} className="text-red-400" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight font-mono">
                {loading ? '--' : stats.overdue}
              </p>
              <p className="text-[9px] text-slate-500 font-semibold">Fully blocked (no POS access)</p>
            </div>
          </section>

          {/* ── Search & Filter Tabs ── */}
          <section className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/30 border border-slate-800/80 p-3 rounded-2xl select-none">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900 p-1 rounded-xl w-full md:w-auto overflow-x-auto shrink-0">
              {[
                { filter: 'all', label: 'All Terminals' },
                { filter: 'paid', label: 'Paid / Active' },
                { filter: 'grace', label: 'Grace Period' },
                { filter: 'unpaid', label: 'Unpaid / Overdue' }
              ].map((tab) => (
                <button
                  key={tab.filter}
                  onClick={() => setBillingFilter(tab.filter as any)}
                  className={`px-4.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                    billingFilter === tab.filter
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Local search input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-3.5" />
              <input
                type="text"
                placeholder="Search shop name or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl pl-9.5 pr-4 py-2 text-xs placeholder:text-slate-500 text-slate-200 focus:outline-none transition-colors"
              />
            </div>
          </section>

          {/* ── Ledger Table ── */}
          {loading ? (
            <div className="text-center text-slate-500 font-medium py-20 text-xs uppercase tracking-widest animate-pulse">
              Loading ledger data...
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="border border-dashed border-slate-850 rounded-2xl p-16 text-center select-none">
              <CreditCard className="size-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-300">No matching installations</p>
              <p className="text-xs text-slate-500 mt-1">Try updating the search query or status filter tabs</p>
            </div>
          ) : (
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/20 backdrop-blur-md shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-[9.5px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-5 py-4">Shop details</th>
                      <th className="px-5 py-4">Payment status</th>
                      <th className="px-5 py-4">Days to pay</th>
                      <th className="px-5 py-4">Expiration Date</th>
                      <th className="px-5 py-4">Last Payment details</th>
                      <th className="px-5 py-4 text-right">Operational Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredShops.map((shop) => {
                      const daysText = getRemainingDaysText(shop);
                      const isUnpaid = shop.isExpired;
                      const lastRenewal = payments.filter(p => p.shop?._id === shop.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];

                      return (
                        <tr key={shop.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
                          {/* Shop details */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center justify-center shrink-0">
                                <Building2 size={14} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-100 leading-snug">{shop.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold flex items-center gap-1.5">
                                  <span>{shop.owner?.name || 'Guest User'}</span>
                                  <span className="text-slate-700">•</span>
                                  <span className="font-mono">{shop.phone}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-4">
                            {!isUnpaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
                                <CheckCircle2 size={10} /> Active / Paid
                              </span>
                            ) : shop.isGracePeriod ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider">
                                <Clock size={10} /> Grace Warning
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-wider">
                                <AlertCircle size={10} /> Overdue / Locked
                              </span>
                            )}
                          </td>

                          {/* Days left countdown */}
                          <td className="px-5 py-4">
                            <span className={`font-extrabold font-mono text-[11px] ${
                              !isUnpaid 
                                ? 'text-indigo-400' 
                                : shop.isGracePeriod 
                                  ? 'text-amber-400' 
                                  : 'text-red-400 animate-pulse'
                            }`}>
                              {daysText}
                            </span>
                          </td>

                          {/* Expiration date */}
                          <td className="px-5 py-4">
                            {shop.subscriptionExpiresAt ? (
                              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                                <Calendar size={11.5} className="text-slate-500 shrink-0" />
                                <span>
                                  {new Date(shop.subscriptionExpiresAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Not set</span>
                            )}
                          </td>

                          {/* Last payment info */}
                          <td className="px-5 py-4">
                            {lastRenewal ? (
                              <div>
                                <p className="font-extrabold text-slate-200">₹{lastRenewal.amount} <span className="text-[9px] text-slate-500 font-medium capitalize">via {lastRenewal.paymentMethod}</span></p>
                                <p className="text-[9.5px] font-mono text-slate-500 mt-0.5">
                                  {new Date(lastRenewal.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  {lastRenewal.referenceId && ` · Ref: ${lastRenewal.referenceId.slice(0, 8)}`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No payments logged</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPaymentShopId(shop.id);
                                setShowPaymentModal(true);
                              }}
                              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-xl cursor-pointer shadow-sm active:scale-98 transition-all inline-flex items-center gap-1"
                            >
                              <PlusCircle size={12} />
                              Record Payment
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ===================== MANUAL PAYMENT MODAL ===================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-4">
            
            {/* Close */}
            <button
              onClick={() => { setShowPaymentModal(false); setPaymentPassword(''); setPaymentError(''); }}
              className="absolute top-5 right-5 text-slate-500 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-400" />
                Record Shop Payment
              </h3>
              <p className="text-[10.5px] text-slate-500 mt-0.5">Enter transaction details to extend the shop subscription by 30 days.</p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Amount (₹) *</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Method */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash Payment</option>
                    <option value="card">Card Swipe</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                </div>
              </div>

              {/* Reference ID */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">UPI Transaction Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. 3145926535"
                  value={paymentRefId}
                  onChange={(e) => setPaymentRefId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Administrative Notes</label>
                <textarea
                  placeholder="Additional remarks on screenshot verification..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none"
                  rows={2}
                />
              </div>

              {/* Verification password */}
              <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Super Admin Password verification *</label>
                <input
                  type="password"
                  placeholder="Enter admin password to confirm"
                  value={paymentPassword}
                  onChange={(e) => setPaymentPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none"
                />
              </div>

              {paymentError && (
                <p className="text-[10px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  {paymentError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPaymentModal(false); setPaymentPassword(''); setPaymentError(''); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer select-none active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-black rounded-xl transition-all cursor-pointer select-none active:scale-98 flex items-center justify-center gap-1.5"
                >
                  {paymentLoading && <RefreshCw size={11} className="animate-spin" />}
                  Confirm & Extend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
