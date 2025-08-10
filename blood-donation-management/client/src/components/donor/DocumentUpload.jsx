import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  File, 
  Image, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Trash2,
  Camera,
  FileText,
  CreditCard,
  MapPin,
  User
} from 'lucide-react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import logger from '../../utils/logger';

const DocumentUpload = ({ onComplete, initialDocuments = [] }) => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});

  const documentTypes = [
    {
      id: 'id_proof',
      label: 'ID Proof',
      description: 'Aadhaar Card, PAN Card, Passport, or Driving License',
      icon: CreditCard,
      required: true,
      maxSize: 5 * 1024 * 1024, // 5MB
      acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    },
    {
      id: 'address_proof',
      label: 'Address Proof',
      description: 'Utility bill, Bank statement, or Rental agreement',
      icon: MapPin,
      required: true,
      maxSize: 5 * 1024 * 1024,
      acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    },
    {
      id: 'medical_certificate',
      label: 'Medical Certificate',
      description: 'Recent health checkup report (optional)',
      icon: FileText,
      required: false,
      maxSize: 10 * 1024 * 1024, // 10MB
      acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    },
    {
      id: 'photo',
      label: 'Profile Photo',
      description: 'Clear photo of yourself',
      icon: User,
      required: true,
      maxSize: 2 * 1024 * 1024, // 2MB
      acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg']
    }
  ];

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e, documentType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], documentType);
    }
  }, []);

  const handleFileSelect = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, documentType);
    }
  };

  const handleFileUpload = async (file, documentType) => {
    logger.ui('FILE_UPLOAD', 'DocumentUpload', { 
      type: documentType.id, 
      size: file.size,
      name: file.name 
    }, 'DOCUMENT_UPLOAD');

    // Validate file
    const validation = validateFile(file, documentType);
    if (!validation.valid) {
      setErrors(prev => ({
        ...prev,
        [documentType.id]: validation.error
      }));
      return;
    }

    setUploading(true);
    setErrors(prev => ({
      ...prev,
      [documentType.id]: null
    }));

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType.id);
      formData.append('userId', localStorage.getItem('userId'));

      // Get token and validate
      const token = localStorage.getItem('token');
      
      logger.debug('🔍 Getting token for document upload', 'DOCUMENT_UPLOAD', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
        allLocalStorageKeys: Object.keys(localStorage),
        localStorageSize: JSON.stringify(localStorage).length
      });
      
      if (!token) {
        logger.error('❌ No authentication token found', 'DOCUMENT_UPLOAD');
        throw new Error('Authentication token not found. Please log in again.');
      }

      logger.debug('🚀 Starting document upload with token', 'DOCUMENT_UPLOAD', { 
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
        documentType: documentType.id,
        fileSize: file.size,
        fileName: file.name
      });

      logger.debug('📡 Making upload request', 'DOCUMENT_UPLOAD', {
        url: '/api/v1/documents/upload',
        method: 'POST',
        authHeader: `Bearer ${token.substring(0, 20)}...`,
        hasFormData: !!formData
      });

      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      logger.debug('📨 Upload response received', 'DOCUMENT_UPLOAD', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      
      logger.debug('📄 Upload response data', 'DOCUMENT_UPLOAD', {
        success: data.success,
        error: data.error,
        message: data.message,
        hasData: !!data.data
      });

      if (response.status === 401) {
        // Authentication failed
        setErrors(prev => ({
          ...prev,
          [documentType.id]: 'Authentication failed. Please log in again.'
        }));
        logger.error('Authentication failed during upload', 'DOCUMENT_UPLOAD');
        return;
      }

      if (data.success) {
        const newDocument = {
          id: data.data.id,
          type: documentType.id,
          filename: data.data.filename,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          verified: false,
          url: data.data.url
        };

        // Remove existing document of same type and add new one
        setDocuments(prev => [
          ...prev.filter(doc => doc.type !== documentType.id),
          newDocument
        ]);

        logger.success('Document uploaded successfully', 'DOCUMENT_UPLOAD');
      } else {
        setErrors(prev => ({
          ...prev,
          [documentType.id]: data.message || 'Upload failed'
        }));
        logger.error('Document upload failed', 'DOCUMENT_UPLOAD');
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [documentType.id]: 'Network error. Please try again.'
      }));
      logger.error('Network error during document upload', 'DOCUMENT_UPLOAD', error);
    } finally {
      setUploading(false);
    }
  };

  const validateFile = (file, documentType) => {
    // Check file size
    if (file.size > documentType.maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${formatFileSize(documentType.maxSize)}`
      };
    }

    // Check file type
    if (!documentType.acceptedFormats.includes(file.type)) {
      return {
        valid: false,
        error: `Only ${documentType.acceptedFormats.join(', ')} files are allowed`
      };
    }

    return { valid: true };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeDocument = (documentId) => {
    logger.ui('CLICK', 'RemoveDocument', { documentId }, 'DOCUMENT_UPLOAD');
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const previewDocument = (document) => {
    logger.ui('CLICK', 'PreviewDocument', { type: document.type }, 'DOCUMENT_UPLOAD');
    window.open(document.url, '_blank');
  };

  const getDocumentByType = (typeId) => {
    return documents.find(doc => doc.type === typeId);
  };

  const getUploadProgress = () => {
    const requiredTypes = documentTypes.filter(type => type.required);
    const uploadedRequired = requiredTypes.filter(type => 
      getDocumentByType(type.id)
    );
    return {
      completed: uploadedRequired.length,
      total: requiredTypes.length,
      percentage: Math.round((uploadedRequired.length / requiredTypes.length) * 100)
    };
  };

  const handleComplete = async () => {
    logger.ui('CLICK', 'CompleteDocumentUpload', null, 'DOCUMENT_UPLOAD');

    const progress = getUploadProgress();
    if (progress.completed < progress.total) {
      setErrors({ submit: 'Please upload all required documents' });
      return;
    }

    try {
      await onComplete(documents);
      logger.success('Document upload completed', 'DOCUMENT_UPLOAD');
    } catch (error) {
      setErrors({ submit: 'Failed to complete document upload' });
      logger.error('Failed to complete document upload', 'DOCUMENT_UPLOAD', error);
    }
  };

  const progress = getUploadProgress();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4"
        >
          <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Document Verification
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Upload required documents to verify your identity and complete registration
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Upload Progress
          </h3>
          <Badge variant={progress.percentage === 100 ? 'green' : 'blue'}>
            {progress.completed}/{progress.total} Required
          </Badge>
        </div>
        
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {progress.percentage}% complete
        </p>
      </Card>

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentTypes.map((documentType) => {
          const Icon = documentType.icon;
          const existingDocument = getDocumentByType(documentType.id);
          const hasError = errors[documentType.id];

          return (
            <Card key={documentType.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    existingDocument 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      existingDocument 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {documentType.label}
                      {documentType.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {documentType.description}
                    </p>
                  </div>
                </div>
                
                {existingDocument && (
                  <Badge variant="green" className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Uploaded</span>
                  </Badge>
                )}
              </div>

              {existingDocument ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {existingDocument.mimeType.startsWith('image/') ? (
                        <Image className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <File className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {existingDocument.originalName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {formatFileSize(existingDocument.size)} • 
                          {new Date(existingDocument.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewDocument(existingDocument)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(existingDocument.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {existingDocument.verified ? (
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Verified by admin</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Pending verification</span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : hasError
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, documentType)}
                >
                  <input
                    type="file"
                    id={`file-${documentType.id}`}
                    className="hidden"
                    accept={documentType.acceptedFormats.join(',')}
                    onChange={(e) => handleFileSelect(e, documentType)}
                  />
                  
                  <Upload className={`h-8 w-8 mx-auto mb-3 ${
                    hasError ? 'text-red-400' : 'text-slate-400'
                  }`} />
                  
                  <p className={`text-sm font-medium mb-1 ${
                    hasError ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white'
                  }`}>
                    Drop files here or click to browse
                  </p>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                    Max size: {formatFileSize(documentType.maxSize)}
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`file-${documentType.id}`).click()}
                    disabled={uploading}
                    className="flex items-center space-x-2"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Choose File</span>
                  </Button>
                </div>
              )}

              {hasError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
                >
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    {hasError}
                  </span>
                </motion.div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Upload Status */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
            />
            <span className="text-sm font-medium">Uploading document...</span>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
        >
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">{errors.submit}</span>
        </motion.div>
      )}

      {/* Complete Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleComplete}
          disabled={progress.percentage < 100}
          size="lg"
          className="flex items-center space-x-2 px-8"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Complete Document Upload</span>
        </Button>
      </div>
    </div>
  );
};

export default DocumentUpload;