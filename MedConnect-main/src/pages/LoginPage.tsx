import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, requestLoginCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (step === 'request') {
        await requestLoginCode(email);
        setStep('verify');
      } else {
        await login({ email, code });
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
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
              {step === 'request' ? 'Sign in with email code' : 'Enter your login code'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {step === 'request'
                ? 'We will send a one-time code to your email'
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  disabled={step === 'verify'}
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {step === 'verify' && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification code
                </label>
                <div className="mt-1 relative">
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm tracking-[0.3em]"
                    placeholder="000000"
                  />
                </div>
              </div>
            )}

            {step === 'verify' && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-emerald-600 hover:underline"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      await requestLoginCode(email);
                    } catch (err: any) {
                      setError(err.message || 'Failed to resend code');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Resend code
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? (step === 'request' ? 'Sending code...' : 'Signing in...')
                  : (step === 'request' ? 'Send login code' : 'Verify and sign in')}
              </button>
            </div>

            {step === 'verify' && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:underline"
                  onClick={() => {
                    setStep('request');
                    setCode('');
                    setError('');
                  }}
                >
                  Use a different email
                </button>
              </div>
            )}

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Sign up
                </Link>
              </span>
            </div>

            {step === 'request' && (
              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-emerald-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;