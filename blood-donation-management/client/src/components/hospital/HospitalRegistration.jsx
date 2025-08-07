import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    MapPin,
    Clock,
    FileText,
    User,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Upload,
    X
} from 'lucide-react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import LocationPicker from '../ui/LocationPicker';
import logger from '../../utils/logger';

const HospitalRegistration = ({ className = '' }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const [hospitalData, setHospitalData] = useState({
        name: '',
        type: '',
        registrationNumber: '',
        location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139] // Default to Delhi
        },
        address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        },
        contactInfo: {
            phone: '',
            email: '',
            website: '',
            emergencyContact: ''
        },
        operatingHours: {
            monday: { open: '09:00', close: '17:00', is24Hours: false },
            tuesday: { open: '09:00', close: '17:00', is24Hours: false },
            wednesday: { open: '09:00', close: '17:00', is24Hours: false },
            thursday: { open: '09:00', close: '17:00', is24Hours: false },
            friday: { open: '09:00', close: '17:00', is24Hours: false },
            saturday: { open: '09:00', close: '17:00', is24Hours: false },
            sunday: { open: '09:00', close: '17:00', is24Hours: false }
        },
        services: [],
        certifications: []
    });

    const [adminUserData, setAdminUserData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [verificationDocuments, setVerificationDocuments] = useState([]);

    // Add keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle keyboard shortcuts when not in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        if (currentStep > 1) prevStep();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        if (currentStep < steps.length) nextStep();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (currentStep === steps.length) {
                            handleSubmit();
                        } else {
                            nextStep();
                        }
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentStep, steps.length]);

    // Auto-save form data to localStorage
    useEffect(() => {
        const formData = {
            hospitalData,
            adminUserData,
            currentStep,
            verificationDocuments: verificationDocuments.map(doc => ({
                type: doc.type,
                name: doc.name,
                size: doc.size
            }))
        };
        localStorage.setItem('hospitalRegistrationDraft', JSON.stringify(formData));
    }, [hospitalData, adminUserData, currentStep, verificationDocuments]);

    // Load saved form data on component mount
    useEffect(() => {
        const savedData = localStorage.getItem('hospitalRegistrationDraft');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.hospitalData) setHospitalData(parsed.hospitalData);
                if (parsed.adminUserData) setAdminUserData(parsed.adminUserData);
                if (parsed.currentStep && parsed.currentStep !== steps.length) {
                    setCurrentStep(parsed.currentStep);
                }
            } catch (error) {
                logger.warn('Failed to load saved registration data', 'HOSPITAL_REGISTRATION');
            }
        }
    }, []);

    const hospitalTypes = [
        { value: 'hospital', label: 'Hospital' },
        { value: 'blood_bank', label: 'Blood Bank' },
        { value: 'clinic', label: 'Clinic' },
        { value: 'diagnostic_center', label: 'Diagnostic Center' }
    ];

    const availableServices = [
        { value: 'blood_donation', label: 'Blood Donation' },
        { value: 'blood_testing', label: 'Blood Testing' },
        { value: 'blood_storage', label: 'Blood Storage' },
        { value: 'platelet_donation', label: 'Platelet Donation' },
        { value: 'plasma_donation', label: 'Plasma Donation' },
        { value: 'emergency_services', label: 'Emergency Services' },
        { value: 'mobile_blood_drive', label: 'Mobile Blood Drive' },
        { value: 'blood_component_separation', label: 'Blood Component Separation' },
        { value: 'cross_matching', label: 'Cross Matching' },
        { value: 'blood_screening', label: 'Blood Screening' }
    ];

    const documentTypes = [
        { value: 'license', label: 'Medical License' },
        { value: 'registration', label: 'Hospital Registration' },
        { value: 'accreditation', label: 'Accreditation Certificate' },
        { value: 'insurance', label: 'Insurance Certificate' },
        { value: 'other', label: 'Other' }
    ];

    const steps = [
        { id: 1, title: 'Basic Information', icon: Building2 },
        { id: 2, title: 'Location & Contact', icon: MapPin },
        { id: 3, title: 'Services & Hours', icon: Clock },
        { id: 4, title: 'Admin Account', icon: User },
        { id: 5, title: 'Documents', icon: FileText }
    ];

    const handleHospitalDataChange = (field, value) => {
        setHospitalData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleNestedDataChange = (section, field, value) => {
        setHospitalData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleAdminDataChange = (field, value) => {
        setAdminUserData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field
        if (errors[`admin.${field}`]) {
            setErrors(prev => ({
                ...prev,
                [`admin.${field}`]: null
            }));
        }
    };

    const handleServiceToggle = (serviceValue) => {
        setHospitalData(prev => ({
            ...prev,
            services: prev.services.includes(serviceValue)
                ? prev.services.filter(s => s !== serviceValue)
                : [...prev.services, serviceValue]
        }));
    };

    const handleOperatingHoursChange = (day, field, value) => {
        setHospitalData(prev => ({
            ...prev,
            operatingHours: {
                ...prev.operatingHours,
                [day]: {
                    ...prev.operatingHours[day],
                    [field]: value
                }
            }
        }));
    };

    const handleLocationChange = (coordinates) => {
        setHospitalData(prev => ({
            ...prev,
            location: {
                type: 'Point',
                coordinates
            }
        }));
    };

    const handleDocumentUpload = (file, type) => {
        // In a real app, this would upload to a file storage service
        const mockUrl = URL.createObjectURL(file);

        setVerificationDocuments(prev => [
            ...prev,
            {
                type,
                file,
                url: mockUrl,
                name: file.name,
                size: file.size
            }
        ]);
    };

    const removeDocument = (index) => {
        setVerificationDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep = (step) => {
        const newErrors = {};

        switch (step) {
            case 1:
                if (!hospitalData.name.trim()) {
                    newErrors.name = 'Hospital name is required';
                } else if (hospitalData.name.trim().length < 3) {
                    newErrors.name = 'Hospital name must be at least 3 characters';
                }
                
                if (!hospitalData.type) {
                    newErrors.type = 'Hospital type is required';
                }
                
                if (!hospitalData.registrationNumber.trim()) {
                    newErrors.registrationNumber = 'Registration number is required';
                } else if (hospitalData.registrationNumber.trim().length < 5) {
                    newErrors.registrationNumber = 'Registration number must be at least 5 characters';
                }
                break;

            case 2:
                if (!hospitalData.address.street.trim()) {
                    newErrors['address.street'] = 'Street address is required';
                }
                
                if (!hospitalData.address.city.trim()) {
                    newErrors['address.city'] = 'City is required';
                }
                
                if (!hospitalData.address.state.trim()) {
                    newErrors['address.state'] = 'State is required';
                }
                
                if (!hospitalData.address.pincode.trim()) {
                    newErrors['address.pincode'] = 'Pincode is required';
                } else if (!/^\d{6}$/.test(hospitalData.address.pincode.trim())) {
                    newErrors['address.pincode'] = 'Pincode must be 6 digits';
                }
                
                if (!hospitalData.contactInfo.phone.trim()) {
                    newErrors['contactInfo.phone'] = 'Phone number is required';
                } else if (!/^[+]?[\d\s\-\(\)]{10,15}$/.test(hospitalData.contactInfo.phone.trim())) {
                    newErrors['contactInfo.phone'] = 'Please enter a valid phone number';
                }
                
                if (!hospitalData.contactInfo.email.trim()) {
                    newErrors['contactInfo.email'] = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hospitalData.contactInfo.email.trim())) {
                    newErrors['contactInfo.email'] = 'Please enter a valid email address';
                }
                
                if (hospitalData.contactInfo.website && !/^https?:\/\/.+/.test(hospitalData.contactInfo.website.trim())) {
                    newErrors['contactInfo.website'] = 'Website must start with http:// or https://';
                }
                break;

            case 3:
                if (hospitalData.services.length === 0) newErrors.services = 'At least one service must be selected';
                break;

            case 4:
                if (!adminUserData.name.trim()) {
                    newErrors['admin.name'] = 'Admin name is required';
                } else if (adminUserData.name.trim().length < 2) {
                    newErrors['admin.name'] = 'Admin name must be at least 2 characters';
                }
                
                if (!adminUserData.email.trim()) {
                    newErrors['admin.email'] = 'Admin email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminUserData.email.trim())) {
                    newErrors['admin.email'] = 'Please enter a valid email address';
                }
                
                if (!adminUserData.phone.trim()) {
                    newErrors['admin.phone'] = 'Admin phone is required';
                } else if (!/^[+]?[\d\s\-\(\)]{10,15}$/.test(adminUserData.phone.trim())) {
                    newErrors['admin.phone'] = 'Please enter a valid phone number';
                }
                
                if (!adminUserData.password) {
                    newErrors['admin.password'] = 'Password is required';
                } else if (adminUserData.password.length < 8) {
                    newErrors['admin.password'] = 'Password must be at least 8 characters';
                } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(adminUserData.password)) {
                    newErrors['admin.password'] = 'Password must contain uppercase, lowercase, number and special character';
                }
                
                if (adminUserData.password !== adminUserData.confirmPassword) {
                    newErrors['admin.confirmPassword'] = 'Passwords do not match';
                }
                break;

            case 5:
                if (verificationDocuments.length === 0) {
                    newErrors.documents = 'At least one verification document is required';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setIsSubmitting(true);

        try {
            // Clear any previous errors
            setErrors({});

            // Prepare form data
            const formData = {
                hospitalData: {
                    ...hospitalData,
                    verificationDocuments: verificationDocuments.map(doc => ({
                        type: doc.type,
                        url: doc.url // In real app, this would be the uploaded file URL
                    }))
                },
                adminUserData
            };

            // Submit registration
            const response = await fetch('/api/v1/hospitals/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('A hospital with this registration number or email already exists');
                } else if (response.status === 400) {
                    throw new Error('Please check your information and try again');
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later');
                } else {
                    throw new Error('Registration failed. Please try again');
                }
            }

            const result = await response.json();

            if (result.success) {
                setSubmitSuccess(true);
                // Clear saved draft data on successful submission
                localStorage.removeItem('hospitalRegistrationDraft');
                logger.success('Hospital registration submitted successfully', 'HOSPITAL_REGISTRATION');
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            logger.error('Error submitting hospital registration', 'HOSPITAL_REGISTRATION', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setErrors({ submit: 'Network error. Please check your connection and try again.' });
            } else {
                setErrors({ submit: error.message || 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className={`max-w-2xl mx-auto ${className}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Card className="p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Registration Submitted Successfully!
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Your hospital registration has been submitted for review. You will receive a verification email shortly.
                            Our team will review your application and notify you of the status within 2-3 business days.
                        </p>
                        <Button onClick={() => window.location.href = '/login'}>
                            Go to Login
                        </Button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`max-w-4xl mx-auto ${className}`}>
            {/* Header */}
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Hospital Registration
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Join our network of healthcare partners to help save lives
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    💡 Your progress is automatically saved. Use Ctrl+← → to navigate between steps.
                </div>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Step {currentStep} of {steps.length}</span>
                        <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / steps.length) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isCompleted
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : isActive
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'border-slate-300 text-slate-400'
                                    }`}>
                                    {isCompleted ? (
                                        <CheckCircle className="h-5 w-5" />
                                    ) : (
                                        <Icon className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                                        }`}>
                                        Step {step.id}
                                    </p>
                                    <p className={`text-xs ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'
                                        }`}>
                                        {step.title}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-slate-300'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Card className="p-8">
                <AnimatePresence mode="wait">
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Basic Information
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Tell us about your hospital or blood bank
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Hospital/Facility Name"
                                    value={hospitalData.name}
                                    onChange={(e) => handleHospitalDataChange('name', e.target.value)}
                                    error={errors.name}
                                    required
                                />

                                <Select
                                    label="Facility Type"
                                    value={hospitalData.type}
                                    onChange={(value) => handleHospitalDataChange('type', value)}
                                    options={hospitalTypes}
                                    error={errors.type}
                                    required
                                />

                                <Input
                                    label="Registration Number"
                                    value={hospitalData.registrationNumber}
                                    onChange={(e) => handleHospitalDataChange('registrationNumber', e.target.value)}
                                    error={errors.registrationNumber}
                                    required
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Location & Contact */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Location & Contact Information
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Provide your facility's location and contact details
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Location on Map
                                    </label>
                                    <LocationPicker
                                        initialCoordinates={hospitalData.location.coordinates}
                                        onLocationChange={handleLocationChange}
                                        height="300px"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Street Address"
                                        value={hospitalData.address.street}
                                        onChange={(e) => handleNestedDataChange('address', 'street', e.target.value)}
                                        error={errors['address.street']}
                                        required
                                    />

                                    <Input
                                        label="City"
                                        value={hospitalData.address.city}
                                        onChange={(e) => handleNestedDataChange('address', 'city', e.target.value)}
                                        error={errors['address.city']}
                                        required
                                    />

                                    <Input
                                        label="State"
                                        value={hospitalData.address.state}
                                        onChange={(e) => handleNestedDataChange('address', 'state', e.target.value)}
                                        error={errors['address.state']}
                                        required
                                    />

                                    <Input
                                        label="Pincode"
                                        value={hospitalData.address.pincode}
                                        onChange={(e) => handleNestedDataChange('address', 'pincode', e.target.value)}
                                        error={errors['address.pincode']}
                                        required
                                    />

                                    <Input
                                        label="Phone Number"
                                        type="tel"
                                        value={hospitalData.contactInfo.phone}
                                        onChange={(e) => handleNestedDataChange('contactInfo', 'phone', e.target.value)}
                                        error={errors['contactInfo.phone']}
                                        required
                                    />

                                    <Input
                                        label="Email Address"
                                        type="email"
                                        value={hospitalData.contactInfo.email}
                                        onChange={(e) => handleNestedDataChange('contactInfo', 'email', e.target.value)}
                                        error={errors['contactInfo.email']}
                                        required
                                    />

                                    <Input
                                        label="Website (Optional)"
                                        type="url"
                                        value={hospitalData.contactInfo.website}
                                        onChange={(e) => handleNestedDataChange('contactInfo', 'website', e.target.value)}
                                    />

                                    <Input
                                        label="Emergency Contact (Optional)"
                                        type="tel"
                                        value={hospitalData.contactInfo.emergencyContact}
                                        onChange={(e) => handleNestedDataChange('contactInfo', 'emergencyContact', e.target.value)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Services & Hours */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Services & Operating Hours
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Select the services you provide and set your operating hours
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <fieldset>
                                        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                            Services Provided *
                                        </legend>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="group" aria-labelledby="services-legend">
                                            {availableServices.map((service) => (
                                                <label key={service.value} className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={hospitalData.services.includes(service.value)}
                                                        onChange={() => handleServiceToggle(service.value)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        aria-describedby={errors.services ? 'services-error' : undefined}
                                                    />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                                        {service.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                    {errors.services && (
                                        <p id="services-error" className="mt-2 text-sm text-red-600" role="alert">
                                            {errors.services}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                        Operating Hours
                                    </label>
                                    <div className="space-y-3">
                                        {Object.keys(hospitalData.operatingHours).map((day) => (
                                            <div key={day} className="flex items-center space-x-4 p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                                                <div className="w-20">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                                                        {day}
                                                    </span>
                                                </div>

                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={hospitalData.operatingHours[day].is24Hours}
                                                        onChange={(e) => handleOperatingHoursChange(day, 'is24Hours', e.target.checked)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">24 Hours</span>
                                                </label>

                                                {!hospitalData.operatingHours[day].is24Hours && (
                                                    <>
                                                        <input
                                                            type="time"
                                                            value={hospitalData.operatingHours[day].open}
                                                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                                                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm"
                                                        />
                                                        <span className="text-slate-400">to</span>
                                                        <input
                                                            type="time"
                                                            value={hospitalData.operatingHours[day].close}
                                                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                                                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Admin Account */}
                    {currentStep === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Administrator Account
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Create an admin account to manage your hospital profile
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Admin Full Name"
                                    value={adminUserData.name}
                                    onChange={(e) => handleAdminDataChange('name', e.target.value)}
                                    error={errors['admin.name']}
                                    required
                                />

                                <Input
                                    label="Admin Email"
                                    type="email"
                                    value={adminUserData.email}
                                    onChange={(e) => handleAdminDataChange('email', e.target.value)}
                                    error={errors['admin.email']}
                                    required
                                />

                                <Input
                                    label="Admin Phone"
                                    type="tel"
                                    value={adminUserData.phone}
                                    onChange={(e) => handleAdminDataChange('phone', e.target.value)}
                                    error={errors['admin.phone']}
                                    required
                                />

                                <div />

                                <Input
                                    label="Password"
                                    type="password"
                                    value={adminUserData.password}
                                    onChange={(e) => handleAdminDataChange('password', e.target.value)}
                                    error={errors['admin.password']}
                                    required
                                />

                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    value={adminUserData.confirmPassword}
                                    onChange={(e) => handleAdminDataChange('confirmPassword', e.target.value)}
                                    error={errors['admin.confirmPassword']}
                                    required
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Documents */}
                    {currentStep === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Verification Documents
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Upload required documents for verification
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                        Upload Documents *
                                    </label>

                                    {documentTypes.map((docType) => (
                                        <div key={docType.value} className="mb-4 p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {docType.label}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            handleDocumentUpload(file, docType.value);
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id={`upload-${docType.value}`}
                                                />
                                                <label
                                                    htmlFor={`upload-${docType.value}`}
                                                    className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded cursor-pointer hover:bg-blue-100"
                                                >
                                                    <Upload className="h-4 w-4" />
                                                    <span className="text-sm">Upload</span>
                                                </label>
                                            </div>

                                            {verificationDocuments
                                                .filter(doc => doc.type === docType.value)
                                                .map((doc, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded">
                                                        <div className="flex items-center space-x-2">
                                                            <FileText className="h-4 w-4 text-slate-500" />
                                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                                {doc.name}
                                                            </span>
                                                            <Badge variant="green" size="sm">Uploaded</Badge>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeDocument(verificationDocuments.indexOf(doc))}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    ))}

                                    {errors.documents && (
                                        <p className="text-sm text-red-600">{errors.documents}</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center space-x-2"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (currentStep > 1) prevStep();
                            }
                        }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Previous</span>
                    </Button>

                    {currentStep < steps.length ? (
                        <Button
                            onClick={nextStep}
                            className="flex items-center space-x-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    nextStep();
                                }
                            }}
                        >
                            <span>Next</span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            className="flex items-center space-x-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (!isSubmitting) handleSubmit();
                                }
                            }}
                        >
                            <span>{isSubmitting ? 'Submitting...' : 'Submit Registration'}</span>
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {errors.submit && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm text-red-600">{errors.submit}</span>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default HospitalRegistration;