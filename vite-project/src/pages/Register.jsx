import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user', // default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { email, password, role } = formData;

    try {
      // 1. Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) throw signUpError;

      const user = data?.user;
      if (!user) throw new Error('Sign up succeeded but user is missing.');

      // 2. Insert profile with the user's UUID from auth.users
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id, // <-- UUID from auth.users
          email,
          role,
        },
      ]);

      if (profileError) throw profileError;

      // 3. Navigate to login or dashboard
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Create Account</h2>

      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          >
            <option value="user">User</option>
            <option value="business">Business</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 bg-green-600 text-white rounded-md font-medium transition-colors ${
            loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700'
          }`}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default Register;

