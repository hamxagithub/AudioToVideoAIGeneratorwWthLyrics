# Environment Variables Setup

## API Keys Configuration

Since React Native doesn't have direct access to `process.env` like Node.js applications, API keys should be configured using one of these methods:

### Option 1: React Native Config (Recommended)
1. Install react-native-config:
   ```bash
   npm install react-native-config
   ```

2. Create `.env` file in root:
   ```
   OPENAI_API_KEY=your_openai_key_here
   PEXELS_API_KEY=your_pexels_key_here
   UNSPLASH_API_KEY=your_unsplash_key_here
   RUNWAY_API_KEY=your_runway_key_here
   STABILITY_API_KEY=your_stability_key_here
   STRIPE_PUBLIC_KEY=your_stripe_public_key_here
   PAYPAL_CLIENT_ID=your_paypal_client_id_here
   API_BASE_URL=your_api_base_url_here
   ```

3. Use in code:
   ```typescript
   import Config from 'react-native-config';
   
   const apiKey = Config.OPENAI_API_KEY || 'demo-key';
   ```

### Option 2: Secure Storage (For Production)
Use React Native Keychain or AsyncStorage for sensitive data:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiKey = async (keyName: string) => {
  try {
    return await AsyncStorage.getItem(keyName) || 'demo-key';
  } catch (error) {
    return 'demo-key';
  }
};
```

### Option 3: Constants File (For Development)
Create a `src/config/constants.ts` file:

```typescript
export const API_KEYS = {
  OPENAI_API_KEY: 'your_openai_key_here',
  PEXELS_API_KEY: 'your_pexels_key_here',
  // ... other keys
};
```

## Current State
The app currently uses demo keys as placeholders. Replace these with your actual API keys before deploying to production.

## Security Note
Never commit real API keys to version control. Always use environment variables or secure storage for production deployments.
