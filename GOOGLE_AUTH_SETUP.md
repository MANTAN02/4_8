# 🔐 Google Authentication Setup Guide for Baartal

## 📋 Prerequisites
- Firebase project created
- Google OAuth client ID: `1083312730280-hhl2ailg9v6276gm032af9jomf17h3vf.apps.googleusercontent.com`
- Google OAuth client secret: `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`

## 🛠️ Step-by-Step Configuration

### 1. Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Baartal project or create a new one

### 2. Enable Google Authentication
1. In the left sidebar, click **Authentication**
2. Click the **Sign-in method** tab
3. Find **Google** in the list of providers
4. Click the **Edit** button (pencil icon)

### 3. Configure Google OAuth Credentials
1. Toggle the **Enable** switch to **On**
2. In the **Web SDK configuration** section:
   - **Web client ID**: `1083312730280-hhl2ailg9v6276gm032af9jomf17h3vf.apps.googleusercontent.com`
   - **Web client secret**: `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`
3. Click **Save**

### 4. Configure Authorized Domains (if needed)
1. Still in the Authentication section, click **Settings** tab
2. In the **Authorized domains** section, ensure your domain is listed:
   - For development: `localhost`
   - For production: your domain (e.g., `yourdomain.com`)

### 5. Test Google Authentication
1. Start your Baartal application
2. Navigate to the login page
3. Click the **Sign in with Google** button
4. You should be able to authenticate with your Google account

## 📝 Important Notes

### Client-Side Implementation
Your application already has Google authentication implemented in:
- `client/src/pages/Login.tsx`
- `client/src/pages/CustomerLogin.tsx`

The implementation uses Firebase's built-in `GoogleAuthProvider` which will automatically use the credentials configured in the Firebase Console.

### Server-Side Implementation
The server-side code uses Firebase Admin SDK which doesn't require the OAuth client ID/secret. It uses service account credentials instead.

### Security Considerations
- Keep your client secret secure and never expose it in client-side code
- The client secret is only used server-side by Firebase for certain operations
- Firebase handles the OAuth flow securely on the client-side

## 🧪 Troubleshooting

### Common Issues
1. **"Invalid client ID" error**
   - Double-check that you've entered the client ID correctly
   - Ensure there are no extra spaces

2. **"Redirect URI mismatch" error**
   - Check that your authorized domains are correctly configured
   - For development, ensure `localhost` is in the authorized domains

3. **Google button not working**
   - Verify that Google authentication is enabled in Firebase Console
   - Check browser console for any JavaScript errors

### Testing
1. Clear your browser cache
2. Try in an incognito/private window
3. Check Firebase Authentication logs in the console

## 🎉 Success
Once configured correctly, users will be able to:
- Sign in with their Google accounts
- Have their profile information automatically retrieved
- Be authenticated through Firebase Authentication
- Access protected routes in your application

Your Google authentication is now ready to use!