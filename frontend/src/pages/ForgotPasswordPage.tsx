import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.post('/auth/forgot-password', { email });
      setMessage('If your email is registered, a password reset code was sent.');
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.post('/auth/reset-password', { token, newPassword });
      setMessage('Password successfully reset! You can now log in.');
    } catch (err: any) {
      setError(err.message || 'Reset failed. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-emerald-600/30">
            K
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">Keepr</span>
        </Link>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reset your password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
          {message && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'request' ? (
            <form className="space-y-4" onSubmit={handleRequestToken}>
              <Input
                label="Enter your account email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Button type="submit" variant="primary" loading={loading} className="w-full">
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <Input
                label="Reset Code (from email or outbox)"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter 64-char token"
                leftIcon={<KeyRound className="w-4 h-4" />}
              />

              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />

              <Button type="submit" variant="primary" loading={loading} className="w-full">
                Reset Password
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              Back to Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
