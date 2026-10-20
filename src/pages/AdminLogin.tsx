import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { apiFetch, setAdminToken } from '../api';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        setAdminToken(data.token);
        navigate('/admin');
      } else {
        setError(data.message || 'Invalid password');
      }
    } catch (err: any) {
      setError('Connection error. Please check server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative max-w-sm w-full backdrop-blur-2xl bg-white/[0.04] border border-white/[0.09] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
          <Lock className="w-5 h-5 text-indigo-400" />
        </div>

        <h1 className="text-xl font-bold text-white text-center">
          Admin Control
        </h1>
        <p className="text-xs text-slate-400 text-center mt-1 mb-6">
          Enter password to manage products & earnings
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:border-indigo-400 outline-none text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-slate-200 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition disabled:opacity-50"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center mt-5">
          Secret URL: <code>/admin</code>
        </p>
      </div>
    </div>
  );
};
