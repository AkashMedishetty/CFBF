import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import { authApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const HospitalLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!phoneNumber || !password) {
      setError('Phone and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ phone: phoneNumber, password });
      if (!res.success) throw new Error(res.message || 'Login failed');
      const user = res.data?.user;
      const tokens = res.data?.tokens;
      if (user?.role !== 'hospital') {
        throw new Error('Not a hospital account');
      }
      const result = await login(user, tokens);
      if (!result.success) throw new Error(result.error || 'Session error');
      navigate('/hospital/dashboard', { replace: true });
    } catch (err) {
      logger.error('Hospital login failed', 'HOSPITAL_LOGIN', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Hospital/Blood Bank Login</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Sign in to manage inventory</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone Number"
              icon={Building2}
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter 10-digit phone"
              required
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
            />
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              <Lock className="h-4 w-4 mr-2" /> Sign In
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default HospitalLoginPage;


