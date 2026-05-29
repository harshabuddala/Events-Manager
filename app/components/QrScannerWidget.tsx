'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  ScanLine, Camera, RefreshCw, CheckCircle2,
  AlertCircle, ArrowRight, GraduationCap, Zap,
} from 'lucide-react';

interface Props {
  /** 'violet' = admin/purple theme, 'emerald' = volunteer/green theme */
  theme?: 'violet' | 'emerald';
  /** Where "Scan Next QR Code" returns — used for localStorage key uniqueness */
  storageKey?: string;
}

const SCANNER_ELEMENT_ID = 'shared-qr-reader';

export default function QrScannerWidget({ theme = 'violet', storageKey = 'edunura_recent_scans' }: Props) {
  const router = useRouter();

  const t = theme === 'emerald'
    ? {
        primary: 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300',
        startBtn: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
        ring: 'focus:ring-emerald-500/20 focus:border-emerald-500',
        selectRing: 'focus:ring-emerald-500/20 focus:border-emerald-500',
        border: 'border-emerald-400',
        scanLine: 'bg-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
        corners: 'border-emerald-400',
        recentDot: 'bg-emerald-100 text-emerald-700',
      }
    : {
        primary: 'bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300',
        startBtn: 'bg-violet-50 text-violet-600 border border-violet-200',
        ring: 'focus:ring-violet-500/20 focus:border-violet-500',
        selectRing: 'focus:ring-violet-500/20 focus:border-violet-500',
        border: 'border-violet-400',
        scanLine: 'bg-violet-400/50 shadow-[0_0_10px_rgba(139,92,246,0.5)]',
        corners: 'border-violet-400',
        recentDot: 'bg-violet-100 text-violet-700',
      };

  const [autoStart, setAutoStart] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [error, setError] = useState('');
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerStartedRef = useRef(false);

  // Read ?autostart=true from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAutoStart(window.location.search.includes('autostart=true'));
    }
  }, []);

  // Enumerate cameras + load recent scans
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const back = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCamera(back?.id || devices[0].id);
        } else {
          setError('No cameras found on this device.');
        }
      })
      .catch(() => setError('Unable to access cameras. Please check permissions.'));

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setRecentScans(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [storageKey]);

  // Auto-start when ?autostart=true
  useEffect(() => {
    if (autoStart && selectedCamera && !isScanning && !scannerStartedRef.current) {
      setIsScanning(true);
    }
  }, [autoStart, selectedCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveRecentScan = useCallback((code: string) => {
    setRecentScans((prev) => {
      const updated = [code, ...prev.filter((c) => c !== code)].slice(0, 10);
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [storageKey]);

  const navigateToScan = useCallback((code: string) => {
    saveRecentScan(code);
    router.push(`/scan/${encodeURIComponent(code)}`);
  }, [router, saveRecentScan]);

  const handleScanSuccess = useCallback((decodedText: string) => {
    let code = decodedText.trim();
    if (!code) return;

    try {
      if (code.includes('/')) {
        const url = new URL(code);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length > 0) code = parts[parts.length - 1];
      }
    } catch { /* use as-is */ }

    if (!code) { setError('Invalid QR code format. Please try again.'); return; }

    if (scannerRef.current && scannerStartedRef.current) {
      scannerStartedRef.current = false;
      scannerRef.current.stop()
        .finally(() => {
          scannerRef.current = null;
          setIsScanning(false);
          navigateToScan(code);
        });
    } else {
      setIsScanning(false);
      navigateToScan(code);
    }
  }, [navigateToScan]);

  // Start / stop scanner
  useEffect(() => {
    if (!isScanning) {
      if (scannerRef.current && scannerStartedRef.current) {
        scannerStartedRef.current = false;
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }
    if (!selectedCamera) { setIsScanning(false); return; }

    setCameraLoading(true);
    setError('');
    setPermissionDenied(false);
    let cancelled = false;

    const startAfterRender = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;

      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
        scannerRef.current = scanner;
        await scanner.start(
          selectedCamera,
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, disableFlip: false },
          handleScanSuccess,
          () => {}
        );
        scannerStartedRef.current = true;
      } catch (err: any) {
        if (!cancelled) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionDenied(true);
            setError('Camera access denied. Please enable camera permissions in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'NotReadableError') {
            setError('Camera is in use by another application or not available.');
          } else {
            setError('Could not start camera. Please try again or refresh the page.');
          }
          setIsScanning(false);
        }
      } finally {
        if (!cancelled) setCameraLoading(false);
      }
    };

    startAfterRender();

    return () => {
      cancelled = true;
      if (scannerRef.current && scannerStartedRef.current) {
        scannerStartedRef.current = false;
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isScanning, selectedCamera, handleScanSuccess]);

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanResult.trim();
    if (!code) return;
    navigateToScan(code);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Scanner card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Scan QR Code</h3>
              <p className="text-xs text-slate-500 mt-0.5">Point camera at student&apos;s QR code</p>
            </div>
            <button
              onClick={() => setIsScanning((v) => !v)}
              disabled={cameraLoading}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors active:scale-95 ${
                isScanning ? 'bg-rose-50 text-rose-600 border border-rose-200' : t.startBtn
              }`}
            >
              {cameraLoading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Starting...</>
                : isScanning
                  ? <><Camera className="w-4 h-4" /> Stop Camera</>
                  : <><Camera className="w-4 h-4" /> Start Camera</>}
            </button>
          </div>

          {cameras.length > 1 && !isScanning && (
            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Select Camera
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className={`w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${t.selectRing}`}
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id.slice(0, 8)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner container — always in DOM */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900" style={{ minHeight: '200px' }}>
            <div
              id={SCANNER_ELEMENT_ID}
              style={{
                width: '100%',
                minHeight: isScanning ? '280px' : '0px',
                maxHeight: isScanning ? '420px' : '0px',
                opacity: isScanning ? 1 : 0,
                transition: 'opacity 0.3s ease, min-height 0.3s ease, max-height 0.3s ease',
                overflow: 'hidden',
              }}
            />

            {!isScanning && !cameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                <ScanLine className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Camera preview area</p>
                <p className="text-xs text-slate-400 mt-1">Click &quot;Start Camera&quot; to begin scanning</p>
                {permissionDenied && (
                  <div className="mt-4 mx-4 text-center">
                    <p className="text-xs text-rose-500 font-medium mb-2">Camera permission was denied</p>
                    <p className="text-[10px] text-slate-400">
                      Go to your browser settings and allow camera access for this site.
                    </p>
                  </div>
                )}
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 sm:w-64 sm:h-64">
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 ${t.corners} rounded-tl-xl`} />
                  <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 ${t.corners} rounded-tr-xl`} />
                  <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 ${t.corners} rounded-bl-xl`} />
                  <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 ${t.corners} rounded-br-xl`} />
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${t.scanLine} animate-[scan_2s_ease-in-out_infinite]`} />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-xl text-xs backdrop-blur-sm">
                  Align QR code within the frame
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual input */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or enter manually</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <form onSubmit={handleManualInput}>
            <div className="relative mb-3 sm:mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ScanLine className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={scanResult}
                onChange={(e) => { setScanResult(e.target.value); if (error) setError(''); }}
                placeholder="Enter registration code (e.g., REG-8451)"
                className={`block w-full pl-11 pr-4 py-3.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${t.ring} placeholder:text-slate-400`}
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm mb-3 sm:mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <button
              type="submit"
              disabled={!scanResult.trim()}
              className={`w-full flex items-center justify-center gap-2 ${t.primary} text-white py-3.5 sm:py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed active:scale-[0.98]`}
            >
              <CheckCircle2 className="w-4 h-4" />Look Up Student
            </button>
          </form>
        </div>
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">Recent Scans</h3>
          <div className="space-y-2 sm:space-y-3">
            {recentScans.map((code, index) => (
              <button
                key={`${code}-${index}`}
                onClick={() => router.push(`/scan/${encodeURIComponent(code)}`)}
                className="w-full flex items-center gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left active:scale-[0.99]"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${t.recentDot} flex items-center justify-center text-xs font-bold shrink-0`}>
                  {code.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 font-mono truncate">{code}</p>
                  <p className="text-xs text-slate-500">Tap to view student</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 sm:p-5">
        <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />Scanning Tips
        </h4>
        <ul className="space-y-2 text-xs sm:text-sm text-blue-800">
          <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />Ensure good lighting for better QR code recognition</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />Hold the device steady and align QR code within frame</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />Use manual entry for students with damaged QR codes</li>
          <li className="flex items-start gap-2"><GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0" />The code is printed on the student&apos;s registration pass</li>
        </ul>
      </div>
    </div>
  );
}
