# Email Setup Guide - Leave Management System

## 🚀 Quick Setup

The Leave Management System is already configured to send real emails! You just need to provide your email credentials.

## 📧 Supported Email Providers

- **Gmail** (Recommended for development)
- **Outlook/Hotmail**
- **Office 365**
- **Yahoo Mail**
- **SendGrid** (Recommended for production)

## 🔧 Gmail Setup (Development)

### Step 1: Enable App Passwords

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled
4. Go to **App passwords**
5. Generate a new app password for "Mail"
6. Copy the 16-character password (no spaces)

### Step 2: Update Environment Variables

Add these to your `backend/.env` file:

```env
# Email Configuration
EMAIL_PROVIDER=GMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# Email From Details
EMAIL_FROM_NAME=Leave Management System
EMAIL_FROM_ADDRESS=your-email@gmail.com
SUPPORT_EMAIL=your-email@gmail.com
```

### Step 3: Test Email Configuration

1. Restart your backend server
2. Go to: `http://localhost:3001/api/v1/email/test`
3. Send a test email to verify the setup

## 🏢 Production Setup (SendGrid)

### Step 1: Create SendGrid Account

1. Sign up at https://sendgrid.com
2. Verify your email address
3. Create an API key with "Mail Send" permissions

### Step 2: Configure Environment Variables

```env
# Email Configuration
EMAIL_PROVIDER=SENDGRID
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Email From Details (must be verified domain)
EMAIL_FROM_NAME=Leave Management System
EMAIL_FROM_ADDRESS=noreply@yourcompany.com
SUPPORT_EMAIL=support@yourcompany.com
```

## 📋 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_PROVIDER` | Email service provider | `GMAIL`, `SENDGRID`, `OUTLOOK` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use SSL/TLS | `false` for port 587, `true` for 465 |
| `SMTP_USER` | Username/email | Your email or `apikey` for SendGrid |
| `SMTP_PASS` | Password/API key | App password or API key |
| `EMAIL_FROM_NAME` | Sender display name | `Leave Management System` |
| `EMAIL_FROM_ADDRESS` | From email address | `noreply@company.com` |
| `SUPPORT_EMAIL` | Support contact email | `support@company.com` |

## 🧪 Testing Email Setup

### Via API Endpoint

```bash
curl -X POST http://localhost:3001/api/v1/email/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### Via Admin Panel

1. Login as HR Admin: `admin@company.com` / `password123`
2. Navigate to **Settings** → **Email Configuration**
3. Click **Test Email Configuration**
4. Enter your email address and click **Send Test**

## 📬 Email Features

### Automated Emails

- **Leave Request Submitted** - Sent to employee and manager
- **Leave Approved** - Sent to employee
- **Leave Rejected** - Sent to employee with reason
- **Leave Cancelled** - Sent to relevant parties
- **Approval Reminders** - Sent to pending approvers
- **Balance Warnings** - Sent when leave balance is low

### Email Templates

All emails use professional HTML templates with:
- Company branding
- Responsive design
- Clear call-to-action buttons
- Consistent styling
- Proper formatting

### Email Queue

- Emails are queued for reliable delivery
- Automatic retry mechanism (3 attempts)
- Failed emails are logged for troubleshooting
- Rate limiting to prevent spam

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Authentication failed" Error

**Gmail:**
- Make sure you're using an App Password, not your regular password
- Ensure 2-Step Verification is enabled
- Check that the app password is correct (16 characters, no spaces)

**Other Providers:**
- Verify username and password
- Check if the account requires app-specific passwords
- Ensure SMTP settings match the provider requirements

#### 2. "Connection refused" Error

- Check SMTP host and port settings
- Verify firewall isn't blocking outbound connections
- Try different ports (587, 465, 25)

#### 3. "Invalid sender address" Error

- Ensure FROM address is properly configured
- For production, verify the sender domain
- Check if the email provider requires domain verification

### Demo Mode

If email configuration fails, the system automatically falls back to **Demo Mode**:
- Emails are logged to console instead of being sent
- All email functionality works normally
- No actual emails are delivered
- Perfect for development and testing

### Checking Email Status

```bash
# Check email configuration
GET /api/v1/email/config

# Send test email
POST /api/v1/email/test

# View email queue status
GET /api/v1/monitoring/email-queue
```

## 🔒 Security Best Practices

### Development

1. **Never commit credentials** to version control
2. Use **App Passwords** instead of main passwords
3. Limit **SMTP user permissions** to mail sending only
4. Use **environment variables** for all credentials

### Production

1. Use **dedicated email service** (SendGrid, Mailgun, etc.)
2. Configure **SPF, DKIM, and DMARC** records
3. Use **verified sender domains**
4. Implement **email rate limiting**
5. Monitor **email delivery metrics**
6. Set up **bounce and complaint handling**

## 📊 Monitoring

The system provides comprehensive email monitoring:

- **Delivery Status** - Track sent, delivered, bounced emails
- **Queue Health** - Monitor email queue length and processing time
- **Error Rates** - Track failed deliveries and reasons
- **Performance Metrics** - Email sending speed and throughput

## 🎯 Next Steps

1. **Set up your email credentials** following the guide above
2. **Test email functionality** with a test email
3. **Configure email templates** if needed (optional)
4. **Set up monitoring** for production use
5. **Train users** on email notifications

## 💡 Tips

- **Gmail** is perfect for development and small teams
- **SendGrid** is recommended for production environments
- **Always test** email configuration before going live
- **Monitor email metrics** to ensure reliable delivery
- **Keep backup email configurations** for redundancy

---

📧 **Email system is now ready to use!** The Leave Management System will automatically send professional email notifications for all leave-related activities.