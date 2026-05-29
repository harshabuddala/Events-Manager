'use client';

import React, { useState, useEffect } from 'react';
import { X, QrCode, RefreshCw, Clock, CheckCircle2, Smartphone, Copy, Check } from 'lucide-react';
import QRCodeSVG from 'qrcode';

interface QrLoginGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetUserType?: 'user' | 'volunteer';
  targetUserName?: string;
}

export default function QrLoginGenerator({ isOpen, onClose, targetUserId, targetUserType, targetUserName }: QrLoginGeneratorProps) {
  const [token, setToken] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const body = targetUserId && targetUserType ? JSON.stringify({ targetUserId, targetUserType }) : undefined;
      const res = await fetch('/api/auth/qr-login', { 
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body 
      });
      if (!res.ok) throw new Error('Failed to generate token');
      const data = await res.json();
      setToken(data.token);
      setTimeLeft(300);

      // Generate QR code data URL
      const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?token=${data.token}`;
      const dataUrl = await QRCodeSVG.toDataURL(loginUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
    } catch {
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate on open
  useEffect(() => {
    if (isOpen) {
      generateToken();
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !token) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, token]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {targetUserName ? `Mobile Login for ${targetUserName}` : 'Mobile Login'}
              </h2>
              <p className="text-xs text-slate-500">
                {targetUserName ? 'Scan this code to log them in automatically' : 'Let someone log in on another device'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-violet-600 mb-3" />
              <p className="text-sm text-slate-500">Generating QR code...</p>
            </div>
          ) : qrDataUrl ? (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className={`p-3 bg-white border-2 rounded-2xl ${timeLeft > 0 ? 'border-violet-200' : 'border-slate-200 opacity-50'}`}>
                  <img src={qrDataUrl} alt="Login QR Code" className="w-56 h-56" />
                </div>
                
                {/* Timer */}
                <div className={`flex items-center gap-1.5 mt-3 text-xs font-bold ${timeLeft > 0 ? 'text-violet-600' : 'text-rose-500'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {timeLeft > 0 ? (
                    <span>Expires in {formatTime(timeLeft)}</span>
                  ) : (
                    <span>Expired — generate a new one</span>
                  )}
                </div>
              </div>

              {/* Token (for manual entry if QR fails) */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Or enter token manually</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 truncate">
                    {token}
                  </code>
                  <button
                    onClick={copyToken}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                    title="Copy token"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              {/* Regenerate */}
              <button
                onClick={generateToken}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate New QR Code
              </button>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-xs text-blue-800 font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  {targetUserName 
                    ? `Ask ${targetUserName} to scan this QR code with their camera app to log in immediately.` 
                    : `Ask the user to open the login page on their device, tap "Scan QR Code to Login", and scan this code.`}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
