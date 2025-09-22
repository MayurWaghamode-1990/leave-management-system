# Email Setup Guide for Leave Management System

## Overview

The Leave Management System supports real SMTP email integration with multiple email providers. This guide will help you configure email notifications for leave approvals, rejections, reminders, and system notifications.

## Quick Setup

### 1. Choose Your Email Provider

The system supports the following email providers out of the box:

- **Gmail** (Default)
- **Outlook/Hotmail**
- **Office 365**
- **Yahoo**
- **SendGrid**
- **Mailgun**
- **Amazon SES**
- **Custom SMTP**

### 2. Environment Variables

Add these environment variables to your `.env` file in the backend directory:

```env
# Email Configuration
EMAIL_PROVIDER=GMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
EMAIL_FROM_NAME=LMS - Leave Management System
EMAIL_FROM_ADDRESS=your-email@gmail.com
COMPANY_NAME=Your Company Name
SUPPORT_EMAIL=support@yourcompany.com

# Advanced Settings (Optional)
SMTP_MAX_CONNECTIONS=5
SMTP_MAX_MESSAGES=100
SMTP_RATE_LIMIT=10
SMTP_RATE_DELTA=1000
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=5000
```

## Provider-Specific Setup

### Gmail Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Environment Variables**:
   ```env
   EMAIL_PROVIDER=GMAIL
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Outlook/Hotmail Setup

1. **Environment Variables**:
   ```env
   EMAIL_PROVIDER=OUTLOOK
   SMTP_USER=your-email@outlook.com
   SMTP_PASS=your-password
   ```

### Office 365 Setup

1. **Environment Variables**:
   ```env
   EMAIL_PROVIDER=OFFICE365
   SMTP_USER=your-email@yourcompany.com
   SMTP_PASS=your-password
   ```

### SendGrid Setup

1. **Create SendGrid Account** at sendgrid.com
2. **Generate API Key** in Settings → API Keys
3. **Environment Variables**:
   ```env
   EMAIL_PROVIDER=SENDGRID
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### Mailgun Setup

1. **Create Mailgun Account** at mailgun.com
2. **Get SMTP credentials** from your domain settings
3. **Environment Variables**:
   ```env
   EMAIL_PROVIDER=MAILGUN
   SMTP_USER=postmaster@your-domain.mailgun.org
   SMTP_PASS=your-mailgun-password
   ```

### Amazon SES Setup

1. **Configure SES** in AWS Console
2. **Create SMTP credentials** in SES Console
3. **Environment Variables**:
   ```env
   EMAIL_PROVIDER=SES
   SMTP_HOST=email-smtp.us-west-2.amazonaws.com
   SMTP_USER=your-ses-access-key
   SMTP_PASS=your-ses-secret-key
   ```

### Custom SMTP Setup

For any other SMTP provider:

```env
EMAIL_PROVIDER=CUSTOM
SMTP_HOST=mail.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Testing Email Configuration

### 1. API Endpoints

Test your email configuration using these API endpoints:

```bash
# Test SMTP connection
curl -X GET "http://localhost:3001/api/v1/email/test-connection" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send test email
curl -X POST "http://localhost:3001/api/v1/email/test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "recipient@example.com"}'
```

### 2. Admin Panel

1. Login as HR Admin or IT Admin
2. Go to System Settings → Email Configuration
3. Click "Test Connection" to verify SMTP settings
4. Click "Send Test Email" to send a test message

## Email Templates

The system includes pre-built templates for:

- **Leave Request Submitted** - Notifies managers
- **Leave Approved** - Notifies employees
- **Leave Rejected** - Notifies employees with reason
- **Leave Reminder** - Reminds managers about pending approvals
- **Leave Balance Low** - Warns employees about low balances
- **Leave Calendar Update** - Team notifications
- **System Notifications** - General announcements

### Customizing Templates

Email templates are located in `/backend/src/templates/email/`:

```
templates/
├── email/
│   ├── base.hbs              # Base template
│   ├── leave-approved.hbs    # Leave approved
│   ├── leave-rejected.hbs    # Leave rejected
│   ├── leave-submitted.hbs   # New leave request
│   └── leave-reminder.hbs    # Approval reminder
```

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check username/password
   - For Gmail, use App Password instead of regular password
   - Verify 2FA is enabled for Gmail

2. **"Connection timeout"**
   - Check SMTP host and port
   - Verify firewall isn't blocking port 587/465
   - Try different ports (587, 465, 25)

3. **"Self signed certificate"**
   - Add to environment: `SMTP_SECURE=false`
   - For production, use SSL certificates

4. **"Rate limit exceeded"**
   - Reduce SMTP_RATE_LIMIT value
   - Increase SMTP_RATE_DELTA value
   - Consider upgrading email service plan

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

This will show detailed SMTP communication logs.

### Demo Mode

If email is not configured, the system runs in demo mode:
- All emails are logged to console instead of being sent
- Perfect for development and testing

## Production Recommendations

### Security

1. **Use App Passwords** instead of regular passwords
2. **Enable 2FA** on email accounts
3. **Use dedicated email account** for the system
4. **Rotate passwords regularly**
5. **Use environment variables** for sensitive data

### Performance

1. **Connection Pooling**: Set `SMTP_MAX_CONNECTIONS=10`
2. **Rate Limiting**: Configure based on provider limits
3. **Retry Logic**: Built-in retry with exponential backoff
4. **Queue Processing**: Emails are queued and processed asynchronously

### Monitoring

1. **Check email logs** regularly
2. **Monitor bounce rates**
3. **Set up alerts** for failed deliveries
4. **Use dedicated email service** for high volume

## Email Provider Limits

| Provider | Daily Limit | Rate Limit | Notes |
|----------|-------------|------------|--------|
| Gmail | 500/day | 1/sec | Free accounts |
| Outlook | 300/day | 1/sec | Free accounts |
| SendGrid | 100/day | Variable | Free tier |
| Mailgun | 100/day | Variable | Free tier |
| Amazon SES | 200/day | 1/sec | Free tier |

## Support

If you encounter issues:

1. Check the application logs
2. Test with API endpoints
3. Verify environment variables
4. Check provider-specific requirements
5. Contact system administrator

## Advanced Configuration

### Custom Email Queue

For high-volume environments, consider:

```env
# Email Queue Settings
EMAIL_QUEUE_ENABLED=true
EMAIL_QUEUE_REDIS_URL=redis://localhost:6379
EMAIL_WORKER_CONCURRENCY=5
EMAIL_BATCH_SIZE=10
```

### Webhook Integration

Set up webhooks for delivery tracking:

```env
EMAIL_WEBHOOK_URL=https://your-domain.com/webhooks/email
EMAIL_WEBHOOK_SECRET=your-webhook-secret
```

This guide covers the complete email integration setup for the Leave Management System. Follow the steps for your specific email provider to enable real email notifications.