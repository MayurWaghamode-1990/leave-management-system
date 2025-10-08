import React from 'react'
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material'

interface SkeletonLoaderProps {
  variant?: 'card' | 'table' | 'dashboard' | 'list' | 'form'
  count?: number
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'card', count = 1 }) => {
  const renderCardSkeleton = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={24} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        </Box>
      </CardContent>
    </Card>
  )

  const renderTableSkeleton = () => (
    <Box>
      <Skeleton variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 2 }} />
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={48} sx={{ mb: 0.5, borderRadius: 1 }} />
      ))}
    </Box>
  )

  const renderDashboardSkeleton = () => (
    <Box>
      <Skeleton variant="text" width="40%" height={48} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {Array.from({ length: 4}).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="circular" width={56} height={56} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="60%" height={20} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
              {Array.from({ length: 5 }).map((_, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )

  const renderListSkeleton = () => (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="50%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  )

  const renderFormSkeleton = () => (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="40%" height={36} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  switch (variant) {
    case 'table':
      return renderTableSkeleton()
    case 'dashboard':
      return renderDashboardSkeleton()
    case 'list':
      return renderListSkeleton()
    case 'form':
      return renderFormSkeleton()
    case 'card':
    default:
      return (
        <Grid container spacing={3}>
          {Array.from({ length: count }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              {renderCardSkeleton()}
            </Grid>
          ))}
        </Grid>
      )
  }
}

export default SkeletonLoader
