/**
 * Camera Upload Component
 * Native camera integration with image optimization
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import imageOptimizer from '../../utils/imageOptimizer';

const CameraUpload = ({
  onImageCapture,
  onImageUpload,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
  multiple = false,
  className = ''
}) => {
  const [capturedImages, setCapturedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Handle camera capture
  const handleCameraCapture = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      for (const file of files) {
        // Validate file
        const validation = imageOptimizer.validateImage(file, {
          maxSize: maxFileSize,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
        });

        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Optimize image
        const optimized = await imageOptimizer.optimizeImage(file, {
          maxWidth,
          maxHeight,
          quality
        });

        const imageData = {
          original: file,
          optimized: optimized.file,
          preview: URL.createObjectURL(optimized.file),
          metadata: {
            originalSize: optimized.originalSize,
            optimizedSize: optimized.optimizedSize,
            compressionRatio: optimized.compressionRatio,
            dimensions: optimized.dimensions,
            format: optimized.format
          }
        };

        setCapturedImages(prev => [...prev, imageData]);

        // Notify parent component
        if (onImageCapture) {
          onImageCapture({
            name: optimized.file.name,
            blob: optimized.file,
            preview: imageData.preview,
            metadata: imageData.metadata
          });
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Camera capture failed:', err);
    } finally {
      setIsProcessing(false);
      // Reset input
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const processedImages = [];

      for (const file of files) {
        // Validate file
        const validation = imageOptimizer.validateImage(file, {
          maxSize: maxFileSize,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        });

        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Optimize image
        const optimized = await imageOptimizer.optimizeImage(file, {
          maxWidth,
          maxHeight,
          quality
        });

        const imageData = {
          original: file,
          optimized: optimized.file,
          preview: URL.createObjectURL(optimized.file),
          metadata: {
            originalSize: optimized.originalSize,
            optimizedSize: optimized.optimizedSize,
            compressionRatio: optimized.compressionRatio,
            dimensions: optimized.dimensions,
            format: optimized.format
          }
        };

        processedImages.push(imageData);
      }

      setCapturedImages(prev => [...prev, ...processedImages]);

      // Notify parent component
      if (onImageUpload) {
        onImageUpload(processedImages.map(img => ({
          name: img.optimized.name,
          blob: img.optimized,
          preview: img.preview,
          metadata: img.metadata
        })));
      }
    } catch (err) {
      setError(err.message);
      console.error('File upload failed:', err);
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove captured image
  const removeImage = (index) => {
    setCapturedImages(prev => {
      const newImages = [...prev];
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Clear all images
  const clearAllImages = () => {
    capturedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setCapturedImages([]);
    setError(null);
  };

  // Check if camera is available
  const isCameraAvailable = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

  return (
    <div className={`camera-upload ${className}`}>
      {/* Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Camera Capture Button */}
        {isCameraAvailable && (
          <div className="flex-1">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple={multiple}
              onChange={handleCameraCapture}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              <Camera className="w-5 h-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Take Photo'}
            </button>
          </div>
        )}

        {/* File Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full flex items-center justify-center px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            style={{ minHeight: '44px' }}
          >
            <Upload className="w-5 h-5 mr-2" />
            {isProcessing ? 'Processing...' : 'Upload Image'}
          </button>
        </div>

        {/* Clear All Button */}
        {capturedImages.length > 0 && (
          <button
            type="button"
            onClick={clearAllImages}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors touch-manipulation"
            style={{ minHeight: '44px' }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 dark:text-blue-200">
                Optimizing images...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captured Images Grid */}
      {capturedImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capturedImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700"
            >
              {/* Image Preview */}
              <div className="aspect-square relative">
                <img
                  src={image.preview}
                  alt={`Captured ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Remove Button */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors touch-manipulation"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Optimization Badge */}
                <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                  -{image.metadata.compressionRatio}%
                </div>
              </div>

              {/* Image Metadata */}
              <div className="p-3">
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium">{image.metadata.format.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium">
                      {(image.metadata.optimizedSize / 1024).toFixed(1)}KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span className="font-medium">
                      {image.metadata.dimensions.width}×{image.metadata.dimensions.height}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Instructions */}
      {capturedImages.length === 0 && !isProcessing && (
        <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No images captured yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {isCameraAvailable 
              ? 'Take a photo with your camera or upload from your device'
              : 'Upload images from your device'
            }
          </p>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p>Max file size: {(maxFileSize / 1024 / 1024).toFixed(1)}MB</p>
            <p>Supported formats: JPEG, PNG, WebP{multiple ? ', GIF' : ''}</p>
            <p>Images will be automatically optimized</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraUpload;