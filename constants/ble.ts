import { BleManager } from 'react-native-ble-plx';

/**
 * Singleton instance of BleManager to be shared across the entire app.
 * Creating multiple instances of BleManager can cause native crashes and 
 * permission issues, especially on Android.
 */
export const bleManager = new BleManager();
