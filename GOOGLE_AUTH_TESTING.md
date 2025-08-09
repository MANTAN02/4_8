# 🧪 Google Authentication Testing Guide

## 📋 Prerequisites
- Firebase project with Google authentication configured
- Google OAuth client ID: `1083312730280-hhl2ailg9v6276gm032af9jomf17h3vf.apps.googleusercontent.com`
- Google OAuth client secret: `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`
- Baartal application running locally or deployed

## 🛠️ Testing Steps

### 1. Start the Application
```bash
npm run dev
```

### 2. Navigate to Login Page
1. Open your browser and go to the login page
2. You should see the "Sign in with Google" button

### 3. Test Google Authentication
1. Click the "Sign in with Google" button
2. A popup should appear asking you to select a Google account
3. Select or enter your Google account credentials
4. Grant necessary permissions if prompted

### 4. Expected Behavior
- After successful authentication, you should be redirected to the home page
- A success toast message should appear: "Google sign-in successful"
- Your user information should be available in the application

### 5. Verification Steps
1. Check browser console for any errors
2. Verify that you're properly redirected after authentication
3. Check that the user's name/email appears in the navigation bar
4. Try accessing a protected route to ensure authentication is working

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. "Popup closed by user" Error
- Make sure to fully complete the authentication flow
- Don't close the popup window manually
- Try disabling popup blockers

#### 2. "Invalid client ID" Error
- Verify that the client ID is correctly configured in Firebase Console
- Check for any extra spaces or characters

#### 3. "Redirect URI mismatch" Error
- Ensure that your domain is in the authorized domains list in Firebase Console
- For development, localhost should be authorized

#### 4. Authentication Succeeds but User Not Logged In
- This indicates that the Firebase authentication is working but not integrated with the application's custom authentication system
- Check if the application needs a server-side endpoint to handle Firebase ID tokens

## 🧪 Advanced Testing

### Test with Different Account Types
1. Test with a Gmail account
2. Test with a Google Workspace account
3. Test with an account that has never logged in before

### Test Edge Cases
1. Cancel the authentication flow
2. Close the popup window
3. Try logging in with an account that's not authorized
4. Test with multiple Google accounts

## 📊 Verification Checklist

- [ ] Google sign-in button is visible and clickable
- [ ] Google popup opens correctly
- [ ] User can select/selects Google account
- [ ] Authentication succeeds without errors
- [ ] User is redirected to the correct page
- [ ] Success message is displayed
- [ ] User's information is properly displayed in the UI
- [ ] User can access protected routes
- [ ] User can log out and log back in

## 🎉 Success Criteria

Google authentication is properly configured when:
1. Users can authenticate using their Google accounts
2. No errors appear in the browser console
3. Users are properly redirected after authentication
4. User information is correctly displayed in the application
5. Users can access protected functionality

## 🆘 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase Console configuration
3. Check network tab for failed API requests
4. Review the implementation in Login.tsx
5. Ensure all environment variables are correctly set