
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import authDesktop from '../assets/images/backgrounds/auth-desktop.jpg';
import authMobile from '../assets/images/backgrounds/auth-mobile.jpg';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [deviceHash, setDeviceHash] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const setFp = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceHash(result.visitorId);
    };
    setFp();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceHash) return;

    try {
      const res = await axios.post('http://localhost:3000/api/login', {
        ...formData,
        deviceHash,
        userAgent: navigator.userAgent
      }, { withCredentials: true });

      if (res.data.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Layout bgImageDesktop={authDesktop} bgImageMobile={authMobile}>
      <div className="container mx-auto max-w-md py-20 px-4">
        <div className="bg-white/95 p-8 rounded-lg shadow-xl border-t-4 border-gold">
          <h2 className="text-2xl font-bold text-navy mb-6 text-center">Member Login</h2>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="w-full bg-navy text-white py-3 rounded font-bold hover:bg-navy-dark transition">
              Access Portal
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="/register" className="text-sm text-navy hover:underline">Have a license key? Register here.</a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
