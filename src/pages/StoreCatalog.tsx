import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  FolderOpen,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch, getAssetUrl } from '../api';

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  coverImage?: string;
  fileName?: string;
  hasDriveAccess?: boolean;
}

export const StoreCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching catalog', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Loading digital store...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-10">

        {/* Store Profile / Hero Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Digital Store & Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Instant, device-protected access to premium digital products, eBooks, and Google Drive resources.
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-1">Store is Updating</h3>
            <p className="text-xs text-slate-500 mb-4">
              Products are being added. Check back in a few minutes or log in to the admin panel.
            </p>
            <Link
              to="/admin/login"
              className="inline-block text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-xl"
            >
              Admin Login
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((prod) => {
              const discount = prod.originalPrice
                ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
                : null;

              return (
                <Link
                  key={prod.id}
                  to={`/p/${prod.slug}`}
                  className="group block bg-white rounded-3xl border border-slate-200/90 hover:border-blue-500/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Cover Image or Icon */}
                    <div className="sm:w-48 aspect-[16/9] sm:aspect-square bg-slate-900 shrink-0 relative overflow-hidden">
                      {prod.coverImage ? (
                        <img
                          src={getAssetUrl(prod.coverImage)}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-white p-4">
                          <FolderOpen className="w-10 h-10 text-emerald-400 mb-1" />
                          <span className="text-[10px] text-slate-300 font-mono">Digital Asset</span>
                        </div>
                      )}
                      {discount && (
                        <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {prod.hasDriveAccess && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1">
                              <FolderOpen className="w-3 h-3" /> Drive Content
                            </span>
                          )}
                          {prod.fileName && (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> PDF File
                            </span>
                          )}
                        </div>

                        <h2 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {prod.title}
                        </h2>

                        {prod.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {prod.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Buy Button Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-slate-900">
                            ₹{prod.price}
                          </span>
                          {prod.originalPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{prod.originalPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 group-hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all">
                          <span>Get Instant Access</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
