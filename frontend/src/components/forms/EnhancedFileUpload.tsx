import React, { useCallback, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  alpha,
  useTheme,
  LinearProgress,
  Chip,
} from '@mui/material'
import {
  CloudUpload,
  InsertDriveFile,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material'

interface EnhancedFileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  onFilesChange?: (files: File[]) => void
  helperText?: string
  error?: boolean
}

interface FileWithStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  accept,
  multiple = false,
  maxSize = 5,
  onFilesChange,
  helperText,
  error = false,
}) => {
  const theme = useTheme()
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      handleFiles(droppedFiles)
    },
    [maxSize]
  )

  const handleFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter((file) => {
      const sizeMB = file.size / 1024 / 1024
      return sizeMB <= maxSize
    })

    const newFiles: FileWithStatus[] = validFiles.map((file) => ({
      file,
      status: 'success',
      progress: 100,
    }))

    const updatedFiles = multiple ? [...files, ...newFiles] : newFiles
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles.map((f) => f.file))
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles.map((f) => f.file))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Box>
      <Paper
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${
            error
              ? theme.palette.error.main
              : isDragging
                ? theme.palette.primary.main
                : theme.palette.divider
          }`,
          borderRadius: 3,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: isDragging
            ? alpha(theme.palette.primary.main, 0.05)
            : alpha(theme.palette.background.paper, 0.5),
          '&:hover': {
            borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
            background: alpha(theme.palette.primary.main, 0.03),
            transform: 'scale(1.01)',
          },
        }}
        onClick={() => document.getElementById('file-upload-input')?.click()}
      >
        <input
          id="file-upload-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <CloudUpload
          sx={{
            fontSize: 48,
            color: error ? theme.palette.error.main : theme.palette.primary.main,
            mb: 2,
          }}
        />
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse
        </Typography>
        <Chip
          label={`Max ${maxSize}MB per file`}
          size="small"
          sx={{ mt: 2 }}
          color={error ? 'error' : 'default'}
        />
      </Paper>

      {helperText && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 1, ml: 2, display: 'block', fontWeight: 500 }}
        >
          {helperText}
        </Typography>
      )}

      {files.length > 0 && (
        <List sx={{ mt: 2 }}>
          {files.map((fileItem, index) => (
            <ListItem
              key={index}
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2,
                mb: 1,
                background: alpha(theme.palette.background.paper, 0.5),
                transition: 'all 0.2s',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon>
                <InsertDriveFile color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {fileItem.file.name}
                    </Typography>
                    {fileItem.status === 'success' && (
                      <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
                    )}
                    {fileItem.status === 'error' && (
                      <ErrorIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(fileItem.file.size)}
                    </Typography>
                    {fileItem.status === 'uploading' && (
                      <LinearProgress
                        variant="determinate"
                        value={fileItem.progress}
                        sx={{ mt: 0.5, borderRadius: 1 }}
                      />
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveFile(index)}
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: theme.palette.error.main,
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}

export default EnhancedFileUpload
