
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import authDesktop from '../assets/images/backgrounds/auth-desktop.jpg';
import authMobile from '../assets/images/backgrounds/auth-mobile.jpg';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    licenseKey: '',
    fullName: '',
    email: '',
    password: '',
    deviceHash: '',
  });

  useEffect(() => {
    // Initialize FingerprintJS
    const setFp = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setFormData(prev => ({ ...prev, deviceHash: result.visitorId }));
    };
    setFp();
  }, []);

  const handleValidateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/validate-license', { licenseKey: formData.licenseKey });
      if (res.data.valid) {
        setStep(2);
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid license key');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/register', {
        ...formData,
        userAgent: navigator.userAgent
      }, { withCredentials: true }); // Important for cookies

      if (res.data.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Layout bgImageDesktop={authDesktop} bgImageMobile={authMobile}>
      <div className="container mx-auto max-w-md py-20 px-4">
        <div className="bg-white/95 p-8 rounded-lg shadow-xl border-t-4 border-navy">
          <h2 className="text-2xl font-bold text-navy mb-6 text-center">
            {step === 1 ? 'Enter License Key' : 'Create Account'}
          </h2>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleValidateKey}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">License Serial Number</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-lg uppercase tracking-widest"
                  placeholder="XXXX-XXXX-XXXX"
                  value={formData.licenseKey}
                  onChange={(e) => setFormData({...formData, licenseKey: e.target.value})}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Use "ONE-NATION-ALPHA" for demo.
                </p>
              </div>
              <button type="submit" className="w-full bg-navy text-white py-3 rounded font-bold hover:bg-navy-dark transition">
                Validate Key
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
               <div className="mb-4">
                <label className="block text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                />
              </div>
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
              <div className="text-xs text-gray-500 mb-6">
                Device ID: {formData.deviceHash} (Will be locked to this account)
              </div>
              <button type="submit" className="w-full bg-gold text-navy py-3 rounded font-bold hover:bg-yellow-400 transition">
                Complete Registration
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Register;
