# 🚀 Local Development Guide for barrtal

## 📋 Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Git (optional, for version control)

## 🛠️ Starting the Development Server

### Method 1: Using npm
```bash
# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

### Method 2: Using yarn
```bash
# Install dependencies (if not already installed)
yarn install

# Start the development server
yarn dev
```

## 🌐 Accessing the Application

Once the development server is running, you can access your application at:
- **Local URL**: http://localhost:5173
- **Network URL**: http://[your-ip-address]:5173 (for testing on other devices)

## 📁 Project Structure

```
barrtal/
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared code between client and server
├── public/          # Static assets
├── package.json     # Project dependencies and scripts
└── vite.config.ts   # Vite configuration
```

## ⚙️ Environment Configuration

Make sure your `.env` file is properly configured with Firebase credentials:
```env
# Firebase Configuration (Client-side)
VITE_FIREBASE_API_KEY=AIzaSyA9bNfEMuFsxxydYmgJ9f7WFebmmsDaGag
VITE_FIREBASE_AUTH_DOMAIN=barrtal-9f826.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=barrtal-9f826
VITE_FIREBASE_STORAGE_BUCKET=barrtal-9f826.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1083312730280
VITE_FIREBASE_APP_ID=1:1083312730280:web:9d51cc9094eaa1d034d29d
VITE_FIREBASE_MEASUREMENT_ID=G-DHYD4KDV8B
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run drizzle:generate` | Generate database migrations |
| `npm run drizzle:migrate` | Apply database migrations |

## 🧪 Testing Google Authentication

After starting the development server:

1. Navigate to http://localhost:5173
2. Go to the login page
3. Click the "Sign in with Google" button
4. Complete the authentication flow

Note: Google authentication will only work after configuring the OAuth credentials in the Firebase Console as described in `DETAILED_GOOGLE_AUTH_CONFIG.md`.

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Kill process using port 5173
   npx kill-port 5173
   
   # Or start on a different port
   npm run dev -- --port 3000
   ```

2. **Dependencies not installed**:
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Firebase configuration errors**:
   - Verify all environment variables in `.env`
   - Check Firebase Console configuration
   - Ensure Google OAuth credentials are properly set

### Development Tools

- **React DevTools** - For debugging React components
- **Redux DevTools** - For state management debugging (if used)
- **Browser DevTools** - For general debugging

## 🔄 Hot Reloading

The development server supports hot reloading:
- Changes to React components will automatically refresh in the browser
- CSS changes are injected without full page reload
- Backend changes may require a server restart

## 📚 Additional Resources

- `DETAILED_GOOGLE_AUTH_CONFIG.md` - Google authentication setup
- `GOOGLE_AUTH_SETUP.md` - General Google auth configuration
- `GOOGLE_AUTH_TESTING.md` - Testing procedures
- `FIREBASE_SETUP.md` - Firebase integration guide

Your barrtal application is ready for local development!
</