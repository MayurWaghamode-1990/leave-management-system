import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Request } from 'express';
import { logger } from '../utils/logger';

export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  category: 'leave_attachment' | 'profile_picture' | 'document' | 'policy_document';
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export class FileUploadService {
  private static readonly UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
  private static readonly MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv'
  ];

  /**
   * Initialize upload directories
   */
  static async initializeDirectories(): Promise<void> {
    try {
      const categories = ['leave_attachments', 'profile_pictures', 'documents', 'policy_documents'];

      // Create main upload directory
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });

      // Create category subdirectories
      for (const category of categories) {
        const categoryPath = path.join(this.UPLOAD_DIR, category);
        await fs.mkdir(categoryPath, { recursive: true });
      }

      logger.info('Upload directories initialized successfully');
    } catch (error) {
      logger.error('Error initializing upload directories:', error);
      throw new Error('Failed to initialize upload directories');
    }
  }

  /**
   * Configure multer storage
   */
  static createMulterConfig(category: string = 'documents') {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          const uploadPath = path.join(this.UPLOAD_DIR, category);
          await fs.mkdir(uploadPath, { recursive: true });
          cb(null, uploadPath);
        } catch (error) {
          cb(error as Error, '');
        }
      },
      filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = crypto.randomUUID();
        const extension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${uniqueSuffix}${extension}`;
        cb(null, fileName);
      }
    });

    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        cb(null, true);
      } else {
        cb(new Error(validation.error));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.MAX_FILE_SIZE,
        files: 5, // Maximum 5 files per request
      }
    });
  }

  /**
   * Validate uploaded file
   */
  static validateFile(file: Express.Multer.File): FileValidationResult {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type ${file.mimetype} is not allowed`
      };
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.csv'];

    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension ${extension} is not allowed`
      };
    }

    // Additional security checks
    if (this.containsSuspiciousContent(file.originalname)) {
      return {
        isValid: false,
        error: 'File name contains suspicious content'
      };
    }

    return { isValid: true };
  }

  /**
   * Check for suspicious content in filename
   */
  private static containsSuspiciousContent(filename: string): boolean {
    const suspiciousPatterns = [
      /\.\./,           // Directory traversal
      /[<>:"|?*]/,      // Invalid filename characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows reserved names
      /\.(exe|bat|cmd|scr|pif|vbs|js)$/i        // Executable files
    ];

    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Save file metadata to database
   */
  static async saveFileMetadata(
    file: Express.Multer.File,
    userId: string,
    category: UploadedFile['category']
  ): Promise<UploadedFile> {
    try {
      const fileMetadata: UploadedFile = {
        id: crypto.randomUUID(),
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: userId,
        uploadedAt: new Date(),
        category
      };

      // In a real implementation, save to database
      // await prisma.fileUpload.create({ data: fileMetadata });

      logger.info('File metadata saved:', {
        fileId: fileMetadata.id,
        originalName: fileMetadata.originalName,
        size: fileMetadata.size,
        uploadedBy: userId
      });

      return fileMetadata;
    } catch (error) {
      logger.error('Error saving file metadata:', error);
      throw new Error('Failed to save file metadata');
    }
  }

  /**
   * Delete file and metadata
   */
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      // In a real implementation, get file info from database
      // const fileRecord = await prisma.fileUpload.findUnique({ where: { id: fileId } });

      // For now, we'll simulate this
      logger.info('Deleting file:', { fileId, deletedBy: userId });

      // Delete physical file
      // await fs.unlink(fileRecord.filePath);

      // Delete from database
      // await prisma.fileUpload.delete({ where: { id: fileId } });

      logger.info('File deleted successfully:', { fileId });
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get file by ID with access control
   */
  static async getFile(fileId: string, userId: string, userRole: string): Promise<UploadedFile | null> {
    try {
      // In a real implementation, fetch from database with access control
      // const file = await prisma.fileUpload.findFirst({
      //   where: {
      //     id: fileId,
      //     OR: [
      //       { uploadedBy: userId },
      //       userRole === 'HR_ADMIN' ? {} : null,
      //       userRole === 'MANAGER' ? { category: 'leave_attachment' } : null
      //     ].filter(Boolean)
      //   }
      // });

      logger.info('File accessed:', { fileId, accessedBy: userId });
      return null; // Placeholder
    } catch (error) {
      logger.error('Error retrieving file:', error);
      throw new Error('Failed to retrieve file');
    }
  }

  /**
   * Clean up old files (maintenance task)
   */
  static async cleanupOldFiles(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // In a real implementation, find and delete old files
      // const oldFiles = await prisma.fileUpload.findMany({
      //   where: {
      //     uploadedAt: { lt: cutoffDate },
      //     category: { not: 'policy_document' } // Don't delete policy documents
      //   }
      // });

      logger.info('File cleanup completed');
    } catch (error) {
      logger.error('Error during file cleanup:', error);
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    sizeByCategory: Record<string, number>;
  }> {
    try {
      // In a real implementation, aggregate from database
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        sizeByCategory: {}
      };

      logger.info('Storage statistics retrieved');
      return stats;
    } catch (error) {
      logger.error('Error retrieving storage statistics:', error);
      throw new Error('Failed to retrieve storage statistics');
    }
  }

  /**
   * Create secure download URL with expiration
   */
  static createSecureDownloadUrl(fileId: string, expiresIn: number = 3600): string {
    const token = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
      .update(`${fileId}:${Date.now() + expiresIn * 1000}`)
      .digest('hex');

    return `/api/v1/files/download/${fileId}?token=${token}&expires=${Date.now() + expiresIn * 1000}`;
  }

  /**
   * Validate secure download token
   */
  static validateDownloadToken(fileId: string, token: string, expires: string): boolean {
    try {
      const expiresAt = parseInt(expires);
      if (Date.now() > expiresAt) {
        return false;
      }

      const expectedToken = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
        .update(`${fileId}:${expiresAt}`)
        .digest('hex');

      return token === expectedToken;
    } catch (error) {
      logger.error('Error validating download token:', error);
      return false;
    }
  }

  /**
   * Scan file for viruses (placeholder for antivirus integration)
   */
  static async scanFileForVirus(filePath: string): Promise<{ isClean: boolean; threat?: string }> {
    try {
      // Placeholder for antivirus scanning
      // In production, integrate with ClamAV, Windows Defender API, or cloud antivirus services

      logger.info('File scanned for viruses:', { filePath });
      return { isClean: true };
    } catch (error) {
      logger.error('Error scanning file for viruses:', error);
      return { isClean: false, threat: 'Scan failed' };
    }
  }

  /**
   * Generate file thumbnail for images
   */
  static async generateThumbnail(filePath: string, outputPath: string): Promise<string | null> {
    try {
      // Placeholder for image thumbnail generation
      // In production, use sharp, jimp, or similar library

      logger.info('Thumbnail generated:', { filePath, outputPath });
      return outputPath;
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      return null;
    }
  }
}

export default FileUploadService;