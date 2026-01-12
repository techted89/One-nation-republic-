
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: number;
  title: string;
  category: string;
  type: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get('http://localhost:3000/api/me', { withCredentials: true });
        setUser(userRes.data);

        const libRes = await axios.get('http://localhost:3000/api/library', { withCredentials: true });
        setDocuments(libRes.data);
      } catch (err) {
        navigate('/login');
      }
    };
    fetchData();
  }, [navigate]);

  if (!user) return <div className="p-10 text-center">Loading Fortress...</div>;

  return (
    <Layout>
      {/* Watermark Overlay */}
      <div className="watermark">
        {user.full_name} - {user.id} - LICENSED
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Welcome, {user.full_name}</h1>
            <p className="text-gray-600">Member ID: {user.id} | Status: Active</p>
          </div>
          <div className="mt-4 md:mt-0 bg-gold/10 text-navy px-4 py-2 rounded border border-gold">
            Security Status: Secure Connection
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Library Area */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-navy mb-6 border-b pb-2">Lawful Freedom Library</h2>

              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50 transition">
                    <div>
                      <h3 className="font-bold text-navy">{doc.title}</h3>
                      <span className="text-xs text-gray-500 uppercase">{doc.category} • {doc.type}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (doc.type === 'PDF') {
                          window.location.href = `http://localhost:3000/api/download/${doc.id}`;
                        } else {
                          alert('Only PDF downloads are implemented for this demo.');
                        }
                      }}
                      className="bg-navy text-white px-4 py-2 rounded text-sm hover:bg-navy-dark"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-navy mb-4">Patriot Alliance Forum</h3>
              <p className="text-gray-600 text-sm mb-4">Connect with fellow members in the private forum.</p>
              <div className="bg-gray-100 p-4 rounded text-center text-gray-500 italic">
                Forum coming soon in v2.0
              </div>
            </div>

            <div className="bg-navy text-white rounded-lg shadow-md p-6">
               <h3 className="text-xl font-bold text-gold mb-4">Donate / Upgrade</h3>
               <p className="text-sm mb-4">Support the cause with anonymous crypto payments.</p>
               <div className="space-y-2">
                 <button className="w-full bg-white/10 border border-white/20 py-2 rounded hover:bg-white/20">Bitcoin (BTC)</button>
                 <button className="w-full bg-white/10 border border-white/20 py-2 rounded hover:bg-white/20">Monero (XMR)</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
