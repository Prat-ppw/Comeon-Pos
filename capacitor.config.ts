import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'th.co.brewcoffee.pos',
  appName: 'BREW POS',
  webDir: 'dist',
  android: {
    backgroundColor: '#3B1F0E',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,   // เปลี่ยนเป็น true เพื่อ debug
    minWebViewVersion: 60,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#3B1F0E',
      showSpinner: false,
      launchAutoHide: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
