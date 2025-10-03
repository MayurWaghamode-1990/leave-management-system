import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  ExpandMore,
  Policy,
  Schedule,
  CalendarMonth,
  AccessTime,
  CheckCircle,
  Info,
  Work,
  Weekend,
  EventBusy,
  Refresh
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import api from '@/config/api'

interface LeavePolicy {
  type: string
  label: string
  description: string
  entitlementDays: number
  maxConsecutiveDays?: number
  carryForwardDays?: number
  encashmentAllowed: boolean
  probationApplicable: boolean
  minimumServiceMonths?: number
  advanceBookingDays?: number
  maxAdvanceApplicationDays?: number
  conditions: string[]
}

interface CompOffPolicy {
  minimumHoursForHalfDay: number
  minimumHoursForFullDay: number
  expiryMonths: number
  maxAccumulationDays: number
  weekendWorkMultiplier: number
  holidayWorkMultiplier: number
  managerVerificationRequired: boolean
  allowedWorkTypes: string[]
  restrictions: string[]
}

interface PolicyData {
  leavePolicies: LeavePolicy[]
  compOffPolicy: CompOffPolicy
  workingHours: {
    standardHours: number
    weeklyWorkingDays: number
    flexibleHoursAllowed: boolean
  }
  holidays: {
    total: number
    remaining: number
    nextHoliday?: {
      name: string
      date: string
    }
  }
}

const LeavePolicyDisplay: React.FC = () => {
  const [policyData, setPolicyData] = useState<PolicyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | false>('leave-policies')

  useEffect(() => {
    fetchPolicyData()
  }, [])

  const fetchPolicyData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/policies/user-policies')
      setPolicyData(response.data.data)
    } catch (error) {
      console.error('Error fetching policy data:', error)
      toast.error('Failed to load policy information')
    } finally {
      setLoading(false)
    }
  }

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false)
  }

  const formatWorkTypes = (types: string[]) => {
    return types.map(type => {
      switch (type) {
        case 'WEEKEND': return 'Weekend Work'
        case 'HOLIDAY': return 'Holiday Work'
        case 'EXTENDED_HOURS': return 'Extended Hours'
        default: return type.replace('_', ' ')
      }
    }).join(', ')
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Policy color="primary" />
            <Typography variant="h6">Leave & Comp Off Policies</Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!policyData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load policy information. Please try refreshing.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Policy color="primary" />
            <Typography variant="h6">Leave & Comp Off Policies</Typography>
          </Box>
          <Tooltip title="Refresh Policy Data">
            <IconButton onClick={fetchPolicyData} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Leave Policies */}
        <Accordion
          expanded={expanded === 'leave-policies'}
          onChange={handleAccordionChange('leave-policies')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <CalendarMonth color="primary" />
              <Typography variant="subtitle1" fontWeight="medium">
                Leave Policies
              </Typography>
              <Chip
                label={`${policyData.leavePolicies.length} types`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {policyData.leavePolicies.map((policy, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      height: '100%'
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {policy.label}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {policy.description}
                    </Typography>

                    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                      <Chip
                        label={`${policy.entitlementDays} days/year`}
                        size="small"
                        color="success"
                      />
                      {policy.carryForwardDays && (
                        <Chip
                          label={`Carry: ${policy.carryForwardDays} days`}
                          size="small"
                          color="info"
                        />
                      )}
                      {policy.encashmentAllowed && (
                        <Chip
                          label="Encashment"
                          size="small"
                          color="warning"
                        />
                      )}
                    </Box>

                    <List dense>
                      {policy.maxConsecutiveDays && (
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Schedule fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Max consecutive: ${policy.maxConsecutiveDays} days`}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      )}
                      {policy.minimumServiceMonths && (
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <AccessTime fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Min service: ${policy.minimumServiceMonths} months`}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      )}
                      {policy.advanceBookingDays && (
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CalendarMonth fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Advance booking: ${policy.advanceBookingDays} days`}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      )}
                    </List>

                    {policy.conditions.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="caption" color="textSecondary" fontWeight="medium">
                          Conditions:
                        </Typography>
                        {policy.conditions.map((condition, condIndex) => (
                          <Typography key={condIndex} variant="caption" display="block" color="textSecondary">
                            • {condition}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Comp Off Policy */}
        <Accordion
          expanded={expanded === 'comp-off-policy'}
          onChange={handleAccordionChange('comp-off-policy')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <Work color="secondary" />
              <Typography variant="subtitle1" fontWeight="medium">
                Compensatory Off Policy
              </Typography>
              <Chip
                label="GLF Compliant"
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Accrual Rules
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <AccessTime fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${policyData.compOffPolicy.minimumHoursForHalfDay} hours = 0.5 day`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <AccessTime fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${policyData.compOffPolicy.minimumHoursForFullDay} hours = 1.0 day`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Weekend fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Weekend work: ${policyData.compOffPolicy.weekendWorkMultiplier}x multiplier`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <EventBusy fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Holiday work: ${policyData.compOffPolicy.holidayWorkMultiplier}x multiplier`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Usage Rules
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Schedule fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Expires in ${policyData.compOffPolicy.expiryMonths} months`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CalendarMonth fontSize="small" color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Max accumulation: ${policyData.compOffPolicy.maxAccumulationDays} days`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={policyData.compOffPolicy.managerVerificationRequired ? 'Manager verification required' : 'Auto-approval enabled'}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Eligible Work Types
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {policyData.compOffPolicy.allowedWorkTypes.map((type, index) => (
                    <Chip
                      key={index}
                      label={formatWorkTypes([type])}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>

                {policyData.compOffPolicy.restrictions.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="textSecondary" fontWeight="medium">
                      Restrictions:
                    </Typography>
                    {policyData.compOffPolicy.restrictions.map((restriction, index) => (
                      <Typography key={index} variant="caption" display="block" color="textSecondary">
                        • {restriction}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Working Hours & Holidays */}
        <Accordion
          expanded={expanded === 'working-info'}
          onChange={handleAccordionChange('working-info')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <Info color="info" />
              <Typography variant="subtitle1" fontWeight="medium">
                Working Hours & Holidays
              </Typography>
              <Chip
                label={`${policyData.holidays.remaining}/${policyData.holidays.total} holidays left`}
                size="small"
                color="info"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Standard Working Hours
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <AccessTime fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${policyData.workingHours.standardHours} hours per day`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CalendarMonth fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${policyData.workingHours.weeklyWorkingDays} days per week`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle fontSize="small" color={policyData.workingHours.flexibleHoursAllowed ? 'success' : 'disabled'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={policyData.workingHours.flexibleHoursAllowed ? 'Flexible hours allowed' : 'Fixed working hours'}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Holiday Information
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <EventBusy fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${policyData.holidays.total} total holidays this year`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CalendarMonth fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${policyData.holidays.remaining} holidays remaining`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  {policyData.holidays.nextHoliday && (
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Schedule fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Next: ${policyData.holidays.nextHoliday.name} (${policyData.holidays.nextHoliday.date})`}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default LeavePolicyDisplay