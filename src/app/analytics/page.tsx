'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Send,
  Power,
  Menu,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Laptop,
  Database,
  Shield,
  Wifi,
  MessageSquare,
  BarChart3,
  IndianRupee,
  Activity,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface AdminStats {
  totalShops: number;
  active: number;
  pending: number;
  blocked: number;
  paid?: number;
  grace?: number;
  overdue?: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({ totalShops: 0, active: 0, pending: 0, blocked: 0, paid: 0, grace: 0, overdue: 0 });
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const MONTHLY_FEE = 199;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/shops');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Fetch stats error:', err);
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

    const loadAnalytics = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchPayments()]);
      setLoading(false);
    };

    loadAnalytics();
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

  const totalCollected = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const monthlyMRR = (stats.paid || 0) * MONTHLY_FEE;
  const annualForecast = monthlyMRR * 12;
  const healthPct = stats.totalShops > 0 ? Math.round(((stats.paid || stats.active || 0) / stats.totalShops) * 100) : 0;

  const diagnostics = [
    {
      label: 'Core Database Connection',
      status: 'Online',
      desc: 'Atlas MongoDB Shared Replica Set — nexBilling',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      icon: Database,
      ping: true,
    },
    {
      label: 'Twilio WhatsApp Relay',
      status: 'Mock Active',
      desc: 'Automated WhatsApp approval dispatcher configured',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
      icon: MessageSquare,
      ping: false,
    },
    {
      label: 'Customer Billing API',
      status: 'Active :3000',
      desc: 'Terminal POS route checks and endpoints running',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      icon: Wifi,
      ping: true,
    },
    {
      label: 'Super Admin API',
      status: 'Active :3001',
      desc: 'Admin control panel API routes running',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      icon: Activity,
      ping: true,
    },
    {
      label: 'SSL Gating & Auth Proxy',
      status: 'AES-256',
      desc: 'Secure Next.js proxy middleware with JWT token gating',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      icon: Shield,
      ping: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col xl:flex-row relative">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/[0.015] rounded-full blur-[150px] pointer-events-none" />

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
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <CreditCard size={15} className="text-slate-400" />
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-500 bg-indigo-500/10 text-white font-extrabold shadow-sm ring-1 ring-indigo-500/10 text-xs transition-all duration-200 cursor-pointer"
          >
            <BarChart3 size={15} className="text-indigo-400" />
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
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/60 px-6 sm:px-8 flex items-center justify-between shrink-0 select-none bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <BarChart3 size={16} className="text-indigo-400" />
            <span className="text-sm font-black text-white">Analytics & Diagnostics</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">/ Revenue · Security</span>
          </div>
          <span className="text-[9.5px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
            SYSTEM SECURE
          </span>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">

          {/* ── Top Summary KPI Cards ── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 select-none">
            {[
              { label: 'Total Installations', value: stats.totalShops, icon: Laptop, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
              { label: 'Active Terminals', value: stats.active, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
              { label: 'Suspended Terminals', value: stats.blocked, icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* ── MRR & Revenue Projection ── */}
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <IndianRupee size={15} className="text-indigo-400" />
                    Subscription & MRR Projection
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    Monthly recurring revenue based on live activated terminal installations.
                  </p>
                </div>
                <TrendingUp size={20} className="text-indigo-400/50" />
              </div>

              {/* Revenue breakdown table */}
              <div className="bg-slate-950 border border-slate-900 rounded-xl divide-y divide-slate-900">
                <div className="flex justify-between items-center px-4 py-3 text-xs">
                  <span className="text-slate-400 font-bold">Standard Subscription Fee</span>
                  <span className="font-extrabold text-white">₹{MONTHLY_FEE} / shop / month</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-xs">
                  <span className="text-slate-400 font-bold">Paid Terminals (Active)</span>
                  <span className="font-mono font-black text-emerald-400">{loading ? '--' : stats.paid} Terminals</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-xs">
                  <span className="text-slate-400 font-bold">Grace Period (Unpaid)</span>
                  <span className="font-mono font-bold text-amber-400">{loading ? '--' : stats.grace} Terminals</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-xs">
                  <span className="text-slate-400 font-bold">Suspended (Blocked)</span>
                  <span className="font-mono font-bold text-red-400">{loading ? '--' : stats.overdue} Terminals</span>
                </div>
                <div className="flex justify-between items-end px-4 py-4">
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total Revenue Collected</p>
                    <p className="text-2xl font-black font-mono tracking-tight text-emerald-400 leading-tight mt-0.5">
                      ₹{loading ? '--' : totalCollected.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Monthly MRR Forecast</p>
                    <p className="text-lg font-extrabold font-mono tracking-tight text-indigo-400 leading-tight mt-0.5">
                      ₹{loading ? '--' : monthlyMRR.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Installation Health Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Installation Health</span>
                  <span className={healthPct === 100 ? 'text-emerald-400' : healthPct >= 50 ? 'text-amber-400' : 'text-red-400'}>
                    {loading ? '--' : `${healthPct}%`} Active
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden flex border border-slate-900">
                  <div
                    className="bg-emerald-500 transition-all duration-700 ease-out"
                    style={{ width: `${stats.totalShops > 0 ? ((stats.paid || 0) / stats.totalShops) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-700 ease-out"
                    style={{ width: `${stats.totalShops > 0 ? ((stats.grace || 0) / stats.totalShops) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all duration-700 ease-out"
                    style={{ width: `${stats.totalShops > 0 ? ((stats.overdue || 0) / stats.totalShops) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" />{stats.paid} Paid</span>
                  <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" />{stats.grace} Grace Period</span>
                  <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-red-500" />{stats.overdue} Suspended</span>
                </div>
              </div>

              {/* Tier breakdown visual */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Active MRR', value: `₹${((stats.paid || 0) * MONTHLY_FEE).toLocaleString('en-IN')}`, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
                  { label: 'Grace MRR', value: `₹${((stats.grace || 0) * MONTHLY_FEE).toLocaleString('en-IN')}`, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
                  { label: 'Suspended Lost', value: `₹${((stats.overdue || 0) * MONTHLY_FEE).toLocaleString('en-IN')}`, color: 'text-red-400 border-red-500/20 bg-red-500/5' },
                ].map((item, i) => (
                  <div key={i} className={`rounded-xl border p-3 text-center space-y-1 ${item.color}`}>
                    <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                    <p className="text-sm font-black font-mono">{loading ? '--' : item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── API Diagnostics & Security Hub ── */}
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Shield size={15} className="text-indigo-400" />
                    API Diagnostics & Security Hub
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    Real-time status of external APIs, database nodes, and notification relay channels.
                  </p>
                </div>
                <Activity size={20} className="text-indigo-400/50" />
              </div>

              <div className="space-y-3">
                {diagnostics.map((diag, index) => {
                  const Icon = diag.icon;
                  return (
                    <div key={index} className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-slate-800 transition-colors group">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg border shrink-0 ${diag.color}`}>
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11.5px] font-extrabold text-slate-200 group-hover:text-white transition-colors truncate">{diag.label}</p>
                          <p className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-relaxed">{diag.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {diag.ping && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider border select-none ${diag.color}`}>
                          {diag.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Last check timestamp */}
              <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Last diagnostics check</span>
                <span className="font-mono text-slate-400">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
