import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Visibility,
  Download,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
  Error as ErrorIcon,
  CheckCircle,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '@/config/api';
import { toast } from 'react-hot-toast';

interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
  uploadedAt: string;
  status: 'uploading' | 'uploaded' | 'error';
  progress?: number;
  error?: string;
}

interface EnhancedFileUploadProps {
  category?: 'leave_attachment' | 'profile_picture' | 'document' | 'policy_document';
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  onFilesUploaded?: (files: UploadedFile[]) => void;
  onFileDeleted?: (fileId: string) => void;
  initialFiles?: UploadedFile[];
  disabled?: boolean;
  showPreview?: boolean;
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  category = 'document',
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain',
  ],
  onFilesUploaded,
  onFileDeleted,
  initialFiles = [],
  disabled = false,
  showPreview = true,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; file?: UploadedFile }>({
    open: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image color="primary" />;
    if (mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <Description color="info" />;
    return <InsertDriveFile />;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    if (!acceptedFileTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }

    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('files', file);

    try {
      const response = await api.post(`/files/upload?category=${category}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;

          setFiles(prev =>
            prev.map(f =>
              f.originalName === file.name && f.status === 'uploading'
                ? { ...f, progress }
                : f
            )
          );
        },
      });

      if (response.data.success) {
        const uploadedFile = response.data.data.files[0];
        return {
          ...uploadedFile,
          status: 'uploaded' as const,
        };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || 'Upload failed'
      );
    }
  };

  const handleFileUpload = async (filesToUpload: File[]) => {
    if (disabled) return;

    setUploading(true);

    // Validate all files first
    const validationErrors: string[] = [];
    filesToUpload.forEach(file => {
      const error = validateFile(file);
      if (error) validationErrors.push(`${file.name}: ${error}`);
    });

    if (validationErrors.length > 0) {
      toast.error(`Validation errors:\n${validationErrors.join('\n')}`);
      setUploading(false);
      return;
    }

    // Add files to state with uploading status
    const newFiles: UploadedFile[] = filesToUpload.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      originalName: file.name,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
      downloadUrl: '',
      uploadedAt: new Date().toISOString(),
      status: 'uploading' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Upload files one by one
    const uploadedFiles: UploadedFile[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        const uploadedFile = await uploadFile(file);
        uploadedFiles.push(uploadedFile);

        // Update file status to uploaded
        setFiles(prev =>
          prev.map(f =>
            f.originalName === file.name && f.status === 'uploading'
              ? uploadedFile
              : f
          )
        );
      } catch (error: any) {
        failedFiles.push(file.name);

        // Update file status to error
        setFiles(prev =>
          prev.map(f =>
            f.originalName === file.name && f.status === 'uploading'
              ? { ...f, status: 'error' as const, error: error.message }
              : f
          )
        );
      }
    }

    setUploading(false);

    if (uploadedFiles.length > 0) {
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      onFilesUploaded?.(uploadedFiles);
    }

    if (failedFiles.length > 0) {
      toast.error(`Failed to upload: ${failedFiles.join(', ')}`);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleFileUpload(acceptedFiles);
    },
    [handleFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploading,
    maxFiles,
    maxSize: maxFileSize,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
  });

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.delete(`/files/${fileId}`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      onFileDeleted?.(fileId);
      toast.success('File deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete file');
    }
  };

  const handlePreviewFile = (file: UploadedFile) => {
    setPreviewDialog({ open: true, file });
  };

  const handleDownloadFile = (file: UploadedFile) => {
    if (file.downloadUrl) {
      window.open(file.downloadUrl, '_blank');
    }
  };

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled || uploading ? 'grey.300' : 'primary.main',
            backgroundColor: disabled || uploading ? 'background.paper' : 'action.hover',
          },
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CloudUpload sx={{ fontSize: 48, color: 'grey.400' }} />
          <Typography variant="h6" textAlign="center">
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'}
          </Typography>
          <Typography variant="body2" color="textSecondary" textAlign="center">
            Maximum {maxFiles} files, up to {formatFileSize(maxFileSize)} each
          </Typography>
          <Typography variant="caption" color="textSecondary" textAlign="center">
            Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT
          </Typography>
          {uploading && (
            <Box sx={{ width: '100%', maxWidth: 300 }}>
              <LinearProgress />
              <Typography variant="caption" textAlign="center" sx={{ mt: 1 }}>
                Uploading files...
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files ({files.length})
          </Typography>
          <List>
            {files.map((file) => (
              <ListItem
                key={file.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: 'background.paper',
                }}
              >
                <ListItemIcon>
                  {file.status === 'uploaded' && <CheckCircle color="success" />}
                  {file.status === 'error' && <ErrorIcon color="error" />}
                  {file.status === 'uploading' && getFileIcon(file.mimeType)}
                </ListItemIcon>
                <ListItemText
                  primary={file.originalName}
                  secondary={
                    <Box>
                      <Typography variant="caption">
                        {formatFileSize(file.size)}
                      </Typography>
                      {file.status === 'uploading' && file.progress !== undefined && (
                        <LinearProgress
                          variant="determinate"
                          value={file.progress}
                          sx={{ mt: 1 }}
                        />
                      )}
                      {file.status === 'error' && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {file.error}
                        </Alert>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {file.status === 'uploaded' && showPreview && (
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewFile(file)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    )}
                    {file.status === 'uploaded' && file.downloadUrl && (
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    )}
                    {file.status !== 'uploading' && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {previewDialog.file && (
            <Box>
              <Typography variant="h6">{previewDialog.file.originalName}</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Size: {formatFileSize(previewDialog.file.size)} | Type: {previewDialog.file.mimeType}
              </Typography>

              {previewDialog.file.mimeType.startsWith('image/') ? (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <img
                    src={previewDialog.file.downloadUrl}
                    alt={previewDialog.file.originalName}
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                  />
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Preview not available for this file type. Click download to view the file.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false })}>
            Close
          </Button>
          {previewDialog.file?.downloadUrl && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleDownloadFile(previewDialog.file!)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedFileUpload;