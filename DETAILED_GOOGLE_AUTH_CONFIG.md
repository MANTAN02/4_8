# 🔧 Detailed Google Authentication Configuration for barrtal

## 📋 Project Information
- **Project Name**: barrtal
- **Project ID**: barrtal-9f826
- **Project Number**: 1083312730280

## 🛠️ Step-by-Step Firebase Console Configuration

### Step 1: Access Firebase Console
1. Open your web browser and go to [Firebase Console](https://console.firebase.google.com)
2. Sign in with your Google account
3. Select the **barrtal** project from your project list

### Step 2: Navigate to Authentication Settings
1. In the left sidebar, click on **Authentication**
2. Click on the **Sign-in method** tab at the top

### Step 3: Enable Google Authentication
1. Find **Google** in the list of sign-in providers
2. Click the **Edit** button (pencil icon) next to Google
3. Toggle the **Enable** switch to the **On** position

### Step 4: Configure OAuth Credentials
In the **Web SDK configuration** section:
1. Enter your **Web client ID**:
   ```
   1083312730280-hhl2ailg9v6276gm032af9jomf17h3vf.apps.googleusercontent.com
   ```
2. Enter your **Web client secret**:
   ```
   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
   ```

### Step 5: Save Configuration
1. Click the **Save** button at the bottom of the form
2. You should see a success message confirming the changes

### Step 6: Verify Authorized Domains
1. Still in the Authentication section, click on the **Settings** tab
2. Scroll down to the **Authorized domains** section
3. Ensure that the following domains are listed:
   - `localhost` (for development)
   - Your production domain (if applicable)

### Step 7: Test Configuration
1. Return to your Baartal application
2. Navigate to the login page
3. Click the "Sign in with Google" button
4. You should be able to authenticate successfully

## 📝 Important Notes

### Credential Security
- Keep your client secret secure and never expose it in client-side code
- The client secret is only used server-side by Firebase
- Firebase handles the OAuth flow securely on the client-side

### Project Verification
- Your project appears to be already set up correctly with:
  - Project ID: `barrtal-9f826`
  - App ID: `1:1083312730280:web:9d51cc9094eaa1d034d29d`
  - API Key: `AIzaSyA9bNfEMuFsxxydYmgJ9f7WFebmmsDaGag`

### Integration Details
- Your client-side code in `Login.tsx` and `CustomerLogin.tsx` is already properly implemented
- The Google authentication will use Firebase's built-in `GoogleAuthProvider`
- No additional code changes are needed for basic functionality

## 🧪 Verification Checklist

After completing the configuration, verify that:

- [ ] Google authentication is enabled in Firebase Console
- [ ] Web client ID is correctly entered: `1083312730280-hhl2ailg9v6276gm032af9jomf17h3vf.apps.googleusercontent.com`
- [ ] Web client secret is correctly entered: `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`
- [ ] Authorized domains include `localhost` for development
- [ ] Google sign-in button works in your application
- [ ] Authentication succeeds without errors

## 🆘 Troubleshooting

### If Google Authentication Fails
1. Double-check that both client ID and secret are entered correctly
2. Ensure there are no extra spaces before or after the credentials
3. Verify that Google authentication is toggled to "Enabled"
4. Check that your domain is in the authorized domains list

### Common Error Messages
- **"Invalid client ID"**: Check for typos in the client ID
- **"Redirect URI mismatch"**: Add your domain to authorized domains
- **"Popup closed by user"**: Complete the authentication flow without closing the popup

## 🎉 Success

Once configured correctly, users of your barrtal application will be able to:
- Sign in with their Google accounts
- Have their profile information automatically retrieved
- Be authenticated through Firebase Authentication
- Access protected routes in your application

Your Google authentication is now ready to use after following these configuration steps!