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
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { Visibility, VisibilityOff, Business } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useAuth } from '@/hooks/useAuth'
import { LoginRequest } from '@/types'
import Logo from '@/components/common/Logo'

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
  })

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

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: (theme) => theme.shadows[8],
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Logo variant="full" size="medium" />
              </Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sign in to your Leave Management System
              </Typography>
            </Box>

            {/* Demo Credentials Alert */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" component="div">
                <strong>🔑 Demo Login Credentials</strong>
                <br /><br />
                <strong>👑 HR Admin:</strong> admin@company.com
                <br />
                <Typography variant="caption" color="textSecondary">
                  Password: admin123 • Admin User • Full system access
                </Typography>
                <br /><br />

                <strong>👥 Manager:</strong>
                <br />
                • <strong>Engineering:</strong> alex.johnson@company.com
                <br />
                <Typography variant="caption" color="textSecondary">
                  Password: password123 • Alex Johnson • Engineering team lead
                </Typography>
                <br /><br />

                <strong>🧑‍💼 Employees:</strong>
                <br />
                • <strong>Engineering:</strong> user@company.com
                <br />
                <Typography variant="caption" color="textSecondary">
                  Password: user123 • John Doe • Software Developer
                </Typography>
                <br />
                • <strong>Engineering:</strong> ananya.patel@company.com
                <br />
                <Typography variant="caption" color="textSecondary">
                  Password: password123 • Ananya Patel • Software Developer
                </Typography>
                <br /><br />

                <strong>💰 Payroll Officer:</strong>
                <br />
                • michelle.lee@company.com
                <br />
                <Typography variant="caption" color="textSecondary">
                  Password: password123 • Michelle Lee • Finance Department
                </Typography>
              </Typography>
            </Alert>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isLoading}
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
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
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
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Footer */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Forgot your password?{' '}
                  <Link href="#" underline="hover">
                    Contact IT Support
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Application Info */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Leave Management System v1.0
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Supporting India and US compliance requirements
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default LoginPage