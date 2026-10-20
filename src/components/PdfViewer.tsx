import React, { useState } from 'react';
import { Eye, Maximize2, Minimize2, Download, AlertCircle } from 'lucide-react';
import { BACKEND_URL } from '../api';

interface PdfViewerProps {
  orderId: string;
  token: string;
  customerName: string;
  fileName: string;
  onDownloadClick?: () => void;
  isDownloading?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  orderId,
  token,
  customerName,
  fileName,
  onDownloadClick,
  isDownloading = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pdfUrl = `${BACKEND_URL}/api/orders/view-pdf/${orderId}?token=${encodeURIComponent(token)}`;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen flex flex-col' : 'w-full'
      }`}
    >
      {/* Header bar */}
      <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
            {fileName}
          </span>
          <span className="hidden md:inline text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            Watermarked to {customerName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadClick && (
            <button
              onClick={onDownloadClick}
              disabled={isDownloading}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Preparing...' : 'Download PDF'}</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* PDF Stream Frame */}
      <div className={`relative bg-slate-900 ${isFullscreen ? 'flex-1 h-full' : 'h-[600px] sm:h-[700px]'}`}>
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full border-none"
          title="Secure eBook Viewer"
        />

        {/* Floating Security Badge */}
        <div className="absolute bottom-3 left-3 pointer-events-none bg-slate-950/80 backdrop-blur-md border border-slate-700/50 text-[11px] text-slate-300 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Device Protected • Dynamic Watermark Active</span>
        </div>
      </div>
    </div>
  );
};
