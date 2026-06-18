'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none"
      style={{ background: '#05070f' }}
    >
      {/* Subtle radial glow in center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 55%, rgba(13, 20, 48, 0.6) 0%, transparent 80%)',
        }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Card */}
        <div
          className="rounded-2xl px-10 py-10"
          style={{
            background: 'rgba(10, 13, 26, 0.95)',
            border: '1px solid rgba(255,255,255,0.04)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
          }}
        >
          {/* Logo block */}
          <div className="flex flex-col items-center mb-8">
            {/* Chutney brand logo from public directory */}
            <img
              src="/Chutney-logo.svg"
              alt="Chutney Logo"
              style={{ height: '48px', width: 'auto' }}
              className="mb-4"
            />

            {/* "beyond branding" bold */}
            <h1
              className="font-extrabold text-white mt-2 tracking-wide font-sans text-center"
              style={{ fontSize: '24px', letterSpacing: '-0.3px' }}
            >
              beyond branding
            </h1>

            {/* subtitle */}
            <p className="text-[13px] mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Sign in to{' '}
              <span style={{ color: '#fdb714', fontWeight: 600 }}>beyond-branding</span>{' '}
              workspace
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="flex items-center gap-2.5 rounded-lg px-4 py-3 mb-5"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="#f87171" viewBox="0 0 24 24" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-[12.5px] font-semibold" style={{ color: '#f87171' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className="block text-[13px] font-semibold mb-2"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-[13.5px] font-medium transition-all focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(253,183,20,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[13px] font-semibold mb-2"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Password
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-[13.5px] font-medium transition-all focus:outline-none tracking-wide"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(253,183,20,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity hover:opacity-100 opacity-50"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.8)" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.8)" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded-sm flex items-center justify-center transition-all"
                    style={{
                      background: rememberMe ? '#fdb714' : 'transparent',
                      border: rememberMe ? '1px solid #fdb714' : '1px solid rgba(255,255,255,0.3)',
                    }}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="#000" viewBox="0 0 24 24" strokeWidth="3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  className="text-[12.5px] font-medium"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-[12.5px] font-semibold transition-opacity hover:opacity-80 cursor-pointer"
                style={{ color: '#fdb714' }}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In button — solid yellow like reference */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-[14.5px] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{
                background: isLoading ? '#d99c10' : '#fdb714',
                color: '#000',
                boxShadow: '0 4px 20px rgba(253,183,20,0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLElement).style.background = '#e5a30f';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(253,183,20,0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLElement).style.background = '#fdb714';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(253,183,20,0.3)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Beyond Branding · Secured by Neon + iron-session
        </p>
      </div>
    </div>
  );
}
