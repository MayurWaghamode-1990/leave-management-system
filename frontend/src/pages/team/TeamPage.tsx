import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Divider,
  LinearProgress,
  Alert,
  Skeleton,
  Tooltip,
  Badge,
  Stack
} from '@mui/material'
import {
  MoreVert,
  Email,
  Phone,
  Event,
  TrendingUp,
  Group,
  Person,
  Star,
  Assignment,
  Schedule,
  CheckCircle,
  Warning,
  DateRange,
  LocationOn,
  Business,
  Refresh,
  FilterList,
  CalendarToday
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'
import { User, UserRole, UserStatus, LeaveRequest, LeaveStatus, ApiResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface TeamMember extends User {
  isActive: boolean
  onLeaveToday?: boolean
  pendingRequests?: number
  completedLeaves?: number
}

interface TeamStats {
  totalMembers: number
  activeMembers: number
  onLeaveToday: number
  pendingApprovals: number
}

const TeamPage: React.FC = () => {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalMembers: 0,
    activeMembers: 0,
    onLeaveToday: 0,
    pendingApprovals: 0
  })
  const [upcomingLeaves, setUpcomingLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterRole, setFilterRole] = useState<UserRole | ''>('')

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      const [teamResponse, leavesResponse] = await Promise.all([
        api.get<ApiResponse<TeamMember[]>>('/users/team'),
        api.get<ApiResponse<LeaveRequest[]>>('/leaves?status=APPROVED&upcoming=true')
      ])

      if (teamResponse.data.success) {
        const members = teamResponse.data.data.map(member => ({
          ...member,
          onLeaveToday: false, // This would be calculated based on current leaves
          pendingRequests: Math.floor(Math.random() * 3), // Mock data
          completedLeaves: Math.floor(Math.random() * 15) // Mock data
        }))
        setTeamMembers(members)

        // Calculate team stats
        setTeamStats({
          totalMembers: members.length,
          activeMembers: members.filter(m => m.isActive).length,
          onLeaveToday: members.filter(m => m.onLeaveToday).length,
          pendingApprovals: members.reduce((acc, m) => acc + (m.pendingRequests || 0), 0)
        })
      }

      if (leavesResponse.data.success) {
        setUpcomingLeaves(leavesResponse.data.data.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Failed to fetch team data')

      // Fallback to mock data
      const mockMembers: TeamMember[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          role: UserRole.EMPLOYEE,
          department: 'Engineering',
          location: 'New York',
          joiningDate: '2023-01-15',
          status: UserStatus.ACTIVE,
          isActive: true,
          onLeaveToday: false,
          pendingRequests: 1,
          completedLeaves: 8
        },
        {
          id: '2',
          employeeId: 'EMP002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          role: UserRole.EMPLOYEE,
          department: 'Engineering',
          location: 'New York',
          joiningDate: '2023-03-10',
          status: UserStatus.ACTIVE,
          isActive: true,
          onLeaveToday: true,
          pendingRequests: 0,
          completedLeaves: 5
        },
        {
          id: '3',
          employeeId: 'EMP003',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@company.com',
          role: UserRole.EMPLOYEE,
          department: 'Engineering',
          location: 'London',
          joiningDate: '2022-11-20',
          status: UserStatus.ACTIVE,
          isActive: true,
          onLeaveToday: false,
          pendingRequests: 2,
          completedLeaves: 12
        }
      ]
      setTeamMembers(mockMembers)
      setTeamStats({
        totalMembers: 3,
        activeMembers: 3,
        onLeaveToday: 1,
        pendingApprovals: 3
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: TeamMember) => {
    setMenuAnchor(event.currentTarget)
    setSelectedMember(member)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedMember(null)
  }

  const handleViewProfile = () => {
    if (selectedMember) {
      setDialogOpen(true)
    }
    handleMenuClose()
  }

  const handleSendEmail = () => {
    if (selectedMember) {
      window.open(`mailto:${selectedMember.email}`, '_blank')
    }
    handleMenuClose()
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.MANAGER:
        return 'primary'
      case UserRole.HR_ADMIN:
        return 'error'
      case UserRole.IT_ADMIN:
        return 'secondary'
      case UserRole.PAYROLL_OFFICER:
        return 'info'
      default:
        return 'default'
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredMembers = filterRole
    ? teamMembers.filter(member => member.role === filterRole)
    : teamMembers

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Team Overview
        </Typography>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} />
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
          Team Overview
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTeamData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Team Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Group />
                </Avatar>
                <Box>
                  <Typography variant="h6">{teamStats.totalMembers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Members
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
                  <Typography variant="h6">{teamStats.activeMembers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Members
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
                  <Event />
                </Avatar>
                <Box>
                  <Typography variant="h6">{teamStats.onLeaveToday}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    On Leave Today
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
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h6">{teamStats.pendingApprovals}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Approvals
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Team Members */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Team Members</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Filter by Role"
                  onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
                >
                  <MenuItem value="">
                    <em>All Roles</em>
                  </MenuItem>
                  {Object.values(UserRole).map((role) => (
                    <MenuItem key={role} value={role}>
                      {role.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Leave Stats</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              member.onLeaveToday ? (
                                <Tooltip title="On Leave Today">
                                  <Event
                                    sx={{
                                      color: 'warning.main',
                                      bgcolor: 'background.paper',
                                      borderRadius: '50%',
                                      fontSize: 16
                                    }}
                                  />
                                </Tooltip>
                              ) : null
                            }
                          >
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {getInitials(member.firstName, member.lastName)}
                            </Avatar>
                          </Badge>
                          <Box>
                            <Typography variant="subtitle2">
                              {member.firstName} {member.lastName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {member.employeeId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.role.replace('_', ' ')}
                          color={getRoleColor(member.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Business fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {member.department}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Chip
                            label={member.isActive ? 'Active' : 'Inactive'}
                            color={member.isActive ? 'success' : 'default'}
                            size="small"
                          />
                          {member.onLeaveToday && (
                            <Chip
                              label="On Leave"
                              color="warning"
                              size="small"
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            Completed: {member.completedLeaves || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Pending: {member.pendingRequests || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, member)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredMembers.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No team members found for the selected filter.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Upcoming Leaves */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Team Leaves
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {upcomingLeaves.length === 0 ? (
              <Alert severity="info">
                No upcoming leaves scheduled.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {upcomingLeaves.map((leave) => (
                  <Card key={leave.id} variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="subtitle2">
                            {leave.employee?.firstName} {leave.employee?.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {leave.leaveType.replace('_', ' ')}
                          </Typography>
                          <Box display="flex" alignItems="center" mt={0.5}>
                            <CalendarToday fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="textSecondary">
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={leave.status}
                          color={leave.status === LeaveStatus.APPROVED ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSendEmail}>
          <ListItemIcon>
            <Email fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>
      </Menu>

      {/* Member Profile Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedMember && (
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {getInitials(selectedMember.firstName, selectedMember.lastName)}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {selectedMember.firstName} {selectedMember.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedMember.employeeId}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedMember && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedMember.email}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Business sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedMember.department}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedMember.location}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <DateRange sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Joined: {formatDate(selectedMember.joiningDate)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Leave Balance
                </Typography>
                <Typography variant="h6">
                  {Math.floor(Math.random() * 20) + 5} days
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Leaves Taken
                </Typography>
                <Typography variant="h6">
                  {selectedMember.completedLeaves || 0} days
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedMember) {
                window.open(`mailto:${selectedMember.email}`, '_blank')
              }
            }}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TeamPage