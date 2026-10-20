import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  FolderOpen,
  Download,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  RefreshCw,
  Eye,
  FileText,
} from 'lucide-react';
import {
  apiFetch,
  getStoredDeviceToken,
  storeDeviceToken,
} from '../api';
import { PdfViewer } from '../components/PdfViewer';

const triggerCelebration = () => {
  try {
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.left = `${Math.random() * 100}vw`;
      el.style.top = '-10px';
      el.style.width = '6px';
      el.style.height = '6px';
      el.style.backgroundColor = ['#10b981', '#6366f1', '#38bdf8', '#f43f5e'][
        Math.floor(Math.random() * 4)
      ];
      el.style.borderRadius = '50%';
      el.style.zIndex = '9999';
      el.style.pointerEvents = 'none';
      el.style.transition = 'transform 2.2s ease-out, opacity 2.2s ease-out';
      document.body.appendChild(el);
      setTimeout(() => {
        el.style.transform = `translate(${Math.random() * 80 - 40}px, ${window.innerHeight + 20}px)`;
        el.style.opacity = '0';
      }, 20);
      setTimeout(() => el.remove(), 2300);
    }
  } catch (e) {}
};

interface OrderAccessData {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  downloadCount: number;
  maxDownloads: number;
  paidAt: string;
  product: {
    id: string;
    title: string;
    description: string;
    coverImage?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    driveUrl?: string;
    hasDriveAccess?: boolean;
    hasFile?: boolean;
  };
}

export const AccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();

  const [order, setOrder] = useState<OrderAccessData | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isDeviceLocked, setIsDeviceLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'drive' | 'viewer' | 'download'>('drive');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    const storedToken = orderId ? getStoredDeviceToken(orderId) : null;
    const activeToken = urlToken || storedToken || '';

    if (activeToken && orderId) {
      storeDeviceToken(orderId, activeToken);
    }

    setToken(activeToken);
    fetchOrderAccess(activeToken);
  }, [orderId]);

  const fetchOrderAccess = async (authToken: string) => {
    if (!orderId) return;

    try {
      setLoading(true);
      setIsDeviceLocked(false);
      setErrorMessage(null);

      const res = await apiFetch(`/api/orders/access/${orderId}?token=${encodeURIComponent(authToken)}`);
      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
        if (data.order.product.driveUrl) {
          setActiveTab('drive');
        } else {
          setActiveTab('viewer');
        }
        triggerCelebration();
      } else {
        if (data.isDeviceLocked || res.status === 401 || res.status === 403) {
          setIsDeviceLocked(true);
        }
        setErrorMessage(data.message || 'Access restricted to the device that completed payment');
      }
    } catch (err: any) {
      setErrorMessage('Connection error. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (order?.product.driveUrl) {
      navigator.clipboard.writeText(order.product.driveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDriveFolderId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/folders\/([a-zA-Z0-9_\-]+)/);
    return match ? match[1] : null;
  };

  const handleDownload = async () => {
    if (!orderId || !token) return;

    try {
      setIsDownloading(true);
      const downloadUrl = `/api/orders/download/${orderId}?token=${encodeURIComponent(token)}`;
      const res = await apiFetch(downloadUrl);

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.message || 'Download failed');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = order?.product.fileName || 'authorized_file.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (order) {
        setOrder({
          ...order,
          downloadCount: order.downloadCount + 1,
        });
      }
    } catch (err: any) {
      alert('Download error: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Device Lock Screen (Clean minimalist alert)
  if (isDeviceLocked || (errorMessage && !order)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full backdrop-blur-2xl bg-white/[0.04] border border-white/[0.09] rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Locked</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {errorMessage || 'This purchase is locked to the original phone/browser where payment was completed.'}
          </p>
          <button
            onClick={() => fetchOrderAccess(token)}
            className="w-full text-xs font-semibold bg-white text-slate-950 py-3 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Authorization</span>
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-600/15 via-teal-600/10 to-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative max-w-2xl mx-auto space-y-6 pt-4 sm:pt-8">

        {/* Minimal Glass Card Header */}
        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.09] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Payment Captured
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Access Unlocked
              </h1>
            </div>
          </div>

          {/* Direct CTA in Header */}
          {order.product.driveUrl && (
            <a
              href={order.product.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-200 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            >
              <FolderOpen className="w-4 h-4 text-emerald-600" />
              <span>Open Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          )}
        </div>

        {/* Tab Selector if both file and drive exist */}
        {order.product.driveUrl && order.product.fileName && (
          <div className="flex items-center gap-2 backdrop-blur-md bg-white/[0.03] border border-white/[0.06] p-1.5 rounded-2xl max-w-xs mx-auto">
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                activeTab === 'drive'
                  ? 'bg-white text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Drive
            </button>
            <button
              onClick={() => setActiveTab('viewer')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                activeTab === 'viewer'
                  ? 'bg-white text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PDF Reader
            </button>
          </div>
        )}

        {/* GOOGLE DRIVE DELIVERY CONTENT */}
        {activeTab === 'drive' && order.product.driveUrl && (
          <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.09] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="text-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {order.product.title}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your content is stored and organized in Google Drive. Click below to access all folders and files.
              </p>
            </div>

            {/* Main Action Button */}
            <div className="max-w-md mx-auto pt-2">
              <a
                href={order.product.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 px-6 rounded-2xl text-center flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 transition active:scale-[0.99]"
              >
                <FolderOpen className="w-5 h-5" />
                <span>Open Google Drive Content</span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
            </div>

            {/* Link Copy Box */}
            <div className="max-w-md mx-auto p-3 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-slate-400 truncate pl-2">
                {order.product.driveUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="shrink-0 text-xs font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Interactive Folder Preview */}
            {getDriveFolderId(order.product.driveUrl) && (
              <div className="pt-2">
                <div className="w-full h-80 rounded-2xl border border-white/[0.08] overflow-hidden bg-slate-900/60">
                  <iframe
                    src={`https://drive.google.com/embeddedfolderview?id=${getDriveFolderId(
                      order.product.driveUrl
                    )}#list`}
                    className="w-full h-full border-none"
                    title="Folder View"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* IN-APP PDF VIEWER (IF PRODUCT INCLUDES PDF) */}
        {activeTab === 'viewer' && order.product.fileName && (
          <div className="space-y-4">
            <PdfViewer
              orderId={order.id}
              token={token}
              customerName={order.customerName}
              fileName={order.product.fileName}
              onDownloadClick={handleDownload}
              isDownloading={isDownloading}
            />
          </div>
        )}

        {/* Security Device Lock Footnote */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Device Protected Access • Bookmark this page on this phone</span>
        </div>

      </div>
    </div>
  );
};
