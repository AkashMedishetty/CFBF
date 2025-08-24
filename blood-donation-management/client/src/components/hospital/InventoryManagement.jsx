import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplet,
  Plus,
  Minus,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  BarChart3,
  Clock,
  Package,
  Bell,
  Edit,
  Save,
  X,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import logger from '../../utils/logger';

const InventoryManagement = ({ hospitalId, className = '' }) => {
  const [inventory, setInventory] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [editingThresholds, setEditingThresholds] = useState({});

  const [addForm, setAddForm] = useState({
    bloodType: '',
    unitsToAdd: '',
    expirationDate: ''
  });

  const [consumeForm, setConsumeForm] = useState({
    bloodType: '',
    unitsToConsume: '',
    reason: ''
  });

  const [thresholdForm, setThresholdForm] = useState({
    bloodType: '',
    threshold: ''
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const consumeReasons = [
    { value: 'patient_transfusion', label: 'Patient Transfusion' },
    { value: 'emergency_use', label: 'Emergency Use' },
    { value: 'expired_disposal', label: 'Expired - Disposal' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'redistribution', label: 'Redistribution' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (hospitalId) {
      fetchInventory();
    }
  }, [hospitalId]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/${hospitalId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setInventory(result.data.inventory);
        setStatistics(result.data.statistics);
        setAlerts(result.data.alerts);
        logger.success('Inventory loaded successfully');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      logger.error('Error fetching inventory:', error);
      // Mock data for demo
      setInventory([
        {
          bloodType: 'O+',
          unitsAvailable: 25,
          minimumThreshold: 10,
          expirationDates: [
            new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
          ],
          lastUpdated: new Date()
        },
        {
          bloodType: 'A+',
          unitsAvailable: 8,
          minimumThreshold: 15,
          expirationDates: [
            new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          ],
          lastUpdated: new Date()
        },
        {
          bloodType: 'B+',
          unitsAvailable: 0,
          minimumThreshold: 5,
          expirationDates: [],
          lastUpdated: new Date()
        }
      ]);
      setStatistics({
        totalUnits: 33,
        totalBloodTypes: 3,
        lowStockCount: 2,
        expiringSoonCount: 1
      });
      setAlerts({
        lowStock: [
          { bloodType: 'A+', unitsAvailable: 8, minimumThreshold: 15 },
          { bloodType: 'B+', unitsAvailable: 0, minimumThreshold: 5 }
        ],
        expiringSoon: [
          { bloodType: 'A+', expiringSoonCount: 1 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInventory = async () => {
    try {
      const response = await fetch(`/api/inventory/${hospitalId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(addForm)
      });

      const result = await response.json();

      if (result.success) {
        setInventory(result.data.inventory);
        setStatistics(result.data.statistics);
        setAlerts(result.data.alerts);
        setShowAddModal(false);
        setAddForm({ bloodType: '', unitsToAdd: '', expirationDate: '' });
        logger.success('Inventory updated successfully');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      logger.error('Error adding inventory:', error);
    }
  };

  const handleConsumeInventory = async () => {
    try {
      const response = await fetch(`/api/inventory/${hospitalId}/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(consumeForm)
      });

      const result = await response.json();

      if (result.success) {
        setInventory(result.data.inventory);
        setStatistics(result.data.statistics);
        setAlerts(result.data.alerts);
        setShowConsumeModal(false);
        setConsumeForm({ bloodType: '', unitsToConsume: '', reason: '' });
        logger.success('Inventory consumed successfully');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      logger.error('Error consuming inventory:', error);
    }
  };

  const handleUpdateThreshold = async (bloodType, threshold) => {
    try {
      const response = await fetch(`/api/inventory/${hospitalId}/threshold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bloodType, threshold: parseInt(threshold) })
      });

      const result = await response.json();

      if (result.success) {
        setInventory(result.data.inventory);
        setEditingThresholds(prev => ({ ...prev, [bloodType]: false }));
        logger.success('Threshold updated successfully');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      logger.error('Error updating threshold:', error);
    }
  };

  const getStockStatus = (item) => {
    if (item.unitsAvailable === 0) return { status: 'out', color: 'red', label: 'Out of Stock' };
    if (item.unitsAvailable <= item.minimumThreshold) return { status: 'low', color: 'yellow', label: 'Low Stock' };
    return { status: 'good', color: 'green', label: 'In Stock' };
  };

  const getDaysUntilExpiry = (expirationDates) => {
    if (!expirationDates || expirationDates.length === 0) return null;
    
    const earliestDate = new Date(Math.min(...expirationDates.map(date => new Date(date))));
    const today = new Date();
    const diffTime = earliestDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Inventory Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your blood inventory and track stock levels
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={fetchInventory}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Stock</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowConsumeModal(true)}
            className="flex items-center space-x-2"
          >
            <Minus className="h-4 w-4" />
            <span>Consume</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Units</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {statistics.totalUnits || 0}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Blood Types</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {statistics.totalBloodTypes || 0}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {statistics.lowStockCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Expiring Soon</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {statistics.expiringSoonCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Alerts */}
      {(alerts.lowStock.length > 0 || alerts.expiringSoon.length > 0) && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Inventory Alerts
            </h3>
          </div>
          
          <div className="space-y-3">
            {alerts.lowStock.map((item) => (
              <div key={`low-${item.bloodType}`} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Low Stock: {item.bloodType}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.unitsAvailable} units available (minimum: {item.minimumThreshold})
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setAddForm({ ...addForm, bloodType: item.bloodType });
                    setShowAddModal(true);
                  }}
                >
                  Add Stock
                </Button>
              </div>
            ))}
            
            {alerts.expiringSoon.map((item) => (
              <div key={`expiring-${item.bloodType}`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Expiring Soon: {item.bloodType}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.expiringSoonCount} units expiring within 7 days
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConsumeForm({ ...consumeForm, bloodType: item.bloodType, reason: 'expired_disposal' });
                    setShowConsumeModal(true);
                  }}
                >
                  Mark as Used
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Inventory Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Current Inventory
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>View Analytics</span>
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-dark-border">
                <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  Blood Type
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  Units Available
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  Min. Threshold
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  Days to Expiry
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  Last Updated
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bloodTypes.map((bloodType) => {
                const item = inventory.find(inv => inv.bloodType === bloodType) || {
                  bloodType,
                  unitsAvailable: 0,
                  minimumThreshold: 5,
                  expirationDates: [],
                  lastUpdated: null
                };
                
                const stockStatus = getStockStatus(item);
                const daysUntilExpiry = getDaysUntilExpiry(item.expirationDates);
                const isEditing = editingThresholds[bloodType];
                
                return (
                  <tr key={bloodType} className="border-b border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                          <Droplet className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {bloodType}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {item.unitsAvailable}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={stockStatus.color} size="sm">
                        {stockStatus.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={editingThresholds[`${bloodType}_value`] || item.minimumThreshold}
                            onChange={(e) => setEditingThresholds(prev => ({
                              ...prev,
                              [`${bloodType}_value`]: e.target.value
                            }))}
                            className="w-20"
                            min="0"
                            max="100"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateThreshold(bloodType, editingThresholds[`${bloodType}_value`])}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingThresholds(prev => ({ ...prev, [bloodType]: false }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-900 dark:text-white">
                            {item.minimumThreshold}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingThresholds(prev => ({
                              ...prev,
                              [bloodType]: true,
                              [`${bloodType}_value`]: item.minimumThreshold
                            }))}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {daysUntilExpiry !== null ? (
                        <span className={`${
                          daysUntilExpiry <= 7 ? 'text-red-600' : 
                          daysUntilExpiry <= 14 ? 'text-yellow-600' : 
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          {daysUntilExpiry} days
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {item.lastUpdated ? (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(item.lastUpdated)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddForm({ ...addForm, bloodType });
                            setShowAddModal(true);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        {item.unitsAvailable > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setConsumeForm({ ...consumeForm, bloodType });
                              setShowConsumeModal(true);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Inventory Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Blood Stock"
      >
        <div className="space-y-4">
          <Select
            label="Blood Type"
            value={addForm.bloodType}
            onChange={(value) => setAddForm({ ...addForm, bloodType: value })}
            options={bloodTypes.map(type => ({ value: type, label: type }))}
            required
          />
          
          <Input
            label="Units to Add"
            type="number"
            value={addForm.unitsToAdd}
            onChange={(e) => setAddForm({ ...addForm, unitsToAdd: e.target.value })}
            min="1"
            required
          />
          
          <Input
            label="Expiration Date"
            type="date"
            value={addForm.expirationDate}
            onChange={(e) => setAddForm({ ...addForm, expirationDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddInventory}
              disabled={!addForm.bloodType || !addForm.unitsToAdd || !addForm.expirationDate}
            >
              Add Stock
            </Button>
          </div>
        </div>
      </Modal>

      {/* Consume Inventory Modal */}
      <Modal
        isOpen={showConsumeModal}
        onClose={() => setShowConsumeModal(false)}
        title="Consume Blood Stock"
      >
        <div className="space-y-4">
          <Select
            label="Blood Type"
            value={consumeForm.bloodType}
            onChange={(value) => setConsumeForm({ ...consumeForm, bloodType: value })}
            options={bloodTypes.map(type => ({ value: type, label: type }))}
            required
          />
          
          <Input
            label="Units to Consume"
            type="number"
            value={consumeForm.unitsToConsume}
            onChange={(e) => setConsumeForm({ ...consumeForm, unitsToConsume: e.target.value })}
            min="1"
            required
          />
          
          <Select
            label="Reason"
            value={consumeForm.reason}
            onChange={(value) => setConsumeForm({ ...consumeForm, reason: value })}
            options={consumeReasons}
            required
          />
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConsumeModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConsumeInventory}
              disabled={!consumeForm.bloodType || !consumeForm.unitsToConsume || !consumeForm.reason}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Consume Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryManagement;