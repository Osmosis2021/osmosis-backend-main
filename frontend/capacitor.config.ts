import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.getosmosis.osmosis',
  appName: 'osmosis',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
