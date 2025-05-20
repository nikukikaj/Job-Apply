// src/pages/PostLogin.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const PostLogin = () => {
  const navigate = useNavigate();
  const setRole = useAuthStore((state) => state.setRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        const role = profile?.role || 'user';
        setRole(role);
        localStorage.setItem('userRole', role);

        // Redirect based on role
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
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [navigate, setRole]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 mt-20 bg-red-100 text-red-700 rounded-md shadow">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return null; // or a fallback UI if you want
};

export default PostLogin;