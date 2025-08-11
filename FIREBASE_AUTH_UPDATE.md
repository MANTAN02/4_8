# Firebase Authentication Configuration Update Guide

## Overview
This guide explains how to update Firebase authentication details for the Baartal project on GitHub.

## Files to Update

### 1. Environment Variables
Create a `.env` file in the root directory with your Firebase configuration:

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your actual Firebase credentials
```

### 2. Firebase Configuration Files

#### Web SDK Configuration (`firebase.config.ts`)
Update the Firebase configuration to use environment variables:

```typescript
// Update firebase.config.ts to use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

#### Server SDK Configuration (`server/firebase-admin.ts`)
Update the Firebase Admin SDK configuration:

```typescript
// Update server/firebase-admin.ts to use environment variables
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
```

### 3. GitHub Actions (Optional)
Create `.github/workflows/firebase-deploy.yml` for automated deployment:

```yaml
name: Deploy Firebase Configuration
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

## Security Best Practices

1. **Never commit actual credentials** - Always use environment variables
2. **Use GitHub Secrets** - Store sensitive data in GitHub repository secrets
3. **Rotate keys regularly** - Update Firebase keys periodically
4. **Enable Firebase App Check** - Add additional security layer
5. **Use Firebase Security Rules** - Configure proper access controls

## Steps to Update on GitHub

1. **Fork the repository** (if contributing)
2. **Create a new branch**:
   ```bash
   git checkout -b update-firebase-auth
   ```

3. **Update configuration files**:
   - Replace hardcoded values with environment variables
   - Update `.env.example` with correct structure
   - Add necessary documentation

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "Update Firebase auth configuration to use environment variables"
   ```

5. **Push to GitHub**:
   ```bash
   git push origin update-firebase-auth
   ```

6. **Create Pull Request** with description:
   ```
   Update Firebase Authentication Configuration
   
   - Replaced hardcoded Firebase credentials with environment variables
   - Added .env.example file for configuration reference
   - Updated documentation with setup instructions
   - Enhanced security by removing sensitive data from source code
   ```

## Testing the Update

1. **Local testing**:
   ```bash
   npm run dev
   ```

2. **Verify authentication**:
   - Test login with email/password
   - Test Google sign-in
   - Check Firebase console for authentication logs

3. **Environment validation**:
   ```bash
   # Check if all required environment variables are set
   node -e "console.log('Firebase config:', process.env.VITE_FIREBASE_API_KEY ? 'OK' : 'MISSING')"
   ```

## Support
For issues with Firebase configuration, please:
1. Check the [Firebase documentation](https://firebase.google.com/docs)
2. Review the [setup guide](FIREBASE_SETUP.md)
3. Open an issue on GitHub with the `firebase-auth` label
