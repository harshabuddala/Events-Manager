'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import {
  GraduationCap, ArrowRight, Mail, Lock, Eye, EyeOff,
  QrCode, ScanLine, ArrowLeft, CheckCircle2, AlertCircle,
  Camera, CameraOff, RefreshCw
} from 'lucide-react';

const SCANNER_ELEMENT_ID = 'login-qr-reader';

type ScanState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'form' | 'scan'>('form');

  // Form login state
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // QR scan state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Request camera permission explicitly (this triggers the browser dialog)
  const requestCameraPermission = useCallback(async () => {
    setScanState('requesting');
    setScanError('');

    try {
      // This is the KEY call that triggers the browser permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Permission granted! Stop this temporary stream
      stream.getTracks().forEach(track => track.stop());

      // Now we can enumerate cameras (they'll have labels now that permission is granted)
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
        setScanState('granted');
      } else {
        setScanState('error');
        setScanError('No cameras found on this device.');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScanState('denied');
      } else if (err.name === 'NotFoundError') {
        setScanState('error');
        setScanError('No camera found on this device.');
      } else {
        setScanState('error');
        setScanError('Could not access camera. Please check your device settings.');
      }
    }
  }, []);

  // Start the actual QR scanner once we have permission and a camera selected
  useEffect(() => {
    if (mode !== 'scan' || scanState !== 'granted' || !selectedCamera || scanSuccess) return;

    let cancelled = false;

    const startScanner = async () => {
      // Wait for DOM element to render
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;

      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          selectedCamera,
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          async (decodedText) => {
            if (scannerRef.current) {
              try { await scannerRef.current.stop(); } catch {}
              scannerRef.current = null;
            }
            
            let finalToken = decodedText.trim();
            try {
              if (finalToken.includes('token=')) {
                const url = new URL(finalToken);
                const t = url.searchParams.get('token');
                if (t) finalToken = t;
              }
            } catch (e) {}
            
            await handleQrLogin(finalToken);
          },
          () => {} // ignore scan errors (no QR in frame)
        );
      } catch (err: any) {
        if (!cancelled) {
          setScanState('error');
          setScanError('Could not start camera. Please try again.');
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        scannerRef.current = null;
      }
    };
  }, [mode, scanState, selectedCamera, scanSuccess]);

  useEffect(() => {
    fetch('/api/auth/clear-session', { method: 'POST', cache: 'no-store' }).catch(() => {})
    
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setMode('scan');
      setScanState('requesting');
      handleQrLogin(token).finally(() => {
         window.history.replaceState({}, '', '/');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQrLogin = async (token: string) => {
    try {
      // Clear any existing session first
      await fetch('/api/auth/clear-session', { method: 'POST', cache: 'no-store' }).catch(() => {});

      // Validate the QR token
      const validateRes = await fetch(`/api/auth/qr-login?token=${encodeURIComponent(token)}`, {
        cache: 'no-store'
      });
      if (!validateRes.ok) {
        setScanState('error');
        setScanError('Invalid or expired QR code. Please ask admin to generate a new one.');
        return;
      }

      // Consume the QR token to login
      const loginRes = await fetch('/api/auth/qr-login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        cache: 'no-store',
      });

      if (!loginRes.ok) {
        const errorData = await loginRes.json().catch(() => ({}));
        setScanState('error');
        setScanError(errorData.error || 'QR login failed. Please try again or use email/password.');
        return;
      }

      const loginData = await loginRes.json();
      if (!loginData.success) {
        setScanState('error');
        setScanError('QR login failed. Please try again.');
        return;
      }

      setScanSuccess(true);

      // Use the auto-login token for a reliable server-side redirect.
      // The server validates and sets the session cookie securely.
      const altToken = loginData.autoLoginToken;
      if (altToken) {
        setTimeout(() => {
          window.location.replace(`/auto-login?token=${encodeURIComponent(altToken)}`);
        }, 300);
      } else {
        // Fallback: direct dashboard redirect
        setTimeout(() => {
          window.location.replace('/dashboard');
        }, 300);
      }
    } catch {
      setScanState('error');
      setScanError('Network error. Please check your connection and try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      });

      if (response.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
        return;
      }

      if (response.status === 429) {
        setError('Too many login attempts. Please wait a few minutes before trying again.');
        return;
      }

      if (response.status >= 500) {
        setError('Server error. Our team has been notified. Please try again in a moment.');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      window.location.replace('/dashboard');
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanner = () => {
    setMode('form');
    setScanState('idle');
    setScanError('');
    setScanSuccess(false);
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col md:flex-row font-sans selection:bg-violet-200">
      
      {/* Left side - Branding */}
      <div className="hidden md:flex flex-col flex-1 bg-gradient-to-br from-[#0A0F2D] to-[#121B45] text-white p-12 lg:p-20 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[80px]" />
        
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
              &copy; {new Date().getFullYear()} Edunura Platform
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-12 lg:p-20 relative bg-white md:bg-transparent md:border-l border-slate-200">
        
        {/* Mobile Header */}
        <div className="md:hidden flex flex-col items-center mb-8 w-full">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edunura</h1>
        </div>

        <div className="w-full max-w-[420px] bg-white md:bg-transparent rounded-2xl md:rounded-none p-6 sm:p-8 md:p-0 border border-slate-100 md:border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:shadow-none">
          
          {mode === 'form' ? (
            <>
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-sm font-medium text-slate-500 mt-2">
                  Sign in to your account to manage events or access your volunteer portal.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      id="email"
                      type="email" 
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                      placeholder="you@example.com" 
                      className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800"
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
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      id="password"
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                      placeholder="••••••••" 
                      className="w-full pl-10 pr-12 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800 font-mono"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 p-2 rounded-lg transition-all"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-800/70 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1 items-center">
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                      </div>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* QR Login Button */}
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <button
                  onClick={() => setMode('scan')}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                >
                  <QrCode className="w-4 h-4 text-violet-600" />
                  Scan QR Code to Login
                </button>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Ask an admin to generate a login QR from their dashboard
                </p>
              </div>
            </>
          ) : (
            /* QR Scan Mode */
            <>
              <div className="mb-4">
                <button
                  onClick={stopScanner}
                  className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to email login
                </button>
              </div>

              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">Scan Login QR</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Point your camera at the QR code shown on the admin&apos;s device
                </p>
              </div>

              {/* Scanner Container */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900" style={{ minHeight: '280px' }}>
                
                {/* Hidden scanner element - always rendered but may be 0 height */}
                <div id={SCANNER_ELEMENT_ID} style={{
                  width: '100%',
                  minHeight: scanState === 'granted' ? '280px' : '0px',
                  maxHeight: scanState === 'granted' ? '420px' : '0px',
                  opacity: scanState === 'granted' ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  overflow: 'hidden',
                }} />

                {/* Permission Request State */}
                {scanState === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                    <Camera className="w-12 h-12 text-violet-500 mb-4" />
                    <p className="text-base font-bold text-slate-800 mb-2">Camera Access Required</p>
                    <p className="text-sm text-slate-500 text-center mb-4">
                      We need your permission to use the camera for scanning QR codes.
                    </p>
                    <button
                      onClick={requestCameraPermission}
                      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      <Camera className="w-4 h-4" />
                      Allow Camera Access
                    </button>
                  </div>
                )}

                {/* Requesting State */}
                {scanState === 'requesting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-violet-200 rounded-2xl">
                    <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm font-medium text-slate-600">Requesting camera permission...</p>
                    <p className="text-xs text-slate-400 mt-2">Check your browser prompt</p>
                  </div>
                )}

                {/* Permission Denied State */}
                {scanState === 'denied' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50 border-2 border-dashed border-rose-200 rounded-2xl p-6">
                    <CameraOff className="w-12 h-12 text-rose-400 mb-3" />
                    <p className="text-base font-bold text-rose-700 mb-2">Camera Access Denied</p>
                    <p className="text-sm text-rose-600 text-center mb-4">
                      Please allow camera access in your browser settings to scan QR codes.
                    </p>
                    <div className="text-xs text-rose-500 bg-rose-100/50 rounded-lg p-3 mb-4 w-full">
                      <p className="font-semibold mb-1">How to enable:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Tap the lock icon in your browser address bar</li>
                        <li>Select &quot;Allow&quot; for camera permissions</li>
                        <li>Refresh the page and try again</li>
                      </ul>
                    </div>
                    <button
                      onClick={requestCameraPermission}
                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                )}

                {/* Error State */}
                {scanState === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                    <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                    <p className="text-base font-bold text-slate-800 mb-2">Camera Error</p>
                    <p className="text-sm text-slate-500 text-center mb-4">{scanError || 'Could not access camera.'}</p>
                    <button
                      onClick={requestCameraPermission}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                )}

                {/* Scanning Active Overlay */}
                {scanState === 'granted' && !scanSuccess && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-violet-400 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-violet-400 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-violet-400 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-violet-400 rounded-br-xl" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-xl text-xs">
                      Align QR code within the frame
                    </div>
                  </div>
                )}

                {/* Success State */}
                {scanSuccess && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50 rounded-2xl gap-3 p-4">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600 mb-1" />
                    <p className="text-base font-bold text-emerald-800">Login successful!</p>
                    <p className="text-sm text-emerald-600">Redirecting to dashboard...</p>
                    <button
                      onClick={() => window.location.replace('/dashboard')}
                      className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </div>

              {/* Camera selector (if multiple cameras) */}
              {scanState === 'granted' && cameras.length > 1 && !scanSuccess && (
                <div className="mt-3">
                  <select
                    value={selectedCamera}
                    onChange={(e) => {
                      setSelectedCamera(e.target.value);
                      // Restart scanner with new camera
                      if (scannerRef.current) {
                        scannerRef.current.stop().then(() => {
                          scannerRef.current = null;
                          setScanState('granted');
                        }).catch(() => {});
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {cameras.map(c => (
                      <option key={c.id} value={c.id}>{c.label || c.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
