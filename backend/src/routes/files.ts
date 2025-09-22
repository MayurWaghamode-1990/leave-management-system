import { Router, Request, Response } from 'express';
import { authenticate as authMiddleware, authorize } from '../middleware/auth';
import { FileUploadService } from '../services/fileUploadService';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Initialize upload directories on startup
FileUploadService.initializeDirectories().catch(console.error);

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     summary: Upload files
 *     description: Upload files with validation and security checks
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [leave_attachment, profile_picture, document, policy_document]
 *         description: File category
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 *       413:
 *         description: File too large
 */
router.post('/upload',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const category = (req.query.category as string) || 'documents';
      const user = (req as any).user;

      // Configure multer for this request
      const upload = FileUploadService.createMulterConfig(category);

      // Handle file upload
      upload.array('files', 5)(req, res, async (err) => {
        if (err) {
          logger.error('File upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        const uploadedFiles = req.files as Express.Multer.File[];

        if (!uploadedFiles || uploadedFiles.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No files uploaded',
          });
        }

        try {
          // Save metadata for each file
          const fileMetadataPromises = uploadedFiles.map(file =>
            FileUploadService.saveFileMetadata(
              file,
              user.id,
              category as any
            )
          );

          const fileMetadata = await Promise.all(fileMetadataPromises);

          // Scan files for viruses (in production)
          const virusScanPromises = uploadedFiles.map(file =>
            FileUploadService.scanFileForVirus(file.path)
          );

          const scanResults = await Promise.all(virusScanPromises);

          // Check if any files failed virus scan
          const infectedFiles = scanResults
            .map((result, index) => ({ result, file: uploadedFiles[index] }))
            .filter(({ result }) => !result.isClean);

          if (infectedFiles.length > 0) {
            // Delete infected files
            await Promise.all(
              infectedFiles.map(({ file }) => fs.unlink(file.path))
            );

            return res.status(400).json({
              success: false,
              message: 'Some files failed security scan and were rejected',
              rejectedFiles: infectedFiles.map(({ file, result }) => ({
                filename: file.originalname,
                threat: result.threat,
              })),
            });
          }

          // Generate thumbnails for images
          const thumbnailPromises = uploadedFiles
            .filter(file => file.mimetype.startsWith('image/'))
            .map(file => {
              const thumbnailPath = path.join(
                path.dirname(file.path),
                'thumbnails',
                `thumb_${file.filename}`
              );
              return FileUploadService.generateThumbnail(file.path, thumbnailPath);
            });

          await Promise.all(thumbnailPromises);

          res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            data: {
              files: fileMetadata.map(metadata => ({
                id: metadata.id,
                originalName: metadata.originalName,
                fileName: metadata.fileName,
                size: metadata.size,
                mimeType: metadata.mimeType,
                downloadUrl: FileUploadService.createSecureDownloadUrl(metadata.id),
                uploadedAt: metadata.uploadedAt,
              })),
            },
          });

        } catch (metadataError) {
          logger.error('Error processing file metadata:', metadataError);

          // Clean up uploaded files on error
          await Promise.all(
            uploadedFiles.map(file =>
              fs.unlink(file.path).catch(console.error)
            )
          );

          res.status(500).json({
            success: false,
            message: 'Failed to process uploaded files',
          });
        }
      });

    } catch (error) {
      logger.error('Error in file upload endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during file upload',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/files/download/{fileId}:
 *   get:
 *     summary: Download file
 *     description: Download file with secure token validation
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: expires
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File content
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: File not found
 */
router.get('/download/:fileId',
  param('fileId').isString().notEmpty(),
  query('token').isString().notEmpty(),
  query('expires').isString().notEmpty(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const { token, expires } = req.query;

      // Validate download token
      if (!FileUploadService.validateDownloadToken(
        fileId,
        token as string,
        expires as string
      )) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired download token',
        });
      }

      // Get file metadata (placeholder - implement with database)
      // const fileMetadata = await FileUploadService.getFile(fileId, userId, userRole);

      // For now, send a placeholder response
      res.json({
        success: true,
        message: 'File download endpoint - implement with actual file serving',
        fileId,
      });

    } catch (error) {
      logger.error('Error in file download endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download file',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/files/{fileId}:
 *   delete:
 *     summary: Delete file
 *     description: Delete file and its metadata
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       403:
 *         description: Not authorized to delete this file
 */
router.delete('/:fileId',
  authMiddleware,
  param('fileId').isString().notEmpty(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const user = (req as any).user;

      await FileUploadService.deleteFile(fileId, user.id);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });

    } catch (error) {
      logger.error('Error in file delete endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/files/storage/stats:
 *   get:
 *     summary: Get storage statistics
 *     description: Get file storage usage statistics (Admin only)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage statistics
 */
router.get('/storage/stats',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const stats = await FileUploadService.getStorageStats();

      res.json({
        success: true,
        message: 'Storage statistics retrieved successfully',
        data: stats,
      });

    } catch (error) {
      logger.error('Error retrieving storage statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve storage statistics',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/files/cleanup:
 *   post:
 *     summary: Clean up old files
 *     description: Remove files older than specified days (Admin only)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysOld:
 *                 type: number
 *                 minimum: 1
 *                 description: Delete files older than this many days
 *     responses:
 *       200:
 *         description: Cleanup completed
 */
router.post('/cleanup',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { daysOld = 30 } = req.body;

      await FileUploadService.cleanupOldFiles(daysOld);

      res.json({
        success: true,
        message: `File cleanup completed for files older than ${daysOld} days`,
      });

    } catch (error) {
      logger.error('Error in file cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean up files',
      });
    }
  }
);

export default router;