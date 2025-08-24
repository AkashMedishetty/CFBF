import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Droplet, Clock, MapPin, CheckCircle, XCircle, RefreshCw, Users } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import logger from '../../utils/logger';
import { adminApi } from '../../utils/api';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [urgency, setUrgency] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [selected, setSelected] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getBloodRequests({ status, urgency, bloodType, limit: 50 });
      setRequests(res?.data?.bloodRequests || []);
      logger.success('Loaded blood requests', 'ADMIN_REQUESTS');
    } catch (e) {
      logger.error('Failed to load blood requests', 'ADMIN_REQUESTS', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [status, urgency, bloodType]);

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await adminApi.updateRequestStatus(requestId, newStatus);
      await loadRequests();
    } catch (e) {
      logger.error('Failed to update request status', 'ADMIN_REQUESTS', e);
    }
  };

  const loadSuggestions = async (req) => {
    try {
      const res = await fetch(`/api/v1/blood-requests/${encodeURIComponent(req.requestId)}/matches`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!res.ok) return setSuggestions([]);
      const data = await res.json();
      const matches = data?.data?.matches || [];
      setSuggestions(matches.map(m => ({
        title: `${m.name || 'Donor'} • ${m.bloodType} • ${typeof m.distance === 'number' ? m.distance.toFixed(1) : '—'}km`,
        hospital: `Score: ${Math.round(m.score || 0)}`
      })));
    } catch (e) {
      setSuggestions([]);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'matched', label: 'Matched' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' }
  ];
  const urgencyOptions = [
    { value: '', label: 'All Urgencies' },
    { value: 'critical', label: 'Critical' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'scheduled', label: 'Scheduled' }
  ];
  const bloodOptions = ['O-','O+','A-','A+','B-','B+','AB-','AB+'].map(v => ({ value: v, label: v }));
  bloodOptions.unshift({ value: '', label: 'All Types' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getUrgencyBadge = (u) => {
    const variant = u === 'critical' ? 'red' : u === 'urgent' ? 'orange' : 'blue';
    return <Badge variant={variant}>{u}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blood Requests</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage and track incoming blood requests</p>
          </div>
          <Button variant="outline" onClick={loadRequests}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </motion.div>

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={status} onChange={setStatus} options={statusOptions} placeholder="Status" />
            <Select value={urgency} onChange={setUrgency} options={urgencyOptions} placeholder="Urgency" />
            <Select value={bloodType} onChange={setBloodType} options={bloodOptions} placeholder="Blood Type" />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {requests.map((req) => (
            <Card key={req._id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">{req.patient?.bloodType}</span>
                </div>
                {getUrgencyBadge(req.request?.urgency)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {new Date(req.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {req.location?.hospital?.name || '—'}
                </div>
                <div>Status: <Badge variant={req.status === 'matched' ? 'green' : 'blue'}>{req.status}</Badge></div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => handleStatusUpdate(req.requestId, 'active')}>Activate</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(req.requestId, 'matched')}>
                  <CheckCircle className="h-3 w-3 mr-1" /> Match
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(req.requestId, 'cancelled')}>
                  <XCircle className="h-3 w-3 mr-1" /> Cancel
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelected(req); loadSuggestions(req); }}>
                  <Users className="h-3 w-3 mr-1" /> View
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
            <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Request {selected.requestId}</div>
                <button onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mb-3">
                <div><strong>Blood:</strong> {selected.patient?.bloodType}</div>
                <div><strong>Urgency:</strong> {selected.request?.urgency}</div>
                <div><strong>Hospital:</strong> {selected.location?.hospital?.name}</div>
              </div>
              <div className="font-semibold mb-2">Suggested donor matches</div>
              <div className="space-y-2">
                {suggestions.length === 0 && <div className="text-slate-500">No suggestions available.</div>}
                {suggestions.map((s, i) => (
                  <Card key={i} className="p-3">
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-slate-500">{s.hospital}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProtectedRequestsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <RequestsPage />
    </ProtectedRoute>
  );
}


