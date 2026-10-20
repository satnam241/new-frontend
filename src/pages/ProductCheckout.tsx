import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  FolderOpen,
  FileText,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  apiFetch,
  getOrCreateDeviceFingerprint,
  storeDeviceToken,
} from '../api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  coverImage?: string;
  fileName?: string;
  fileSize?: number;
  hasDriveAccess?: boolean;
}

export const ProductCheckout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      // If slug exists, fetch that product; otherwise fetch the first active product
      const endpoint = slug ? `/api/products/slug/${slug}` : '/api/products';
      const res = await apiFetch(endpoint);
      const data = await res.json();

      if (data.success) {
        if (slug) {
          setProduct(data.product);
        } else if (data.products && data.products.length > 0) {
          setProduct(data.products[0]);
        } else {
          setError('No active products found.');
        }
      } else {
        setError(data.message || 'Product not found');
      }
    } catch (err: any) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantCheckout = async () => {
    if (!product || paying) return;

    try {
      setPaying(true);
      setError(null);

      // 1. Create order on backend (no name input needed - completely frictionless)
      const res = await apiFetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Unable to initialize checkout');
      }

      const clientFp = getOrCreateDeviceFingerprint();

      // Check if Razorpay script is loaded or mock fallback active
      if (orderData.isMock || typeof window.Razorpay === 'undefined') {
        await verifyAndRedirect({
          orderId: orderData.orderId,
          razorpayOrderId: orderData.razorpayOrderId,
          razorpayPaymentId: 'pay_test_' + Date.now(),
          razorpaySignature: 'mock_signature',
          clientFingerprint: clientFp,
        });
        return;
      }

      // 2. Directly open Razorpay checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, // paise
        name: product.title,
        description: product.description ? product.description.substring(0, 100) : product.title,
        image: product.coverImage
          ? product.coverImage.startsWith('http')
            ? product.coverImage
            : `${window.location.origin}${product.coverImage}`
          : undefined,
        order_id: orderData.razorpayOrderId,
        theme: {
          color: '#0f172a',
        },
        handler: async (response: any) => {
          try {
            await verifyAndRedirect({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              clientFingerprint: clientFp,
            });
          } catch (verErr: any) {
            setError(verErr.message || 'Payment verification failed');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setError(response.error?.description || 'Payment was cancelled or failed');
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Something went wrong during checkout');
      setPaying(false);
    }
  };

  const verifyAndRedirect = async (payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    clientFingerprint: string;
  }) => {
    const verifyRes = await apiFetch('/api/orders/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      throw new Error(verifyData.message || 'Payment verification failed');
    }

    // Lock device session token in browser storage
    storeDeviceToken(verifyData.orderId, verifyData.deviceToken);

    // Redirect to instant access page
    navigate(`/access/${verifyData.orderId}?token=${encodeURIComponent(verifyData.deviceToken)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-sm w-full backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] p-8 rounded-3xl text-center shadow-2xl">
          <p className="text-sm font-medium text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => fetchProduct()}
            className="text-xs bg-white text-slate-900 font-semibold px-5 py-2.5 rounded-full hover:bg-slate-200 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      
      {/* Ambient background glows (Glassmorphism atmosphere) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative w-full max-w-lg mx-auto">
        
        {/* Main Glassmorphic Card */}
        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.09] rounded-[32px] sm:rounded-[38px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] overflow-hidden transition-all">
          
          {/* Cover Media */}
          {product.coverImage ? (
            <div className="relative aspect-[16/10] w-full bg-slate-900/60 overflow-hidden">
              <img
                src={product.coverImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              {discountPercent && (
                <div className="absolute top-4 right-4 backdrop-blur-md bg-white/10 border border-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                  {discountPercent}% OFF
                </div>
              )}
            </div>
          ) : (
            <div className="pt-8 pb-4 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header: Title & Badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {product.hasDriveAccess && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    <FolderOpen className="w-3 h-3 text-emerald-400" />
                    <span>Google Drive Access</span>
                  </span>
                )}
                {product.fileName && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>Digital File</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                {product.title}
              </h1>

              {product.description && (
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1 whitespace-pre-line">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price Presentation */}
            <div className="p-4 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-500 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-medium bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.06]">
                One-time Payment
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
                {error}
              </div>
            )}

            {/* Direct 1-Click Payment CTA */}
            <div className="space-y-3 pt-1">
              <button
                onClick={handleInstantCheckout}
                disabled={paying}
                className="group relative w-full overflow-hidden rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-950 font-bold py-4 px-6 text-base sm:text-lg shadow-xl shadow-white/10 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
              >
                {paying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Opening Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Get Instant Access • ₹{product.price}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Minimal Trust Indicator */}
              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Secured by Razorpay</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-slate-400" />
                  <span>Instant Delivery</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Minimal Footer Note */}
        <div className="text-center mt-5 text-[11px] text-slate-600 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Device-Locked Digital Delivery</span>
        </div>

      </div>
    </div>
  );
};
