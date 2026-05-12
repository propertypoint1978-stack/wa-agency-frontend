import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ total: 0, hot: 0, warm: 0, cold: 0 });
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, clientsRes, leadsRes] = await Promise.all([
          axios.get(`${API}/leads/stats/summary`, { headers }),
          axios.get(`${API}/clients`, { headers }),
          axios.get(`${API}/leads?limit=5`, { headers })
        ]);
        setStats(statsRes.data);
        setClients(clientsRes.data);
        setLeads(leadsRes.data.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pieData = [
    { name: 'Hot 🔥', value: stats.hot, color: '#ef4444' },
    { name: 'Warm 🌡️', value: stats.warm, color: '#f97316' },
    { name: 'Cold ❄️', value: stats.cold, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const statCards = [
    { label: 'Total Leads', value: stats.total, icon: '👥', color: 'var(--accent)' },
    { label: 'Hot Leads 🔥', value: stats.hot, icon: '🔥', color: '#ef4444' },
    { label: 'Warm Leads', value: stats.warm, icon: '🌡️', color: '#f97316' },
    { label: 'Active Clients', value: clients.filter(c => c.isConnected).length, icon: '✅', color: '#22c55e' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--muted)' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard 📊</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Welcome back! Here's your overview.</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 36, fontWeight: 700, color }}>{value}</div>
              </div>
              <div style={{ fontSize: 28 }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Lead Chart */}
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Lead Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              No leads yet
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Recent Leads</h2>
          {leads.length === 0 ? (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No leads yet — connect a client to start!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leads.map(lead => (
                <div key={lead._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{lead.customerName || lead.customerPhone}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{lead.lastMessage?.slice(0, 40) || 'No message'}</div>
                  </div>
                  <span className={`badge badge-${lead.score}`}>{lead.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
