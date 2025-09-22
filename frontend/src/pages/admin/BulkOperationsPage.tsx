import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import BulkOperationsManager from '@/components/admin/BulkOperationsManager';

const BulkOperationsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user || (user.role !== 'HR_ADMIN' && user.role !== 'IT_ADMIN')) {
    return (
      <Box>
        <Alert severity="error">
          You don't have permission to access bulk operations. This feature is only available to HR and IT administrators.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bulk Operations & Administrative Tools
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Manage multiple leave requests efficiently with bulk operations, export data, and monitor system activities.
      </Typography>

      <BulkOperationsManager />
    </Box>
  );
};

export default BulkOperationsPage;