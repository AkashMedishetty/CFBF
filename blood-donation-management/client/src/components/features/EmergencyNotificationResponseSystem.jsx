/**
 * EmergencyNotificationResponseSystem Component
 * Comprehensive emergency notification response system with hospital contact integration,
 * donor coordination, and analytics
 */

import React, { useState } from 'react';
import { useEmergencyNotificationResponse } from '../../hooks/useEmergencyNotificationResponse';

const EmergencyNotificationResponseSystem = () => {
  const {
    isInitialized,
    activeEmergencies,
    analytics,
    isLoading,
    error,
    hasActiveEmergencies,
    totalEmergencies,
    successfulMatches,
    averageResponseTime,
    responseRate,
    deliverySuccessRate,
    createEmergencyRequest,
    acceptEmergencyRequest,
    declineEmergencyRequest,
    contactHospital,
    shareEmergencyWithNetwork,
    getEmergencyDetails,
    refreshAnalytics,
    testEmergencySystem
  } = useEmergencyNotificationResponse();

  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmergencyData, setNewEmergencyData] = useState({
    bloodType: 'O-',
    urgency: 'critical',
    hospitalName: 'City General Hospital',
    hospitalPhone: '+1-555-0123',
    patientAge: 35,
    unitsNeeded: 1,
    specialInstructions: ''
  });

  // Handle create emergency request
  const handleCreateEmergency = async (e) => {
    e.preventDefault();
    
    try {
      const emergencyRequest = {
        bloodType: newEmergencyData.bloodType,
        urgency: newEmergencyData.urgency,
        hospital: {
          id: `hospital-${Date.now()}`,
          name: newEmergencyData.hospitalName,
          phone: newEmergencyData.hospitalPhone,
          address: '123 Hospital Street, City',
          location: { lat: 40.7128, lng: -74.0060 }
        },
        patient: {
          name: 'Emergency Patient',
          age: parseInt(newEmergencyData.patientAge),
          condition: 'Emergency medical procedure'
        },
        unitsNeeded: parseInt(newEmergencyData.unitsNeeded),
        neededBy: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        specialInstructions: newEmergencyData.specialInstructions,
        distance: Math.random() * 10 + 1 // Random distance 1-11km
      };

      const emergencyId = await createEmergencyRequest(emergencyRequest);
      alert(`Emergency request created successfully! ID: ${emergencyId}`);
      setShowCreateForm(false);
      
      // Reset form
      setNewEmergencyData({
        bloodType: 'O-',
        urgency: 'critical',
        hospitalName: 'City General Hospital',
        hospitalPhone: '+1-555-0123',
        patientAge: 35,
        unitsNeeded: 1,
        specialInstructions: ''
      });
      
    } catch (err) {
      alert(`Failed to create emergency request: ${err.message}`);
    }
  };

  // Handle test system
  const handleTestSystem = async () => {
    try {
      const emergencyId = await testEmergencySystem();
      alert(`Test emergency system initiated! Emergency ID: ${emergencyId}`);
    } catch (err) {
      alert(`Failed to test system: ${err.message}`);
    }
  };

  // Handle emergency action
  const handleEmergencyAction = async (emergencyId, action, additionalData = {}) => {
    try {
      const donorId = 'current-user'; // This would come from auth context
      
      switch (action) {
        case 'accept':
          await acceptEmergencyRequest(emergencyId, donorId, additionalData);
          alert('Emergency request accepted! Hospital has been notified.');
          break;
          
        case 'decline':
          await declineEmergencyRequest(emergencyId, donorId, additionalData.reason || '');
          alert('Response recorded. Thank you for letting us know.');
          break;
          
        case 'call':
          const emergency = getEmergencyDetails(emergencyId);
          if (emergency?.hospital?.phone) {
            await contactHospital(emergencyId, emergency.hospital.phone);
          }
          break;
          
        case 'share':
          await shareEmergencyWithNetwork(emergencyId);
          break;
          
        default:
          console.log('Unknown action:', action);
      }
      
    } catch (err) {
      alert(`Failed to perform action: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Initializing emergency response system...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Emergency Response System Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Emergency Notification Response System</h2>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isInitialized ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Total Emergencies</p>
                  <p className="text-2xl font-semibold text-blue-600">{totalEmergencies}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Successful Matches</p>
                  <p className="text-2xl font-semibold text-green-600">{successfulMatches}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Avg Response Time</p>
                  <p className="text-2xl font-semibold text-yellow-600">{averageResponseTime}s</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Response Rate</p>
                  <p className="text-2xl font-semibold text-purple-600">{responseRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-indigo-900">Delivery Success</p>
                  <p className="text-2xl font-semibold text-indigo-600">{deliverySuccessRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Create Emergency Request
          </button>

          <button
            onClick={handleTestSystem}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Test System
          </button>

          <button
            onClick={refreshAnalytics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Analytics
          </button>
        </div>
      </div>

      {/* Create Emergency Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Emergency Blood Request</h3>
          
          <form onSubmit={handleCreateEmergency} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                <select
                  value={newEmergencyData.bloodType}
                  onChange={(e) => setNewEmergencyData({...newEmergencyData, bloodType: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Urgency Level</label>
                <select
                  value={newEmergencyData.urgency}
                  onChange={(e) => setNewEmergencyData({...newEmergencyData, urgency: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                >
                  <option value="critical">Critical (Life-threatening)</option>
                  <option value="urgent">Urgent (Within 6 hours)</option>
                  <option value="normal">Normal (Within 24 hours)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                <input
                  type="text"
                  value={newEmergencyData.hospitalName}
                  onChange={(e) => setNewEmergencyData({...newEmergencyData, hospitalName: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hospital Phone</label>
                <input
                  type="tel"
                  value={newEmergencyData.hospitalPhone}
                  onChange={(e) => setNewEmergencyData({...newEmergencyData, hospitalPhone: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newEmergencyData.patientAge}
                  onChange={(e) => setNewEmergencyData({...newEmergencyData, patientAge: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Units Needed</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newEmergencyData.unitsNeeded}
                  onChange={(e) => setNewEmergencyData({...newEmergencyData, unitsNeeded: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
              <textarea
                value={newEmergencyData.specialInstructions}
                onChange={(e) => setNewEmergencyData({...newEmergencyData, specialInstructions: e.target.value})}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                placeholder="Any special instructions for donors..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                Create Emergency Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Emergencies */}
      {hasActiveEmergencies && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Emergency Requests</h3>
          
          <div className="space-y-4">
            {activeEmergencies.map((emergency) => (
              <div key={emergency.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${
                      emergency.priority >= 150 ? 'bg-red-500' : 
                      emergency.priority >= 100 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}></div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {emergency.bloodType} Blood Needed - {emergency.urgency.toUpperCase()}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Priority: {emergency.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(emergency.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Hospital:</strong> {emergency.hospital.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Phone:</strong> {emergency.hospital.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Patient Age:</strong> {emergency.patient?.age || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Units Needed:</strong> {emergency.unitsNeeded || 1}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Responses:</strong> {emergency.responses?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Selected Donors:</strong> {emergency.selectedDonors?.length || 0}
                    </p>
                  </div>
                </div>

                {emergency.specialInstructions && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Special Instructions:</strong> {emergency.specialInstructions}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEmergencyAction(emergency.id, 'accept')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept
                  </button>

                  <button
                    onClick={() => handleEmergencyAction(emergency.id, 'decline', { reason: 'Not available' })}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Decline
                  </button>

                  <button
                    onClick={() => handleEmergencyAction(emergency.id, 'call')}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Hospital
                  </button>

                  <button
                    onClick={() => handleEmergencyAction(emergency.id, 'share')}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Active Emergencies */}
      {!hasActiveEmergencies && isInitialized && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Emergencies</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are currently no active emergency blood requests in the system.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmergencyNotificationResponseSystem;