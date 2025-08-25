# SMTP Email Configuration Guide

The Blood Donation Management System now uses SMTP instead of SendGrid for email delivery. This guide will help you configure SMTP settings for various email providers.

## Environment Variables

Add these variables to your `.env` file:

```bash
# SMTP Email Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
EMAIL_FROM=info@callforbloodfoundation.com
EMAIL_FROM_NAME=CallforBlood Foundation
```

## Common SMTP Providers

### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
```

**Note**: For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use the app password in `SMTP_PASS`

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP Server
```bash
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
```

## SSL/TLS Configuration

For secure connections (port 465):
```bash
SMTP_PORT=465
SMTP_SECURE=true
```

For STARTTLS (port 587):
```bash
SMTP_PORT=587
SMTP_SECURE=false
```

## Testing Your Configuration

1. Start your server with the SMTP configuration
2. Check the logs for "SMTP connection verified successfully"
3. Use the test endpoint to send a test email:

```bash
curl -X POST http://localhost:5000/api/v1/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"email": "test@example.com"}'
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check username and password
   - For Gmail, ensure you're using an app password
   - Verify 2FA is enabled for Gmail

2. **Connection Timeout**
   - Check SMTP host and port
   - Verify firewall settings
   - Try different ports (587, 465, 25)

3. **TLS/SSL Errors**
   - Try setting `SMTP_SECURE=false` for port 587
   - Try setting `SMTP_SECURE=true` for port 465

4. **Self-signed Certificate Errors**
   - The service automatically sets `rejectUnauthorized: false`
   - This should handle most certificate issues

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=nodemailer:*
```

## Security Best Practices

1. **Use App Passwords**: Never use your main email password
2. **Environment Variables**: Store credentials in `.env` file, never in code
3. **Secure Ports**: Use port 587 (STARTTLS) or 465 (SSL/TLS)
4. **Rate Limiting**: The service includes built-in rate limiting for bulk emails

## Features

- ✅ SMTP authentication
- ✅ TLS/SSL support
- ✅ HTML and plain text emails
- ✅ Bulk email sending with rate limiting
- ✅ Email validation
- ✅ Connection verification
- ✅ Comprehensive error handling
- ✅ Development mode simulation
- ✅ Email masking for privacy in logs

## Migration from SendGrid

The new SMTP service maintains the same API as the previous SendGrid implementation, so no code changes are required in other parts of the application. Simply update your environment variables and restart the server.