'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Laptop,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Power,
  Search,
  Send,
  Trash2,
  Check,
  CreditCard,
  Info,
  Menu,
  BarChart3,
  UserCheck,
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

interface AdminStats {
  totalShops: number;
  active: number;
  pending: number;
  blocked: number;
  paid: number;
  grace: number;
  overdue: number;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'payment';
  targetName: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'shops' | 'broadcasts' | 'payments' | 'qrconfig'>('shops');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({ totalShops: 0, active: 0, pending: 0, blocked: 0, paid: 0, grace: 0, overdue: 0 });
  const [shops, setShops] = useState<Shop[] | any[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'blocked' | 'paid' | 'grace' | 'suspended'>('all');

  // QR code config states
  const [qrConfig, setQrConfig] = useState<any>({ paymentQrCodeUrl: '', whatsappNumber: '' });
  const [qrCodeUrlInput, setQrCodeUrlInput] = useState('');
  const [whatsappNumberInput, setWhatsappNumberInput] = useState('');
  const [qrSuccessMsg, setQrSuccessMsg] = useState('');
  const [qrErrorMsg, setQrErrorMsg] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Payments audit history states
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

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

  // Notification Forms
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'alert' | 'payment'>('info');
  const [targetShopId, setTargetShopId] = useState(''); // empty means global
  const [recipientSearch, setRecipientSearch] = useState('Global Broadcast (All Shops)');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');

  // Block reason modal state
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  const [selectedBlockShopId, setSelectedBlockShopId] = useState('');
  const [blockReasonOption, setBlockReasonOption] = useState('Subscription Payment Overdue');
  const [customBlockReason, setCustomBlockReason] = useState('');
  const [blockPassword, setBlockPassword] = useState('');
  const [blockError, setBlockError] = useState('');

  // Delete verification modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteShopId, setSelectedDeleteShopId] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Approve verification modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApproveShopId, setSelectedApproveShopId] = useState('');
  const [approvePassword, setApprovePassword] = useState('');
  const [approveError, setApproveError] = useState('');

  // Reject verification modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectShopId, setSelectedRejectShopId] = useState('');
  const [rejectPassword, setRejectPassword] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Mobile Menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/shops');
      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
        setStats(data.stats);
        if (data.qrConfig) {
          setQrConfig(data.qrConfig);
          setQrCodeUrlInput(data.qrConfig.paymentQrCodeUrl || '');
          setWhatsappNumberInput(data.qrConfig.whatsappNumber || '');
        }
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    }
  };

  const fetchNotificationsHistory = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const response = await fetch('/api/payments');
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDashboardData(), fetchNotificationsHistory(), fetchPayments()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
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

  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setQrErrorMsg('');
    setQrSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setQrCodeUrlInput(data.imageUrl);
        setQrSuccessMsg('QR Code uploaded successfully. Click Save Configuration to apply.');
        setTimeout(() => setQrSuccessMsg(''), 5000);
      } else {
        setQrErrorMsg(data.error || 'Failed to upload QR Code image.');
      }
    } catch (err) {
      setQrErrorMsg('Network error. Failed to upload.');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleShopAction = async (shopId: string, action: 'approve' | 'block' | 'unblock' | 'delete' | 'reject', reason?: string) => {
    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, shopId, reason }),
      });
      const data = await response.json();
      if (data.success) {
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to update shop');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating shop');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;

    setDispatchLoading(true);
    setNotifSuccess('');

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          targetShopId: targetShopId || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNotifSuccess(data.message);
        setNotifTitle('');
        setNotifMessage('');
        setNotifType('info');
        setTargetShopId('');
        setRecipientSearch('Global Broadcast (All Shops)');
        fetchNotificationsHistory();
        setTimeout(() => setNotifSuccess(''), 5000);
      } else {
        alert(data.error || 'Failed to dispatch notification');
      }
    } catch (err) {
      console.error(err);
      alert('Error dispatching notification');
    } finally {
      setDispatchLoading(false);
    }
  };

  // Filter & Search Logic
  const filteredShops = shops.filter((shop) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      shop.name.toLowerCase().includes(q) ||
      shop.phone.includes(q) ||
      (shop.owner && shop.owner.name.toLowerCase().includes(q)) ||
      (shop.owner && shop.owner.email.toLowerCase().includes(q));

    const status = shop.owner ? shop.owner.status : 'inactive';
    const isPaid = !shop.isExpired && shop.subscriptionStatus !== 'trialing';

    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = status === 'pending';
    else if (statusFilter === 'active') matchesStatus = status === 'active';
    else if (statusFilter === 'blocked') matchesStatus = status === 'blocked';
    else if (statusFilter === 'paid') matchesStatus = isPaid;
    else if (statusFilter === 'grace') matchesStatus = shop.isGracePeriod;
    else if (statusFilter === 'suspended') matchesStatus = shop.isSuspended;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col xl:flex-row relative">
      
      {/* Background ambient neon glow spheres */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/[0.015] rounded-full blur-[150px] pointer-events-none" />

      {/* ── Sidebar Navigation ── */}
      <aside className="w-full xl:w-64 bg-slate-900 border-b xl:border-b-0 xl:border-r border-slate-800/80 shrink-0 select-none z-30 relative xl:flex xl:flex-col">
        {/* Sidebar Header */}
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

          {/* Mobile hamburger menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className={`px-4 py-4 space-y-1.5 flex-1 ${mobileMenuOpen ? 'block' : 'hidden'} xl:block`}>
          <div 
            onClick={() => { setActiveTab('shops'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'shops'
                ? 'border-indigo-500 bg-indigo-500/10 text-white font-extrabold shadow-sm ring-1 ring-indigo-500/10'
                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Users size={15} className={activeTab === 'shops' ? 'text-indigo-400' : 'text-slate-400'} />
            Installations Manager
          </div>
          <div 
            onClick={() => { setActiveTab('payments'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'payments'
                ? 'border-indigo-500 bg-indigo-500/10 text-white font-extrabold shadow-sm ring-1 ring-indigo-500/10'
                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <CreditCard size={15} className={activeTab === 'payments' ? 'text-indigo-400' : 'text-slate-400'} />
            Payments Audit Log
          </div>
          <div 
            onClick={() => { setActiveTab('qrconfig'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'qrconfig'
                ? 'border-indigo-500 bg-indigo-500/10 text-white font-extrabold shadow-sm ring-1 ring-indigo-500/10'
                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Laptop size={15} className={activeTab === 'qrconfig' ? 'text-indigo-400' : 'text-slate-400'} />
            Payment QR Config
          </div>
          <div 
            onClick={() => { setActiveTab('broadcasts'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'broadcasts'
                ? 'border-indigo-500 bg-indigo-500/10 text-white font-extrabold shadow-sm ring-1 ring-indigo-500/10'
                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Send size={15} className={activeTab === 'broadcasts' ? 'text-indigo-400' : 'text-slate-400'} />
            System Broadcasts
          </div>
          <Link
            href="/billing"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <CreditCard size={15} className="text-slate-400" />
            Subscription Ledger
          </Link>
          <Link
            href="/approvals"
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
          <Link
            href="/analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <BarChart3 size={15} className="text-slate-400" />
            Analytics & Diagnostics
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

      {/* ── Main Dashboard Panel Content ── */}
      <main className="flex-1 min-w-0 flex flex-col z-10">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/60 px-6 sm:px-8 flex items-center justify-between shrink-0 select-none bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-400">
            <Clock size={14} className="text-indigo-500" />
            <span>Last DB Sync: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9.5px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
              SYSTEM SECURE
            </span>
          </div>
        </header>

        {/* Dashboard Pages */}
        <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">

          {/* ── Top Metrics Stats Grid ── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
            {[
              { label: 'Total Installations', value: stats.totalShops, icon: Laptop, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/10' },
              { label: 'Active Terminals', value: stats.active, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10' },
              { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/10' },
              { label: 'Suspended Terminals', value: stats.blocked, icon: AlertCircle, color: 'text-red-500 bg-red-500/10 border-red-500/10' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className={`p-4 border rounded-2xl bg-slate-900/40 backdrop-blur-md shadow-sm space-y-3 ${stat.color}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
                    <Icon size={16} />
                  </div>
                  <p className="text-2xl font-black text-white tracking-tight leading-none font-mono">
                    {loading ? '--' : stat.value}
                  </p>
                </div>
              );
            })}
          </section>

          {/* ── Prominent Pending Terminal Approvals quick center ── */}
          {!loading && shops.some(s => s.owner && s.owner.status === 'pending') && (
            <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-5 rounded-2xl shadow-md space-y-4 animate-in slide-in-from-top-2 duration-300 select-none">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                    <Clock size={16} className="animate-pulse" />
                    Pending Terminal Approval Requests ({stats.pending})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Newly registered retail billing terminals are waiting for access tokens. Approving them immediately dispatches WhatsApp activations via Twilio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5 pt-1">
                {shops
                  .filter(s => s.owner && s.owner.status === 'pending')
                  .map(shop => (
                    <div key={shop.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-4 transition-all hover:border-amber-500/30 shadow-sm relative overflow-hidden group">
                      {/* Subtle cyber background amber highlight */}
                      <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/[0.03] rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/[0.06] transition-colors" />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-white tracking-tight">{shop.name}</h4>
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.75 rounded-md border border-amber-500/20">PENDING</span>
                        </div>
                        
                        <div className="space-y-1 text-[10.5px] leading-relaxed">
                          <p className="text-slate-400 font-semibold">Owner: <span className="text-slate-200">{shop.owner?.name}</span></p>
                          <p className="text-slate-400 font-semibold">Email: <span className="text-slate-300 font-mono">{shop.owner?.email}</span></p>
                          <p className="text-slate-400 font-semibold">Contact: <span className="text-indigo-400 font-bold">{shop.phone}</span></p>
                          <p className="text-slate-500 font-medium italic mt-0.5">{shop.address}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-900">
                        <button
                          onClick={() => {
                            setSelectedApproveShopId(shop.id);
                            setApprovePassword('');
                            setApproveError('');
                            setShowApproveModal(true);
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-98"
                        >
                          <Check size={11} strokeWidth={3} />
                          Approve Terminal
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRejectShopId(shop.id);
                            setRejectPassword('');
                            setRejectError('');
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-all cursor-pointer flex items-center justify-center active:scale-98"
                          title="Reject / Delete profile"
                        >
                          <Trash2 size={12.5} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium tracking-widest uppercase animate-pulse">Loading installation index...</p>
            </div>
          ) : activeTab === 'shops' ? (
            
            // ── TAB: TERMINAL INSTALLATIONS MANAGER ──
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Table search & status filter headers */}
              <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl shadow-sm justify-between">
                <div className="relative max-w-sm w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shop name, owner, or email..."
                    className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl pl-9 pr-4 py-2.5 text-xs placeholder:text-slate-500 focus:outline-none transition-all font-semibold text-white"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4" />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'pending', label: 'Pending Approvals' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'grace', label: 'Grace Period' },
                    { value: 'suspended', label: 'Suspended (Overdue)' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value as any)}
                      className={`px-3.5 py-2 text-[10.5px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                        statusFilter === f.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm font-black'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic installations database table sheet */}
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[9.5px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/40 select-none">
                        <th className="py-3.5 px-6 w-12 text-center">No</th>
                        <th className="py-3.5 px-6">Terminal Name / Contact</th>
                        <th className="py-3.5 px-6">Owner Name / Email</th>
                        <th className="py-3.5 px-6 w-32">Creation Date</th>
                        <th className="py-3.5 px-6 w-28 text-center">Status</th>
                        <th className="py-3.5 px-6 w-56 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {filteredShops.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-bold select-none border-none">
                            No matching billing installations found.
                          </td>
                        </tr>
                      ) : (
                        filteredShops.map((shop, index) => {
                          const status = shop.owner ? shop.owner.status : 'inactive';
                          const isBlocked = status === 'blocked';
                          const isPending = status === 'pending';

                          return (
                            <tr key={shop.id} className="hover:bg-slate-900/10 transition-colors duration-150">
                              <td className="py-4 px-6 text-center font-mono font-bold text-slate-500">
                                {index + 1}
                              </td>
                              
                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-white text-xs">{shop.name}</p>
                                    {/* Active heartbeat indicator */}
                                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                                      {formatLastActive(shop.lastActiveAt) === 'Online Now' && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                      )}
                                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                                        formatLastActive(shop.lastActiveAt) === 'Online Now' 
                                          ? 'bg-emerald-500' 
                                          : formatLastActive(shop.lastActiveAt).includes('m') || formatLastActive(shop.lastActiveAt).includes('h')
                                          ? 'bg-amber-500' 
                                          : 'bg-slate-600'
                                      }`} />
                                    </span>
                                    <span className="text-[9px] font-semibold text-slate-500">
                                      {formatLastActive(shop.lastActiveAt)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold">{shop.phone} · {shop.address}</p>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                {shop.owner ? (
                                  <div className="space-y-0.5">
                                    <p className="font-extrabold text-slate-300">{shop.owner.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{shop.owner.email}</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 font-semibold italic">No Owner Logged</span>
                                )}
                              </td>

                              <td className="py-4 px-6 font-mono text-[10.5px] text-slate-400">
                                {new Date(shop.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </td>

                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider select-none border ${
                                  isPending
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                                    : shop.isSuspended
                                    ? 'bg-red-500/15 text-red-400 border-red-500/25'
                                    : shop.isGracePeriod
                                    ? 'bg-orange-500/15 text-orange-400 border-orange-500/25'
                                    : shop.subscriptionStatus === 'trialing'
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                }`}>
                                  {isPending 
                                    ? 'Pending Approval' 
                                    : shop.isSuspended 
                                    ? 'Suspended' 
                                    : shop.isGracePeriod 
                                    ? `Grace Period (${shop.graceDaysLeft}d)` 
                                    : shop.subscriptionStatus === 'trialing'
                                    ? 'Trialing'
                                    : 'Paid'}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2.5">
                                  {isPending ? (
                                    <button
                                      onClick={() => {
                                        setSelectedApproveShopId(shop.id);
                                        setApprovePassword('');
                                        setApproveError('');
                                        setShowApproveModal(true);
                                      }}
                                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                    >
                                      <Check size={12} strokeWidth={3} />
                                      Approve Terminal
                                    </button>
                                  ) : (
                                    // Block/Unblock toggle switch and Manual Payment Logger
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => {
                                          setSelectedPaymentShopId(shop.id);
                                          setPaymentAmount('199');
                                          setPaymentMethod('upi');
                                          setPaymentRefId('');
                                          setPaymentNotes('');
                                          setPaymentPassword('');
                                          setPaymentError('');
                                          setShowPaymentModal(true);
                                        }}
                                        className="px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                        title="Log manual subscription payment"
                                      >
                                        <CreditCard size={11} />
                                        Log Pay
                                      </button>

                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-500 font-bold select-none">
                                          {isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isBlocked) {
                                              handleShopAction(shop.id, 'unblock');
                                            } else {
                                              setSelectedBlockShopId(shop.id);
                                              setBlockReasonOption('Subscription Payment Overdue');
                                              setCustomBlockReason('');
                                              setShowBlockReasonModal(true);
                                            }
                                          }}
                                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none flex items-center ${
                                            isBlocked ? 'bg-red-500 justify-end' : 'bg-slate-700 justify-start'
                                          }`}
                                        >
                                          <span className="w-4 h-4 rounded-full bg-white shadow-sm block transition-all" />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <button
                                    onClick={() => {
                                      setSelectedDeleteShopId(shop.id);
                                      setDeletePassword('');
                                      setDeleteError('');
                                      setShowDeleteModal(true);
                                    }}
                                    className="p-1.5 text-slate-550 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer"
                                    title="Delete shop installation"
                                  >
                                    <Trash2 size={13.5} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View full analytics link */}
              <div className="flex justify-end">
                <Link
                  href="/analytics"
                  className="flex items-center gap-2 text-[10.5px] font-black text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 hover:bg-indigo-500/10"
                >
                  <BarChart3 size={12} />
                  View Analytics & Revenue Projection
                </Link>
              </div>
            </div>

          ) : activeTab === 'broadcasts' ? (
            
            // ── TAB: SYSTEM NOTIFICATIONS & BROADCASTS ──
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
              
              {/* Send Broadcast Controller Form */}
              <div className="xl:col-span-5 space-y-4">
                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white">Create Broadcast Message</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">
                      Dispatch global system bulletins or direct billing payment alerts to specific active terminal installations.
                    </p>
                  </div>

                  {notifSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>{notifSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendNotification} className="space-y-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                        Target Installation Recipient
                      </label>
                      
                      {/* Searchable input selector */}
                      <div className="relative">
                        <input
                          type="text"
                          value={recipientSearch}
                          onFocus={() => setDropdownOpen(true)}
                          onChange={(e) => {
                            setRecipientSearch(e.target.value);
                            setDropdownOpen(true);
                          }}
                          placeholder="Search shop name, owner, or global..."
                          className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-slate-300 font-semibold focus:outline-none transition-all cursor-pointer"
                        />
                        <Search size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>

                      {/* Dropdown items popover panel */}
                      {dropdownOpen && (
                        <>
                          {/* Invisible clicking backdrop to close dropdown */}
                          <div 
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => {
                              const currentSelected = shops.find(s => s.id === targetShopId);
                              setRecipientSearch(currentSelected ? `${currentSelected.name} (${currentSelected.owner?.name})` : 'Global Broadcast (All Shops)');
                              setDropdownOpen(false);
                            }}
                          />
                          <div className="absolute top-[100%] left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
                            {/* Option: Global */}
                            <div
                              onClick={() => {
                                setTargetShopId('');
                                setRecipientSearch('Global Broadcast (All Shops)');
                                setDropdownOpen(false);
                              }}
                              className={`px-3.5 py-2.5 text-xs font-bold cursor-pointer transition-all hover:bg-indigo-500/20 hover:text-white flex items-center justify-between ${
                                targetShopId === '' ? 'bg-indigo-500/10 text-white font-extrabold' : 'text-slate-400'
                              }`}
                            >
                              <span>Global Broadcast (All Shops)</span>
                              {targetShopId === '' && <Check size={12} className="text-indigo-400" />}
                            </div>

                            {/* Option: Active shops */}
                            {shops
                              .filter((s) => s.owner && s.owner.status === 'active')
                              .filter((s) => {
                                const q = recipientSearch.toLowerCase().trim();
                                if (q === '' || q === 'global broadcast (all shops)') return true;
                                return (
                                  s.name.toLowerCase().includes(q) ||
                                  (s.owner && s.owner.name.toLowerCase().includes(q)) ||
                                  (s.owner && s.owner.email.toLowerCase().includes(q))
                                );
                              })
                              .map((s) => {
                                const isSelected = targetShopId === s.id;
                                return (
                                  <div
                                    key={s.id}
                                    onClick={() => {
                                      setTargetShopId(s.id);
                                      setRecipientSearch(`${s.name} (${s.owner?.name})`);
                                      setDropdownOpen(false);
                                    }}
                                    className={`px-3.5 py-2.5 text-xs font-bold cursor-pointer transition-all hover:bg-indigo-500/25 hover:text-white flex flex-col gap-0.5 ${
                                      isSelected ? 'bg-indigo-500/10 text-white font-extrabold' : 'text-slate-400'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-slate-200">{s.name}</span>
                                      {isSelected && <Check size={12} className="text-indigo-400 shrink-0" />}
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-semibold">{s.owner?.name} · {s.owner?.email}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                          Notice Alert Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'info', label: 'Info Memo', icon: Info, color: 'text-indigo-400 border-slate-800' },
                            { value: 'alert', label: 'System Alert', icon: AlertCircle, color: 'text-amber-400 border-slate-800' },
                            { value: 'payment', label: 'Billing Due', icon: CreditCard, color: 'text-red-400 border-slate-800' },
                          ].map((t) => {
                            const Icon = t.icon;
                            const isSelected = notifType === t.value;
                            return (
                              <div
                                key={t.value}
                                onClick={() => setNotifType(t.value as any)}
                                className={`flex flex-col items-center justify-center gap-1.5 py-3.5 border rounded-xl cursor-pointer transition-all duration-150 select-none ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-500/10 text-white font-extrabold'
                                    : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700'
                                }`}
                              >
                                <Icon size={14} className={isSelected ? '' : 'opacity-65'} />
                                <span className="text-[9.5px] font-bold text-center leading-none mt-0.5">{t.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                        Broadcast Title
                      </label>
                      <input
                        type="text"
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="e.g. Monthly Fee Pending, Maintenance Notice..."
                        className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-650 focus:outline-none transition-all font-semibold text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                        Bulletin / Alert Message Body
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        placeholder="Type detailed message here..."
                        className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-650 focus:outline-none transition-all font-semibold text-white leading-normal resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={dispatchLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-black tracking-wide shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {dispatchLoading ? 'Sending Alert...' : 'Dispatch Broadcast'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sent Broadcasts History Log */}
              <div className="xl:col-span-7 space-y-4">
                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
                  <div className="pb-3.5 border-b border-slate-800/60">
                    <h3 className="text-sm font-black text-white">Broadcast logs history</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">
                      Verify status of globally and directly dispatched notifications to POS cashier terminals.
                    </p>
                  </div>

                  <div className="flex-1 divide-y divide-slate-800/50 overflow-y-auto no-scrollbar max-h-[500px]">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center select-none text-slate-500 text-xs font-bold border-dashed">
                        No sent bulletins logged in database.
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isPay = n.type === 'payment';
                        const isAlert = n.type === 'alert';
                        const Icon = isPay ? CreditCard : isAlert ? AlertCircle : Info;
                        const labelBg = isPay ? 'bg-red-500/10 text-red-400 border border-red-500/20' : isAlert ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';

                        return (
                          <div key={n.id} className="py-4 hover:bg-slate-900/5 transition-colors flex gap-4 text-[11px] leading-relaxed">
                            <div className={`size-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border ${labelBg}`}>
                              <Icon size={14} />
                            </div>
                            <div className="space-y-1 flex-1 pr-2">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="font-extrabold text-white text-xs">{n.title}</span>
                                <span className={`px-2 py-0.25 rounded-md text-[8.5px] font-black uppercase tracking-wider select-none ${
                                  n.targetName === 'Global Broadcast'
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {n.targetName}
                                </span>
                              </div>
                              <p className="text-slate-400 font-semibold leading-normal">{n.message}</p>
                              <p className="text-[9.5px] text-slate-500 font-semibold mt-1 font-mono">
                                {new Date(n.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : activeTab === 'payments' ? (
            // ── TAB: SYSTEM PAYMENTS HISTORY ──
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-sm">
                <div className="pb-4 border-b border-slate-800/60 flex justify-between items-center select-none">
                  <div>
                    <h3 className="text-sm font-black text-white">System Payments History</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">
                      Verify and audit all manual subscription payments recorded for retail billing terminals.
                    </p>
                  </div>
                  <button 
                    onClick={fetchPayments} 
                    className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Refresh Logs
                  </button>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-955/20 select-none">
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4">Terminal Name</th>
                        <th className="py-3 px-4 w-28 text-center">Amount</th>
                        <th className="py-3 px-4 w-28 text-center">Date</th>
                        <th className="py-3 px-4">Billing Period Start / End</th>
                        <th className="py-3 px-4 w-32 font-bold text-center">Payment Method</th>
                        <th className="py-3 px-4">Reference ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/35 text-xs">
                      {paymentsLoading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 font-bold select-none border-none">
                            Loading transaction audits...
                          </td>
                        </tr>
                      ) : payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 font-bold select-none border-none">
                            No payment transactions logged in system.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p, index) => (
                          <tr key={p.id} className="hover:bg-slate-900/10">
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-550">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-extrabold text-white text-xs">{p.shop?.name || 'Unknown Store'}</p>
                              <p className="text-[9.5px] text-slate-500 font-semibold">{p.shop?.phone || ''}</p>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-400">
                              ₹{p.amount}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-[10.5px] text-slate-400">
                              {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                              {new Date(p.billingPeriodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              {' → '}
                              {new Date(p.billingPeriodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400">
                                {p.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10.5px] text-slate-300">
                              {p.referenceId || <span className="text-slate-655 italic">None</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // ── TAB: PAYMENT QR & CONTACT CONFIGURATION ──
            <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-5">
                <div>
                  <h3 className="text-sm font-black text-white">Payment Configuration Manager</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">
                    Update the UPI Payment QR Code and manual verification WhatsApp number displayed to locked or warning retailers.
                  </p>
                </div>

                {qrSuccessMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{qrSuccessMsg}</span>
                  </div>
                )}
                {qrErrorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{qrErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setQrLoading(true);
                  setQrSuccessMsg('');
                  setQrErrorMsg('');
                  try {
                    const res = await fetch('/api/shops', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'update-qr',
                        paymentQrCodeUrl: qrCodeUrlInput,
                        whatsappNumber: whatsappNumberInput
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setQrSuccessMsg(data.message);
                      setQrConfig({ paymentQrCodeUrl: qrCodeUrlInput, whatsappNumber: whatsappNumberInput });
                      setTimeout(() => setQrSuccessMsg(''), 5000);
                    } else {
                      setQrErrorMsg(data.error || 'Failed to update configurations.');
                    }
                  } catch (err) {
                    setQrErrorMsg('Network error. Please try again.');
                  } finally {
                    setQrLoading(false);
                  }
                }} className="space-y-4">
                  <div className="space-y-4 p-4.5 bg-slate-950 border border-slate-900 rounded-2xl">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                        Upload UPI QR Code Image
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrFileUpload}
                          disabled={uploadingQr}
                          className="hidden"
                          id="qr-image-upload"
                        />
                        <label
                          htmlFor="qr-image-upload"
                          className="flex-grow flex items-center justify-center gap-2 border border-dashed border-slate-800 hover:border-indigo-500 bg-slate-900 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer select-none"
                        >
                          {uploadingQr ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                              Uploading to Cloudinary...
                            </span>
                          ) : (
                            'Choose QR Image File...'
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-900"></div>
                      <span className="flex-shrink mx-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">Or</span>
                      <div className="flex-grow border-t border-slate-900"></div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                        Paste QR Code Image URL
                      </label>
                      <input
                        type="url"
                        required
                        value={qrCodeUrlInput}
                        onChange={(e) => setQrCodeUrlInput(e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-655 focus:outline-none transition-all font-semibold text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                      WhatsApp Contact Number
                    </label>
                    <input
                      type="text"
                      required
                      value={whatsappNumberInput}
                      onChange={(e) => setWhatsappNumberInput(e.target.value)}
                      placeholder="e.g. +91 96009 50190"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-655 focus:outline-none transition-all font-semibold text-white"
                    />
                  </div>

                  {/* QR code preview */}
                  {qrCodeUrlInput && (
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col items-center space-y-2.5 select-none">
                      <p className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block pl-0.5">Live Preview QR Code</p>
                      <img 
                        src={qrCodeUrlInput} 
                        alt="UPI QR Code Preview" 
                        className="size-40 object-contain rounded-lg border border-slate-800 bg-white p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dihkz12e6/image/upload/v1700000000/mock-qr.png';
                        }}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={qrLoading}
                    className="w-full bg-indigo-650 hover:bg-indigo-600 text-white flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-black tracking-wide shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {qrLoading ? 'Updating configurations...' : 'Save Configuration'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>


      {/* ── Block Reason Modal Overlay ── */}
      {showBlockReasonModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Red top bar accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-650" />

            <div className="p-7 space-y-5">
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="size-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20 shadow-sm">
                  <AlertCircle size={24} strokeWidth={2} />
                </div>
                <h3 className="text-base font-black text-white tracking-tight">Specify Suspension Reason</h3>
                <p className="text-[10.5px] text-slate-400 leading-normal font-semibold">
                  Select why this branch terminal is being suspended. This message will be clearly displayed on their login dashboard.
                </p>
              </div>

              {/* Radio buttons options list */}
              <div className="space-y-3">
                {[
                  'Subscription Payment Overdue',
                  'Violation of Terms of Service',
                  'Scheduled Maintenance Downtime',
                  'Other Reason (Write Custom Message)'
                ].map((option) => (
                  <label
                    key={option}
                    className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-800/40 select-none ${
                      blockReasonOption === option
                        ? 'border-red-500 bg-red-500/5 text-white font-extrabold shadow-sm'
                        : 'border-slate-800 bg-slate-950/20 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="blockReason"
                      value={option}
                      checked={blockReasonOption === option}
                      onChange={() => setBlockReasonOption(option)}
                      className="mt-0.5 text-red-500 border-slate-700 bg-slate-800 focus:ring-0 cursor-pointer shrink-0"
                    />
                    <span className="text-xs tracking-tight font-bold">{option}</span>
                  </label>
                ))}
              </div>

              {/* Custom Message Field (revealed on selection) */}
              {blockReasonOption === 'Other Reason (Write Custom Message)' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                  <label className="text-[9.5px] font-black text-slate-550 uppercase tracking-widest block pl-0.5">
                    Custom Suspension Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={customBlockReason}
                    onChange={(e) => setCustomBlockReason(e.target.value)}
                    placeholder="Type the exact reason for terminal suspension..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-xl px-3 py-2 text-xs placeholder:text-slate-600 focus:outline-none transition-all font-semibold text-white leading-normal resize-none"
                  />
                </div>
              )}

              {/* Security Authorization */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                  Security Authorization Password
                </label>
                <input
                  type="password"
                  required
                  value={blockPassword}
                  onChange={(e) => setBlockPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-650 focus:outline-none transition-all font-semibold text-white"
                />
                {blockError && (
                  <p className="text-[10px] font-bold text-red-400 pl-0.5 animate-pulse">{blockError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockReasonModal(false);
                    setBlockPassword('');
                    setBlockError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer select-none active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const finalReason = blockReasonOption === 'Other Reason (Write Custom Message)'
                      ? customBlockReason
                      : blockReasonOption;
                    
                    if (!finalReason.trim()) {
                      alert('Please provide a suspension reason.');
                      return;
                    }

                    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_AUTH_PASSWORD || 'nexurah123@';
                    if (blockPassword !== correctPassword) {
                      setBlockError('Invalid admin verification password.');
                      return;
                    }

                    setBlockError('');
                    setBlockPassword('');
                    setShowBlockReasonModal(false);
                    await handleShopAction(selectedBlockShopId, 'block', finalReason);
                  }}
                  className="flex-grow-[1.5] py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer select-none active:scale-98 flex items-center justify-center gap-1.5"
                >
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Deletion Confirmation Modal Overlay ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Red top bar accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700" />

            <div className="p-7 space-y-5">
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="size-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20 shadow-sm animate-pulse">
                  <Trash2 size={24} strokeWidth={2} />
                </div>
                <h3 className="text-base font-black text-white tracking-tight">Confirm Terminal Deletion</h3>
                <p className="text-[10.5px] text-slate-400 leading-normal font-semibold">
                  This will permanently delete this shop and all associated user profiles. This action is completely irreversible.
                </p>
              </div>

              {/* Warning box */}
              <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-3.5 text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-red-400">CRITICAL ACTION REQUIRED</span>
                <p className="text-[10px] font-bold text-slate-350 leading-relaxed mt-1">
                  Once deleted, all transaction history, invoices, and terminal settings will be wiped.
                </p>
              </div>

              {/* Security Authorization */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                  Admin Authorization Password
                </label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-650 focus:outline-none transition-all font-semibold text-white"
                />
                {deleteError && (
                  <p className="text-[10px] font-bold text-red-400 pl-0.5 animate-pulse">{deleteError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer select-none active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_AUTH_PASSWORD || 'nexurah123@';
                    if (deletePassword !== correctPassword) {
                      setDeleteError('Invalid admin verification password.');
                      return;
                    }
                    setShowDeleteModal(false);
                    await handleShopAction(selectedDeleteShopId, 'delete');
                  }}
                  className="flex-grow-[1.5] py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer select-none active:scale-98 flex items-center justify-center gap-1.5"
                >
                  Confirm & Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Approval Confirmation Modal Overlay ── */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Emerald top bar accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            <div className="p-7 space-y-5">
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-sm animate-pulse">
                  <CheckCircle2 size={24} strokeWidth={2} />
                </div>
                <h3 className="text-base font-black text-white tracking-tight">Approve Billing Terminal</h3>
                <p className="text-[10.5px] text-slate-400 leading-normal font-semibold">
                  This will authorize branch terminal access and automatically dispatch activation confirmation via WhatsApp.
                </p>
              </div>

              {/* Security Authorization */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                  Admin Authorization Password
                </label>
                <input
                  type="password"
                  required
                  value={approvePassword}
                  onChange={(e) => setApprovePassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-650 focus:outline-none transition-all font-semibold text-white"
                />
                {approveError && (
                  <p className="text-[10px] font-bold text-red-400 pl-0.5 animate-pulse">{approveError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setApprovePassword('');
                    setApproveError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer select-none active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_AUTH_PASSWORD || 'nexurah123@';
                    if (approvePassword !== correctPassword) {
                      setApproveError('Invalid admin verification password.');
                      return;
                    }
                    setShowApproveModal(false);
                    await handleShopAction(selectedApproveShopId, 'approve');
                  }}
                  className="flex-grow-[1.5] py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer select-none active:scale-98 flex items-center justify-center gap-1.5"
                >
                  Verify & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Rejection Confirmation Modal Overlay ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Orange top bar accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

            <div className="p-7 space-y-5">
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-sm animate-pulse">
                  <AlertCircle size={24} strokeWidth={2} />
                </div>
                <h3 className="text-base font-black text-white tracking-tight">Reject Registration</h3>
                <p className="text-[10.5px] text-slate-400 leading-normal font-semibold">
                  This will reject the registration request. The branch terminal will not be activated, and the user will see a rejected status notice upon logging in.
                </p>
              </div>

              {/* Security Authorization */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                  Admin Authorization Password
                </label>
                <input
                  type="password"
                  required
                  value={rejectPassword}
                  onChange={(e) => setRejectPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-650 focus:outline-none transition-all font-semibold text-white"
                />
                {rejectError && (
                  <p className="text-[10px] font-bold text-red-400 pl-0.5 animate-pulse">{rejectError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectPassword('');
                    setRejectError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer select-none active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_AUTH_PASSWORD || 'nexurah123@';
                    if (rejectPassword !== correctPassword) {
                      setRejectError('Invalid admin verification password.');
                      return;
                    }
                    setShowRejectModal(false);
                    await handleShopAction(selectedRejectShopId, 'reject');
                  }}
                  className="flex-grow-[1.5] py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer select-none active:scale-98 flex items-center justify-center gap-1.5"
                >
                  Confirm & Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Record manual subscription payment modal overlay ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Emerald top bar accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-655" />

            <div className="p-7 space-y-5 select-text">
              {/* Header */}
              <div className="text-center space-y-1.5 select-none">
                <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-sm animate-pulse">
                  <CreditCard size={24} strokeWidth={2} />
                </div>
                <h3 className="text-base font-black text-white tracking-tight">Record Manual Payment</h3>
                <p className="text-[10.5px] text-slate-400 leading-normal font-semibold">
                  Manually record a renewal transaction for this billing terminal. This will automatically extend their subscription by 30 days and unlock terminal POS access.
                </p>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                    Renew Amount (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-350"
                  >
                    <option value="upi">UPI Transfer</option>
                    <option value="cash">Cash Payment</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card Swipe</option>
                    <option value="manual">Other Manual</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                    Transaction Ref ID (UPI ID / Ref)
                  </label>
                  <input
                    type="text"
                    value={paymentRefId}
                    onChange={(e) => setPaymentRefId(e.target.value)}
                    placeholder="e.g. txn_987654321..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                    Administrative Notes
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Verified transaction on WhatsApp screenshot..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white"
                  />
                </div>
              </div>

              {/* Security Authorization */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-left select-none">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                  Admin Authorization Password
                </label>
                <input
                  type="password"
                  required
                  value={paymentPassword}
                  onChange={(e) => setPaymentPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-555/10 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-650 focus:outline-none transition-all font-semibold text-white"
                />
                {paymentError && (
                  <p className="text-[10px] font-bold text-red-400 pl-0.5 animate-pulse mt-1">{paymentError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentPassword('');
                    setPaymentError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer select-none active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={paymentLoading}
                  onClick={async () => {
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
                        fetchDashboardData();
                        fetchPayments();
                      } else {
                        setPaymentError(data.error || 'Failed to record payment.');
                      }
                    } catch (err) {
                      setPaymentError('Network error. Please try again.');
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                  className="flex-grow-[1.5] py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer select-none active:scale-98 flex items-center justify-center gap-1.5"
                >
                  {paymentLoading ? 'Logging...' : 'Confirm & Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function formatLastActive(lastActiveAt: any) {
  if (!lastActiveAt) return 'Inactive';
  const lastActiveDate = new Date(lastActiveAt);
  const now = new Date();
  const diffTime = now.getTime() - lastActiveDate.getTime();
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 65));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 5) {
    return 'Online Now';
  } else if (diffMinutes < 60) {
    return `Active ${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `Active ${diffHours}h ago`;
  } else {
    return `Active ${diffDays}d ago`;
  }
}
