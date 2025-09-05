import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6516af0761504ef8bcb5a63a510c1de0',
  appName: 'o2guru-gamified-hub',
  webDir: 'dist',
  server: {
    url: 'https://6516af07-6150-4ef8-bcb5-a63a510c1de0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    BarcodeScanner: {
      permissions: ['camera']
    }
  }
};

export default config;