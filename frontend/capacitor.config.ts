import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.studiotime',
  appName: 'Studio Time',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
