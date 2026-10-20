import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProductCheckout } from './pages/ProductCheckout';
import { AccessPage } from './pages/AccessPage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white antialiased">
        <main className="w-full">
          <Routes>
            {/* Direct Instant Checkout Page (First Page) */}
            <Route path="/" element={<ProductCheckout />} />
            <Route path="/p/:slug" element={<ProductCheckout />} />

            {/* Paid Customer Access Page (Device Locked) */}
            <Route path="/access/:orderId" element={<AccessPage />} />

            {/* Secret Admin Management Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
