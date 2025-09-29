# Testing Guide: Backup Code Exhaustion Solution

## 🧪 How to Test the Complete Solution

### Prerequisites
✅ Backend server running on http://localhost:5000  
✅ Frontend server running on http://localhost:5174  
✅ MongoDB connected  
✅ All new features implemented  

### Test Scenarios

## 1. **Test Normal Registration & Backup Code Generation**

### Steps:
1. Navigate to http://localhost:5174/register
2. Register a new user with:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!@#
   - Role: employee or manager
3. ✅ **Expected**: Registration success page with 8 backup codes displayed
4. ✅ **Expected**: Codes automatically downloaded as `backup-codes.txt`
5. Click "Continue to Login"
6. Login with password + one of the backup codes
7. ✅ **Expected**: Successful login to dashboard

---

## 2. **Test Low Backup Codes Warning**

### Setup:
1. Login to an existing user account
2. Use backup codes until only 2 remain

### Steps:
1. Login with password
2. Use a backup code (when you have ≤2 remaining)
3. ✅ **Expected**: Warning message on dashboard: "Warning: Only X backup codes remaining. Generate new codes soon."
4. ✅ **Expected**: Yellow warning banner with "Generate New Codes" button
5. Click "Generate New Codes"
6. ✅ **Expected**: Redirect to Settings → Security with backup codes section highlighted

---

## 3. **Test Complete Backup Code Exhaustion**

### Setup:
1. Use all 8 backup codes for a user account
2. Logout completely

### Steps:
1. Navigate to login page
2. Enter email and password
3. ✅ **Expected**: Password verification successful
4. When prompted for backup code, try entering any code
5. ✅ **Expected**: Error message: "All backup codes have been used. Please use account recovery."
6. ✅ **Expected**: "Use Account Recovery" button displayed
7. Click the "Use Account Recovery" button
8. ✅ **Expected**: Redirect to `/recovery` page

---

## 4. **Test Account Recovery Flow**

### Steps:
1. On the recovery page, enter your email address
2. Select reason: "All backup codes used"
3. Click "Send Recovery Instructions"
4. ✅ **Expected**: Success message displayed
5. ✅ **Expected**: Recovery token displayed in console (development mode)
6. Copy the recovery token from console/terminal output
7. Enter the token in the recovery verification field
8. Choose **"Generate New Backup Codes"**
9. ✅ **Expected**: New 8 backup codes generated and displayed
10. ✅ **Expected**: Codes automatically downloaded as `new-backup-codes.txt`
11. ✅ **Expected**: Success page with instructions
12. Click "Continue to Login"
13. Login with password + one of the new backup codes
14. ✅ **Expected**: Successful login, old codes invalidated

---

## 5. **Test Emergency Access Flow**

### Steps:
1. Follow steps 1-7 from Test #4
2. Instead of "Generate New Backup Codes", click **"Emergency Access (30 min)"**
3. ✅ **Expected**: Temporary login with 30-minute timer
4. ✅ **Expected**: Redirect to Settings with emergency warning
5. ✅ **Expected**: Orange warning banner: "🚨 Emergency Access: You're using emergency access with limited time remaining."
6. Generate new backup codes from Settings
7. ✅ **Expected**: Full access restored, emergency status removed

---

## 6. **Test Security Activity Logging**

### Steps:
1. Perform various actions (login, recovery, emergency access)
2. Navigate to Settings → Security Activity
3. ✅ **Expected**: All security events logged with timestamps
4. ✅ **Expected**: Recovery requests, emergency access, and login attempts visible
5. ✅ **Expected**: Session durations calculated correctly

---

## 7. **Test Error Handling**

### Invalid Recovery Token:
1. Go to `/recovery?token=invalid-token`
2. ✅ **Expected**: "Invalid or expired recovery token" error

### Expired Recovery Token:
1. Wait 24+ hours after generating recovery token
2. Try to use expired token
3. ✅ **Expected**: "Invalid or expired recovery token" error

### Rate Limiting:
1. Request multiple recovery emails quickly
2. ✅ **Expected**: Rate limiting protection (if implemented)

---

## 8. **Test UI/UX Features**

### Dashboard Warnings:
1. Login with low backup codes
2. ✅ **Expected**: Persistent yellow warning banner
3. ✅ **Expected**: Dismissible notification
4. ✅ **Expected**: "Generate New Codes" button works

### Settings Auto-Focus:
1. Use grace period login (new user without codes)
2. ✅ **Expected**: Auto-redirect to Settings → Security
3. ✅ **Expected**: Warning about grace period displayed

### Recovery Page UX:
1. Test responsive design on different screen sizes
2. ✅ **Expected**: Professional styling matches main application
3. ✅ **Expected**: Clear instructions and help text
4. ✅ **Expected**: Loading states and disabled buttons work

---

## 9. **Test Email Integration (Development)**

### Console Output:
1. Trigger account recovery
2. Check terminal/console output
3. ✅ **Expected**: Formatted email content displayed:
```
🔐 ACCOUNT RECOVERY EMAIL 🔐
To: user@example.com
Subject: Account Recovery - Backup Codes Exhausted
Recovery Link: http://localhost:5174/recovery?token=...
This link expires in 24 hours.
```

---

## 10. **Test Security Audit Trail**

### Backend Logs:
1. Perform various security actions
2. Check MongoDB SecurityLog collection
3. ✅ **Expected**: All events logged with:
   - Event type
   - User ID
   - IP address
   - User agent
   - Timestamp
   - Metadata

### Event Types to Verify:
- `login_success`
- `login_backup_code_failed`
- `account_recovery_requested`
- `account_recovery_completed`
- `emergency_access_granted`
- `backup_codes_generated`

---

## 🎯 Success Criteria

The solution is working correctly if:

✅ **No User Lockouts**: Users can always regain access even with exhausted codes  
✅ **Security Maintained**: All recovery actions are logged and audited  
✅ **User-Friendly**: Clear warnings and recovery options provided  
✅ **Professional UI**: Recovery flows match existing design system  
✅ **Error Handling**: Graceful handling of all edge cases  
✅ **Performance**: Fast response times for all recovery operations  

---

## 🚨 Edge Cases Covered

1. **User with no backup codes** → Grace period access
2. **User with exhausted codes** → Recovery or emergency access
3. **Invalid recovery tokens** → Clear error messages
4. **Expired recovery tokens** → New recovery process
5. **Multiple recovery requests** → Token invalidation and rate limiting
6. **Emergency access expiry** → Forced new recovery
7. **Concurrent sessions** → Proper session management
8. **Network failures** → Retry mechanisms and error handling

---

## 📊 Monitoring Points

During testing, monitor:

1. **Response Times**: All recovery operations < 2 seconds
2. **Error Rates**: < 1% error rate for valid operations
3. **Security Events**: All events properly logged
4. **User Experience**: No confusion or dead-ends in UI
5. **Database Performance**: Efficient queries for recovery operations

---

## 🔧 Development Notes

### For Production Deployment:
1. Replace console logging with actual email service
2. Implement proper rate limiting
3. Add geographic IP validation
4. Set up monitoring and alerting
5. Configure backup retention policies

### Current Development Features:
- Recovery tokens displayed in console for testing
- Extended logging for debugging
- Simplified email templates
- Development-friendly error messages

---

This testing guide ensures comprehensive validation of the backup code exhaustion solution across all user scenarios and edge cases.