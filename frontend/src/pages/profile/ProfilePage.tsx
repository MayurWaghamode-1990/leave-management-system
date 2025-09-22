import React from 'react'
import { Box, Typography } from '@mui/material'
import EnhancedProfileManager from '@/components/profile/EnhancedProfileManager'

const ProfilePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        My Profile
      </Typography>
      <EnhancedProfileManager />
    </Box>
  )
}

export default ProfilePage