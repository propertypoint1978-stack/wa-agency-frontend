import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API } from '../context/AuthContext';

export default function Leads() {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState({ clientId: '', score: '' });
  const [selectedLead, setSelectedLead] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (filter.clientId) params.clientId = filter.clientId;
      if (filter.score) params.score = filter.score;

      const [leadsRes, clientsRes] = await Promise.all([
        axios.get(`${API}/leads`, { headers, params }),
        axios.get(`${API}/clients`, { headers })
      ]);
      setLeads(leadsRes.data);
      setClients(clientsRes.data);
    } finally {
      setLoading(false);
    }
  }

  async function viewConversation(lead) {
    setSelectedLead(lead);
    const res = await axios.get(`${API}/leads/${lead._id}/conversation`, { headers });
    setConversation(res.data.messages || []);
  }

  const scoreEmoji = { hot: '🔥', warm: '🌡️', cold: '❄️' };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Leads 🔥</h1>
        <p style={{ color: 'var(--muted)' }}>All customer conversations & lead scores</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select style={{ width: 200 }} value={filter.clientId} onChange={e => setFilter({ ...filter, clientId: e.target.value })}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c._id} value={c._id}>{c.businessName}</option>)}
        </select>
        <select style={{ width: 160 }} value={filter.score} onChange={e => setFilter({ ...filter, score: e.target.value })}>
          <option value="">All Scores</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">🌡️ Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>
        <button className="btn btn-outline" onClick={loadData}>Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedLead ? '1fr 400px' : '1fr', gap: 24 }}>
        {/* Leads Table */}
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Client</th>
                <th>Score</th>
                <th>Last Message</th>
                <th>Msgs</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No leads yet</td></tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead._id} style={{ cursor: 'pointer' }} onClick={() => viewConversation(lead)}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lead.customerName || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>+{lead.customerPhone}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>{lead.clientId?.businessName || '—'}</td>
                    <td>
                      <span className={`badge badge-${lead.score}`}>
                        {scoreEmoji[lead.score]} {lead.score}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 200 }}>
                      {lead.lastMessage?.slice(0, 50) || '—'}
                    </td>
                    <td style={{ fontSize: 13 }}>{lead.totalMessages}</td>
                    <td>
                      <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}
                        onClick={e => { e.stopPropagation(); viewConversation(lead); }}>
                        View Chat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Conversation Panel */}
        {selectedLead && (
          <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>+{selectedLead.customerPhone}</div>
                <span className={`badge badge-${selectedLead.score}`} style={{ marginTop: 4, display: 'inline-block' }}>
                  {scoreEmoji[selectedLead.score]} {selectedLead.score} — {selectedLead.scoreReason || ''}
                </span>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setSelectedLead(null)}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conversation.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>No messages yet</div>
              ) : (
                conversation.map((msg, i) => (
                  <div key={i} style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 14,
                    alignSelf: msg.role === 'user' ? 'flex-start' : 'flex-end',
                    background: msg.role === 'user' ? 'var(--bg3)' : 'var(--accent)',
                    color: 'var(--text)'
                  }}>
                    <div style={{ fontSize: 11, color: msg.role === 'user' ? 'var(--muted)' : 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                      {msg.role === 'user' ? '👤 Customer' : '🤖 AI Bot'}
                    </div>
                    {msg.content}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
