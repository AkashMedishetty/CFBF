const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { auth } = require('../middleware/auth');
const Document = require('../models/Document');
const logger = require('../utils/logger');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/documents');

        // Create directory if it doesn't exist
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (error) {
            logger.error('Failed to create upload directory', 'DOCUMENTS_ROUTES', error);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const filename = `${req.user.id}-${req.body.type}-${uniqueSuffix}${extension}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter
});

// @route   POST /api/v1/documents/upload
// @desc    Upload document
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        logger.api('POST', '/api/v1/documents/upload', null, null, 'DOCUMENTS_ROUTES');

        if (!req.file) {
            logger.warn('No file uploaded', 'DOCUMENTS_ROUTES');
            return res.status(400).json({
                success: false,
                error: {
                    message: 'No file uploaded',
                    code: 'NO_FILE'
                }
            });
        }

        const { type } = req.body;

        if (!type) {
            logger.warn('Document type not specified', 'DOCUMENTS_ROUTES');
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Document type is required',
                    code: 'TYPE_REQUIRED'
                }
            });
        }

        // Validate document type
        const validTypes = ['id_proof', 'address_proof', 'medical_certificate', 'photo'];
        if (!validTypes.includes(type)) {
            logger.warn(`Invalid document type: ${type}`, 'DOCUMENTS_ROUTES');
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid document type',
                    code: 'INVALID_TYPE'
                }
            });
        }

        // Create document record in database
        const document = new Document({
            userId: req.user.id,
            type: type,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            path: req.file.path
        });

        await document.save();

        logger.success(`Document uploaded successfully: ${type} for user ${req.user.id}`, 'DOCUMENTS_ROUTES');

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                id: document._id,
                type: document.type,
                filename: document.filename,
                originalName: document.originalName,
                size: document.size,
                mimeType: document.mimeType,
                uploadedAt: document.uploadedAt,
                verified: document.verified,
                url: document.url
            }
        });

    } catch (error) {
        logger.error('Document upload failed', 'DOCUMENTS_ROUTES', error);

        // Clean up uploaded file if there was an error
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                logger.error('Failed to clean up uploaded file', 'DOCUMENTS_ROUTES', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Document upload failed',
                code: 'UPLOAD_ERROR'
            }
        });
    }
});

// @route   GET /api/v1/documents/view/:filename
// @desc    View/download document
// @access  Private
router.get('/view/:filename', auth, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads/documents', filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            logger.warn(`Document not found: ${filename}`, 'DOCUMENTS_ROUTES');
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Document not found',
                    code: 'FILE_NOT_FOUND'
                }
            });
        }

        // Find document in database and check ownership
        const document = await Document.findOne({ filename });
        if (!document) {
            logger.warn(`Document not found in database: ${filename}`, 'DOCUMENTS_ROUTES');
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Document not found',
                    code: 'DOCUMENT_NOT_FOUND'
                }
            });
        }

        // Security check: ensure the file belongs to the requesting user or user is admin
        if (document.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            logger.warn(`Unauthorized document access attempt: ${filename} by user ${req.user.id}`, 'DOCUMENTS_ROUTES');
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Send file
        res.sendFile(filePath);
        logger.info(`Document served: ${filename} to user ${req.user.id}`, 'DOCUMENTS_ROUTES');

    } catch (error) {
        logger.error('Failed to serve document', 'DOCUMENTS_ROUTES', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to serve document',
                code: 'SERVE_ERROR'
            }
        });
    }
});

// @route   GET /api/v1/documents/list
// @desc    Get user's documents
// @access  Private
router.get('/list', auth, async (req, res) => {
    try {
        logger.api('GET', '/api/v1/documents/list', null, null, 'DOCUMENTS_ROUTES');

        // Admin may request another user's documents via query param
        const { userId } = req.query;
        const targetUserId = (req.user.role === 'admin' && userId) ? userId : req.user.id;
        const documents = await Document.findByUser(targetUserId);

        res.status(200).json({
            success: true,
            data: documents
        });

    } catch (error) {
        logger.error('Failed to fetch documents', 'DOCUMENTS_ROUTES', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch documents',
                code: 'FETCH_ERROR'
            }
        });
    }
});

// @route   DELETE /api/v1/documents/:documentId
// @desc    Delete document
// @access  Private
router.delete('/:documentId', auth, async (req, res) => {
    try {
        const { documentId } = req.params;

        logger.api('DELETE', `/api/v1/documents/${documentId}`, null, null, 'DOCUMENTS_ROUTES');

        // Find document in database
        const document = await Document.findById(documentId);
        if (!document) {
            logger.warn(`Document not found: ${documentId}`, 'DOCUMENTS_ROUTES');
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Document not found',
                    code: 'DOCUMENT_NOT_FOUND'
                }
            });
        }

        // Check ownership
        if (document.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            logger.warn(`Unauthorized document deletion attempt: ${documentId} by user ${req.user.id}`, 'DOCUMENTS_ROUTES');
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Delete file from filesystem
        try {
            await fs.unlink(document.path);
        } catch (error) {
            logger.warn(`Failed to delete file: ${document.path}`, 'DOCUMENTS_ROUTES', error);
        }

        // Remove from database
        await Document.findByIdAndDelete(documentId);

        logger.success(`Document deleted: ${documentId} by user ${req.user.id}`, 'DOCUMENTS_ROUTES');

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        logger.error('Failed to delete document', 'DOCUMENTS_ROUTES', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete document',
                code: 'DELETE_ERROR'
            }
        });
    }
});

// @route   PUT /api/v1/documents/:documentId/verify
// @desc    Verify document (admin only)
// @access  Private (Admin)
router.put('/:documentId/verify', auth, async (req, res) => {
    try {
        const { documentId } = req.params;
        const { verified, rejectionReason } = req.body;

        logger.api('PUT', `/api/v1/documents/${documentId}/verify`, null, null, 'DOCUMENTS_ROUTES');

        // Check if user is admin
        if (req.user.role !== 'admin') {
            logger.warn(`Unauthorized document verification attempt by user ${req.user.id}`, 'DOCUMENTS_ROUTES');
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Admin privileges required.',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Find document
        const document = await Document.findById(documentId);
        if (!document) {
            logger.warn(`Document not found for verification: ${documentId}`, 'DOCUMENTS_ROUTES');
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Document not found',
                    code: 'DOCUMENT_NOT_FOUND'
                }
            });
        }

        // Update verification status
        if (verified) {
            await document.markAsVerified(req.user.id);
            logger.success(`Document verified: ${documentId} by admin ${req.user.id}`, 'DOCUMENTS_ROUTES');
        } else {
            if (!rejectionReason) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Rejection reason is required when rejecting a document',
                        code: 'REJECTION_REASON_REQUIRED'
                    }
                });
            }
            await document.reject(rejectionReason, req.user.id);
            logger.info(`Document rejected: ${documentId} by admin ${req.user.id}`, 'DOCUMENTS_ROUTES');
        }

        // After updating a document, recompute user's documentsVerified flag
        // Documents are now optional, so we'll mark as verified if any document is verified
        try {
            // const requiredTypes = ['id_proof', 'address_proof']; // No longer required
            const verifiedDocs = await Document.find({
                userId: document.userId,
                verified: true
            }).select('type');

            // Mark as verified if user has any verified documents (optional verification)
            const hasAnyVerified = verifiedDocs.length > 0;
            await User.findByIdAndUpdate(document.userId, {
                'verification.documentsVerified': hasAnyVerified,
                updatedBy: req.user.id
            });
        } catch (recalcError) {
            logger.warn('Failed to recalculate user documentsVerified status', 'DOCUMENTS_ROUTES', recalcError);
        }

        res.status(200).json({
            success: true,
            message: verified ? 'Document verified successfully' : 'Document rejected',
            data: {
                id: document._id,
                verified: document.verified,
                verifiedBy: document.verifiedBy,
                verifiedAt: document.verifiedAt,
                rejectionReason: document.rejectionReason
            }
        });

    } catch (error) {
        logger.error('Document verification failed', 'DOCUMENTS_ROUTES', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Document verification failed',
                code: 'VERIFICATION_ERROR'
            }
        });
    }
});

// @route   GET /api/v1/documents/pending
// @desc    Get pending documents for verification (admin only)
// @access  Private (Admin)
router.get('/pending', auth, async (req, res) => {
    try {
        logger.api('GET', '/api/v1/documents/pending', null, null, 'DOCUMENTS_ROUTES');

        // Check if user is admin
        if (req.user.role !== 'admin') {
            logger.warn(`Unauthorized pending documents access by user ${req.user.id}`, 'DOCUMENTS_ROUTES');
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Admin privileges required.',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Get pending documents
        const pendingDocuments = await Document.findUnverified();

        logger.success(`Retrieved ${pendingDocuments.length} pending documents`, 'DOCUMENTS_ROUTES');

        res.status(200).json({
            success: true,
            data: pendingDocuments,
            count: pendingDocuments.length
        });

    } catch (error) {
        logger.error('Failed to fetch pending documents', 'DOCUMENTS_ROUTES', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch pending documents',
                code: 'FETCH_ERROR'
            }
        });
    }
});

module.exports = router;