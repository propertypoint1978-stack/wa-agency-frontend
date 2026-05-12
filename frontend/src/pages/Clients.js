import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API } from '../context/AuthContext';
import io from 'socket.io-client';

const BACKEND = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function Clients() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [qrData, setQrData] = useState({ clientId: null, qr: null });
  const [connecting, setConnecting] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', businessName: '', businessContext: '', aiPersonality: '' });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadClients();
    const socket = io(BACKEND);
    socket.on('connect', () => console.log('Socket connected'));
    return () => socket.disconnect();
  }, []);

  async function loadClients() {
    const res = await axios.get(`${API}/clients`, { headers });
    setClients(res.data);
  }

  async function handleAdd(e) {
    e.preventDefault();
    await axios.post(`${API}/clients`, form, { headers });
    setShowForm(false);
    setForm({ name: '', email: '', businessName: '', businessContext: '', aiPersonality: '' });
    loadClients();
  }

  async function connectWhatsApp(clientId) {
    setConnecting(clientId);
    setQrData({ clientId, qr: null });
    try {
      const res = await axios.post(`${API}/whatsapp/connect/${clientId}`, {}, { headers });
      if (res.data.qr) setQrData({ clientId, qr: res.data.qr });
      if (res.data.status === 'already_connected') alert('Already connected!');
    } catch (err) {
      alert('Connection failed: ' + err.message);
    } finally {
      setConnecting(null);
    }
  }

  async function disconnectWhatsApp(clientId) {
    await axios.post(`${API}/whatsapp/disconnect/${clientId}`, {}, { headers });
    loadClients();
  }

  async function deleteClient(id) {
    if (!window.confirm('Delete this client?')) return;
    await axios.delete(`${API}/clients/${id}`, { headers });
    loadClients();
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Clients 👥</h1>
          <p style={{ color: 'var(--muted)' }}>Manage your WhatsApp automation clients</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Client</button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Add New Client</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Client Name</label>
                <input placeholder="Muhammad Ali" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="client@gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Business Name</label>
                <input placeholder="Ali Electronics" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Business Description (AI ke liye)</label>
                <textarea
                  rows={3}
                  placeholder="We sell mobile phones and accessories in Karachi. Our prices are competitive..."
                  value={form.businessContext}
                  onChange={e => setForm({ ...form, businessContext: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>AI Personality</label>
                <select value={form.aiPersonality} onChange={e => setForm({ ...form, aiPersonality: e.target.value })}>
                  <option value="helpful and professional">Helpful & Professional</option>
                  <option value="friendly and casual">Friendly & Casual</option>
                  <option value="formal and corporate">Formal & Corporate</option>
                  <option value="enthusiastic sales assistant">Enthusiastic Sales</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>Add Client</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrData.qr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ textAlign: 'center', width: 340 }}>
            <h2 style={{ marginBottom: 8 }}>📱 Scan QR Code</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
              WhatsApp kholein → ⋮ → Linked Devices → Link a Device
            </p>
            <img src={qrData.qr} alt="QR" style={{ width: 260, height: 260, borderRadius: 12 }} />
            <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 16, marginBottom: 20 }}>
              QR code 60 seconds mein expire hota hai
            </p>
            <button className="btn btn-outline" onClick={() => { setQrData({ clientId: null, qr: null }); loadClients(); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Business</th>
              <th>WhatsApp Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No clients yet — add your first client!</td></tr>
            ) : (
              clients.map(client => (
                <tr key={client._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{client.email}</div>
                  </td>
                  <td>{client.businessName}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: client.isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                      color: client.isConnected ? 'var(--green)' : 'var(--muted)'
                    }}>
                      {client.isConnected ? '● Connected' : '○ Disconnected'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!client.isConnected ? (
                        <button className="btn btn-primary" onClick={() => connectWhatsApp(client._id)} disabled={connecting === client._id}>
                          {connecting === client._id ? '...' : '🔗 Connect'}
                        </button>
                      ) : (
                        <button className="btn btn-outline" onClick={() => disconnectWhatsApp(client._id)}>
                          Disconnect
                        </button>
                      )}
                      <button className="btn btn-danger" onClick={() => deleteClient(client._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
