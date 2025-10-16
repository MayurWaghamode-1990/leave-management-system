import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Link,
  IconButton,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
  useTheme,
} from '@mui/material'
import { Visibility, VisibilityOff, AccountCircle, LockOutlined } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useAuth } from '@/hooks/useAuth'
import { LoginRequest } from '@/types'
import Logo from '@/components/common/Logo'
import GradientButton from '@/components/common/GradientButton'
import { fadeInUp, fadeInDown, scaleIn } from '@/theme/animations'

// Test user credentials
const TEST_USERS = [
  {
    id: 'admin',
    name: 'Admin User',
    email: 'admin@glf.com',
    password: 'password123',
    role: 'Admin',
    department: 'Human Resources',
    description: 'Full system access • Mumbai'
  },
  {
    id: 'manager1',
    name: 'Rajesh Kumar',
    email: 'manager1@glf.com',
    password: 'password123',
    role: 'Manager',
    department: 'Engineering',
    description: 'Team lead • 3 pending approvals • Bangalore'
  },
  {
    id: 'manager2',
    name: 'Priya Sharma',
    email: 'manager2@glf.com',
    password: 'password123',
    role: 'Manager',
    department: 'Sales',
    description: 'Team lead • 1 pending approval • Delhi'
  },
  {
    id: 'employee1',
    name: 'Amit Patel',
    email: 'employee1@glf.com',
    password: 'password123',
    role: 'Employee',
    department: 'Engineering',
    description: 'Has approved & pending leaves • Reports to Rajesh • Bangalore'
  },
  {
    id: 'employee2',
    name: 'Sneha Desai',
    email: 'employee2@glf.com',
    password: 'password123',
    role: 'Employee',
    department: 'Engineering',
    description: 'Has rejected leave • Reports to Rajesh • Bangalore'
  },
  {
    id: 'employee3',
    name: 'Vikram Singh',
    email: 'employee3@glf.com',
    password: 'password123',
    role: 'Employee',
    department: 'Sales',
    description: 'Has half-day pending • Reports to Priya • Delhi'
  },
  {
    id: 'employee4',
    name: 'Kavita Nair',
    email: 'employee4@glf.com',
    password: 'password123',
    role: 'Employee',
    department: 'Marketing',
    description: 'Has approved sick leave • Reports to Rajesh • Pune'
  },
  {
    id: 'employee5',
    name: 'Rahul Mehta',
    email: 'employee5@glf.com',
    password: 'password123',
    role: 'Employee',
    department: 'Engineering',
    description: 'Has long pending leave • Reports to Rajesh • Bangalore'
  }
]

const schema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const emailValue = watch('email')
  const passwordValue = watch('password')

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId)
    const user = TEST_USERS.find(u => u.id === userId)
    if (user) {
      setValue('email', user.email, { shouldValidate: true })
      setValue('password', user.password, { shouldValidate: true })
    }
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginRequest) => {
    try {
      setIsLoading(true)
      await login(data.email, data.password)
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false)
    }
  }

  const theme = useTheme()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(103, 126, 234, 0.3) 0%, transparent 50%)',
          animation: `${fadeInDown} 1s ease-out`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 80%, rgba(118, 75, 162, 0.3) 0%, transparent 50%)',
          animation: `${fadeInUp} 1s ease-out`,
        },
      }}
    >
      {/* Left Side - Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            animation: `${scaleIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <Logo variant="full" size="large" />
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 700,
              mt: 4,
              textAlign: 'center',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            Leave Management
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: alpha('#ffffff', 0.9),
              fontWeight: 400,
              mt: 2,
              textAlign: 'center',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            Simplified. Streamlined. Smart.
          </Typography>
          <Box
            sx={{
              mt: 6,
              p: 3,
              background: alpha('#ffffff', 0.1),
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: `1px solid ${alpha('#ffffff', 0.2)}`,
            }}
          >
            <Typography variant="body1" sx={{ color: 'white', mb: 2, fontWeight: 500 }}>
              ✨ Features:
            </Typography>
            <Box component="ul" sx={{ color: alpha('#ffffff', 0.9), pl: 2, m: 0 }}>
              <li>Easy leave application & approval</li>
              <li>Real-time notifications</li>
              <li>Comprehensive analytics</li>
              <li>Multi-location support</li>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: { xs: 1, md: 0.8 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container component="main" maxWidth="sm">
          <Card
            sx={{
              background: alpha('#ffffff', 0.95),
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              boxShadow: `0 20px 60px ${alpha('#000000', 0.3)}`,
              border: `1px solid ${alpha('#ffffff', 0.3)}`,
              overflow: 'hidden',
              position: 'relative',
              animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1)`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
                  <Logo variant="full" size="medium" />
                </Box>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    mb: 2,
                  }}
                >
                  <LockOutlined sx={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to access your leave management portal
                </Typography>
              </Box>

              {/* Login Form */}
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Quick User Selection */}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Quick Select Test User</InputLabel>
                  <Select
                    value={selectedUser}
                    label="Quick Select Test User"
                    onChange={(e) => handleUserSelect(e.target.value)}
                    disabled={isLoading}
                    startAdornment={
                      <InputAdornment position="start">
                        <AccountCircle />
                      </InputAdornment>
                    }
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Select a test user...</em>
                    </MenuItem>
                    {TEST_USERS.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {user.name}
                            </Typography>
                            <Box
                              sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: user.role === 'Admin'
                                  ? 'error.light'
                                  : user.role === 'Manager'
                                    ? 'primary.light'
                                    : 'success.light',
                                color: user.role === 'Admin'
                                  ? 'error.dark'
                                  : user.role === 'Manager'
                                    ? 'primary.dark'
                                    : 'success.dark',
                              }}
                            >
                              <Typography variant="caption" fontWeight="bold">
                                {user.role}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {user.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  value={emailValue}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                  InputLabelProps={{
                    shrink: !!emailValue,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                    },
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  {...register('password')}
                  value={passwordValue}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isLoading}
                  InputLabelProps={{
                    shrink: !!passwordValue,
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                    },
                  }}
                />

                <GradientButton
                  type="submit"
                  fullWidth
                  size="large"
                  gradientType="primary"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </GradientButton>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Forgot your password?{' '}
                    <Link
                      href="#"
                      underline="hover"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      }}
                    >
                      Contact IT Support
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Application Info */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.9), fontWeight: 500 }}>
              Leave Management System v1.0
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.8) }}>
              Supporting India and US compliance requirements
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default LoginPage