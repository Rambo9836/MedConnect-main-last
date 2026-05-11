import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordResetCode, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await requestPasswordResetCode(email);
      setInfo('If an account exists for this email, we sent a reset code.');
      setStep('reset');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      await resetPassword(email, code, newPassword);
      setInfo('Password reset successful. You can now sign in.');
      setTimeout(() => navigate('/login'), 400);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-8">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {step === 'request'
                ? 'We will email you a one-time reset code'
                : `Enter the code sent to ${email}`}
            </p>
          </div>

          {step === 'request' ? (
            <form className="space-y-6" onSubmit={onRequest}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {info && (
                <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-md">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending code...' : 'Send reset code'}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-gray-600 hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={onReset}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Reset code
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm tracking-[0.3em]"
                    placeholder="000000"
                  />
                </div>
                <div className="text-right mt-2">
                  <button
                    type="button"
                    className="text-sm text-emerald-600 hover:underline"
                    disabled={loading}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setError('');
                        setInfo('');
                        await requestPasswordResetCode(email);
                        setInfo('If an account exists for this email, we sent a reset code.');
                      } catch (err: any) {
                        setError(err?.message || 'Failed to resend code');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Resend code
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {info && (
                <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-md">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:underline"
                  onClick={() => {
                    setStep('request');
                    setCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setInfo('');
                  }}
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

