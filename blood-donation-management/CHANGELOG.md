# Changelog

## [1.0.2] - 2025-01-08

### Fixed
- **Document Upload Authentication**: Enhanced token validation in DocumentUpload component
  - Added proper token existence check before API calls
  - Improved error handling for authentication failures
  - Added debug logging for token validation
- **Code Cleanup**: Removed unused imports in components
  - Cleaned up unused AnimatePresence and X imports in DocumentUpload
  - Removed unused isLoading state in SignInPage
- **Documents API**: Enhanced document routes with better error handling
  - Improved file validation and error messages
  - Added comprehensive admin verification endpoints
  - Enhanced security checks for document access

### Changed
- **DocumentUpload Component**: Better authentication flow with token validation
- **OTP Modal**: Improved error message extraction from API responses
- **Documents Routes**: Added missing verification and pending document endpoints

## [1.0.1] - 2025-01-08

### Fixed
- **Double OTP Verification Issue**: Fixed authentication flow where OTP was being verified twice, causing login failures
  - Modified OTP service to allow verified OTPs to be reused within a 2-minute grace period
  - Updated OTP cleanup logic to extend from 30 seconds to 2 minutes
  - Enhanced OTP controller to properly handle purpose parameter
  - Simplified SignInPage authentication flow to eliminate redundant token checking
  - Added comprehensive logging for better debugging

### Changed
- **OTP Service (`server/services/otpService.js`)**:
  - Added grace period for verified OTP reuse (2 minutes)
  - Enhanced verification logic to track verification time
  - Extended cleanup delay for verified OTPs
  
- **OTP Controller (`server/controllers/otpController.js`)**:
  - Added purpose parameter extraction from request body
  - Improved logging for verification attempts
  
- **OTP Routes (`server/routes/otp.js`)**:
  - Added purpose validation for verify endpoint
  - Consistent parameter handling across all OTP endpoints
  
- **SignIn Page (`client/src/pages/auth/SignInPage.jsx`)**:
  - Simplified authentication flow logic
  - Improved error handling and user data extraction
  - Removed redundant token checking with fallback logic

### Security
- Maintained 2-minute grace period limit to prevent OTP abuse
- Preserved rate limiting and account locking mechanisms
- Enhanced audit logging for all verification events

### Documentation
- Added comprehensive fix documentation in `docs/fixes/double-otp-issue-fix.md`
- Updated changelog with detailed change descriptions

### Files Modified
- `server/services/otpService.js`
- `server/controllers/otpController.js` 
- `server/routes/otp.js`
- `client/src/pages/auth/SignInPage.jsx`
- `client/src/components/ui/OTPModal.jsx` (already had correct implementation)

### Testing Recommendations
- Test normal OTP login flow
- Test OTP expiration after 5 minutes
- Test grace period expiration after 2 minutes
- Test multiple verification attempts within grace period
- Verify rate limiting functionality remains intact