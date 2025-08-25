# Email Integration Guide

The Blood Donation Management System now includes comprehensive email functionality alongside the existing WhatsApp integration. This provides users with multiple communication channels and ensures better message delivery.

## Features Added

### 1. Email Service Integration
- **SMTP Support**: Full SMTP email service with multiple provider support
- **Email Validation**: Comprehensive email format and deliverability validation
- **Template System**: Pre-built email templates for different purposes
- **Fallback Support**: Automatic fallback from WhatsApp to email when needed
- **Development Mode**: Email simulation for development environments

### 2. OTP via Email
- **Email OTP Delivery**: Send OTPs via email as alternative to WhatsApp
- **Multi-channel Support**: Support both phone and email in the same OTP system
- **Automatic Fallback**: If WhatsApp fails, automatically try email delivery
- **Flexible Routing**: Choose delivery method (whatsapp, email, auto)

### 3. Authentication Enhancements
- **Forgot Password**: Send password reset OTPs via email
- **Welcome Emails**: Automatic welcome emails for new registrations
- **Security Notifications**: Password reset confirmations and security alerts
- **Email Verification**: Support for email-based account verification

## API Endpoints

### OTP Endpoints (Enhanced)

#### Request OTP
```http
POST /api/v1/otp/request
Content-Type: application/json

{
  "phoneNumber": "9876543210",  // Optional if email provided
  "email": "user@example.com",  // Optional if phone provided
  "purpose": "verification",    // Optional: verification, login, password_reset
  "method": "auto"             // Optional: whatsapp, email, auto
}
```

#### Verify OTP
```http
POST /api/v1/otp/verify
Content-Type: application/json

{
  "phoneNumber": "9876543210",  // Optional if email provided
  "email": "user@example.com",  // Optional if phone provided
  "otp": "123456",
  "purpose": "verification"     // Optional
}
```

### Authentication Endpoints (New)

#### Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "phoneNumber": "9876543210",  // Optional if email provided
  "email": "user@example.com"   // Optional if phone provided
}
```

#### Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "phoneNumber": "9876543210",  // Optional if email provided
  "email": "user@example.com",  // Optional if phone provided
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

#### Test Email (Development Only)
```http
POST /api/v1/auth/test-email
Content-Type: application/json

{
  "email": "test@example.com",
  "type": "welcome"  // welcome, otp, or test
}
```

## Configuration

### Environment Variables
```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=info@callforbloodfoundation.com
EMAIL_FROM_NAME=CallforBlood Foundation
```

### Email Templates

The system includes pre-built templates for:

1. **OTP Emails**: Verification codes with security instructions
2. **Welcome Emails**: Onboarding messages for new donors
3. **Password Reset**: Security notifications and confirmations
4. **Blood Request Notifications**: Emergency and scheduled requests
5. **Donation Confirmations**: Post-donation certificates and thank you messages

## Usage Examples

### 1. Send OTP via Email
```javascript
// Request OTP via email
const response = await fetch('/api/v1/otp/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'donor@example.com',
    purpose: 'verification',
    method: 'email'
  })
});
```

### 2. Password Reset Flow
```javascript
// Step 1: Request password reset
await fetch('/api/v1/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'donor@example.com'
  })
});

// Step 2: Reset password with OTP
await fetch('/api/v1/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'donor@example.com',
    otp: '123456',
    newPassword: 'newSecurePassword123'
  })
});
```

### 3. Multi-channel OTP with Fallback
```javascript
// Try WhatsApp first, fallback to email
const response = await fetch('/api/v1/otp/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '9876543210',
    email: 'donor@example.com',  // Fallback email
    method: 'auto'               // Auto-fallback enabled
  })
});
```

## Email Service Features

### 1. Delivery Methods
- **Primary**: WhatsApp for phone-based communications
- **Secondary**: Email for email-based communications
- **Fallback**: Automatic email fallback when WhatsApp fails
- **Bulk**: Batch email sending with rate limiting

### 2. Security Features
- **Email Masking**: Email addresses are masked in logs for privacy
- **Rate Limiting**: Built-in rate limiting for email sending
- **Validation**: Comprehensive email format and deliverability validation
- **Error Handling**: Graceful error handling with detailed error messages

### 3. Development Features
- **Simulation Mode**: Email simulation when SMTP is not configured
- **Test Endpoints**: Development-only endpoints for testing email functionality
- **Debug Logging**: Detailed logging for troubleshooting
- **Configuration Validation**: Automatic SMTP configuration validation

## Error Handling

### Common Error Codes
- `INVALID_EMAIL`: Email format validation failed
- `EMAIL_REQUIRED`: Email address is required but not provided
- `SMTP_ERROR`: SMTP server error during email sending
- `OTP_SEND_FAILED`: Failed to send OTP via email
- `EMAIL_SEND_FAILED`: General email sending failure

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Invalid email format",
    "code": "INVALID_EMAIL"
  }
}
```

## Testing

### 1. SMTP Configuration Test
```bash
curl -X POST http://localhost:5000/api/v1/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "test"}'
```

### 2. OTP Email Test
```bash
curl -X POST http://localhost:5000/api/v1/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "method": "email"}'
```

### 3. Welcome Email Test
```bash
curl -X POST http://localhost:5000/api/v1/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "welcome"}'
```

## Migration Notes

### Backward Compatibility
- All existing phone-based OTP functionality remains unchanged
- WhatsApp integration continues to work as before
- No breaking changes to existing API endpoints

### New Capabilities
- Email-based user registration and authentication
- Multi-channel communication preferences
- Enhanced password recovery options
- Improved notification delivery reliability

## Best Practices

### 1. Email Configuration
- Use app passwords for Gmail (not regular passwords)
- Enable 2FA for email accounts used for SMTP
- Use secure SMTP ports (587 with STARTTLS or 465 with SSL)
- Test email configuration before production deployment

### 2. User Experience
- Provide clear instructions for email-based OTP
- Show delivery method in UI (WhatsApp vs Email)
- Allow users to choose preferred communication method
- Implement proper error messages for email failures

### 3. Security
- Validate email addresses before sending
- Implement rate limiting for email endpoints
- Log email activities for audit purposes
- Use secure email templates with proper formatting

## Troubleshooting

### Common Issues
1. **SMTP Authentication Failed**: Check username, password, and 2FA settings
2. **Connection Timeout**: Verify SMTP host, port, and firewall settings
3. **Email Not Delivered**: Check spam folders and email provider limits
4. **Template Errors**: Verify email template formatting and variables

### Debug Steps
1. Check SMTP configuration in environment variables
2. Test SMTP connection using the test endpoint
3. Review server logs for detailed error messages
4. Verify email provider settings and limits

## Future Enhancements

### Planned Features
- **Email Templates**: Rich HTML email templates with branding
- **Email Analytics**: Delivery tracking and engagement metrics
- **Bulk Notifications**: Mass email campaigns for blood drives
- **Email Preferences**: User-configurable email notification settings
- **Email Verification**: Email address verification during registration