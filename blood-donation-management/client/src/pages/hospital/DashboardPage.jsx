import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import InventoryManagement from '../../components/hospital/InventoryManagement';
import logger from '../../utils/logger';

const HospitalDashboardPage = () => {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/hospitals/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });
        const data = await res.json();
        if (res.ok && data?.success) {
          setHospital(data.data);
        } else {
          logger.warn('Failed to fetch hospital profile', 'HOSPITAL_DASH');
        }
      } catch (e) {
        logger.error('Error fetching hospital profile', 'HOSPITAL_DASH', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen p-6">
        <Card className="p-6">
          <div className="text-slate-700">No hospital profile found for this account.</div>
          <Button className="mt-3" onClick={() => (window.location.href = '/blood-banks')}>Find Blood Banks</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{hospital.name}</h1>
          <p className="text-slate-600">{hospital.address?.street}, {hospital.address?.city}</p>
        </div>
        <InventoryManagement hospitalId={hospital._id} />
      </div>
    </div>
  );
};

export default HospitalDashboardPage;


