import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Search,
  Add,
  Edit,
  Delete,
  MoreVert,
  Person,
  Email,
  Business,
  LocationOn,
  DateRange,
  Block,
  CheckCircle,
  FilterList,
  Refresh
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'
import { User, UserRole, UserStatus, PaginatedResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface UsersFilters {
  search: string
  department: string
  location: string
  role: UserRole | ''
  status: UserStatus | ''
}

const UsersPage: React.FC = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<UsersFilters>({
    search: '',
    department: '',
    location: '',
    role: '',
    status: ''
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuUser, setMenuUser] = useState<User | null>(null)

  // Departments and locations for filtering
  const departments = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales']
  const locations = ['New York', 'London', 'Mumbai', 'Singapore', 'Toronto', 'Sydney']

  useEffect(() => {
    fetchUsers()
  }, [page, rowsPerPage, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.department && { department: filters.department }),
        ...(filters.location && { location: filters.location }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status })
      })

      const response = await api.get<PaginatedResponse<User>>(`/users?${params}`)

      if (response.data.success) {
        setUsers(response.data.data)
        setTotal(response.data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: keyof UsersFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(0) // Reset to first page when filtering
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(event.currentTarget)
    setMenuUser(user)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuUser(null)
  }

  const handleUserEdit = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
    handleMenuClose()
  }

  const handleUserStatusToggle = async (user: User) => {
    try {
      const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE
      await api.patch(`/users/${user.id}/status`, { status: newStatus })
      toast.success(`User ${newStatus === UserStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
    handleMenuClose()
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.HR_ADMIN:
        return 'error'
      case UserRole.MANAGER:
        return 'primary'
      case UserRole.IT_ADMIN:
        return 'secondary'
      case UserRole.PAYROLL_OFFICER:
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success'
      case UserStatus.INACTIVE:
        return 'default'
      case UserStatus.SUSPENDED:
        return 'error'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (loading && users.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Manage Users
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} key={index}>
              <Skeleton variant="rectangular" height={60} />
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Manage Users
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedUser(null)
              setDialogOpen(true)
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6">{total}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {users.filter(u => u.status === UserStatus.ACTIVE).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {new Set(users.map(u => u.department)).size}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Departments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <LocationOn />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {new Set(users.map(u => u.location)).size}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Locations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={filters.location}
                label="Location"
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {Object.values(UserRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {Object.values(UserStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Tooltip title="Clear Filters">
              <IconButton
                onClick={() => {
                  setFilters({
                    search: '',
                    department: '',
                    location: '',
                    role: '',
                    status: ''
                  })
                }}
              >
                <FilterList />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joining Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(rowsPerPage)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(8)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="info">No users found</Alert>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {getInitials(user.firstName, user.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {user.employeeId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.replace('_', ' ')}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Business fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {user.department}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {user.location}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <DateRange fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {formatDate(user.joiningDate)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuUser && handleUserEdit(menuUser)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuUser && handleUserStatusToggle(menuUser)}>
          <ListItemIcon>
            {menuUser?.status === UserStatus.ACTIVE ? (
              <Block fontSize="small" />
            ) : (
              <CheckCircle fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {menuUser?.status === UserStatus.ACTIVE ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* User Dialog (Add/Edit) */}
      <UserFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        user={selectedUser}
        onSuccess={() => {
          setDialogOpen(false)
          fetchUsers()
        }}
      />
    </Box>
  )
}

// User Form Dialog Component
interface UserFormDialogProps {
  open: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({ open, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: UserRole.EMPLOYEE,
    department: '',
    location: '',
    reportingManagerId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    gender: '',
    maritalStatus: '',
    country: '',
    designation: ''
  })
  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<User[]>([])

  const departments = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales']
  const locations = ['New York', 'London', 'Mumbai', 'Singapore', 'Toronto', 'Sydney']

  useEffect(() => {
    if (user) {
      setFormData({
        employeeId: user.employeeId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        role: user.role,
        department: user.department,
        location: user.location,
        reportingManagerId: (user as any).reportingManagerId || '',
        joiningDate: user.joiningDate.split('T')[0],
        gender: (user as any).gender || '',
        maritalStatus: (user as any).maritalStatus || '',
        country: (user as any).country || '',
        designation: (user as any).designation || ''
      })
    } else {
      setFormData({
        employeeId: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: UserRole.EMPLOYEE,
        department: '',
        location: '',
        reportingManagerId: '',
        joiningDate: new Date().toISOString().split('T')[0],
        gender: '',
        maritalStatus: '',
        country: '',
        designation: ''
      })
    }
  }, [user, open])

  useEffect(() => {
    if (open) {
      fetchManagers()
    }
  }, [open])

  const fetchManagers = async () => {
    try {
      const response = await api.get('/users?role=MANAGER&limit=100')
      if (response.data.success) {
        setManagers(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Basic validation
      if (!formData.employeeId || !formData.email || !formData.firstName || !formData.lastName ||
          !formData.department || !formData.location || !formData.joiningDate) {
        toast.error('Please fill in all required fields')
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address')
        return
      }

      if (user) {
        // Update existing user
        await api.patch(`/users/${user.id}`, formData)
        toast.success('User updated successfully')
      } else {
        // Create new user
        await api.post('/users', formData)
        toast.success('User created successfully')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving user:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save user'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {user ? 'Edit User' : 'Add New User'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee ID"
                required
                value={formData.employeeId}
                onChange={(e) => handleChange('employeeId', e.target.value)}
                disabled={!!user}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!!user}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                required
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </Grid>
            {!user && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password (Optional - default: Welcome@123)"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  helperText="Leave blank to use default password: Welcome@123"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => handleChange('role', e.target.value)}
                >
                  {Object.values(UserRole).map((role) => (
                    <MenuItem key={role} value={role}>
                      {role.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department}
                  label="Department"
                  onChange={(e) => handleChange('department', e.target.value)}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.location}
                  label="Location"
                  onChange={(e) => handleChange('location', e.target.value)}
                >
                  {locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Joining Date"
                type="date"
                required
                value={formData.joiningDate}
                onChange={(e) => handleChange('joiningDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Reporting Manager</InputLabel>
                <Select
                  value={formData.reportingManagerId}
                  label="Reporting Manager"
                  onChange={(e) => handleChange('reportingManagerId', e.target.value)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName} ({manager.employeeId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Designation"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  label="Gender"
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Not specified</em>
                  </MenuItem>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Marital Status</InputLabel>
                <Select
                  value={formData.maritalStatus}
                  label="Marital Status"
                  onChange={(e) => handleChange('maritalStatus', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Not specified</em>
                  </MenuItem>
                  <MenuItem value="SINGLE">Single</MenuItem>
                  <MenuItem value="MARRIED">Married</MenuItem>
                  <MenuItem value="DIVORCED">Divorced</MenuItem>
                  <MenuItem value="WIDOWED">Widowed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : user ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UsersPage