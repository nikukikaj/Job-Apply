// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore'; // <-- import your auth store here

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const navigate = useNavigate();
  const setRole = useAuthStore((state) => state.setRole); // get setter from Zustand

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) navigate('/dashboard');
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError('');

    try {
      const { email, password } = formData;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      const user = data.user;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const role = profile?.role;
      setRole(role); // ✅ update Zustand state
      localStorage.setItem('userRole', role); // optional backup

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'business') {
        navigate('/business');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/post-login', // Redirect to post-login to fetch role
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        className={`w-full mb-4 py-2.5 rounded-md flex items-center justify-center gap-3 transition-colors
          ${isGoogleLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'}`}
      >
        {isGoogleLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          <>
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google logo"
              className="w-5 h-5"
            />
            Continue with Google
          </>
        )}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-sm text-gray-500">OR</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={isEmailLoading}
          className={`w-full py-2.5 px-4 rounded-md text-white font-medium transition-colors
            ${isEmailLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isEmailLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/signup')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default Login;
