'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, User, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('A network exception occurred. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden select-none">
      
      {/* Decorative Neon Blurs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="NexBill Logo" className="h-12 w-auto object-contain select-none" />
        </div>
        <h2 className="text-center text-xl font-black text-white tracking-tight leading-none">
          Nex<span className="text-indigo-500 font-black">Bill</span> Super Admin
        </h2>
        <p className="mt-2.5 text-center text-[10px] text-slate-500 font-black tracking-wider uppercase flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500 animate-pulse" />
          Secure Terminal Controller
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl space-y-6">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircleIcon size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                Username Credentials
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl pl-10 pr-4 py-3 text-xs placeholder:text-slate-500 focus:outline-none transition-all font-semibold text-white"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-0.5">
                Secret Access Token
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl pl-10 pr-10 py-3 text-xs placeholder:text-slate-500 focus:outline-none transition-all font-semibold text-white"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-black tracking-wide shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating Session...' : 'Verify & Log In'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

// Simple internal icon to prevent import crashes
function AlertCircleIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
