'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col md:flex-row font-sans selection:bg-violet-200">
      
      {/* Left side - Branding Context */}
      <div className="hidden md:flex flex-col flex-1 bg-gradient-to-br from-[#0A0F2D] to-[#121B45] text-white p-12 lg:p-20 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Edunura</h1>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase mt-2 ml-1">Learn Today, Lead Tomorrow</p>
          </div>

          <div className="mt-auto mb-auto max-w-lg">
            <h2 className="text-4xl lg:text-5xl font-bold leading-[1.1] mb-6">
              Event & Community Management <span className="text-violet-400">Simplified.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Streamline stall participation, track volunteer performance, and generate comprehensive report cards in real time.
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-8">
            <div className="text-sm font-semibold text-slate-400">
              © {new Date().getFullYear()} Edunura Platform
            </div>
            <div className="flex gap-4 text-sm font-semibold text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-20 relative bg-white md:bg-transparent md:border-l border-slate-200">
        
        {/* Mobile Header (Shows only on small screens) */}
        <div className="md:hidden flex flex-col items-center mb-10 w-full">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edunura</h1>
        </div>

        <div className="w-full max-w-[420px] bg-white md:bg-transparent rounded-2xl md:rounded-none p-8 md:p-0 border border-slate-100 md:border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:shadow-none">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Sign in to your account to manage your events.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@edunura.com" 
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700" htmlFor="password">Password</label>
                <a href="#" className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800 font-mono"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 pb-3">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20 accent-violet-600"
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-800/70 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-slate-500">
              Don't have an account? {' '}
              <a href="#" className="font-bold text-violet-600 hover:text-violet-700 transition-colors">
                Contact your administrator
              </a>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
