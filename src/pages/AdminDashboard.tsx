import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Download,
  Package,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  X,
  FileText,
  AlertCircle,
  ShieldAlert,
  RotateCcw,
  FolderOpen,
} from 'lucide-react';
import { apiFetch, getAdminToken, removeAdminToken, getAssetUrl } from '../api';

interface Stats {
  totalRevenue: number;
  paidOrdersCount: number;
  totalDownloads: number;
  totalProducts: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  coverImage?: string;
  driveUrl?: string;
  fileName?: string;
  fileSize?: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

interface Order {
  id: string;
  customerName: string;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: string;
  deviceToken?: string;
  downloadCount: number;
  maxDownloads: number;
  isAccessRevoked: boolean;
  paidAt?: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    price: number;
    fileName: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/products/admin/all'),
        apiFetch('/api/admin/orders'),
      ]);

      if (statsRes.status === 401 || productsRes.status === 401) {
        removeAdminToken();
        navigate('/admin/login');
        return;
      }

      const statsData = await statsRes.json();
      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (productsData.success) setProducts(productsData.products);
      if (ordersData.success) setOrders(ordersData.orders);
    } catch (err) {
      console.error('Error loading admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAdminToken();
    navigate('/admin/login');
  };

  const handleCopyLink = (productSlug: string, id: string) => {
    const url = `${window.location.origin}/p/${productSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAccessUrl = (orderId: string, deviceToken?: string) => {
    const tokenParam = deviceToken ? `?token=${encodeURIComponent(deviceToken)}` : '';
    const url = `${window.location.origin}/access/${orderId}${tokenParam}`;
    navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle('');
    setSlug('');
    setPrice('');
    setOriginalPrice('');
    setDescription('');
    setDriveUrl('');
    setFile(null);
    setCoverImage(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setSlug(prod.slug);
    setPrice(prod.price.toString());
    setOriginalPrice(prod.originalPrice ? prod.originalPrice.toString() : '');
    setDescription(prod.description || '');
    setDriveUrl(prod.driveUrl || '');
    setFile(null);
    setCoverImage(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError(null);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('price', price);
      if (originalPrice) formData.append('originalPrice', originalPrice);
      if (description) formData.append('description', description);
      if (slug) formData.append('customSlug', slug);
      if (driveUrl) formData.append('driveUrl', driveUrl);
      if (file) formData.append('file', file);
      if (coverImage) formData.append('coverImage', coverImage);

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        await loadData();
      } else {
        setModalError(data.message || 'Failed to save product');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error occurred');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? All related orders will remain in records.')) return;
    try {
      const res = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleToggleRevoke = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/admin/orders/${orderId}/revoke`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, isAccessRevoked: data.isAccessRevoked } : o
          )
        );
      }
    } catch (err: any) {
      alert('Failed to update revoke status: ' + err.message);
    }
  };

  const handleResetDownloads = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/admin/orders/${orderId}/reset-downloads`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, downloadCount: 0 } : o)));
      }
    } catch (err: any) {
      alert('Failed to reset downloads: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Admin Control Center</h1>
            <p className="text-xs text-slate-500">Instagram Store & Digital Access Manager</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-6">

        {/* Analytics Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              ₹{stats?.totalRevenue.toLocaleString('en-IN') || 0}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Realized via Razorpay</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.paidOrdersCount || 0}
            </div>
            <span className="text-[11px] text-blue-600 font-medium">Verified purchases</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Downloads
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Download className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.totalDownloads || 0}
            </div>
            <span className="text-[11px] text-indigo-600 font-medium">Watermarked files fetched</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Products
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.totalProducts || 0}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">Active items</span>
          </div>
        </div>

        {/* Tab Switching */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('products')}
              className={`text-sm font-bold pb-2 relative transition-colors ${
                activeTab === 'products'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Digital Items / eBooks ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`text-sm font-bold pb-2 relative transition-colors ${
                activeTab === 'orders'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Purchases & Orders ({orders.length})
            </button>
          </div>

          {activeTab === 'products' && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          )}
        </div>

        {/* TAB 1: PRODUCTS LIST */}
        {activeTab === 'products' && (
          <div>
            {products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base mb-1">No Items Added Yet</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Add your first eBook or digital file to generate an Instagram bio link.
                </p>
                <button
                  onClick={openCreateModal}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Item</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover or placeholder */}
                      <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden">
                        {prod.coverImage ? (
                          <img
                            src={getAssetUrl(prod.coverImage)}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-indigo-900 text-white p-4 text-center">
                            <FileText className="w-8 h-8 text-blue-400 mb-1" />
                            <span className="text-xs font-bold truncate max-w-full">
                              {prod.fileName}
                            </span>
                          </div>
                        )}
                        <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                          ₹{prod.price}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                            {prod.title}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                          {prod.description || 'No description provided'}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg flex-wrap">
                          {prod.driveUrl && (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                              <FolderOpen className="w-3 h-3" /> Drive Linked
                            </span>
                          )}
                          {prod.fileName && <span>File: {prod.fileName}</span>}
                          <span>•</span>
                          <span>{prod._count?.orders || 0} sales</span>
                        </div>

                        {/* Bio Link Box with One-Click Copy */}
                        <div className="bg-blue-50/70 border border-blue-200/70 p-2.5 rounded-xl mb-3 flex items-center justify-between gap-2">
                          <div className="truncate text-xs font-mono text-blue-700">
                            /p/{prod.slug}
                          </div>
                          <button
                            onClick={() => handleCopyLink(prod.slug, prod.id)}
                            className="text-xs font-bold flex items-center gap-1 bg-white hover:bg-blue-600 hover:text-white text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 transition shrink-0"
                          >
                            {copiedId === prod.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Bio Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={`/p/${prod.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS & CUSTOMERS */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No orders recorded yet. As soon as a user pays via Razorpay, it will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment ID</th>
                      <th className="py-3 px-4">Downloads</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {o.customerName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {o.product?.title || 'Unknown Item'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{o.amount}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              o.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {o.razorpayPaymentId || 'Pending'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {o.downloadCount} / {o.maxDownloads}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Copy Access URL */}
                            <button
                              onClick={() => handleCopyAccessUrl(o.id, o.deviceToken)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                              title="Copy Customer Access Link"
                            >
                              {copiedId === o.id ? 'Copied!' : 'Copy Link'}
                            </button>

                            {/* Reset Downloads */}
                            <button
                              onClick={() => handleResetDownloads(o.id)}
                              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 p-1 hover:bg-slate-200 rounded"
                              title="Reset Downloads Count"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Revoke / Restore */}
                            <button
                              onClick={() => handleToggleRevoke(o.id)}
                              className={`text-[11px] font-bold px-2 py-1 rounded ${
                                o.isAccessRevoked
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-200 text-slate-700 hover:bg-rose-100 hover:text-rose-700'
                              }`}
                            >
                              {o.isAccessRevoked ? 'Revoked' : 'Revoke'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-black text-slate-900">
                {editingProduct ? 'Edit Digital Item' : 'Add New Digital Item / eBook'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-Day Instagram Growth Blueprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Bio Slug (URL)
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-300">
                    /p/
                  </span>
                  <input
                    type="text"
                    placeholder="insta-guide (optional, auto-generated from title)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-r-xl border border-slate-300 text-xs focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 199"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Original Price (₹) (Strike-through)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 999"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Bullet Highlights
                </label>
                <textarea
                  rows={3}
                  placeholder="Highlight key takeaways of this eBook or product..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Drive Folder / Content Link (Optional)
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-300">
                    Drive URL
                  </span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-300 text-xs focus:border-blue-600 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Buyer gets direct authorized access to this Drive link after payment capture.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload PDF or Digital File {!editingProduct && !driveUrl && '*'}
                </label>
                <input
                  type="file"
                  required={!editingProduct && !driveUrl}
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Optional if Google Drive link is provided. PDF files are watermarked with buyer name.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
